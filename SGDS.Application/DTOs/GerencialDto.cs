namespace SGDS.Application.DTOs;

public class KpiGerencialDto
{
    public int Total { get; set; }
    public int Finalizadas { get; set; }
    public int EnTramite { get; set; }
    public int Pendientes { get; set; }
    public decimal? CumplimientoSlaPorcentaje { get; set; }

    public decimal? DeltaTotalPorcentaje { get; set; }
    public decimal? DeltaFinalizadasPorcentaje { get; set; }
    public decimal? DeltaEnTramitePorcentaje { get; set; }
    public decimal? DeltaPendientesPorcentaje { get; set; }
    public decimal? DeltaSlaPorcentaje { get; set; }
}

public class PuntoTendenciaDto
{
    public DateTime Fecha { get; set; }
    public int Radicadas { get; set; }
    public int Finalizadas { get; set; }
    public int EnTramite { get; set; }
}

public class DistribucionEstadoDto
{
    public string Bucket { get; set; } = string.Empty;
    public int Total { get; set; }
    public decimal Porcentaje { get; set; }
}

public class SolicitudesPorProyectoDto
{
    public int ProyectoId { get; set; }
    public string ProyectoNombre { get; set; } = string.Empty;
    public int Total { get; set; }
}

public class SlaPorProyectoDto
{
    public int ProyectoId { get; set; }
    public string ProyectoNombre { get; set; } = string.Empty;
    public decimal? CumplimientoPorcentaje { get; set; }
}

public class SolicitudCriticaDto
{
    public int SolicitudId { get; set; }
    public string Numero { get; set; } = string.Empty;
    public string ProyectoNombre { get; set; } = string.Empty;
    public string Asunto { get; set; } = string.Empty;
    public int DiasParaVencer { get; set; }
    public string Prioridad { get; set; } = string.Empty;
    public string Estado { get; set; } = string.Empty;
}

public class AlertaGerencialDto
{
    public string Severidad { get; set; } = string.Empty;
    public string Texto { get; set; } = string.Empty;
    public string Etiqueta { get; set; } = string.Empty;
}

public class PuntoSerieDto
{
    public DateTime Fecha { get; set; }
    public decimal? Valor { get; set; }
}

public class TiempoRespuestaDto
{
    public decimal? PromedioDias { get; set; }
    public decimal? DeltaDias { get; set; }
    public List<PuntoSerieDto> Serie { get; set; } = new();
}

public class ResumenProyectoGerencialDto
{
    public int ProyectoId { get; set; }
    public string ProyectoNombre { get; set; } = string.Empty;
    public string ProyectoCodigo { get; set; } = string.Empty;
    public int TotalSolicitudes { get; set; }
    public int EnTramite { get; set; }
    public decimal? CumplimientoSlaPorcentaje { get; set; }
}

public class DashboardGerencialResponseDto
{
    public DateTime Desde { get; set; }
    public DateTime Hasta { get; set; }
    public KpiGerencialDto Kpis { get; set; } = new();
    public List<PuntoTendenciaDto> Tendencia { get; set; } = new();
    public List<DistribucionEstadoDto> DistribucionEstado { get; set; } = new();
    public List<SolicitudesPorProyectoDto> SolicitudesPorProyecto { get; set; } = new();
    public List<SlaPorProyectoDto> SlaPorProyecto { get; set; } = new();
    public TiempoRespuestaDto TiempoRespuesta { get; set; } = new();
    public List<SolicitudCriticaDto> Criticas { get; set; } = new();
    public List<AlertaGerencialDto> Alertas { get; set; } = new();
    public List<ResumenProyectoGerencialDto> Proyectos { get; set; } = new();
}
