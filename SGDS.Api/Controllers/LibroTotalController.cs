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
public class LibroTotalController : ControllerBase
{
    private readonly SgdsDbContext _context;

    // Proyectos que la Consulta Consolidada muestra siempre (con o sin actividad), tal como
    // los nombra la sección "Motor de Consulta Consolidada" de las reglas de negocio. Si el
    // ciudadano tiene trámites en cualquier otro proyecto, también se incluyen — esta lista
    // solo garantiza que estos tres nunca queden ocultos.
    private static readonly string[] ProyectosSiempreMostrar = { "IUVA", "Colpensiones", "Estampillas" };

    public LibroTotalController(SgdsDbContext context)
    {
        _context = context;
    }

    // ===== Sedes =====

    // GET: api/LibroTotal/sedes
    [HttpGet("sedes")]
    public async Task<IActionResult> GetSedes()
    {
        var sedes = await _context.Set<Sede>().Where(s => s.Activo).OrderBy(s => s.Nombre).ToListAsync();
        var resultado = new List<SedeResponseDto>();
        foreach (var sede in sedes)
            resultado.Add(await ConstruirSedeDtoAsync(sede));
        return Ok(resultado);
    }

    // GET: api/LibroTotal/sedes/5
    [HttpGet("sedes/{id}")]
    public async Task<IActionResult> GetSede(int id)
    {
        var sede = await _context.Set<Sede>().FirstOrDefaultAsync(s => s.Id == id);
        if (sede == null) return NotFound();
        return Ok(await ConstruirSedeDtoAsync(sede));
    }

    // ===== Agendamiento y ciclo de vida del turno =====
    // RN: [1. Turnero/Recepción] -> [2. Llamado a Taquilla] -> [3. Consulta Consolidada] ->
    // [4. Exportación/Entrega] -> [5. Cierre de Turno]

    // POST: api/LibroTotal/solicitudes
    [HttpPost("solicitudes")]
    public async Task<IActionResult> AgendarTurno(CrearTurnoDto dto)
    {
        var ciudadanoExiste = await _context.Ciudadanos.AnyAsync(c => c.Id == dto.CiudadanoId);
        if (!ciudadanoExiste)
            return BadRequest(new { mensaje = "El ciudadano no existe." });

        var sede = await _context.Set<Sede>().FirstOrDefaultAsync(s => s.Id == dto.SedeId && s.Activo);
        if (sede == null)
            return BadRequest(new { mensaje = "La sede seleccionada no existe o no está activa." });

        var tipo = await _context.TiposSolicitudes.FindAsync(dto.TipoSolicitudId);
        if (tipo == null)
            return BadRequest(new { mensaje = "El tipo de solicitud no es válido." });

        if (string.IsNullOrWhiteSpace(dto.Motivo))
            return BadRequest(new { mensaje = "Indica qué proyecto viene a consultar el ciudadano." });

        var nuevaSolicitud = new Solicitud
        {
            CiudadanoId = dto.CiudadanoId,
            ProyectoId = dto.ProyectoId,
            TipoSolicitudId = dto.TipoSolicitudId,
            Estado = "Agendado",
            FechaCreacion = DateTime.UtcNow,
            TurnoLibroTotal = new TurnoLibroTotal
            {
                SedeId = dto.SedeId,
                Motivo = dto.Motivo,
                FechaHoraCita = dto.FechaHoraCita,
            },
        };

        _context.Solicitudes.Add(nuevaSolicitud);
        await _context.SaveChangesAsync();

        return CreatedAtAction(nameof(GetTurno), new { id = nuevaSolicitud.Id }, new { nuevaSolicitud.Id });
    }

    // PUT: api/LibroTotal/solicitudes/5/llamar
    [HttpPut("solicitudes/{id}/llamar")]
    public async Task<IActionResult> LlamarTurno(int id)
    {
        var (error, solicitud) = await ObtenerTurnoAsync(id);
        if (error != null) return error;

        if (solicitud!.Estado != "Agendado")
            return BadRequest(new { mensaje = "Solo se puede llamar un turno que esté Agendado." });

        var usuarioId = int.Parse(User.FindFirst("sub")!.Value);
        var estadoAnterior = solicitud.Estado;
        solicitud.Estado = "En atención";
        solicitud.UsuarioAsignadoId = usuarioId;
        solicitud.TurnoLibroTotal!.FechaInicioAtencion = DateTime.UtcNow;

        _context.HistorialEstados.Add(new HistorialEstado
        {
            SolicitudId = id,
            EstadoAnterior = estadoAnterior,
            EstadoNuevo = "En atención",
            FechaCambio = DateTime.UtcNow,
        });

        await _context.SaveChangesAsync();
        return NoContent();
    }

    // PUT: api/LibroTotal/solicitudes/5/finalizar
    [HttpPut("solicitudes/{id}/finalizar")]
    public async Task<IActionResult> FinalizarTurno(int id, FinalizarTurnoDto dto)
    {
        var (error, solicitud) = await ObtenerTurnoAsync(id);
        if (error != null) return error;

        if (solicitud!.Estado != "En atención")
            return BadRequest(new { mensaje = "Solo se puede finalizar un turno que esté En atención." });

        if (string.IsNullOrWhiteSpace(dto.Tipificacion))
            return BadRequest(new { mensaje = "Tipifica la atención antes de cerrar el turno (RN paso 5)." });

        var estadoAnterior = solicitud.Estado;
        solicitud.Estado = "Atendido";
        solicitud.FechaCierre = DateTime.UtcNow;
        solicitud.TurnoLibroTotal!.FechaFinAtencion = DateTime.UtcNow;
        solicitud.TurnoLibroTotal.Tipificacion = dto.Tipificacion;

        _context.HistorialEstados.Add(new HistorialEstado
        {
            SolicitudId = id,
            EstadoAnterior = estadoAnterior,
            EstadoNuevo = "Atendido",
            FechaCambio = DateTime.UtcNow,
        });

        await _context.SaveChangesAsync();
        return NoContent();
    }

    // PUT: api/LibroTotal/solicitudes/5/marcar-no-asistio
    [HttpPut("solicitudes/{id}/marcar-no-asistio")]
    public async Task<IActionResult> MarcarNoAsistio(int id, MarcarNoAsistioDto dto)
    {
        var (error, solicitud) = await ObtenerTurnoAsync(id);
        if (error != null) return error;

        if (solicitud!.Estado != "Agendado")
            return BadRequest(new { mensaje = "Solo se puede marcar como No asistió un turno que esté Agendado." });

        var estadoAnterior = solicitud.Estado;
        solicitud.Estado = "No asistió";
        solicitud.FechaCierre = DateTime.UtcNow;
        solicitud.TurnoLibroTotal!.MotivoNoAsistio = dto.Motivo;

        _context.HistorialEstados.Add(new HistorialEstado
        {
            SolicitudId = id,
            EstadoAnterior = estadoAnterior,
            EstadoNuevo = "No asistió",
            FechaCambio = DateTime.UtcNow,
        });

        await _context.SaveChangesAsync();
        return NoContent();
    }

    // GET: api/LibroTotal/solicitudes/5/turno
    [HttpGet("solicitudes/{id}/turno")]
    public async Task<IActionResult> GetTurno(int id)
    {
        var (error, solicitud) = await ObtenerTurnoAsync(id);
        return error ?? Ok(ConstruirTurnoDto(solicitud!));
    }

    // ===== Tablero de turnos por sede (sustituye al Kanban de solicitudes) =====

    // GET: api/LibroTotal/kanban?sedeId=1
    [HttpGet("kanban")]
    public async Task<IActionResult> GetKanban([FromQuery] int sedeId)
    {
        var esAdminSyc = User.FindFirst("esAdminSyc")?.Value == "True";
        var proyectosPermitidos = User.FindAll("proyecto")
            .Select(c => int.Parse(c.Value.Split(':')[0]))
            .ToList();

        var hoy = DateTime.UtcNow.Date;
        var query = _context.Solicitudes
            .Include(s => s.Ciudadano)
            .Include(s => s.Proyecto)
            .Include(s => s.TurnoLibroTotal!).ThenInclude(t => t.Sede)
            .Where(s => s.TurnoLibroTotal != null && s.TurnoLibroTotal.SedeId == sedeId
                     && s.TurnoLibroTotal.FechaHoraCita >= hoy && s.TurnoLibroTotal.FechaHoraCita < hoy.AddDays(1));

        if (!esAdminSyc)
            query = query.Where(s => s.ProyectoId != null && proyectosPermitidos.Contains(s.ProyectoId.Value));

        var solicitudes = await query.OrderBy(s => s.TurnoLibroTotal!.FechaHoraCita).ToListAsync();

        var tarjetas = solicitudes.Select(s => new TarjetaKanbanTurnoDto
        {
            Id = s.Id,
            Numero = s.Proyecto != null ? $"{s.Proyecto.Codigo}-{s.Id:0000}" : s.Id.ToString(),
            NumeroTurno = NumeroTurno(s),
            CiudadanoNombre = s.Ciudadano?.NombreCompleto ?? string.Empty,
            Motivo = s.TurnoLibroTotal!.Motivo,
            Estado = s.Estado,
            FechaHoraCita = s.TurnoLibroTotal.FechaHoraCita,
        }).ToList();

        return Ok(tarjetas);
    }

    // ===== Motor de Consulta Consolidada =====

    // GET: api/LibroTotal/consulta-consolidada?documento=91234567
    [HttpGet("consulta-consolidada")]
    public async Task<IActionResult> GetConsultaConsolidada([FromQuery] string documento)
    {
        if (string.IsNullOrWhiteSpace(documento))
            return BadRequest(new { mensaje = "Indica el número de documento a consultar." });

        var ciudadano = await _context.Ciudadanos.FirstOrDefaultAsync(c => c.NumeroDocumento == documento);
        if (ciudadano == null)
            return NotFound(new { mensaje = "No se encontró un ciudadano con ese número de documento." });

        return Ok(await ConstruirConsultaConsolidadaAsync(ciudadano));
    }

    // GET: api/LibroTotal/consulta-consolidada-pdf?documento=91234567
    [HttpGet("consulta-consolidada-pdf")]
    public async Task<IActionResult> GetConsultaConsolidadaPdf([FromQuery] string documento)
    {
        var ciudadano = await _context.Ciudadanos.FirstOrDefaultAsync(c => c.NumeroDocumento == documento);
        if (ciudadano == null)
            return NotFound(new { mensaje = "No se encontró un ciudadano con ese número de documento." });

        var consulta = await ConstruirConsultaConsolidadaAsync(ciudadano);
        var dto = ConstruirEstadoCuentaDto(consulta, sedeNombre: null, operadorNombre: null);
        var qrBytes = GenerarQrPng(ContenidoQr(dto));
        var pdfBytes = GenerarEstadoCuentaPdf(dto, qrBytes);
        return File(pdfBytes, "application/pdf", $"EstadoCuenta_{dto.Referencia}.pdf");
    }

    // GET: api/LibroTotal/consulta-consolidada-qr.png?documento=91234567
    [HttpGet("consulta-consolidada-qr.png")]
    public async Task<IActionResult> GetConsultaConsolidadaQr([FromQuery] string documento)
    {
        var ciudadano = await _context.Ciudadanos.FirstOrDefaultAsync(c => c.NumeroDocumento == documento);
        if (ciudadano == null)
            return NotFound(new { mensaje = "No se encontró un ciudadano con ese número de documento." });

        var consulta = await ConstruirConsultaConsolidadaAsync(ciudadano);
        var dto = ConstruirEstadoCuentaDto(consulta, sedeNombre: null, operadorNombre: null);
        var qrBytes = GenerarQrPng(ContenidoQr(dto));
        return File(qrBytes, "image/png");
    }

    // ===== Estado de Cuenta Consolidado vinculado a un turno (con sede y operador) =====

    // GET: api/LibroTotal/solicitudes/5/estado-cuenta
    [HttpGet("solicitudes/{id}/estado-cuenta")]
    public async Task<IActionResult> GetEstadoCuenta(int id)
    {
        var (error, dto) = await ConstruirEstadoCuentaDesdeTurnoAsync(id);
        return error ?? Ok(dto);
    }

    // GET: api/LibroTotal/solicitudes/5/estado-cuenta-pdf
    [HttpGet("solicitudes/{id}/estado-cuenta-pdf")]
    public async Task<IActionResult> GetEstadoCuentaPdf(int id)
    {
        var (error, dto) = await ConstruirEstadoCuentaDesdeTurnoAsync(id);
        if (error != null) return error;

        var qrBytes = GenerarQrPng(ContenidoQr(dto!));
        var pdfBytes = GenerarEstadoCuentaPdf(dto!, qrBytes);
        return File(pdfBytes, "application/pdf", $"EstadoCuenta_{dto!.Referencia}.pdf");
    }

    // GET: api/LibroTotal/solicitudes/5/estado-cuenta-qr.png
    [HttpGet("solicitudes/{id}/estado-cuenta-qr.png")]
    public async Task<IActionResult> GetEstadoCuentaQr(int id)
    {
        var (error, dto) = await ConstruirEstadoCuentaDesdeTurnoAsync(id);
        if (error != null) return error;

        var qrBytes = GenerarQrPng(ContenidoQr(dto!));
        return File(qrBytes, "image/png");
    }

    // ===== Helpers =====

    private static string NumeroTurno(Solicitud s) =>
        $"{(s.TurnoLibroTotal?.Sede?.Nombre.Length > 0 ? char.ToUpperInvariant(s.TurnoLibroTotal.Sede.Nombre[0]) : 'T')}-{s.Id:000}";

    private async Task<SedeResponseDto> ConstruirSedeDtoAsync(Sede sede)
    {
        var inicioMes = new DateTime(DateTime.UtcNow.Year, DateTime.UtcNow.Month, 1, 0, 0, 0, DateTimeKind.Utc);

        var turnosMes = await _context.Solicitudes
            .Include(s => s.TurnoLibroTotal)
            .Where(s => s.TurnoLibroTotal != null && s.TurnoLibroTotal.SedeId == sede.Id && s.FechaCreacion >= inicioMes)
            .ToListAsync();

        var esperas = turnosMes
            .Where(s => s.TurnoLibroTotal!.FechaInicioAtencion != null)
            .Select(s => (s.TurnoLibroTotal!.FechaInicioAtencion!.Value - s.FechaCreacion).TotalMinutes)
            .ToList();

        return new SedeResponseDto
        {
            Id = sede.Id,
            Nombre = sede.Nombre,
            Ciudad = sede.Ciudad,
            EsPrincipal = sede.EsPrincipal,
            AtencionesMes = turnosMes.Count,
            EsperaPromedioMinutos = esperas.Count > 0 ? (int)Math.Round(esperas.Average()) : null,
        };
    }

    private async Task<(IActionResult? Error, Solicitud? Solicitud)> ObtenerTurnoAsync(int id)
    {
        var esAdminSyc = User.FindFirst("esAdminSyc")?.Value == "True";
        var proyectosPermitidos = User.FindAll("proyecto")
            .Select(c => int.Parse(c.Value.Split(':')[0]))
            .ToList();

        var solicitud = await _context.Solicitudes
            .Include(s => s.Ciudadano)
            .Include(s => s.Proyecto)
            .Include(s => s.UsuarioAsignado)
            .Include(s => s.TurnoLibroTotal!).ThenInclude(t => t.Sede)
            .FirstOrDefaultAsync(s => s.Id == id);

        if (solicitud == null || solicitud.TurnoLibroTotal == null)
            return (NotFound(), null);

        if (!esAdminSyc && (solicitud.ProyectoId == null || !proyectosPermitidos.Contains(solicitud.ProyectoId.Value)))
            return (NotFound(), null);

        return (null, solicitud);
    }

    private static TurnoResponseDto ConstruirTurnoDto(Solicitud s)
    {
        var t = s.TurnoLibroTotal!;
        var numero = s.Proyecto != null ? $"{s.Proyecto.Codigo}-{s.Id:0000}" : s.Id.ToString();

        return new TurnoResponseDto
        {
            SolicitudId = s.Id,
            Numero = numero,
            NumeroTurno = NumeroTurno(s),
            Estado = s.Estado,
            SedeId = t.SedeId,
            SedeNombre = t.Sede?.Nombre ?? string.Empty,
            SedeCiudad = t.Sede?.Ciudad ?? string.Empty,
            CiudadanoId = s.CiudadanoId ?? 0,
            CiudadanoNombre = s.Ciudadano?.NombreCompleto ?? string.Empty,
            CiudadanoDocumento = s.Ciudadano?.NumeroDocumento ?? string.Empty,
            Motivo = t.Motivo,
            FechaHoraCita = t.FechaHoraCita,
            FechaCreacion = s.FechaCreacion,
            FechaInicioAtencion = t.FechaInicioAtencion,
            FechaFinAtencion = t.FechaFinAtencion,
            Tipificacion = t.Tipificacion,
            MotivoNoAsistio = t.MotivoNoAsistio,
            OperadorNombre = s.UsuarioAsignado?.NombreCompleto,
        };
    }

    private async Task<ConsultaConsolidadaResponseDto> ConstruirConsultaConsolidadaAsync(Ciudadano ciudadano)
    {
        var solicitudes = await _context.Solicitudes
            .Include(s => s.Proyecto)
            .Include(s => s.TipoSolicitud)
            .Include(s => s.Vehiculo)
            .Where(s => s.CiudadanoId == ciudadano.Id && s.Proyecto != null && s.Proyecto.Nombre != "Libro Total")
            .OrderByDescending(s => s.FechaCreacion)
            .ToListAsync();

        var proyectos = solicitudes
            .GroupBy(s => new { Id = s.ProyectoId!.Value, Nombre = s.Proyecto!.Nombre })
            .Select(g => new TramiteProyectoDto
            {
                ProyectoId = g.Key.Id,
                ProyectoNombre = g.Key.Nombre,
                Solicitudes = g.Select(s => new TramiteResumenDto
                {
                    SolicitudId = s.Id,
                    Numero = $"{s.Proyecto!.Codigo}-{s.Id:0000}",
                    Descripcion = (s.TipoSolicitud?.Nombre ?? "Trámite") + (s.Vehiculo != null ? $" — Placa {s.Vehiculo.Placa}" : ""),
                    Estado = s.Estado,
                }).ToList(),
            })
            .ToList();

        foreach (var nombre in ProyectosSiempreMostrar)
        {
            if (proyectos.Any(p => p.ProyectoNombre == nombre)) continue;
            var proyecto = await _context.Proyectos.FirstOrDefaultAsync(p => p.Nombre == nombre && p.Activo);
            if (proyecto != null)
                proyectos.Add(new TramiteProyectoDto { ProyectoId = proyecto.Id, ProyectoNombre = proyecto.Nombre, Solicitudes = new() });
        }

        return new ConsultaConsolidadaResponseDto
        {
            CiudadanoId = ciudadano.Id,
            CiudadanoNombre = ciudadano.NombreCompleto,
            CiudadanoDocumento = ciudadano.NumeroDocumento,
            CiudadanoCiudad = ciudadano.Ciudad,
            TotalTramitesActivos = solicitudes.Count,
            TotalProyectos = proyectos.Count(p => p.Solicitudes.Count > 0),
            Proyectos = proyectos.OrderByDescending(p => p.Solicitudes.Count).ToList(),
        };
    }

    private async Task<(IActionResult? Error, EstadoCuentaResponseDto? Dto)> ConstruirEstadoCuentaDesdeTurnoAsync(int solicitudId)
    {
        var (error, solicitud) = await ObtenerTurnoAsync(solicitudId);
        if (error != null) return (error, null);

        if (solicitud!.CiudadanoId == null)
            return (BadRequest(new { mensaje = "Este turno no tiene un ciudadano vinculado." }), null);

        var ciudadano = await _context.Ciudadanos.FirstAsync(c => c.Id == solicitud.CiudadanoId.Value);
        var consulta = await ConstruirConsultaConsolidadaAsync(ciudadano);
        var dto = ConstruirEstadoCuentaDto(consulta, solicitud.TurnoLibroTotal!.Sede?.Nombre, solicitud.UsuarioAsignado?.NombreCompleto);
        return (null, dto);
    }

    private static EstadoCuentaResponseDto ConstruirEstadoCuentaDto(ConsultaConsolidadaResponseDto consulta, string? sedeNombre, string? operadorNombre) => new()
    {
        Referencia = $"EC-{DateTime.UtcNow.Year}-{consulta.CiudadanoDocumento}",
        CiudadanoId = consulta.CiudadanoId,
        CiudadanoNombre = consulta.CiudadanoNombre,
        CiudadanoDocumento = consulta.CiudadanoDocumento,
        TotalTramitesActivos = consulta.TotalTramitesActivos,
        TotalProyectos = consulta.TotalProyectos,
        Proyectos = consulta.Proyectos,
        SedeNombre = sedeNombre,
        OperadorNombre = operadorNombre,
        FechaGeneracion = DateTime.UtcNow,
    };

    private static string ContenidoQr(EstadoCuentaResponseDto dto) =>
        $"SGDS-LIBROTOTAL|{dto.Referencia}|{dto.CiudadanoDocumento}|Tramites:{dto.TotalTramitesActivos}|Proyectos:{dto.TotalProyectos}";

    private static byte[] GenerarQrPng(string contenido)
    {
        using var generador = new QRCodeGenerator();
        using var datosQr = generador.CreateQrCode(contenido, QRCodeGenerator.ECCLevel.Q);
        var pngQr = new PngByteQRCode(datosQr);
        return pngQr.GetGraphic(20);
    }

    private static byte[] GenerarEstadoCuentaPdf(EstadoCuentaResponseDto dto, byte[] qrBytes)
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
                    col.Item().Text("SYC — Libro Total").FontSize(11);
                    col.Item().Text("Estado de Cuenta Consolidado").FontSize(16).Bold();
                    col.Item().PaddingTop(4).Text($"Referencia: {dto.Referencia}").FontSize(10).Bold();
                });

                pagina.Content().PaddingTop(15).Column(col =>
                {
                    col.Spacing(12);

                    col.Item().Text("Ciudadano").Bold();
                    col.Item().Table(t =>
                    {
                        t.ColumnsDefinition(c => { c.RelativeColumn(); c.RelativeColumn(); });
                        t.Cell().Text("Nombre"); t.Cell().Text(dto.CiudadanoNombre);
                        t.Cell().Text("Documento"); t.Cell().Text(dto.CiudadanoDocumento);
                    });

                    col.Item().Text("Resumen por proyecto").Bold();
                    col.Item().Table(t =>
                    {
                        t.ColumnsDefinition(c => { c.RelativeColumn(2); c.RelativeColumn(3); c.RelativeColumn(); });
                        t.Cell().Text("Proyecto").FontColor(Colors.Grey.Darken1).FontSize(9);
                        t.Cell().Text("Trámite").FontColor(Colors.Grey.Darken1).FontSize(9);
                        t.Cell().AlignRight().Text("Estado").FontColor(Colors.Grey.Darken1).FontSize(9);

                        foreach (var proyecto in dto.Proyectos)
                        {
                            if (proyecto.Solicitudes.Count == 0)
                            {
                                t.Cell().Text(proyecto.ProyectoNombre).Bold();
                                t.Cell().Text("Sin trámites registrados").Italic().FontColor(Colors.Grey.Medium);
                                t.Cell().AlignRight().Text("—").FontColor(Colors.Grey.Medium);
                                continue;
                            }
                            foreach (var s in proyecto.Solicitudes)
                            {
                                t.Cell().Text(proyecto.ProyectoNombre).Bold();
                                t.Cell().Text($"#{s.Numero} — {s.Descripcion}");
                                t.Cell().AlignRight().Text(s.Estado);
                            }
                        }
                    });

                    col.Item().PaddingTop(4).Text($"{dto.TotalTramitesActivos} trámites activos en {dto.TotalProyectos} proyectos.").FontSize(11).Bold();
                    if (dto.SedeNombre != null)
                        col.Item().Text($"Consultado en sede {dto.SedeNombre}" + (dto.OperadorNombre != null ? $" — Operador {dto.OperadorNombre}" : "")).FontSize(9).Italic();

                    col.Item().PaddingTop(10).AlignCenter().Width(110).Image(qrBytes);
                    col.Item().AlignCenter().Text(dto.Referencia).FontSize(8);
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
