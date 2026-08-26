using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using SGDS.Application.DTOs;
using SGDS.Domain.Entities;
using SGDS.Infrastructure.Data;
using QuestPDF.Fluent;
using QuestPDF.Helpers;
using QuestPDF.Infrastructure;
using QRCoder;

namespace SGDS.Api.Controllers;

[ApiController]
[Route("api/[controller]")]
[Authorize]
public class GoTraceController : ControllerBase
{
    private readonly SgdsDbContext _context;

    // Cadena de custodia fija (RN-GT03) — mismo orden que el mockup del certificado.
    private static readonly string[] PuntosControlDisponibles = { "Fábrica", "Bodega", "Distribuidor", "Punto de venta" };

    public GoTraceController(SgdsDbContext context)
    {
        _context = context;
    }

    // ===== Creación y edición =====

    // POST: api/GoTrace/solicitudes
    [HttpPost("solicitudes")]
    public async Task<IActionResult> CrearSolicitud(CrearSolicitudGoTraceDto dto)
    {
        var esAdminSyc = User.FindFirst("esAdminSyc")?.Value == "True";
        var proyectosPermitidos = User.FindAll("proyecto")
            .Select(c => int.Parse(c.Value.Split(':')[0]))
            .ToList();

        if (!esAdminSyc && !proyectosPermitidos.Contains(dto.ProyectoId))
        {
            return BadRequest(new { mensaje = "No tienes acceso al proyecto indicado." });
        }

        var empresaExiste = await _context.Empresas.AnyAsync(e => e.Id == dto.EmpresaId);
        if (!empresaExiste)
            return BadRequest(new { mensaje = "La empresa productora no existe." });

        var tipo = await _context.TiposSolicitudes.FindAsync(dto.TipoSolicitudId);
        if (tipo == null)
            return BadRequest(new { mensaje = "El tipo de solicitud no es válido." });

        var errorLote = ValidarDatosLote(dto.Producto, dto.NumeroLote, dto.UnidadesLote);
        if (errorLote != null) return BadRequest(new { mensaje = errorLote });

        var errorUid = ValidarRangoUid(dto.PrefijoUid, dto.CantidadUids, dto.UidInicial);
        if (errorUid != null) return BadRequest(new { mensaje = errorUid });

        var nuevaSolicitud = new Solicitud
        {
            EmpresaId = dto.EmpresaId,
            ProyectoId = dto.ProyectoId,
            TipoSolicitudId = dto.TipoSolicitudId,
            Estado = "Radicada",
            FechaCreacion = DateTime.UtcNow,
            LoteGoTrace = new LoteGoTrace
            {
                Producto = dto.Producto,
                NumeroLote = dto.NumeroLote,
                FechaProduccion = DateTime.SpecifyKind(dto.FechaProduccion, DateTimeKind.Utc),
                UnidadesLote = dto.UnidadesLote,
                PrefijoUid = dto.PrefijoUid,
                CantidadUids = dto.CantidadUids,
                UidInicial = dto.UidInicial,
                UidFinal = CalcularUidFinal(dto.CantidadUids, dto.UidInicial),
                PuntosControl = ConstruirPuntosControl(dto.PuntosControlHabilitados),
            },
        };

        _context.Solicitudes.Add(nuevaSolicitud);
        await _context.SaveChangesAsync();

        _context.HistorialEstados.Add(new HistorialEstado
        {
            SolicitudId = nuevaSolicitud.Id,
            EstadoAnterior = null,
            EstadoNuevo = "Radicada",
            FechaCambio = DateTime.UtcNow,
        });
        await _context.SaveChangesAsync();

        return CreatedAtAction(nameof(GetCertificado), new { id = nuevaSolicitud.Id }, new { nuevaSolicitud.Id });
    }

    // PUT: api/GoTrace/solicitudes/5
    [HttpPut("solicitudes/{id}")]
    public async Task<IActionResult> ActualizarSolicitud(int id, ActualizarSolicitudGoTraceDto dto)
    {
        var (error, solicitud) = await ObtenerSolicitudGoTraceAsync(id);
        if (error != null) return error;

        var errorLote = ValidarDatosLote(dto.Producto, dto.NumeroLote, dto.UnidadesLote);
        if (errorLote != null) return BadRequest(new { mensaje = errorLote });

        var errorUid = ValidarRangoUid(dto.PrefijoUid, dto.CantidadUids, dto.UidInicial);
        if (errorUid != null) return BadRequest(new { mensaje = errorUid });

        var lote = solicitud!.LoteGoTrace!;
        lote.Producto = dto.Producto;
        lote.NumeroLote = dto.NumeroLote;
        lote.FechaProduccion = DateTime.SpecifyKind(dto.FechaProduccion, DateTimeKind.Utc);
        lote.UnidadesLote = dto.UnidadesLote;
        lote.PrefijoUid = dto.PrefijoUid;
        lote.CantidadUids = dto.CantidadUids;
        lote.UidInicial = dto.UidInicial;
        lote.UidFinal = CalcularUidFinal(dto.CantidadUids, dto.UidInicial);

        foreach (var punto in lote.PuntosControl)
            punto.Habilitado = dto.PuntosControlHabilitados.Contains(punto.Nombre);

        await _context.SaveChangesAsync();
        return NoContent();
    }

    // ===== Cadena de custodia =====

    // PUT: api/GoTrace/solicitudes/5/puntos-control/8/confirmar
    [HttpPut("solicitudes/{id}/puntos-control/{puntoId}/confirmar")]
    public async Task<IActionResult> ConfirmarPuntoControl(int id, int puntoId)
    {
        var (error, solicitud) = await ObtenerSolicitudGoTraceAsync(id);
        if (error != null) return error;

        var punto = solicitud!.LoteGoTrace!.PuntosControl.FirstOrDefault(p => p.Id == puntoId);
        if (punto == null)
            return NotFound(new { mensaje = "El punto de control no existe para esta solicitud." });

        if (!punto.Habilitado)
            return BadRequest(new { mensaje = $"\"{punto.Nombre}\" no está habilitado en la cadena de custodia de este lote." });

        if (punto.Confirmado)
            return BadRequest(new { mensaje = $"\"{punto.Nombre}\" ya estaba confirmado." });

        punto.Confirmado = true;
        punto.FechaConfirmacion = DateTime.UtcNow;

        await _context.SaveChangesAsync();
        return NoContent();
    }

    // ===== Certificado de trazabilidad =====

    // GET: api/GoTrace/solicitudes/5/certificado
    [HttpGet("solicitudes/{id}/certificado")]
    public async Task<IActionResult> GetCertificado(int id)
    {
        var (error, solicitud) = await ObtenerSolicitudGoTraceAsync(id);
        return error ?? Ok(ConstruirCertificadoDto(solicitud!));
    }

    // GET: api/GoTrace/solicitudes/5/certificado-pdf
    [HttpGet("solicitudes/{id}/certificado-pdf")]
    public async Task<IActionResult> GetCertificadoPdf(int id)
    {
        var (error, solicitud) = await ObtenerSolicitudGoTraceAsync(id);
        if (error != null) return error;

        var dto = ConstruirCertificadoDto(solicitud!);
        var qrBytes = GenerarQrPng(ContenidoQr(dto));
        var pdfBytes = GenerarCertificadoPdf(dto, qrBytes);
        return File(pdfBytes, "application/pdf", $"Certificado_Trazabilidad_{dto.NumeroLote}.pdf");
    }

    // GET: api/GoTrace/solicitudes/5/certificado-qr.png
    [HttpGet("solicitudes/{id}/certificado-qr.png")]
    public async Task<IActionResult> GetCertificadoQr(int id)
    {
        var (error, solicitud) = await ObtenerSolicitudGoTraceAsync(id);
        if (error != null) return error;

        var dto = ConstruirCertificadoDto(solicitud!);
        var qrBytes = GenerarQrPng(ContenidoQr(dto));
        return File(qrBytes, "image/png");
    }

    // ===== Helpers =====

    private static string? ValidarDatosLote(string producto, string numeroLote, int unidades)
    {
        if (string.IsNullOrWhiteSpace(producto)) return "Indica el producto del lote.";
        if (string.IsNullOrWhiteSpace(numeroLote)) return "Indica el número de lote.";
        if (unidades <= 0) return "Las unidades del lote deben ser mayores que cero.";
        return null;
    }

    private static string? ValidarRangoUid(string? prefijo, int? cantidad, int? inicial)
    {
        // El rango de UIDs es opcional al radicar (el mockup no lo exige) — si se diligencia
        // alguno de los tres campos, deben venir completos.
        var algunoLleno = !string.IsNullOrWhiteSpace(prefijo) || cantidad.HasValue || inicial.HasValue;
        if (!algunoLleno) return null;

        if (string.IsNullOrWhiteSpace(prefijo) || !cantidad.HasValue || !inicial.HasValue)
            return "Para registrar el rango de UIDs, completa prefijo, cantidad y código inicial.";
        if (cantidad <= 0) return "La cantidad de UIDs debe ser mayor que cero.";
        if (inicial < 0) return "El UID inicial no puede ser negativo.";
        return null;
    }

    private static int? CalcularUidFinal(int? cantidad, int? inicial) =>
        cantidad.HasValue && inicial.HasValue ? inicial.Value + cantidad.Value - 1 : null;

    private static List<PuntoControlGoTrace> ConstruirPuntosControl(List<string> habilitados) =>
        PuntosControlDisponibles.Select((nombre, i) => new PuntoControlGoTrace
        {
            Nombre = nombre,
            Orden = i + 1,
            Habilitado = habilitados.Contains(nombre),
        }).ToList();

    private async Task<(IActionResult? Error, Solicitud? Solicitud)> ObtenerSolicitudGoTraceAsync(int id)
    {
        var esAdminSyc = User.FindFirst("esAdminSyc")?.Value == "True";
        var proyectosPermitidos = User.FindAll("proyecto")
            .Select(c => int.Parse(c.Value.Split(':')[0]))
            .ToList();

        var solicitud = await _context.Solicitudes
            .Include(s => s.Empresa)
            .Include(s => s.Proyecto)
            .Include(s => s.LoteGoTrace!).ThenInclude(l => l.PuntosControl)
            .FirstOrDefaultAsync(s => s.Id == id);

        if (solicitud == null || solicitud.LoteGoTrace == null)
            return (NotFound(), null);

        if (!esAdminSyc && (solicitud.ProyectoId == null || !proyectosPermitidos.Contains(solicitud.ProyectoId.Value)))
            return (NotFound(), null);

        return (null, solicitud);
    }

    private static string ContenidoQr(CertificadoTrazabilidadResponseDto dto) =>
        $"SGDS-GOTRACE|{dto.Numero}|Lote:{dto.NumeroLote}|{dto.TotalPuntosConfirmados}/{dto.TotalPuntosHabilitados} puntos confirmados";

    private static CertificadoTrazabilidadResponseDto ConstruirCertificadoDto(Solicitud s)
    {
        var l = s.LoteGoTrace!;
        var numero = s.Proyecto != null ? $"{s.Proyecto.Codigo}-{s.Id:0000}" : s.Id.ToString();
        var puntos = l.PuntosControl.OrderBy(p => p.Orden)
            .Select(p => new PuntoControlResponseDto
            {
                Id = p.Id,
                Nombre = p.Nombre,
                Orden = p.Orden,
                Habilitado = p.Habilitado,
                Confirmado = p.Confirmado,
                FechaConfirmacion = p.FechaConfirmacion,
            })
            .ToList();

        var habilitados = puntos.Where(p => p.Habilitado).ToList();
        var fechasConfirmacion = habilitados.Where(p => p.FechaConfirmacion.HasValue).Select(p => p.FechaConfirmacion!.Value).ToList();

        return new CertificadoTrazabilidadResponseDto
        {
            SolicitudId = s.Id,
            Numero = numero,
            Estado = s.Estado,
            EmpresaId = s.EmpresaId ?? 0,
            EmpresaRazonSocial = s.Empresa?.RazonSocial ?? string.Empty,
            EmpresaNit = s.Empresa?.Nit ?? string.Empty,
            Producto = l.Producto,
            NumeroLote = l.NumeroLote,
            FechaProduccion = l.FechaProduccion,
            UnidadesLote = l.UnidadesLote,
            PrefijoUid = l.PrefijoUid,
            CantidadUids = l.CantidadUids,
            UidInicial = l.UidInicial,
            UidFinal = l.UidFinal,
            RangoUidCompleto = l.PrefijoUid != null && l.UidInicial.HasValue && l.UidFinal.HasValue
                ? $"{l.PrefijoUid}-{l.UidInicial:00000} a {l.PrefijoUid}-{l.UidFinal:00000}"
                : null,
            PuntosControl = puntos,
            TotalPuntosHabilitados = habilitados.Count,
            TotalPuntosConfirmados = habilitados.Count(p => p.Confirmado),
            UltimaActualizacion = fechasConfirmacion.Count > 0 ? fechasConfirmacion.Max() : (DateTime?)null,
            FechaCreacion = s.FechaCreacion,
        };
    }

    private static byte[] GenerarQrPng(string contenido)
    {
        using var generador = new QRCodeGenerator();
        using var datosQr = generador.CreateQrCode(contenido, QRCodeGenerator.ECCLevel.Q);
        var pngQr = new PngByteQRCode(datosQr);
        return pngQr.GetGraphic(20);
    }

    private static byte[] GenerarCertificadoPdf(CertificadoTrazabilidadResponseDto dto, byte[] qrBytes)
    {
        var documento = Document.Create(contenedor =>
        {
            contenedor.Page(pagina =>
            {
                pagina.Size(PageSizes.A4);
                pagina.Margin(30);
                pagina.DefaultTextStyle(x => x.FontSize(10));

                pagina.Header().Column(col =>
                {
                    col.Item().Text("Gotrace — Trazabilidad Logística").FontSize(11).FontColor(Colors.Amber.Darken2);
                    col.Item().Text("Certificado de Trazabilidad").FontSize(18).Bold();
                    col.Item().PaddingTop(4).Text($"Lote: {dto.NumeroLote}").FontSize(11).Bold();
                });

                pagina.Content().PaddingTop(15).Column(col =>
                {
                    col.Spacing(12);

                    col.Item().Text("Producto").Bold();
                    col.Item().Table(t =>
                    {
                        t.ColumnsDefinition(c => { c.RelativeColumn(); c.RelativeColumn(); });
                        void Fila(string l, string v) { t.Cell().Text(l); t.Cell().Text(v); }
                        Fila("Producto", dto.Producto);
                        Fila("Unidades del lote", $"{dto.UnidadesLote:N0} botellas");
                        Fila("Fecha de producción", dto.FechaProduccion.ToString("dd/MM/yyyy"));
                        if (dto.RangoUidCompleto != null)
                            Fila("Rango de UIDs", dto.RangoUidCompleto);
                    });

                    col.Item().Text("Empresa productora").Bold();
                    col.Item().Table(t =>
                    {
                        t.ColumnsDefinition(c => { c.RelativeColumn(); c.RelativeColumn(); });
                        t.Cell().Text("Razón social"); t.Cell().Text(dto.EmpresaRazonSocial);
                        t.Cell().Text("NIT"); t.Cell().Text(dto.EmpresaNit);
                    });

                    col.Item().Text("Cadena de custodia").Bold();
                    col.Item().Table(t =>
                    {
                        t.ColumnsDefinition(c => { c.RelativeColumn(2); c.RelativeColumn(); c.RelativeColumn(2); });
                        t.Cell().Text("Punto de control").Bold();
                        t.Cell().Text("Estado").Bold();
                        t.Cell().Text("Fecha").Bold();
                        foreach (var p in dto.PuntosControl.Where(p => p.Habilitado))
                        {
                            t.Cell().Text(p.Nombre);
                            t.Cell().Text(p.Confirmado ? "Confirmado" : "Pendiente")
                                .FontColor(p.Confirmado ? Colors.Green.Darken1 : Colors.Grey.Medium);
                            t.Cell().Text(p.FechaConfirmacion.HasValue ? p.FechaConfirmacion.Value.ToString("dd/MM/yyyy HH:mm") : "—");
                        }
                    });

                    col.Item().PaddingTop(4).Text($"{dto.TotalPuntosConfirmados} de {dto.TotalPuntosHabilitados} puntos de control confirmados.")
                        .FontSize(11).Bold();

                    col.Item().PaddingTop(10).AlignCenter().Width(110).Image(qrBytes);
                    col.Item().AlignCenter().Text(dto.Numero).FontSize(8);

                    col.Item().PaddingTop(6).Text(
                        "Este certificado se actualiza conforme cada punto de control registra el paso del lote. Es una herramienta de la empresa productora, distinta de la estampilla oficial que expide SYCTrace para el control departamental del impuesto al consumo.")
                        .FontSize(8.5f).Italic().FontColor(Colors.Grey.Medium);
                });

                pagina.Footer().AlignCenter().Text(texto =>
                {
                    texto.Span("Generado el ");
                    texto.Span(DateTime.UtcNow.ToString("yyyy-MM-dd HH:mm")).Bold();
                });
            });
        });

        return documento.GeneratePdf();
    }
}
