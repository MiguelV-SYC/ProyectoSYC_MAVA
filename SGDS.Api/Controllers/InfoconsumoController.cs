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
using SGDS.Api.Pdf;

namespace SGDS.Api.Controllers;

[ApiController]
[Route("api/[controller]")]
[Authorize]
public class InfoconsumoController : ControllerBase
{
    private readonly SgdsDbContext _context;
    private readonly ConfiguracionImpuestoConsumo _configImpoConsumo;
    private readonly SGDS.Application.Interfaces.IAlmacenamientoService _almacenamiento;

    public InfoconsumoController(SgdsDbContext context, IOptions<ConfiguracionImpuestoConsumo> configImpoConsumo, SGDS.Application.Interfaces.IAlmacenamientoService almacenamiento)
    {
        _context = context;
        _configImpoConsumo = configImpoConsumo.Value;
        _almacenamiento = almacenamiento;
    }

    // El logo de la empresa remitente es opcional (Empresa.RutaLogo) — si no lo ha cargado
    // todavía, la tornaguía se genera igual, sin ese bloque.
    private async Task<byte[]?> ObtenerLogoEmpresaAsync(int empresaId)
    {
        var rutaLogo = await _context.Empresas.Where(e => e.Id == empresaId).Select(e => e.RutaLogo).FirstOrDefaultAsync();
        if (rutaLogo == null) return null;

        try
        {
            using var stream = await _almacenamiento.ObtenerArchivoAsync(rutaLogo);
            using var memoria = new MemoryStream();
            await stream.CopyToAsync(memoria);
            return memoria.ToArray();
        }
        catch (FileNotFoundException)
        {
            return null;
        }
    }

    // ===== Creación y edición =====

    // POST: api/Infoconsumo/solicitudes
    [HttpPost("solicitudes")]
    public async Task<IActionResult> CrearSolicitud(CrearSolicitudInfoconsumoDto dto)
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

        var errorLoteGoTrace = await ValidarLoteGoTraceAsync(dto.LoteGoTraceSolicitudId, dto.EmpresaId);
        if (errorLoteGoTrace != null) return BadRequest(new { mensaje = errorLoteGoTrace });

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
                LoteGoTraceSolicitudId = dto.LoteGoTraceSolicitudId,
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

    // PUT: api/Infoconsumo/solicitudes/5/confirmar-pago
    // Independiente del ciclo Elaborada/Expedida/Legalizada/Vencida (que sigue midiendo la
    // movilización física) — marca que se pagó el impuesto al consumo, habilitando el puente
    // hacia SYCTrace para la expedición de la estampilla física (RN-03 de SYCTrace).
    [HttpPut("solicitudes/{id}/confirmar-pago")]
    public async Task<IActionResult> ConfirmarPago(int id)
    {
        var (error, solicitud) = await ObtenerSolicitudInfoconsumoAsync(id, incluirTipo: false);
        if (error != null) return error;

        if (solicitud!.Estado == "Elaborada")
            return BadRequest(new { mensaje = "Solo se puede confirmar el pago de una tornaguía ya expedida." });

        var t = solicitud.TornaguiaInfoconsumo!;
        if (t.PagoConfirmado)
            return BadRequest(new { mensaje = "El pago de esta tornaguía ya estaba confirmado." });

        t.PagoConfirmado = true;
        t.FechaPagoConfirmado = DateTime.UtcNow;

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
        var qrBytes = DisenoPdfSgds.GenerarQrPng($"SGDS-INFOCONSUMO-TG|{dto.Numero}|Placa:{dto.PlacaVehiculo}|Vence:{dto.FechaVigenciaLimite:yyyy-MM-dd}");
        var logoEmpresa = await ObtenerLogoEmpresaAsync(dto.EmpresaId);
        var pdfBytes = GenerarTornaguiaPdf(dto, qrBytes, logoEmpresa);
        return File(pdfBytes, "application/pdf", $"Tornaguia_{dto.Numero}.pdf");
    }

    // GET: api/Infoconsumo/solicitudes/5/tornaguia-qr.png
    [HttpGet("solicitudes/{id}/tornaguia-qr.png")]
    public async Task<IActionResult> GetTornaguiaQr(int id)
    {
        var (error, solicitud) = await ObtenerSolicitudInfoconsumoAsync(id, incluirTipo: true);
        if (error != null) return error;

        var dto = ConstruirTornaguiaDto(solicitud!);
        var qrBytes = DisenoPdfSgds.GenerarQrPng($"SGDS-INFOCONSUMO-TG|{dto.Numero}|Placa:{dto.PlacaVehiculo}|Vence:{dto.FechaVigenciaLimite:yyyy-MM-dd}");
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
        var qrBytes = DisenoPdfSgds.GenerarQrPng($"SGDS-INFOCONSUMO-ICL|{dto.Numero}|Total:{dto.TotalAPagar:0}");
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
        var qrBytes = DisenoPdfSgds.GenerarQrPng($"SGDS-INFOCONSUMO-ICL|{dto.Numero}|Total:{dto.TotalAPagar:0}");
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

    // ===== Búsqueda de lotes de GoTrace aprobados (paso opcional del formulario) =====
    // GoTrace rastrea el lote desde fábrica; si la empresa ya lo trazó allí, Infoconsumo hereda
    // empresa y unidades físicas en vez de volver a digitarlas (puente GoTrace -> Infoconsumo).

    // GET: api/Infoconsumo/lotes-gotrace-disponibles?buscar=GOTRACE-0012
    [HttpGet("lotes-gotrace-disponibles")]
    public async Task<IActionResult> GetLotesGoTraceDisponibles([FromQuery] string? buscar)
    {
        var esAdminSyc = User.FindFirst("esAdminSyc")?.Value == "True";
        var proyectosPermitidos = User.FindAll("proyecto")
            .Select(c => int.Parse(c.Value.Split(':')[0]))
            .ToList();

        var query = _context.Solicitudes
            .Include(s => s.Proyecto)
            .Include(s => s.Empresa)
            .Include(s => s.LoteGoTrace)
            .Where(s => s.Proyecto != null && s.Proyecto.Nombre == "Gotrace"
                     && s.Estado == "Aprobada" && s.LoteGoTrace != null);

        if (!esAdminSyc)
            query = query.Where(s => s.ProyectoId != null && proyectosPermitidos.Contains(s.ProyectoId.Value));

        var solicitudes = await query.OrderByDescending(s => s.FechaCreacion).Take(200).ToListAsync();

        var resultado = solicitudes
            .Select(s => new LoteGoTraceDisponibleDto
            {
                Id = s.Id,
                Numero = s.Proyecto != null ? $"{s.Proyecto.Codigo}-{s.Id:0000}" : s.Id.ToString(),
                EmpresaId = s.EmpresaId ?? 0,
                EmpresaNombre = s.Empresa?.RazonSocial ?? string.Empty,
                EmpresaNit = s.Empresa?.Nit ?? string.Empty,
                Producto = s.LoteGoTrace!.Producto,
                NumeroLote = s.LoteGoTrace.NumeroLote,
                UnidadesLote = s.LoteGoTrace.UnidadesLote,
                RangoUidCompleto = FormatearRangoUid(s.LoteGoTrace),
            })
            .Where(d => string.IsNullOrWhiteSpace(buscar)
                     || d.Numero.Contains(buscar, StringComparison.OrdinalIgnoreCase)
                     || d.EmpresaNombre.Contains(buscar, StringComparison.OrdinalIgnoreCase)
                     || d.EmpresaNit.Contains(buscar, StringComparison.OrdinalIgnoreCase)
                     || d.NumeroLote.Contains(buscar, StringComparison.OrdinalIgnoreCase)
                     || d.Producto.Contains(buscar, StringComparison.OrdinalIgnoreCase))
            .ToList();

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

    // El lote de GoTrace referenciado (si hay) debe existir, pertenecer al proyecto Gotrace,
    // estar Aprobado y ser de la misma empresa que radica la tornaguía en Infoconsumo.
    private async Task<string?> ValidarLoteGoTraceAsync(int? loteGoTraceSolicitudId, int empresaId)
    {
        if (!loteGoTraceSolicitudId.HasValue)
            return null;

        var lote = await _context.Solicitudes
            .Include(s => s.Proyecto)
            .FirstOrDefaultAsync(s => s.Id == loteGoTraceSolicitudId.Value);

        if (lote == null || lote.Proyecto == null || lote.Proyecto.Nombre != "Gotrace")
            return "El lote de GoTrace referenciado no existe.";

        if (lote.Estado != "Aprobada")
            return "Solo se pueden heredar datos de lotes de GoTrace que estén Aprobados.";

        if (lote.EmpresaId != empresaId)
            return "El lote de GoTrace referenciado pertenece a una empresa distinta a la seleccionada.";

        return null;
    }

    private static string? FormatearRangoUid(LoteGoTrace lote)
    {
        if (string.IsNullOrWhiteSpace(lote.PrefijoUid) || lote.UidInicial == null || lote.UidFinal == null)
            return null;

        return $"{lote.PrefijoUid}-{lote.UidInicial:00000} a {lote.PrefijoUid}-{lote.UidFinal:00000}";
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
            .Include(s => s.TornaguiaInfoconsumo!).ThenInclude(t => t.LoteGoTraceSolicitud!).ThenInclude(l => l.Proyecto)
            .Include(s => s.TornaguiaInfoconsumo!).ThenInclude(t => t.LoteGoTraceSolicitud!).ThenInclude(l => l.LoteGoTrace)
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
            PagoConfirmado = t.PagoConfirmado,
            FechaPagoConfirmado = t.FechaPagoConfirmado,
            LoteGoTraceSolicitudId = t.LoteGoTraceSolicitudId,
            LoteGoTraceNumero = t.LoteGoTraceSolicitud?.Proyecto != null
                ? $"{t.LoteGoTraceSolicitud.Proyecto.Codigo}-{t.LoteGoTraceSolicitud.Id:0000}"
                : null,
            LoteGoTraceProducto = t.LoteGoTraceSolicitud?.LoteGoTrace?.Producto,
            LoteGoTraceRangoUid = t.LoteGoTraceSolicitud?.LoteGoTrace != null
                ? FormatearRangoUid(t.LoteGoTraceSolicitud.LoteGoTrace)
                : null,
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

    private static byte[] GenerarTornaguiaPdf(TornaguiaResponseDto dto, byte[] qrBytes, byte[]? logoEmpresa)
    {
        var documento = Document.Create(contenedor =>
        {
            contenedor.Page(pagina =>
            {
                pagina.Size(PageSizes.A4);
                pagina.Margin(0);
                pagina.DefaultTextStyle(x => x.FontSize(10));

                pagina.Header().Element(h => DisenoPdfSgds.Encabezado(h, "Infoconsumo · Impuesto al Consumo", $"Tornaguía de {dto.TipoTramite}", dto.Numero));

                pagina.Content().Padding(24).Column(col =>
                {
                    // Logo de la empresa remitente (Empresa.RutaLogo) — si aún no lo ha
                    // cargado, se omite el bloque en vez de mostrar un espacio vacío.
                    if (logoEmpresa != null)
                    {
                        col.Item().PaddingBottom(8).Row(row =>
                        {
                            row.ConstantItem(60).Height(60).Image(logoEmpresa).FitArea();
                            row.RelativeItem().PaddingLeft(12).AlignMiddle().Column(c2 =>
                            {
                                c2.Item().Text(dto.EmpresaRazonSocial).FontSize(11).Bold().FontColor(DisenoPdfSgds.Ink900);
                                c2.Item().Text($"NIT {dto.EmpresaNit} — Empresa remitente").FontSize(8.5f).FontColor(DisenoPdfSgds.Ink600);
                            });
                        });
                    }

                    DisenoPdfSgds.SeccionTabla(col, "Producto amparado",
                        ("Categoría", dto.CategoriaProducto),
                        ("Unidades físicas", $"{dto.UnidadesFisicas:N0} ({dto.VolumenTotalCc:N0} cc)"),
                        ("Grados alcoholimétricos", dto.GradosAlcoholimetricos?.ToString("0.#°") ?? "—"));

                    DisenoPdfSgds.SeccionTabla(col, "Empresa remitente",
                        ("Razón social", dto.EmpresaRazonSocial),
                        ("NIT", dto.EmpresaNit));

                    DisenoPdfSgds.SeccionTabla(col, "Transportador",
                        ("Empresa transportadora", dto.EmpresaTransportadora),
                        ("Conductor", dto.Conductor ?? "—"),
                        ("Cédula del conductor", dto.CedulaConductor ?? "—"),
                        ("Placa del vehículo", dto.PlacaVehiculo),
                        ("Tipo de vehículo", dto.TipoVehiculo ?? "—"));

                    var filasMovilizacion = new List<(string, string)>
                    {
                        ("Origen", $"{dto.MunicipioOrigen}, {dto.DepartamentoOrigen}"),
                        ("Destino", $"{dto.MunicipioDestino}, {dto.DepartamentoDestino}"),
                    };
                    if (dto.DistanciaAproximadaKm.HasValue)
                        filasMovilizacion.Add(("Distancia aproximada", $"{dto.DistanciaAproximadaKm:N0} km (línea recta entre capitales)"));
                    DisenoPdfSgds.SeccionTabla(col, "Movilización autorizada", filasMovilizacion.ToArray());

                    col.Item().PaddingTop(10).Text(
                        dto.FechaVigenciaLimite.HasValue
                            ? $"Vigente hasta el {dto.FechaVigenciaLimite:dd/MM/yyyy} — {(dto.TipoTramite == "Tránsito" ? "10 días calendario" : "15 días calendario")} para legalización (Decreto 3071 de 1997)."
                            : "Aún no expedida — sin fecha de vigencia.").FontSize(8.5f).Italic().FontColor(DisenoPdfSgds.Ink600);

                    DisenoPdfSgds.BloqueQr(col, qrBytes, dto.Numero);
                });

                pagina.Footer().PaddingHorizontal(24).PaddingBottom(16).Element(f => DisenoPdfSgds.PiePagina(f,
                    "Tornaguía válida únicamente para la movilización descrita — no transferible."));
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
                pagina.Margin(0);
                pagina.DefaultTextStyle(x => x.FontSize(10));

                pagina.Header().Element(h => DisenoPdfSgds.Encabezado(h, "Infoconsumo · Impuesto al Consumo", "Preliquidación Impuesto al Consumo", dto.Numero));

                pagina.Content().Padding(24).Column(col =>
                {
                    DisenoPdfSgds.SeccionTabla(col, "Contribuyente",
                        ("Razón social", dto.ContribuyenteNombre),
                        ("NIT", dto.ContribuyenteNit));

                    DisenoPdfSgds.SeccionTabla(col, "Producto gravado",
                        ("Categoría", dto.CategoriaProducto),
                        ("Unidades físicas", $"{dto.UnidadesFisicas:N0} ({dto.VolumenTotalCc:N0} cc)"),
                        ("Grados alcoholimétricos", dto.GradosAlcoholimetricos?.ToString("0.#°") ?? "—"));

                    if (!dto.Soportado)
                    {
                        col.Item().PaddingTop(10).Background("#fdeaea").Padding(8)
                            .Text(dto.MotivoNoSoportado ?? "Categoría no soportada.").FontColor(Colors.Red.Medium).Bold();
                    }
                    else
                    {
                        col.Item().PaddingTop(12).Text("Liquidación — Impuesto al Consumo de Licores (ICL)").FontSize(10.5f).Bold().FontColor(DisenoPdfSgds.Blue600);
                        col.Item().PaddingTop(4).Table(t =>
                        {
                            t.ColumnsDefinition(c => { c.RelativeColumn(2); c.RelativeColumn(2); c.RelativeColumn(2); });
                            DisenoPdfSgds.TablaEncabezado(t, "Concepto", "Tarifa", "Valor");
                            (string, string, string)[] filas =
                            [
                                (dto.AplicaExcepcionSanAndres ? "Componente específico (tarifa San Andrés)" : "Componente específico",
                                    $"${dto.TarifaEspecifica:N0} × grado", Moneda(dto.ComponenteEspecifico)),
                                ("Componente ad valorem", $"{dto.TarifaAdValorem * 100:0.#}% sobre PVP", Moneda(dto.ComponenteAdValorem)),
                            ];
                            for (var i = 0; i < filas.Length; i++)
                            {
                                var (concepto, tarifa, valor) = filas[i];
                                var fondo = i % 2 == 0 ? "#FFFFFF" : DisenoPdfSgds.Paper;
                                t.Cell().Background(fondo).BorderBottom(0.5f).BorderColor(DisenoPdfSgds.Line).Padding(6).Text(concepto).FontSize(9);
                                t.Cell().Background(fondo).BorderBottom(0.5f).BorderColor(DisenoPdfSgds.Line).Padding(6).Text(tarifa).FontSize(9);
                                t.Cell().Background(fondo).BorderBottom(0.5f).BorderColor(DisenoPdfSgds.Line).Padding(6).Text(valor).FontSize(9);
                            }
                        });

                        col.Item().PaddingTop(6).AlignRight().Text($"ICL informativo: {Moneda(dto.IclInformativo)}").FontSize(9.5f).FontColor(DisenoPdfSgds.Ink600);
                        DisenoPdfSgds.ValorDestacado(col, "Total a pagar", Moneda(dto.TotalAPagar));

                        if (dto.EsSoloInformativo)
                        {
                            col.Item().PaddingTop(8).Background("#fdf3e7").Padding(8)
                                .Text($"El trámite es de {dto.TipoTramite} — el impuesto no se causa en este departamento; el valor se muestra solo de forma informativa.")
                                .FontSize(8.5f).Bold().FontColor("#96631a");
                        }
                    }

                    DisenoPdfSgds.BloqueQr(col, qrBytes, dto.Numero);

                    col.Item().PaddingTop(10).Text("Bancos habilitados: Davivienda, BBVA, Bancolombia, Banco de Bogotá — también disponible por PSE (tarjeta débito/crédito, cuentas de ahorro).")
                        .FontSize(8.5f).FontColor(DisenoPdfSgds.Ink600);
                });

                pagina.Footer().PaddingHorizontal(24).PaddingBottom(16).Element(f => DisenoPdfSgds.PiePagina(f,
                    "Preliquidación sujeta a verificación por la Secretaría de Hacienda Departamental."));
            });
        });

        return documento.GeneratePdf();
    }
}
