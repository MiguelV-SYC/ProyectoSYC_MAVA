using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using SGDS.Application.DTOs;
using SGDS.Application.Interfaces;
using SGDS.Domain.Entities;
using SGDS.Infrastructure.Data;

namespace SGDS.Api.Controllers;

// Resumen ejecutivo del perfil Gerencial — agrega datos reales de los 9 proyectos activos.
// Es puramente de lectura: no crea ni modifica Solicitudes, y no depende de los claims
// "proyecto" (Gerencial no tiene ninguno) — la visibilidad global se resuelve aquí mismo
// verificando el claim "esGerencial", igual que "esAdminSyc" en el resto de la API.
[ApiController]
[Route("api/[controller]")]
[Authorize]
public class GerencialController : ControllerBase
{
    private readonly SgdsDbContext _context;
    private readonly IIAService _iaService;
    private readonly ILogger<GerencialController> _logger;

    // Umbral de cumplimiento (creación -> cierre) usado como referencia general del sistema —
    // mismo valor ya usado como plazo de legalización de Infoconsumo (Decreto 3071/1997).
    // No hay todavía un SLA configurable por proyecto/tipo de trámite; es un valor de
    // referencia único para dar una cifra de "cumplimiento" comparable entre proyectos.
    private const int SlaDias = 15;
    private const int DiasAlertaVencimiento = 5;
    private const decimal UmbralSlaBajo = 85m;
    private const decimal UmbralIncrementoRelevante = 15m;

    // Vocabulario de estados "negativos" conocido entre los 9 proyectos (mismo criterio que el
    // arreglo estadosFinales ya hardcodeado en SolicitudesController.CambiarEstado) — se usa
    // solo para Indicadores (tasa de aprobación/rechazo), nunca para decidir si algo está
    // cerrado (eso ya lo resuelve FechaCierre, no el nombre del estado).
    private static readonly HashSet<string> EstadosNegativos = new()
    {
        "Rechazada", "Anulada", "No asistió", "Vencida",
    };

    public GerencialController(SgdsDbContext context, IIAService iaService, ILogger<GerencialController> logger)
    {
        _context = context;
        _iaService = iaService;
        _logger = logger;
    }

    private IActionResult? VerificarAcceso()
    {
        var esAdminSyc = User.FindFirst("esAdminSyc")?.Value == "True";
        var esGerencial = User.FindFirst("esGerencial")?.Value == "True";
        return (esAdminSyc || esGerencial) ? null : Forbid();
    }

    // GET: api/Gerencial/dashboard?dias=30
    [HttpGet("dashboard")]
    public async Task<IActionResult> GetDashboard([FromQuery] int dias = 30)
    {
        var errorAcceso = VerificarAcceso();
        if (errorAcceso != null) return errorAcceso;

        dias = Math.Clamp(dias, 1, 365);
        var hasta = DateTime.UtcNow;
        var desde = hasta.AddDays(-dias);
        var desdeAnterior = desde.AddDays(-dias);

        var proyectos = await _context.Proyectos.Where(p => p.Activo).OrderBy(p => p.Nombre).ToListAsync();

        var solicitudesPeriodo = await _context.Solicitudes
            .Include(s => s.Proyecto)
            .Include(s => s.TipoSolicitud)
            .Include(s => s.Empresa)
            .Include(s => s.Ciudadano)
            .Where(s => s.FechaCreacion >= desde && s.FechaCreacion < hasta)
            .ToListAsync();

        var solicitudesPeriodoAnterior = await _context.Solicitudes
            .Where(s => s.FechaCreacion >= desdeAnterior && s.FechaCreacion < desde)
            .Select(s => new { s.FechaCierre })
            .ToListAsync();

        var dto = new DashboardGerencialResponseDto
        {
            Desde = desde,
            Hasta = hasta,
            Kpis = ConstruirKpis(solicitudesPeriodo, solicitudesPeriodoAnterior.Select(s => s.FechaCierre).ToList(), desdeAnterior, desde),
            Tendencia = ConstruirTendencia(solicitudesPeriodo, desde, hasta),
            DistribucionEstado = ConstruirDistribucionEstado(solicitudesPeriodo),
            SolicitudesPorProyecto = ConstruirPorProyecto(solicitudesPeriodo),
            SlaPorProyecto = ConstruirSlaPorProyecto(solicitudesPeriodo),
            TiempoRespuesta = await ConstruirTiempoRespuestaAsync(desde, hasta, desdeAnterior),
            Criticas = await ConstruirCriticasAsync(),
            Proyectos = ConstruirResumenProyectos(proyectos, solicitudesPeriodo),
        };

        dto.Alertas = ConstruirAlertas(dto, proyectos, solicitudesPeriodo);

        return Ok(dto);
    }

    // GET: api/Gerencial/indicadores?dias=30
    // Vista de profundidad: mismo período que el resumen, pero el catálogo completo de
    // métricas desglosado por proyecto + tipo de trámite (no solo los 5 KPIs del resumen).
    [HttpGet("indicadores")]
    public async Task<IActionResult> GetIndicadores([FromQuery] int dias = 30)
    {
        var errorAcceso = VerificarAcceso();
        if (errorAcceso != null) return errorAcceso;

        dias = Math.Clamp(dias, 1, 365);
        var hasta = DateTime.UtcNow;
        var desde = hasta.AddDays(-dias);

        var solicitudes = await _context.Solicitudes
            .Include(s => s.Proyecto)
            .Include(s => s.TipoSolicitud)
            .Where(s => s.FechaCreacion >= desde && s.FechaCreacion < hasta && s.Proyecto != null && s.TipoSolicitud != null)
            .ToListAsync();

        var idsPeriodo = solicitudes.Select(s => s.Id).ToList();

        // "Pasar por Requiere información" se mira en el historial completo, no solo en el
        // estado actual — una solicitud puede haber pasado por ahí y ya haber avanzado.
        var idsConRequiereInfo = (await _context.HistorialEstados
            .Where(h => idsPeriodo.Contains(h.SolicitudId) && h.EstadoNuevo == "Requiere información")
            .Select(h => h.SolicitudId)
            .Distinct()
            .ToListAsync())
            .ToHashSet();

        var indicadores = solicitudes
            .GroupBy(s => new { s.Proyecto!.Id, s.Proyecto.Nombre, Tipo = s.TipoSolicitud!.Nombre })
            .Select(g =>
            {
                var total = g.Count();
                var finalizadas = g.Where(EsFinalizada).ToList();
                var negativas = finalizadas.Count(s => EstadosNegativos.Contains(s.Estado));
                var conRequiereInfo = g.Count(s => idsConRequiereInfo.Contains(s.Id));

                return new IndicadorPorTipoDto
                {
                    ProyectoId = g.Key.Id,
                    ProyectoNombre = g.Key.Nombre,
                    TipoSolicitudNombre = g.Key.Tipo,
                    Total = total,
                    Finalizadas = finalizadas.Count,
                    CumplimientoSlaPorcentaje = finalizadas.Count > 0
                        ? Math.Round((decimal)finalizadas.Count(CumpleSla) / finalizadas.Count * 100m, 1)
                        : null,
                    TiempoRespuestaPromedioDias = finalizadas.Count > 0
                        ? Math.Round((decimal)finalizadas.Average(s => (s.FechaCierre!.Value - s.FechaCreacion).TotalDays), 1)
                        : null,
                    TasaAprobacionPorcentaje = finalizadas.Count > 0
                        ? Math.Round((decimal)(finalizadas.Count - negativas) / finalizadas.Count * 100m, 1)
                        : null,
                    TasaRechazoPorcentaje = finalizadas.Count > 0
                        ? Math.Round((decimal)negativas / finalizadas.Count * 100m, 1)
                        : null,
                    PorcentajeRequiereInformacion = total > 0
                        ? Math.Round((decimal)conRequiereInfo / total * 100m, 1)
                        : 0,
                };
            })
            .OrderByDescending(i => i.Total)
            .ToList();

        return Ok(new IndicadoresGerencialResponseDto { Desde = desde, Hasta = hasta, Indicadores = indicadores });
    }

    // GET: api/Gerencial/tendencias?dias=90&granularidad=semana
    // Vista de tiempo: misma métrica, rangos largos y granularidad ajustable (día/semana/mes),
    // a diferencia de la tendencia diaria fija del resumen ejecutivo.
    [HttpGet("tendencias")]
    public async Task<IActionResult> GetTendencias([FromQuery] int dias = 90, [FromQuery] string granularidad = "dia")
    {
        var errorAcceso = VerificarAcceso();
        if (errorAcceso != null) return errorAcceso;

        dias = Math.Clamp(dias, 1, 365);
        granularidad = granularidad is "semana" or "mes" ? granularidad : "dia";
        var hasta = DateTime.UtcNow;
        var desde = hasta.AddDays(-dias);

        var solicitudes = await _context.Solicitudes
            .Where(s => s.FechaCreacion >= desde && s.FechaCreacion < hasta)
            .ToListAsync();

        return Ok(new TendenciasGerencialResponseDto
        {
            Desde = desde,
            Hasta = hasta,
            Granularidad = granularidad,
            Puntos = ConstruirTendenciaExtendida(solicitudes, desde, hasta, granularidad),
        });
    }

    // GET: api/Gerencial/insights?dias=30
    // Observaciones en prosa generadas por plantilla a partir de las mismas cifras ya
    // calculadas (volumen, SLA, tiempo de respuesta, rechazo por tipo de trámite) — el
    // reemplazo por redacción real de IA no cambia esta forma de respuesta, solo la fuente
    // del campo Texto y EsGeneradoPorIa.
    [HttpGet("insights")]
    public async Task<IActionResult> GetInsights([FromQuery] int dias = 30)
    {
        var errorAcceso = VerificarAcceso();
        if (errorAcceso != null) return errorAcceso;

        dias = Math.Clamp(dias, 1, 365);
        var hasta = DateTime.UtcNow;
        var desde = hasta.AddDays(-dias);
        var desdeAnterior = desde.AddDays(-dias);

        var actual = await _context.Solicitudes
            .Include(s => s.Proyecto)
            .Include(s => s.TipoSolicitud)
            .Where(s => s.FechaCreacion >= desde && s.FechaCreacion < hasta)
            .ToListAsync();

        var anterior = await _context.Solicitudes
            .Where(s => s.FechaCreacion >= desdeAnterior && s.FechaCreacion < desde)
            .ToListAsync();

        var insights = ConstruirInsights(actual, anterior);

        var resumenIA = await GenerarResumenEjecutivoAsync(insights, actual.Count, anterior.Count);
        if (resumenIA != null)
        {
            insights.Insert(0, resumenIA);
        }

        return Ok(new InsightsGerencialResponseDto
        {
            Desde = desde,
            Hasta = hasta,
            Insights = insights,
        });
    }

    // Redacta, mediante IA, un resumen ejecutivo breve a partir de los insights que ya calculó
    // ConstruirInsights (por reglas) — la IA interpreta datos ya validados por SGDS, no accede
    // a la base de datos ni recalcula nada (RF-IA-GER-01). Si el servicio de IA falla (sin
    // API key configurada, rate limit, etc.) se omite la tarjeta y el resto de Insights sigue
    // funcionando igual que hoy.
    private async Task<InsightGerencialDto?> GenerarResumenEjecutivoAsync(List<InsightGerencialDto> insightsPorReglas, int totalActual, int totalAnterior)
    {
        // Sin datos en ninguno de los dos períodos no hay nada que interpretar. Pero que las
        // reglas de ConstruirInsights no hayan disparado ninguna tarjeta (dataset chico, sin
        // variaciones relevantes) no debe impedir el resumen — en ese caso se le da a la IA el
        // volumen crudo como contexto en vez de la lista de insights.
        if (totalActual == 0 && totalAnterior == 0) return null;

        var contexto = insightsPorReglas.Count > 0
            ? string.Join("\n", insightsPorReglas.Select(i => $"- {i.Titulo}: {i.Texto}"))
            : $"Solicitudes en el período actual: {totalActual}. Solicitudes en el período anterior: {totalAnterior}. Ninguna de las reglas de variación configuradas se activó (sin cambios relevantes detectados).";
        const string systemPrompt = "Eres un analista que redacta un resumen ejecutivo breve (máximo 3 frases) para un gerente, a partir de indicadores que el sistema ya calculó. Usa únicamente los datos entregados en el contexto, sin inventar cifras ni mencionar datos que no estén ahí. Responde en español, con tono profesional y directo.";

        try
        {
            var respuesta = await _iaService.GenerarAsync(systemPrompt, contexto, "Redacta el resumen ejecutivo del período.");
            await RegistrarOperacionIaAsync("InsightGerencial", respuesta, contexto);

            return new InsightGerencialDto
            {
                Titulo = "Resumen ejecutivo",
                Texto = respuesta.Texto,
                Categoria = "Resumen ejecutivo",
                EsGeneradoPorIa = true,
            };
        }
        catch (IAServiceException ex)
        {
            _logger.LogWarning(ex, "No se pudo generar el resumen ejecutivo de IA para Insights Gerencial.");
            return null;
        }
    }

    // POST: api/Gerencial/asistente
    [HttpPost("asistente")]
    public async Task<IActionResult> Preguntar([FromBody] PreguntaAsistenteDto solicitud)
    {
        var errorAcceso = VerificarAcceso();
        if (errorAcceso != null) return errorAcceso;

        if (string.IsNullOrWhiteSpace(solicitud.Pregunta))
        {
            return BadRequest("La pregunta no puede estar vacía.");
        }

        var hasta = DateTime.UtcNow;
        var desde = hasta.AddDays(-DiasContextoAsistente);

        var periodo = await _context.Solicitudes
            .Include(s => s.Proyecto)
            .Where(s => s.FechaCreacion >= desde && s.FechaCreacion < hasta)
            .ToListAsync();

        var criticas = await ConstruirCriticasAsync();
        var contexto = ConstruirContextoAsistente(periodo, desde, hasta, criticas);
        const string systemPrompt = "Eres el asistente de SGDS Intelligence para el perfil Gerencial. Respondes en español, con tono profesional, únicamente con base en el contexto de datos entregado. Si la pregunta no se puede responder con esos datos, dilo explícitamente en vez de inventar una cifra o un dato que no esté en el contexto.";

        try
        {
            var respuesta = await _iaService.GenerarAsync(systemPrompt, contexto, solicitud.Pregunta);
            await RegistrarOperacionIaAsync("AsistenteGerencial", respuesta, solicitud.Pregunta);

            return Ok(new RespuestaAsistenteDto { Texto = respuesta.Texto });
        }
        catch (IAServiceException ex)
        {
            _logger.LogWarning(ex, "El Asistente IA de Gerencial no pudo responder.");
            return StatusCode(503, "El asistente no está disponible en este momento. Intenta de nuevo más tarde.");
        }
    }

    private string ConstruirContextoAsistente(List<Solicitud> periodo, DateTime desde, DateTime hasta, List<SolicitudCriticaDto> criticas)
    {
        var kpis = ConstruirKpis(periodo, new List<DateTime?>(), desde, desde);
        var slaPorProyecto = ConstruirSlaPorProyecto(periodo);
        var porProyecto = ConstruirPorProyecto(periodo);

        var lineas = new List<string>
        {
            $"Período analizado: {desde:yyyy-MM-dd} a {hasta:yyyy-MM-dd} (últimos {DiasContextoAsistente} días).",
            $"Total de solicitudes: {kpis.Total}.",
            $"Solicitudes finalizadas: {kpis.Finalizadas}, pendientes: {kpis.Pendientes}.",
            "Solicitudes por proyecto:",
        };
        lineas.AddRange(porProyecto.Select(p => $"- {p.ProyectoNombre}: {p.Total} solicitudes."));
        lineas.Add("Cumplimiento de SLA por proyecto:");
        lineas.AddRange(slaPorProyecto.Where(s => s.CumplimientoPorcentaje.HasValue)
            .Select(s => $"- {s.ProyectoNombre}: {s.CumplimientoPorcentaje}%."));

        if (criticas.Count > 0)
        {
            lineas.Add("Solicitudes críticas (abiertas, más próximas a vencer, con su prioridad):");
            lineas.AddRange(criticas.Select(c => $"- {c.Numero} ({c.ProyectoNombre}): {c.Asunto}, vence en {c.DiasParaVencer} día(s), prioridad {c.Prioridad}."));

            var porProyectoCriticas = criticas.GroupBy(c => c.ProyectoNombre).Select(g => $"- {g.Key}: {g.Count()} solicitud(es) crítica(s).");
            lineas.Add("Conteo de solicitudes críticas por proyecto:");
            lineas.AddRange(porProyectoCriticas);
        }
        else
        {
            lineas.Add("No hay solicitudes críticas (próximas a vencer) registradas actualmente.");
        }

        return string.Join("\n", lineas);
    }

    private const int DiasContextoAsistente = 30;

    private async Task RegistrarOperacionIaAsync(string tipoAnalisis, RespuestaIADto respuesta, string entrada)
    {
        var usuarioId = int.Parse(User.FindFirst("sub")!.Value);
        _context.OperacionesIA.Add(new OperacionIA
        {
            UsuarioId = usuarioId,
            TipoAnalisis = tipoAnalisis,
            Modelo = respuesta.Modelo,
            Entrada = entrada,
            Resultado = respuesta.Texto,
        });
        await _context.SaveChangesAsync();
    }

    // GET: api/Gerencial/alertas?dias=30
    // Vista de profundidad del mismo motor de reglas de ConstruirAlertas (dashboard) — ahí se
    // resume al hallazgo más relevante por regla; acá se listan todos los que cumplen cada
    // regla, sin cambiar el resumen que ya se muestra en el Resumen Ejecutivo.
    [HttpGet("alertas")]
    public async Task<IActionResult> GetAlertasDetalladas([FromQuery] int dias = 30)
    {
        var errorAcceso = VerificarAcceso();
        if (errorAcceso != null) return errorAcceso;

        dias = Math.Clamp(dias, 1, 365);
        var hasta = DateTime.UtcNow;
        var desde = hasta.AddDays(-dias);

        var periodo = await _context.Solicitudes
            .Include(s => s.Proyecto)
            .Where(s => s.FechaCreacion >= desde && s.FechaCreacion < hasta)
            .ToListAsync();

        var alertas = ConstruirAlertasDetalladas(periodo, ConstruirSlaPorProyecto(periodo));

        var resumenIA = await GenerarResumenAlertasAsync(alertas, periodo.Count);
        if (resumenIA != null)
        {
            alertas.Insert(0, resumenIA);
        }

        return Ok(new AlertasGerencialResponseDto
        {
            Desde = desde,
            Hasta = hasta,
            Alertas = alertas,
        });
    }

    // Interpreta, mediante IA, las alertas que ya detectó el motor de reglas (RF-IA-GER-04:
    // "combinando reglas y, cuando aporte, interpretación por IA") — no inventa riesgos nuevos,
    // solo prioriza/explica los que ConstruirAlertasDetalladas ya encontró. Si no hay ninguna
    // alerta pero sí hay solicitudes en el período, igual redacta una nota breve en vez del
    // mensaje genérico "sin alertas relevantes". Si el servicio de IA falla, se omite la tarjeta
    // y el resto de Alertas sigue funcionando igual que hoy (solo reglas).
    private async Task<AlertaDetalladaDto?> GenerarResumenAlertasAsync(List<AlertaDetalladaDto> alertasPorReglas, int totalSolicitudesPeriodo)
    {
        if (totalSolicitudesPeriodo == 0) return null;

        var contexto = alertasPorReglas.Count > 0
            ? string.Join("\n", alertasPorReglas.Select(a => $"- [{a.Etiqueta}] {a.Texto}"))
            : $"No se activó ninguna de las reglas configuradas (vencimientos próximos, incrementos relevantes, SLA bajo) sobre las {totalSolicitudesPeriodo} solicitudes del período.";
        const string systemPrompt = "Eres un analista de riesgos que interpreta brevemente (máximo 3 frases) las alertas que el sistema ya detectó por reglas de negocio, priorizando lo más urgente para un gerente. Usa únicamente los datos del contexto, sin inventar riesgos ni cifras. Si el contexto indica que no hay alertas, dilo con un tono breve y tranquilizador. Responde en español.";

        try
        {
            var respuesta = await _iaService.GenerarAsync(systemPrompt, contexto, "Interpreta el panorama de riesgos del período.");
            await RegistrarOperacionIaAsync("AlertaGerencial", respuesta, contexto);

            return new AlertaDetalladaDto
            {
                Severidad = "info",
                Texto = respuesta.Texto,
                Etiqueta = "Resumen",
                EsGeneradoPorIa = true,
            };
        }
        catch (IAServiceException ex)
        {
            _logger.LogWarning(ex, "No se pudo generar el resumen de IA para Alertas Inteligentes.");
            return null;
        }
    }

    // GET: api/Gerencial/comparativos?dias=30
    // Período actual vs. anterior (mismos deltas que el resumen deja en null hoy) y
    // proyecto vs. proyecto sobre el mismo par de períodos.
    [HttpGet("comparativos")]
    public async Task<IActionResult> GetComparativos([FromQuery] int dias = 30)
    {
        var errorAcceso = VerificarAcceso();
        if (errorAcceso != null) return errorAcceso;

        dias = Math.Clamp(dias, 1, 365);
        var hasta = DateTime.UtcNow;
        var desde = hasta.AddDays(-dias);
        var desdeAnterior = desde.AddDays(-dias);

        var actual = await _context.Solicitudes
            .Where(s => s.FechaCreacion >= desde && s.FechaCreacion < hasta)
            .ToListAsync();

        var anterior = await _context.Solicitudes
            .Where(s => s.FechaCreacion >= desdeAnterior && s.FechaCreacion < desde)
            .ToListAsync();

        var proyectos = await _context.Proyectos.Where(p => p.Activo).OrderBy(p => p.Nombre).ToListAsync();

        return Ok(new ComparativosGerencialResponseDto
        {
            Desde = desde,
            Hasta = hasta,
            DesdeAnterior = desdeAnterior,
            Resumen = ConstruirResumenComparativo(actual, anterior),
            PorProyecto = ConstruirComparativoPorProyecto(proyectos, actual, anterior),
        });
    }

    // ===== Helpers de cálculo =====

    private static bool EsFinalizada(Solicitud s) => s.FechaCierre != null;
    private static bool EsPendiente(Solicitud s) => s.FechaCierre == null && (s.Estado == "Pendiente" || s.Estado == "Requiere información");
    private static bool EsEnTramite(Solicitud s) => s.FechaCierre == null && !EsPendiente(s);
    private static bool CumpleSla(Solicitud s) => s.FechaCierre != null && (s.FechaCierre.Value - s.FechaCreacion).TotalDays <= SlaDias;

    private static decimal? PorcentajeCambio(int actual, int anterior)
    {
        if (anterior == 0) return actual == 0 ? 0 : null;
        return Math.Round((actual - anterior) / (decimal)anterior * 100m, 1);
    }

    private KpiGerencialDto ConstruirKpis(List<Solicitud> periodo, List<DateTime?> cierresAnterior, DateTime desdeAnterior, DateTime hastaAnterior)
    {
        var total = periodo.Count;
        var finalizadas = periodo.Count(EsFinalizada);
        var enTramite = periodo.Count(EsEnTramite);
        var pendientes = periodo.Count(EsPendiente);
        var conSla = periodo.Where(s => s.FechaCierre != null).ToList();
        decimal? sla = conSla.Count > 0 ? Math.Round((decimal)conSla.Count(CumpleSla) / conSla.Count * 100m, 1) : null;

        // El periodo anterior se usa únicamente como referencia de tamaño total y cierres —
        // suficiente para el delta de las 5 tarjetas sin duplicar toda la consulta.
        var totalAnterior = cierresAnterior.Count;
        var finalizadasAnterior = cierresAnterior.Count(c => c != null);

        return new KpiGerencialDto
        {
            Total = total,
            Finalizadas = finalizadas,
            EnTramite = enTramite,
            Pendientes = pendientes,
            CumplimientoSlaPorcentaje = sla,
            DeltaTotalPorcentaje = PorcentajeCambio(total, totalAnterior),
            DeltaFinalizadasPorcentaje = PorcentajeCambio(finalizadas, finalizadasAnterior),
            DeltaEnTramitePorcentaje = null,
            DeltaPendientesPorcentaje = null,
            DeltaSlaPorcentaje = null,
        };
    }

    private static List<PuntoTendenciaDto> ConstruirTendencia(List<Solicitud> periodo, DateTime desde, DateTime hasta)
    {
        var dias = (int)Math.Ceiling((hasta.Date - desde.Date).TotalDays);
        var puntos = new List<PuntoTendenciaDto>();
        var acumuladoAbierto = 0;

        for (var i = 0; i <= dias; i++)
        {
            var dia = desde.Date.AddDays(i);
            var radicadas = periodo.Count(s => s.FechaCreacion.Date == dia);
            var finalizadas = periodo.Count(s => s.FechaCierre?.Date == dia);
            acumuladoAbierto += radicadas - finalizadas;

            puntos.Add(new PuntoTendenciaDto
            {
                Fecha = dia,
                Radicadas = radicadas,
                Finalizadas = finalizadas,
                EnTramite = Math.Max(acumuladoAbierto, 0),
            });
        }

        return puntos;
    }

    private static List<DistribucionEstadoDto> ConstruirDistribucionEstado(List<Solicitud> periodo)
    {
        var total = periodo.Count;
        var finalizadas = periodo.Count(EsFinalizada);
        var enTramite = periodo.Count(EsEnTramite);
        var pendientes = periodo.Count(EsPendiente);

        decimal Pct(int n) => total > 0 ? Math.Round(n / (decimal)total * 100m, 1) : 0;

        return new List<DistribucionEstadoDto>
        {
            new() { Bucket = "Finalizadas", Total = finalizadas, Porcentaje = Pct(finalizadas) },
            new() { Bucket = "En trámite", Total = enTramite, Porcentaje = Pct(enTramite) },
            new() { Bucket = "Pendientes", Total = pendientes, Porcentaje = Pct(pendientes) },
        };
    }

    private static List<SolicitudesPorProyectoDto> ConstruirPorProyecto(List<Solicitud> periodo)
    {
        return periodo
            .Where(s => s.Proyecto != null)
            .GroupBy(s => new { s.Proyecto!.Id, s.Proyecto.Nombre })
            .Select(g => new SolicitudesPorProyectoDto { ProyectoId = g.Key.Id, ProyectoNombre = g.Key.Nombre, Total = g.Count() })
            .OrderByDescending(p => p.Total)
            .ToList();
    }

    private static List<SlaPorProyectoDto> ConstruirSlaPorProyecto(List<Solicitud> periodo)
    {
        return periodo
            .Where(s => s.Proyecto != null && s.FechaCierre != null)
            .GroupBy(s => new { s.Proyecto!.Id, s.Proyecto.Nombre })
            .Select(g => new SlaPorProyectoDto
            {
                ProyectoId = g.Key.Id,
                ProyectoNombre = g.Key.Nombre,
                CumplimientoPorcentaje = Math.Round((decimal)g.Count(CumpleSla) / g.Count() * 100m, 1),
            })
            .OrderByDescending(p => p.CumplimientoPorcentaje)
            .ToList();
    }

    private async Task<TiempoRespuestaDto> ConstruirTiempoRespuestaAsync(DateTime desde, DateTime hasta, DateTime desdeAnterior)
    {
        var cerradas = await _context.Solicitudes
            .Where(s => s.FechaCierre != null && s.FechaCierre >= desde && s.FechaCierre < hasta)
            .Select(s => new { s.FechaCreacion, s.FechaCierre })
            .ToListAsync();

        var cerradasAnterior = await _context.Solicitudes
            .Where(s => s.FechaCierre != null && s.FechaCierre >= desdeAnterior && s.FechaCierre < desde)
            .Select(s => new { s.FechaCreacion, s.FechaCierre })
            .ToListAsync();

        decimal? promedio = cerradas.Count > 0
            ? Math.Round((decimal)cerradas.Average(s => (s.FechaCierre!.Value - s.FechaCreacion).TotalDays), 1)
            : null;
        decimal? promedioAnterior = cerradasAnterior.Count > 0
            ? Math.Round((decimal)cerradasAnterior.Average(s => (s.FechaCierre!.Value - s.FechaCreacion).TotalDays), 1)
            : null;

        var dias = (int)Math.Ceiling((hasta.Date - desde.Date).TotalDays);
        var serie = new List<PuntoSerieDto>();
        for (var i = 0; i <= dias; i++)
        {
            var dia = desde.Date.AddDays(i);
            var delDia = cerradas.Where(s => s.FechaCierre!.Value.Date == dia).ToList();
            serie.Add(new PuntoSerieDto
            {
                Fecha = dia,
                Valor = delDia.Count > 0 ? Math.Round((decimal)delDia.Average(s => (s.FechaCierre!.Value - s.FechaCreacion).TotalDays), 1) : null,
            });
        }

        return new TiempoRespuestaDto
        {
            PromedioDias = promedio,
            DeltaDias = promedio.HasValue && promedioAnterior.HasValue ? Math.Round(promedio.Value - promedioAnterior.Value, 1) : null,
            Serie = serie,
        };
    }

    private async Task<List<SolicitudCriticaDto>> ConstruirCriticasAsync()
    {
        var hoy = DateTime.UtcNow;
        var abiertasConLimite = await _context.Solicitudes
            .Include(s => s.Proyecto)
            .Include(s => s.TipoSolicitud)
            .Include(s => s.Empresa)
            .Include(s => s.Ciudadano)
            .Where(s => s.FechaCierre == null && s.FechaLimite != null && s.FechaLimite >= hoy)
            .OrderBy(s => s.FechaLimite)
            .Take(10)
            .ToListAsync();

        return abiertasConLimite.Select(s =>
        {
            var diasRestantes = (int)Math.Ceiling((s.FechaLimite!.Value - hoy).TotalDays);
            var quien = s.Empresa?.RazonSocial ?? s.Ciudadano?.NombreCompleto;
            return new SolicitudCriticaDto
            {
                SolicitudId = s.Id,
                Numero = s.Proyecto != null ? $"{s.Proyecto.Codigo}-{s.Id:0000}" : s.Id.ToString(),
                ProyectoNombre = s.Proyecto?.Nombre ?? "—",
                Asunto = (s.TipoSolicitud?.Nombre ?? "Trámite") + (quien != null ? $" — {quien}" : ""),
                DiasParaVencer = diasRestantes,
                Prioridad = diasRestantes <= 3 ? "Alta" : "Media",
                Estado = s.Estado,
            };
        }).ToList();
    }

    private static List<ResumenProyectoGerencialDto> ConstruirResumenProyectos(List<Proyecto> proyectos, List<Solicitud> periodo)
    {
        return proyectos.Select(p =>
        {
            var deProyecto = periodo.Where(s => s.ProyectoId == p.Id).ToList();
            var cerradas = deProyecto.Where(s => s.FechaCierre != null).ToList();
            return new ResumenProyectoGerencialDto
            {
                ProyectoId = p.Id,
                ProyectoNombre = p.Nombre,
                ProyectoCodigo = p.Codigo,
                TotalSolicitudes = deProyecto.Count,
                EnTramite = deProyecto.Count(EsEnTramite),
                CumplimientoSlaPorcentaje = cerradas.Count > 0 ? Math.Round((decimal)cerradas.Count(CumpleSla) / cerradas.Count * 100m, 1) : null,
            };
        }).ToList();
    }

    // Alertas basadas en reglas de negocio simples (umbrales) — no es IA/ML, es el mismo tipo
    // de cálculo que el resto del dashboard. La sección de IA real (Insights, Asistente IA)
    // queda para una fase posterior, según lo acordado.
    private List<AlertaGerencialDto> ConstruirAlertas(DashboardGerencialResponseDto dto, List<Proyecto> proyectos, List<Solicitud> periodo)
    {
        var alertas = new List<AlertaGerencialDto>();
        var hoy = DateTime.UtcNow;

        var porVencerPorProyecto = periodo
            .Where(s => s.FechaCierre == null && s.FechaLimite != null && s.FechaLimite >= hoy && s.FechaLimite <= hoy.AddDays(DiasAlertaVencimiento))
            .Where(s => s.Proyecto != null)
            .GroupBy(s => s.Proyecto!.Nombre)
            .Select(g => new { Proyecto = g.Key, Total = g.Count() })
            .OrderByDescending(g => g.Total)
            .FirstOrDefault();

        if (porVencerPorProyecto != null)
        {
            alertas.Add(new AlertaGerencialDto
            {
                Severidad = "alta",
                Texto = $"{porVencerPorProyecto.Total} solicitudes de {porVencerPorProyecto.Proyecto} vencen en los próximos {DiasAlertaVencimiento} días.",
                Etiqueta = "Riesgo alto",
            });
        }

        var proyectoConMasIncremento = ProyectoConMayorIncremento(periodo);
        if (proyectoConMasIncremento != null)
        {
            alertas.Add(new AlertaGerencialDto
            {
                Severidad = "media",
                Texto = $"El proyecto {proyectoConMasIncremento.Value.Nombre} presenta un incremento del {proyectoConMasIncremento.Value.Porcentaje:0}% en solicitudes.",
                Etiqueta = "Riesgo medio",
            });
        }

        var proyectosSlaBajo = dto.SlaPorProyecto.Count(p => p.CumplimientoPorcentaje.HasValue && p.CumplimientoPorcentaje.Value < UmbralSlaBajo);
        if (proyectosSlaBajo > 0)
        {
            alertas.Add(new AlertaGerencialDto
            {
                Severidad = "info",
                Texto = $"{proyectosSlaBajo} proyecto(s) con cumplimiento de SLA por debajo del {UmbralSlaBajo:0}%.",
                Etiqueta = "Información",
            });
        }

        return alertas;
    }

    // Compara la primera mitad del periodo contra la segunda mitad, por proyecto, para
    // detectar incrementos marcados — una señal simple de tendencia sin necesitar el periodo
    // histórico completo otra vez.
    private static List<(string Nombre, decimal Porcentaje)> TodosLosProyectosConIncremento(List<Solicitud> periodo)
    {
        if (periodo.Count == 0) return new();

        var minFecha = periodo.Min(s => s.FechaCreacion);
        var maxFecha = periodo.Max(s => s.FechaCreacion);
        var mitad = minFecha.AddSeconds((maxFecha - minFecha).TotalSeconds / 2);

        return periodo
            .Where(s => s.Proyecto != null)
            .GroupBy(s => s.Proyecto!.Nombre)
            .Select(g => new
            {
                Nombre = g.Key,
                PrimeraMitad = g.Count(s => s.FechaCreacion < mitad),
                SegundaMitad = g.Count(s => s.FechaCreacion >= mitad),
            })
            .Where(g => g.PrimeraMitad >= 3)
            .Select(g => new { g.Nombre, Porcentaje = PorcentajeCambio(g.SegundaMitad, g.PrimeraMitad) })
            .Where(g => g.Porcentaje.HasValue && g.Porcentaje.Value >= UmbralIncrementoRelevante)
            .OrderByDescending(g => g.Porcentaje)
            .Select(g => (g.Nombre, g.Porcentaje!.Value))
            .ToList();
    }

    private static (string Nombre, decimal Porcentaje)? ProyectoConMayorIncremento(List<Solicitud> periodo)
    {
        var todos = TodosLosProyectosConIncremento(periodo);
        return todos.Count > 0 ? todos[0] : null;
    }

    // ===== Helpers de Insights =====

    private static List<InsightGerencialDto> ConstruirInsights(List<Solicitud> actual, List<Solicitud> anterior)
    {
        var insights = new List<InsightGerencialDto>();

        var deltaVolumen = PorcentajeCambio(actual.Count, anterior.Count);
        if (deltaVolumen.HasValue && deltaVolumen.Value != 0)
        {
            var direccion = deltaVolumen.Value >= 0 ? "subió" : "bajó";
            insights.Add(new InsightGerencialDto
            {
                Titulo = "Volumen de solicitudes",
                Texto = $"El total de solicitudes {direccion} un {Math.Abs(deltaVolumen.Value):0.#}% frente al período anterior.",
                Categoria = "volumen",
                EnlaceRuta = "/gerencial/comparativos",
            });
        }

        var mayorIncremento = ProyectoConMayorIncremento(actual);
        if (mayorIncremento != null)
        {
            insights.Add(new InsightGerencialDto
            {
                Titulo = "Proyecto con mayor crecimiento",
                Texto = $"{mayorIncremento.Value.Nombre} presenta el incremento más marcado del período (+{mayorIncremento.Value.Porcentaje:0.#}%).",
                Categoria = "volumen",
                EnlaceRuta = "/gerencial/tendencias",
            });
        }

        var slaPorProyecto = ConstruirSlaPorProyecto(actual).Where(p => p.CumplimientoPorcentaje.HasValue).ToList();
        if (slaPorProyecto.Count > 0)
        {
            var mejor = slaPorProyecto.OrderByDescending(p => p.CumplimientoPorcentaje).First();
            insights.Add(new InsightGerencialDto
            {
                Titulo = "Mejor cumplimiento de SLA",
                Texto = $"{mejor.ProyectoNombre} lidera el cumplimiento de SLA con {mejor.CumplimientoPorcentaje}%.",
                Categoria = "sla",
                EnlaceRuta = "/gerencial/indicadores",
            });

            var peor = slaPorProyecto.OrderBy(p => p.CumplimientoPorcentaje).First();
            if (peor.ProyectoId != mejor.ProyectoId)
            {
                insights.Add(new InsightGerencialDto
                {
                    Titulo = "Oportunidad de mejora en SLA",
                    Texto = $"{peor.ProyectoNombre} tiene el cumplimiento de SLA más bajo del período ({peor.CumplimientoPorcentaje}%).",
                    Categoria = "sla",
                    EnlaceRuta = "/gerencial/indicadores",
                });
            }
        }

        var cerradasActual = actual.Where(EsFinalizada).ToList();
        var cerradasAnterior = anterior.Where(EsFinalizada).ToList();
        if (cerradasActual.Count > 0 && cerradasAnterior.Count > 0)
        {
            var promActual = (decimal)cerradasActual.Average(s => (s.FechaCierre!.Value - s.FechaCreacion).TotalDays);
            var promAnterior = (decimal)cerradasAnterior.Average(s => (s.FechaCierre!.Value - s.FechaCreacion).TotalDays);
            var delta = Math.Round(promActual - promAnterior, 1);
            if (delta != 0)
            {
                var direccion = delta < 0 ? "mejoró" : "empeoró";
                insights.Add(new InsightGerencialDto
                {
                    Titulo = "Tiempo de respuesta",
                    Texto = $"El tiempo de respuesta promedio {direccion} en {Math.Abs(delta)} días frente al período anterior.",
                    Categoria = "tiempo",
                    EnlaceRuta = "/gerencial/tendencias",
                });
            }
        }

        var tipoConMasRechazo = actual
            .Where(s => s.Proyecto != null && s.TipoSolicitud != null)
            .GroupBy(s => new { Proyecto = s.Proyecto!.Nombre, Tipo = s.TipoSolicitud!.Nombre })
            .Select(g =>
            {
                var finalizadas = g.Where(EsFinalizada).ToList();
                var negativas = finalizadas.Count(s => EstadosNegativos.Contains(s.Estado));
                return new { g.Key.Proyecto, g.Key.Tipo, Finalizadas = finalizadas.Count, Tasa = finalizadas.Count > 0 ? (decimal)negativas / finalizadas.Count * 100m : 0m };
            })
            .Where(x => x.Finalizadas >= 3 && x.Tasa > 0)
            .OrderByDescending(x => x.Tasa)
            .FirstOrDefault();

        if (tipoConMasRechazo != null)
        {
            insights.Add(new InsightGerencialDto
            {
                Titulo = "Trámite con mayor tasa de rechazo",
                Texto = $"\"{tipoConMasRechazo.Tipo}\" en {tipoConMasRechazo.Proyecto} tiene la tasa de rechazo más alta del período ({tipoConMasRechazo.Tasa:0.#}%).",
                Categoria = "calidad",
                EnlaceRuta = "/gerencial/indicadores",
            });
        }

        return insights;
    }

    // ===== Helpers de Alertas Inteligentes (versión detallada de ConstruirAlertas) =====

    private static List<AlertaDetalladaDto> ConstruirAlertasDetalladas(List<Solicitud> periodo, List<SlaPorProyectoDto> slaPorProyecto)
    {
        var alertas = new List<AlertaDetalladaDto>();
        var hoy = DateTime.UtcNow;

        var porVencerPorProyecto = periodo
            .Where(s => s.FechaCierre == null && s.FechaLimite != null && s.FechaLimite >= hoy && s.FechaLimite <= hoy.AddDays(DiasAlertaVencimiento))
            .Where(s => s.Proyecto != null)
            .GroupBy(s => s.Proyecto!.Nombre)
            .Select(g => new { Proyecto = g.Key, Total = g.Count() })
            .OrderByDescending(g => g.Total);

        foreach (var g in porVencerPorProyecto)
        {
            alertas.Add(new AlertaDetalladaDto
            {
                Severidad = "alta",
                Texto = $"{g.Total} solicitudes de {g.Proyecto} vencen en los próximos {DiasAlertaVencimiento} días.",
                Etiqueta = "Riesgo alto",
                EnlaceRuta = "/solicitudes",
            });
        }

        foreach (var (nombre, porcentaje) in TodosLosProyectosConIncremento(periodo))
        {
            alertas.Add(new AlertaDetalladaDto
            {
                Severidad = "media",
                Texto = $"El proyecto {nombre} presenta un incremento del {porcentaje:0}% en solicitudes.",
                Etiqueta = "Riesgo medio",
                EnlaceRuta = "/gerencial/tendencias",
            });
        }

        foreach (var p in slaPorProyecto.Where(p => p.CumplimientoPorcentaje.HasValue && p.CumplimientoPorcentaje.Value < UmbralSlaBajo))
        {
            alertas.Add(new AlertaDetalladaDto
            {
                Severidad = "info",
                Texto = $"{p.ProyectoNombre} tiene un cumplimiento de SLA de {p.CumplimientoPorcentaje}%, por debajo del {UmbralSlaBajo:0}%.",
                Etiqueta = "Información",
                EnlaceRuta = "/gerencial/indicadores",
            });
        }

        return alertas;
    }

    // ===== Helpers de Tendencias (granularidad día/semana/mes) =====

    private static DateTime InicioSemana(DateTime fecha)
    {
        var diff = (7 + (fecha.DayOfWeek - DayOfWeek.Monday)) % 7;
        return fecha.Date.AddDays(-diff);
    }

    private static DateTime InicioBucket(DateTime fecha, string granularidad) => granularidad switch
    {
        "semana" => InicioSemana(fecha),
        "mes" => new DateTime(fecha.Year, fecha.Month, 1),
        _ => fecha.Date,
    };

    private static DateTime FinBucket(DateTime inicioBucket, string granularidad) => granularidad switch
    {
        "semana" => inicioBucket.AddDays(7),
        "mes" => inicioBucket.AddMonths(1),
        _ => inicioBucket.AddDays(1),
    };

    private static List<PuntoTendenciaExtendidoDto> ConstruirTendenciaExtendida(List<Solicitud> periodo, DateTime desde, DateTime hasta, string granularidad)
    {
        var puntos = new List<PuntoTendenciaExtendidoDto>();
        var acumuladoAbierto = 0;
        var cursor = InicioBucket(desde, granularidad);

        while (cursor < hasta)
        {
            var fin = FinBucket(cursor, granularidad);
            var radicadas = periodo.Count(s => s.FechaCreacion >= cursor && s.FechaCreacion < fin);
            var cerradas = periodo.Where(s => s.FechaCierre >= cursor && s.FechaCierre < fin).ToList();
            acumuladoAbierto += radicadas - cerradas.Count;

            puntos.Add(new PuntoTendenciaExtendidoDto
            {
                Fecha = cursor,
                Radicadas = radicadas,
                Finalizadas = cerradas.Count,
                EnTramite = Math.Max(acumuladoAbierto, 0),
                CumplimientoSlaPorcentaje = cerradas.Count > 0
                    ? Math.Round((decimal)cerradas.Count(CumpleSla) / cerradas.Count * 100m, 1)
                    : null,
            });

            cursor = fin;
        }

        return puntos;
    }

    // ===== Helpers de Comparativos =====

    private static ComparativoPeriodoDto ResumirPeriodo(List<Solicitud> periodo)
    {
        var finalizadas = periodo.Where(EsFinalizada).ToList();
        return new ComparativoPeriodoDto
        {
            Total = periodo.Count,
            Finalizadas = finalizadas.Count,
            EnTramite = periodo.Count(EsEnTramite),
            Pendientes = periodo.Count(EsPendiente),
            CumplimientoSlaPorcentaje = finalizadas.Count > 0
                ? Math.Round((decimal)finalizadas.Count(CumpleSla) / finalizadas.Count * 100m, 1)
                : null,
        };
    }

    private static ResumenComparativoDto ConstruirResumenComparativo(List<Solicitud> actual, List<Solicitud> anterior)
    {
        var a = ResumirPeriodo(actual);
        var b = ResumirPeriodo(anterior);
        return new ResumenComparativoDto
        {
            Actual = a,
            Anterior = b,
            DeltaTotalPorcentaje = PorcentajeCambio(a.Total, b.Total),
            DeltaFinalizadasPorcentaje = PorcentajeCambio(a.Finalizadas, b.Finalizadas),
            DeltaEnTramitePorcentaje = PorcentajeCambio(a.EnTramite, b.EnTramite),
            DeltaPendientesPorcentaje = PorcentajeCambio(a.Pendientes, b.Pendientes),
            DeltaSlaPorcentaje = a.CumplimientoSlaPorcentaje.HasValue && b.CumplimientoSlaPorcentaje.HasValue
                ? Math.Round(a.CumplimientoSlaPorcentaje.Value - b.CumplimientoSlaPorcentaje.Value, 1)
                : null,
        };
    }

    private static List<ComparativoProyectoDto> ConstruirComparativoPorProyecto(List<Proyecto> proyectos, List<Solicitud> actual, List<Solicitud> anterior)
    {
        return proyectos.Select(p =>
        {
            var deActual = actual.Where(s => s.ProyectoId == p.Id).ToList();
            var deAnterior = anterior.Where(s => s.ProyectoId == p.Id).ToList();
            var finalizadasActual = deActual.Where(EsFinalizada).ToList();
            var finalizadasAnterior = deAnterior.Where(EsFinalizada).ToList();
            decimal? slaActual = finalizadasActual.Count > 0
                ? Math.Round((decimal)finalizadasActual.Count(CumpleSla) / finalizadasActual.Count * 100m, 1)
                : null;
            decimal? slaAnterior = finalizadasAnterior.Count > 0
                ? Math.Round((decimal)finalizadasAnterior.Count(CumpleSla) / finalizadasAnterior.Count * 100m, 1)
                : null;

            return new ComparativoProyectoDto
            {
                ProyectoId = p.Id,
                ProyectoNombre = p.Nombre,
                TotalActual = deActual.Count,
                TotalAnterior = deAnterior.Count,
                DeltaTotalPorcentaje = PorcentajeCambio(deActual.Count, deAnterior.Count),
                SlaActualPorcentaje = slaActual,
                SlaAnteriorPorcentaje = slaAnterior,
                DeltaSlaPorcentaje = slaActual.HasValue && slaAnterior.HasValue ? Math.Round(slaActual.Value - slaAnterior.Value, 1) : null,
            };
        }).OrderByDescending(c => c.TotalActual).ToList();
    }
}
