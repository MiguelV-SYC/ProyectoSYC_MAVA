using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using SGDS.Application.DTOs;
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

    // Umbral de cumplimiento (creación -> cierre) usado como referencia general del sistema —
    // mismo valor ya usado como plazo de legalización de Infoconsumo (Decreto 3071/1997).
    // No hay todavía un SLA configurable por proyecto/tipo de trámite; es un valor de
    // referencia único para dar una cifra de "cumplimiento" comparable entre proyectos.
    private const int SlaDias = 15;
    private const int DiasAlertaVencimiento = 5;
    private const decimal UmbralSlaBajo = 85m;
    private const decimal UmbralIncrementoRelevante = 15m;

    public GerencialController(SgdsDbContext context)
    {
        _context = context;
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
    // detectar el incremento más marcado — una señal simple de tendencia sin necesitar el
    // periodo histórico completo otra vez.
    private static (string Nombre, decimal Porcentaje)? ProyectoConMayorIncremento(List<Solicitud> periodo)
    {
        if (periodo.Count == 0) return null;

        var minFecha = periodo.Min(s => s.FechaCreacion);
        var maxFecha = periodo.Max(s => s.FechaCreacion);
        var mitad = minFecha.AddSeconds((maxFecha - minFecha).TotalSeconds / 2);

        var porProyecto = periodo
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
            .FirstOrDefault();

        return porProyecto != null ? (porProyecto.Nombre, porProyecto.Porcentaje!.Value) : null;
    }
}
