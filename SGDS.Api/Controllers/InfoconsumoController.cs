using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Options;
using SGDS.Application.DTOs;
using SGDS.Application.Helpers;
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
public class InfoconsumoController : ControllerBase
{
    private readonly SgdsDbContext _context;
    private readonly ConfiguracionImpuestoConsumo _configImpoConsumo;

    public InfoconsumoController(SgdsDbContext context, IOptions<ConfiguracionImpuestoConsumo> configImpoConsumo)
    {
        _context = context;
        _configImpoConsumo = configImpoConsumo.Value;
    }

    // ===== Creación y edición =====

    // POST: api/Infoconsumo/solicitudes
    [HttpPost("solicitudes")]
    public async Task<IActionResult> CrearSolicitud(CrearSolicitudInfoconsumoDto dto)
    {
        var empresaExiste = await _context.Empresas.AnyAsync(e => e.Id == dto.EmpresaId);
        if (!empresaExiste)
            return BadRequest(new { mensaje = "La empresa contribuyente no existe." });

        var tipo = await _context.TiposSolicitudes.FindAsync(dto.TipoSolicitudId);
        if (tipo == null)
            return BadRequest(new { mensaje = "El tipo de solicitud no es válido." });

        var errorCoherencia = ValidarCoherenciaOrigenDestino(tipo.Nombre, dto.DepartamentoOrigen, dto.DepartamentoDestino);
        if (errorCoherencia != null)
            return BadRequest(new { mensaje = errorCoherencia });

        var conflicto = await BuscarConflictoPlacaAsync(dto.PlacaVehiculo, dto.NitTransportador, null);
        if (conflicto.HasValue)
            return BadRequest(new { mensaje = $"La placa {dto.PlacaVehiculo} ya tiene una tornaguía activa (solicitud #{conflicto}) dentro del mismo rango de vigencia." });

        var nuevaSolicitud = new Solicitud
        {
            EmpresaId = dto.EmpresaId,
            ProyectoId = dto.ProyectoId,
            TipoSolicitudId = dto.TipoSolicitudId,
            Estado = "Elaborada",
            FechaCreacion = DateTime.UtcNow,
            TornaguiaInfoconsumo = new TornaguiaInfoconsumo
            {
                TipoTransporte = dto.TipoTransporte,
                CategoriaProducto = dto.CategoriaProducto,
                GradosAlcoholimetricos = dto.GradosAlcoholimetricos,
                UnidadesFisicas = dto.UnidadesFisicas,
                PvpCertificado = dto.PvpCertificado,
                DepartamentoOrigen = dto.DepartamentoOrigen,
                MunicipioOrigen = dto.MunicipioOrigen,
                DepartamentoDestino = dto.DepartamentoDestino,
                MunicipioDestino = dto.MunicipioDestino,
                EmpresaTransportadora = dto.EmpresaTransportadora,
                NitTransportador = dto.NitTransportador,
                PlacaVehiculo = dto.PlacaVehiculo,
                Conductor = dto.Conductor,
                CedulaConductor = dto.CedulaConductor,
                TipoVehiculo = dto.TipoVehiculo,
                Observaciones = dto.Observaciones,
            },
        };

        _context.Solicitudes.Add(nuevaSolicitud);
        await _context.SaveChangesAsync();

        return CreatedAtAction(nameof(GetTornaguia), new { id = nuevaSolicitud.Id }, new { nuevaSolicitud.Id });
    }

    // PUT: api/Infoconsumo/solicitudes/5
    [HttpPut("solicitudes/{id}")]
    public async Task<IActionResult> ActualizarSolicitud(int id, ActualizarSolicitudInfoconsumoDto dto)
    {
        var (error, solicitud) = await ObtenerSolicitudInfoconsumoAsync(id, incluirTipo: true);
        if (error != null) return error;

        var tipoNombre = solicitud!.TipoSolicitud?.Nombre ?? string.Empty;
        if (dto.TipoSolicitudId.HasValue && dto.TipoSolicitudId.Value != solicitud.TipoSolicitudId)
        {
            var tipo = await _context.TiposSolicitudes.FindAsync(dto.TipoSolicitudId.Value);
            if (tipo == null) return BadRequest(new { mensaje = "El tipo de solicitud no es válido." });
            tipoNombre = tipo.Nombre;
        }

        var errorCoherencia = ValidarCoherenciaOrigenDestino(tipoNombre, dto.DepartamentoOrigen, dto.DepartamentoDestino);
        if (errorCoherencia != null)
            return BadRequest(new { mensaje = errorCoherencia });

        var conflicto = await BuscarConflictoPlacaAsync(dto.PlacaVehiculo, dto.NitTransportador, id);
        if (conflicto.HasValue)
            return BadRequest(new { mensaje = $"La placa {dto.PlacaVehiculo} ya tiene una tornaguía activa (solicitud #{conflicto}) dentro del mismo rango de vigencia." });

        if (dto.TipoSolicitudId.HasValue)
            solicitud.TipoSolicitudId = dto.TipoSolicitudId.Value;

        var t = solicitud.TornaguiaInfoconsumo!;
        t.TipoTransporte = dto.TipoTransporte;
        t.CategoriaProducto = dto.CategoriaProducto;
        t.GradosAlcoholimetricos = dto.GradosAlcoholimetricos;
        t.UnidadesFisicas = dto.UnidadesFisicas;
        t.PvpCertificado = dto.PvpCertificado;
        t.DepartamentoOrigen = dto.DepartamentoOrigen;
        t.MunicipioOrigen = dto.MunicipioOrigen;
        t.DepartamentoDestino = dto.DepartamentoDestino;
        t.MunicipioDestino = dto.MunicipioDestino;
        t.EmpresaTransportadora = dto.EmpresaTransportadora;
        t.NitTransportador = dto.NitTransportador;
        t.PlacaVehiculo = dto.PlacaVehiculo;
        t.Conductor = dto.Conductor;
        t.CedulaConductor = dto.CedulaConductor;
        t.TipoVehiculo = dto.TipoVehiculo;
        t.Observaciones = dto.Observaciones;

        await _context.SaveChangesAsync();
        return NoContent();
    }

    // ===== Ciclo de vida propio de Infoconsumo (sección 3 de las reglas de negocio) =====

    // PUT: api/Infoconsumo/solicitudes/5/expedir
    [HttpPut("solicitudes/{id}/expedir")]
    public async Task<IActionResult> Expedir(int id)
    {
        var (error, solicitud) = await ObtenerSolicitudInfoconsumoAsync(id, incluirTipo: true);
        if (error != null) return error;

        if (solicitud!.Estado != "Elaborada")
            return BadRequest(new { mensaje = "Solo se puede expedir una tornaguía que esté en estado Elaborada." });

        var t = solicitud.TornaguiaInfoconsumo!;
        var conflicto = await BuscarConflictoPlacaAsync(t.PlacaVehiculo, t.NitTransportador, id);
        if (conflicto.HasValue)
            return BadRequest(new { mensaje = $"La placa {t.PlacaVehiculo} ya tiene una tornaguía activa (solicitud #{conflicto})." });

        // Vigencia: 10 días calendario para Tránsito, 15 días calendario para el resto — Decreto 3071/1997
        // (sustituye la fórmula por distancia vial de la sección 3.2, no definida por el equipo de negocio).
        var diasVigencia = solicitud.TipoSolicitud?.Nombre == "Tránsito" ? 10 : 15;

        var estadoAnterior = solicitud.Estado;
        solicitud.Estado = "Expedida";
        t.FechaExpedicion = DateTime.UtcNow;
        t.FechaVigenciaLimite = DateTime.UtcNow.AddDays(diasVigencia);

        _context.HistorialEstados.Add(new HistorialEstado
        {
            SolicitudId = id,
            EstadoAnterior = estadoAnterior,
            EstadoNuevo = "Expedida",
            FechaCambio = DateTime.UtcNow,
        });

        await _context.SaveChangesAsync();
        return NoContent();
    }

    // PUT: api/Infoconsumo/solicitudes/5/legalizar
    [HttpPut("solicitudes/{id}/legalizar")]
    public async Task<IActionResult> Legalizar(int id)
    {
        var (error, solicitud) = await ObtenerSolicitudInfoconsumoAsync(id, incluirTipo: false);
        if (error != null) return error;

        if (solicitud!.Estado != "Expedida")
            return BadRequest(new { mensaje = "Solo se puede legalizar una tornaguía que esté Expedida." });

        var estadoAnterior = solicitud.Estado;
        solicitud.Estado = "Legalizada";
        solicitud.FechaCierre = DateTime.UtcNow;
        solicitud.TornaguiaInfoconsumo!.FechaLegalizacion = DateTime.UtcNow;

        _context.HistorialEstados.Add(new HistorialEstado
        {
            SolicitudId = id,
            EstadoAnterior = estadoAnterior,
            EstadoNuevo = "Legalizada",
            FechaCambio = DateTime.UtcNow,
        });

        await _context.SaveChangesAsync();
        return NoContent();
    }

    // ===== Tornaguía =====

    // GET: api/Infoconsumo/solicitudes/5/tornaguia
    [HttpGet("solicitudes/{id}/tornaguia")]
    public async Task<IActionResult> GetTornaguia(int id)
    {
        var (error, solicitud) = await ObtenerSolicitudInfoconsumoAsync(id, incluirTipo: true);
        return error ?? Ok(ConstruirTornaguiaDto(solicitud!));
    }

    // GET: api/Infoconsumo/solicitudes/5/tornaguia-pdf
    [HttpGet("solicitudes/{id}/tornaguia-pdf")]
    public async Task<IActionResult> GetTornaguiaPdf(int id)
    {
        var (error, solicitud) = await ObtenerSolicitudInfoconsumoAsync(id, incluirTipo: true);
        if (error != null) return error;

        var dto = ConstruirTornaguiaDto(solicitud!);
        var qrBytes = GenerarQrPng($"SGDS-INFOCONSUMO-TG|{dto.Numero}|Placa:{dto.PlacaVehiculo}|Vence:{dto.FechaVigenciaLimite:yyyy-MM-dd}");
        var pdfBytes = GenerarTornaguiaPdf(dto, qrBytes);
        return File(pdfBytes, "application/pdf", $"Tornaguia_{dto.Numero}.pdf");
    }

    // GET: api/Infoconsumo/solicitudes/5/tornaguia-qr.png
    [HttpGet("solicitudes/{id}/tornaguia-qr.png")]
    public async Task<IActionResult> GetTornaguiaQr(int id)
    {
        var (error, solicitud) = await ObtenerSolicitudInfoconsumoAsync(id, incluirTipo: true);
        if (error != null) return error;

        var dto = ConstruirTornaguiaDto(solicitud!);
        var qrBytes = GenerarQrPng($"SGDS-INFOCONSUMO-TG|{dto.Numero}|Placa:{dto.PlacaVehiculo}|Vence:{dto.FechaVigenciaLimite:yyyy-MM-dd}");
        return File(qrBytes, "image/png");
    }

    // ===== Preliquidación del Impuesto al Consumo (ICL) =====

    // GET: api/Infoconsumo/solicitudes/5/liquidacion
    [HttpGet("solicitudes/{id}/liquidacion")]
    public async Task<IActionResult> GetLiquidacion(int id)
    {
        var (error, solicitud) = await ObtenerSolicitudInfoconsumoAsync(id, incluirTipo: true);
        return error ?? Ok(ConstruirLiquidacionDto(solicitud!));
    }

    // GET: api/Infoconsumo/solicitudes/5/liquidacion-pdf
    [HttpGet("solicitudes/{id}/liquidacion-pdf")]
    public async Task<IActionResult> GetLiquidacionPdf(int id)
    {
        var (error, solicitud) = await ObtenerSolicitudInfoconsumoAsync(id, incluirTipo: true);
        if (error != null) return error;

        var dto = ConstruirLiquidacionDto(solicitud!);
        var qrBytes = GenerarQrPng($"SGDS-INFOCONSUMO-ICL|{dto.Numero}|Total:{dto.TotalAPagar:0}");
        var pdfBytes = GenerarLiquidacionPdf(dto, qrBytes);
        return File(pdfBytes, "application/pdf", $"Liquidacion_ICL_{dto.Numero}.pdf");
    }

    // GET: api/Infoconsumo/solicitudes/5/liquidacion-qr.png
    [HttpGet("solicitudes/{id}/liquidacion-qr.png")]
    public async Task<IActionResult> GetLiquidacionQr(int id)
    {
        var (error, solicitud) = await ObtenerSolicitudInfoconsumoAsync(id, incluirTipo: true);
        if (error != null) return error;

        var dto = ConstruirLiquidacionDto(solicitud!);
        var qrBytes = GenerarQrPng($"SGDS-INFOCONSUMO-ICL|{dto.Numero}|Total:{dto.TotalAPagar:0}");
        return File(qrBytes, "image/png");
    }

    // ===== Historial por empresa (contribuyente) =====

    // GET: api/Infoconsumo/empresas/5/historial
    [HttpGet("empresas/{empresaId}/historial")]
    public async Task<IActionResult> GetHistorialEmpresa(int empresaId)
    {
        var esAdminSyc = User.FindFirst("esAdminSyc")?.Value == "True";
        var proyectosPermitidos = User.FindAll("proyecto")
            .Select(c => int.Parse(c.Value.Split(':')[0]))
            .ToList();

        var query = _context.Solicitudes
            .Include(s => s.Proyecto)
            .Include(s => s.TipoSolicitud)
            .Where(s => s.EmpresaId == empresaId && s.Proyecto != null && s.Proyecto.Nombre == "Infoconsumo");

        if (!esAdminSyc)
        {
            query = query.Where(s => s.ProyectoId != null && proyectosPermitidos.Contains(s.ProyectoId.Value));
        }

        var resultado = await query
            .OrderByDescending(s => s.FechaCreacion)
            .Select(s => new SolicitudHistorialEmpresaDto
            {
                Id = s.Id,
                Numero = s.Proyecto != null ? s.Proyecto.Codigo + "-" + s.Id.ToString("0000") : s.Id.ToString(),
                TipoSolicitudNombre = s.TipoSolicitud != null ? s.TipoSolicitud.Nombre : null,
                Estado = s.Estado,
                FechaCreacion = s.FechaCreacion,
            })
            .ToListAsync();

        return Ok(resultado);
    }

    // ===== Kanban (estados propios de Infoconsumo — no reutiliza el workflow genérico) =====

    // GET: api/Infoconsumo/kanban?proyectoId=8
    [HttpGet("kanban")]
    public async Task<IActionResult> GetKanban([FromQuery] int proyectoId)
    {
        var esAdminSyc = User.FindFirst("esAdminSyc")?.Value == "True";
        var proyectosPermitidos = User.FindAll("proyecto")
            .Select(c => int.Parse(c.Value.Split(':')[0]))
            .ToList();

        if (!esAdminSyc && !proyectosPermitidos.Contains(proyectoId))
            return BadRequest(new { mensaje = "No tienes acceso a este proyecto." });

        var solicitudes = await _context.Solicitudes
            .Include(s => s.Empresa)
            .Include(s => s.TipoSolicitud)
            .Include(s => s.Proyecto)
            .Include(s => s.TornaguiaInfoconsumo)
            .Where(s => s.ProyectoId == proyectoId)
            .OrderByDescending(s => s.FechaCreacion)
            .ToListAsync();

        var tarjetas = solicitudes
            .Where(s => s.TornaguiaInfoconsumo != null)
            .Select(s => new TarjetaKanbanInfoconsumoDto
            {
                Id = s.Id,
                Numero = s.Proyecto != null ? $"{s.Proyecto.Codigo}-{s.Id:0000}" : s.Id.ToString(),
                TipoTramite = s.TipoSolicitud?.Nombre,
                EmpresaNombre = s.Empresa?.RazonSocial,
                Estado = EstadoEfectivo(s),
                FechaCreacion = s.FechaCreacion,
                FechaVigenciaLimite = s.TornaguiaInfoconsumo!.FechaVigenciaLimite,
            })
            .ToList();

        return Ok(tarjetas);
    }

    // ===== Helpers =====

    private static string? ValidarCoherenciaOrigenDestino(string tipoTramite, string depOrigen, string depDestino)
    {
        if (tipoTramite == "Tránsito local" && depOrigen != depDestino)
            return "Tránsito local exige que el departamento de origen y el de destino sean el mismo.";

        if ((tipoTramite == "Movilización" || tipoTramite == "Reenvío") && depOrigen == depDestino)
            return $"{tipoTramite} exige que el departamento de origen y el de destino sean diferentes.";

        return null;
    }

    private async Task<int?> BuscarConflictoPlacaAsync(string placa, string? nitTransportador, int? excluirSolicitudId)
    {
        if (string.IsNullOrWhiteSpace(placa))
            return null;

        var query = _context.TornaguiasInfoconsumo
            .Include(t => t.Solicitud)
            .Where(t => t.PlacaVehiculo == placa
                     && t.NitTransportador == nitTransportador
                     && t.Solicitud.Estado == "Expedida"
                     && t.FechaVigenciaLimite != null
                     && t.FechaVigenciaLimite > DateTime.UtcNow);

        if (excluirSolicitudId.HasValue)
            query = query.Where(t => t.SolicitudId != excluirSolicitudId.Value);

        return await query.Select(t => (int?)t.SolicitudId).FirstOrDefaultAsync();
    }

    private async Task<(IActionResult? Error, Solicitud? Solicitud)> ObtenerSolicitudInfoconsumoAsync(int id, bool incluirTipo)
    {
        var esAdminSyc = User.FindFirst("esAdminSyc")?.Value == "True";
        var proyectosPermitidos = User.FindAll("proyecto")
            .Select(c => int.Parse(c.Value.Split(':')[0]))
            .ToList();

        var query = _context.Solicitudes
            .Include(s => s.Empresa)
            .Include(s => s.Proyecto)
            .Include(s => s.TornaguiaInfoconsumo)
            .AsQueryable();

        if (incluirTipo)
            query = query.Include(s => s.TipoSolicitud);

        var solicitud = await query.FirstOrDefaultAsync(s => s.Id == id);

        if (solicitud == null || solicitud.TornaguiaInfoconsumo == null)
            return (NotFound(), null);

        if (!esAdminSyc && (solicitud.ProyectoId == null || !proyectosPermitidos.Contains(solicitud.ProyectoId.Value)))
            return (NotFound(), null);

        return (null, solicitud);
    }

    private static string EstadoEfectivo(Solicitud s)
    {
        var t = s.TornaguiaInfoconsumo;
        if (s.Estado == "Expedida" && t?.FechaVigenciaLimite != null && t.FechaVigenciaLimite < DateTime.UtcNow)
            return "Vencida";
        return s.Estado;
    }

    private static TornaguiaResponseDto ConstruirTornaguiaDto(Solicitud s)
    {
        var t = s.TornaguiaInfoconsumo!;
        var numero = s.Proyecto != null ? $"{s.Proyecto.Codigo}-{s.Id:0000}" : s.Id.ToString();
        var origen = GeografiaColombia.ObtenerCapital(t.DepartamentoOrigen);
        var destino = GeografiaColombia.ObtenerCapital(t.DepartamentoDestino);

        return new TornaguiaResponseDto
        {
            SolicitudId = s.Id,
            Numero = numero,
            TipoTramite = s.TipoSolicitud?.Nombre ?? string.Empty,
            Estado = EstadoEfectivo(s),
            EmpresaId = s.EmpresaId ?? 0,
            EmpresaRazonSocial = s.Empresa?.RazonSocial ?? string.Empty,
            EmpresaNit = s.Empresa?.Nit ?? string.Empty,
            TipoTransporte = t.TipoTransporte,
            CategoriaProducto = t.CategoriaProducto,
            GradosAlcoholimetricos = t.GradosAlcoholimetricos,
            UnidadesFisicas = t.UnidadesFisicas,
            VolumenTotalCc = t.UnidadesFisicas * CalculadoraImpuestoConsumo.PresentacionEstandarCc,
            PvpCertificado = t.PvpCertificado,
            DepartamentoOrigen = t.DepartamentoOrigen,
            MunicipioOrigen = t.MunicipioOrigen,
            DepartamentoDestino = t.DepartamentoDestino,
            MunicipioDestino = t.MunicipioDestino,
            DistanciaAproximadaKm = GeografiaColombia.DistanciaAproximadaKm(t.DepartamentoOrigen, t.DepartamentoDestino),
            LatOrigen = origen?.Lat,
            LngOrigen = origen?.Lng,
            LatDestino = destino?.Lat,
            LngDestino = destino?.Lng,
            EmpresaTransportadora = t.EmpresaTransportadora,
            NitTransportador = t.NitTransportador,
            PlacaVehiculo = t.PlacaVehiculo,
            Conductor = t.Conductor,
            CedulaConductor = t.CedulaConductor,
            TipoVehiculo = t.TipoVehiculo,
            Observaciones = t.Observaciones,
            FechaCreacion = s.FechaCreacion,
            FechaExpedicion = t.FechaExpedicion,
            FechaVigenciaLimite = t.FechaVigenciaLimite,
            FechaLegalizacion = t.FechaLegalizacion,
        };
    }

    private LiquidacionImpoConsumoResponseDto ConstruirLiquidacionDto(Solicitud s)
    {
        var t = s.TornaguiaInfoconsumo!;
        var numero = s.Proyecto != null ? $"{s.Proyecto.Codigo}-{s.Id:0000}" : s.Id.ToString();

        var entrada = new CalculadoraImpuestoConsumo.Entrada(
            t.CategoriaProducto,
            t.UnidadesFisicas,
            t.GradosAlcoholimetricos ?? 0,
            t.PvpCertificado,
            t.DepartamentoDestino,
            s.TipoSolicitud?.Nombre ?? string.Empty);

        var resultado = CalculadoraImpuestoConsumo.Calcular(entrada, _configImpoConsumo);

        return new LiquidacionImpoConsumoResponseDto
        {
            SolicitudId = s.Id,
            Numero = numero,
            TipoTramite = s.TipoSolicitud?.Nombre ?? string.Empty,
            ContribuyenteNombre = s.Empresa?.RazonSocial ?? string.Empty,
            ContribuyenteNit = s.Empresa?.Nit ?? string.Empty,
            CategoriaProducto = t.CategoriaProducto,
            UnidadesFisicas = t.UnidadesFisicas,
            GradosAlcoholimetricos = t.GradosAlcoholimetricos,
            VolumenTotalCc = resultado.VolumenTotalCc,
            PvpCertificado = t.PvpCertificado,
            DepartamentoDestino = t.DepartamentoDestino,
            Soportado = resultado.Soportado,
            MotivoNoSoportado = resultado.MotivoNoSoportado,
            TarifaEspecifica = resultado.TarifaEspecifica,
            TarifaAdValorem = resultado.TarifaAdValorem,
            ComponenteEspecifico = resultado.ComponenteEspecifico,
            ComponenteAdValorem = resultado.ComponenteAdValorem,
            IclInformativo = resultado.IclInformativo,
            TotalAPagar = resultado.TotalAPagar,
            AplicaExcepcionSanAndres = resultado.AplicaExcepcionSanAndres,
            EsSoloInformativo = resultado.EsSoloInformativo,
        };
    }

    private static byte[] GenerarQrPng(string contenido)
    {
        using var generador = new QRCodeGenerator();
        using var datosQr = generador.CreateQrCode(contenido, QRCodeGenerator.ECCLevel.Q);
        var pngQr = new PngByteQRCode(datosQr);
        return pngQr.GetGraphic(20);
    }

    private static byte[] GenerarTornaguiaPdf(TornaguiaResponseDto dto, byte[] qrBytes)
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
                    col.Item().Text("Secretaría de Hacienda Departamental — Unidad de Rentas").FontSize(11);
                    col.Item().Text($"Tornaguía de {dto.TipoTramite}").FontSize(16).Bold();
                    col.Item().PaddingTop(4).Text($"Número: {dto.Numero}").FontSize(10).Bold();
                });

                pagina.Content().PaddingTop(15).Column(col =>
                {
                    col.Spacing(12);

                    col.Item().Text("Producto amparado").Bold();
                    col.Item().Table(t =>
                    {
                        t.ColumnsDefinition(c => { c.RelativeColumn(); c.RelativeColumn(); });
                        void Fila(string l, string v) { t.Cell().Text(l); t.Cell().Text(v); }
                        Fila("Categoría", dto.CategoriaProducto);
                        Fila("Unidades físicas", $"{dto.UnidadesFisicas:N0} ({dto.VolumenTotalCc:N0} cc)");
                        Fila("Grados alcoholimétricos", dto.GradosAlcoholimetricos?.ToString("0.#°") ?? "—");
                    });

                    col.Item().Text("Empresa remitente").Bold();
                    col.Item().Table(t =>
                    {
                        t.ColumnsDefinition(c => { c.RelativeColumn(); c.RelativeColumn(); });
                        t.Cell().Text("Razón social"); t.Cell().Text(dto.EmpresaRazonSocial);
                        t.Cell().Text("NIT"); t.Cell().Text(dto.EmpresaNit);
                    });

                    col.Item().Text("Transportador").Bold();
                    col.Item().Table(t =>
                    {
                        t.ColumnsDefinition(c => { c.RelativeColumn(); c.RelativeColumn(); });
                        void Fila(string l, string v) { t.Cell().Text(l); t.Cell().Text(v); }
                        Fila("Empresa transportadora", dto.EmpresaTransportadora);
                        Fila("Conductor", dto.Conductor ?? "—");
                        Fila("Cédula del conductor", dto.CedulaConductor ?? "—");
                        Fila("Placa del vehículo", dto.PlacaVehiculo);
                        Fila("Tipo de vehículo", dto.TipoVehiculo ?? "—");
                    });

                    col.Item().Text("Movilización autorizada").Bold();
                    col.Item().Table(t =>
                    {
                        t.ColumnsDefinition(c => { c.RelativeColumn(); c.RelativeColumn(); });
                        t.Cell().Text("Origen"); t.Cell().Text($"{dto.MunicipioOrigen}, {dto.DepartamentoOrigen}");
                        t.Cell().Text("Destino"); t.Cell().Text($"{dto.MunicipioDestino}, {dto.DepartamentoDestino}");
                        if (dto.DistanciaAproximadaKm.HasValue)
                        {
                            t.Cell().Text("Distancia aproximada"); t.Cell().Text($"{dto.DistanciaAproximadaKm:N0} km (línea recta entre capitales)");
                        }
                    });

                    col.Item().PaddingTop(4).Text(
                        dto.FechaVigenciaLimite.HasValue
                            ? $"Vigente hasta el {dto.FechaVigenciaLimite:dd/MM/yyyy} — {(dto.TipoTramite == "Tránsito" ? "10 días calendario" : "15 días calendario")} para legalización (Decreto 3071 de 1997)."
                            : "Aún no expedida — sin fecha de vigencia.").FontSize(9).Italic();

                    col.Item().PaddingTop(10).AlignCenter().Width(110).Image(qrBytes);
                    col.Item().AlignCenter().Text(dto.Numero).FontSize(8);
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

    private static byte[] GenerarLiquidacionPdf(LiquidacionImpoConsumoResponseDto dto, byte[] qrBytes)
    {
        string Moneda(decimal v) => v.ToString("C0", new System.Globalization.CultureInfo("es-CO"));

        var documento = Document.Create(contenedor =>
        {
            contenedor.Page(pagina =>
            {
                pagina.Size(PageSizes.A4);
                pagina.Margin(30);
                pagina.DefaultTextStyle(x => x.FontSize(10));

                pagina.Header().Column(col =>
                {
                    col.Item().Text("Secretaría de Hacienda Departamental — Unidad de Rentas").FontSize(11);
                    col.Item().Text("Preliquidación Impuesto al Consumo").FontSize(16).Bold();
                    col.Item().PaddingTop(4).Text($"Referencia: {dto.Numero}").FontSize(10).Bold();
                });

                pagina.Content().PaddingTop(15).Column(col =>
                {
                    col.Spacing(12);

                    col.Item().Text("Contribuyente").Bold();
                    col.Item().Table(t =>
                    {
                        t.ColumnsDefinition(c => { c.RelativeColumn(); c.RelativeColumn(); });
                        t.Cell().Text("Razón social"); t.Cell().Text(dto.ContribuyenteNombre);
                        t.Cell().Text("NIT"); t.Cell().Text(dto.ContribuyenteNit);
                    });

                    col.Item().Text("Producto gravado").Bold();
                    col.Item().Table(t =>
                    {
                        t.ColumnsDefinition(c => { c.RelativeColumn(); c.RelativeColumn(); });
                        void Fila(string l, string v) { t.Cell().Text(l); t.Cell().Text(v); }
                        Fila("Categoría", dto.CategoriaProducto);
                        Fila("Unidades físicas", $"{dto.UnidadesFisicas:N0} ({dto.VolumenTotalCc:N0} cc)");
                        Fila("Grados alcoholimétricos", dto.GradosAlcoholimetricos?.ToString("0.#°") ?? "—");
                    });

                    if (!dto.Soportado)
                    {
                        col.Item().Text(dto.MotivoNoSoportado ?? "Categoría no soportada.").FontColor(Colors.Red.Medium);
                    }
                    else
                    {
                        col.Item().Text("Liquidación — Impuesto al Consumo de Licores (ICL)").Bold();
                        col.Item().Table(t =>
                        {
                            t.ColumnsDefinition(c => { c.RelativeColumn(2); c.RelativeColumn(); c.RelativeColumn(); });
                            t.Cell().Text("Concepto").Bold(); t.Cell().Text("Tarifa").Bold(); t.Cell().Text("Valor").Bold();
                            t.Cell().Text(dto.AplicaExcepcionSanAndres ? "Componente específico (tarifa San Andrés)" : "Componente específico");
                            t.Cell().Text($"${dto.TarifaEspecifica:N0} × grado");
                            t.Cell().Text(Moneda(dto.ComponenteEspecifico));
                            t.Cell().Text("Componente ad valorem");
                            t.Cell().Text($"{dto.TarifaAdValorem * 100:0.#}% sobre PVP");
                            t.Cell().Text(Moneda(dto.ComponenteAdValorem));
                        });

                        col.Item().PaddingTop(4).AlignRight().Text($"ICL informativo: {Moneda(dto.IclInformativo)}").FontSize(11);
                        col.Item().AlignRight().Text($"Total a pagar: {Moneda(dto.TotalAPagar)}").FontSize(14).Bold();

                        if (dto.EsSoloInformativo)
                        {
                            col.Item().Text($"El trámite es de {dto.TipoTramite} — el impuesto no se causa en este departamento; el valor se muestra solo de forma informativa.").FontSize(9).Italic();
                        }
                    }

                    col.Item().PaddingTop(10).AlignCenter().Width(110).Image(qrBytes);
                    col.Item().AlignCenter().Text(dto.Numero).FontSize(8);

                    col.Item().PaddingTop(6).AlignCenter().Text("Bancos habilitados: Davivienda, BBVA, Bancolombia, Banco de Bogotá").FontSize(9);
                    col.Item().AlignCenter().Text("PSE: tarjeta débito/crédito · cuentas de ahorro").FontSize(9);
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
