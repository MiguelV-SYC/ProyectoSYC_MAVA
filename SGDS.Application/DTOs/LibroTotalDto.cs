namespace SGDS.Application.DTOs;

public class SedeResponseDto
{
    public int Id { get; set; }
    public string Nombre { get; set; } = string.Empty;
    public string Ciudad { get; set; } = string.Empty;
    public bool EsPrincipal { get; set; }
    public int AtencionesMes { get; set; }
    public int? EsperaPromedioMinutos { get; set; }
}

public class CrearTurnoDto
{
    public int ProyectoId { get; set; }
    public int TipoSolicitudId { get; set; }
    public int CiudadanoId { get; set; }
    public int SedeId { get; set; }
    public string Motivo { get; set; } = string.Empty;
    public DateTime FechaHoraCita { get; set; }
}

public class FinalizarTurnoDto
{
    public string Tipificacion { get; set; } = string.Empty;
}

public class MarcarNoAsistioDto
{
    public string? Motivo { get; set; }
}

public class TurnoResponseDto
{
    public int SolicitudId { get; set; }
    public string Numero { get; set; } = string.Empty;
    public string NumeroTurno { get; set; } = string.Empty;
    public string Estado { get; set; } = string.Empty;

    public int SedeId { get; set; }
    public string SedeNombre { get; set; } = string.Empty;
    public string SedeCiudad { get; set; } = string.Empty;

    public int CiudadanoId { get; set; }
    public string CiudadanoNombre { get; set; } = string.Empty;
    public string CiudadanoDocumento { get; set; } = string.Empty;

    public string Motivo { get; set; } = string.Empty;
    public DateTime FechaHoraCita { get; set; }
    public DateTime FechaCreacion { get; set; }
    public DateTime? FechaInicioAtencion { get; set; }
    public DateTime? FechaFinAtencion { get; set; }
    public string? Tipificacion { get; set; }
    public string? MotivoNoAsistio { get; set; }

    public string? OperadorNombre { get; set; }
}

public class TarjetaKanbanTurnoDto
{
    public int Id { get; set; }
    public string Numero { get; set; } = string.Empty;
    public string NumeroTurno { get; set; } = string.Empty;
    public string CiudadanoNombre { get; set; } = string.Empty;
    public string Motivo { get; set; } = string.Empty;
    public string Estado { get; set; } = string.Empty;
    public DateTime FechaHoraCita { get; set; }
}

// Un trámite puntual de un ciudadano en algún proyecto SYC (fila del panel por proyecto).
public class TramiteResumenDto
{
    public int SolicitudId { get; set; }
    public string Numero { get; set; } = string.Empty;
    public string Descripcion { get; set; } = string.Empty;
    public string Estado { get; set; } = string.Empty;
}

// Agrupación de los trámites de un ciudadano dentro de un mismo proyecto.
public class TramiteProyectoDto
{
    public int ProyectoId { get; set; }
    public string ProyectoNombre { get; set; } = string.Empty;
    public List<TramiteResumenDto> Solicitudes { get; set; } = new();
}

// Respuesta del Motor de Consulta Consolidada — agrega los trámites del ciudadano en todos
// los proyectos SYC donde tiene actividad (excepto el propio Libro Total, que es el agregador).
public class ConsultaConsolidadaResponseDto
{
    public int CiudadanoId { get; set; }
    public string CiudadanoNombre { get; set; } = string.Empty;
    public string CiudadanoDocumento { get; set; } = string.Empty;
    public string? CiudadanoCiudad { get; set; }

    public int TotalTramitesActivos { get; set; }
    public int TotalProyectos { get; set; }

    public List<TramiteProyectoDto> Proyectos { get; set; } = new();
}

// Documento exportable "Estado de Cuenta Consolidado" — mismo contenido de la consulta más
// el contexto de dónde/quién lo generó (sede, operador, turno) cuando aplica.
public class EstadoCuentaResponseDto
{
    public string Referencia { get; set; } = string.Empty;

    public int CiudadanoId { get; set; }
    public string CiudadanoNombre { get; set; } = string.Empty;
    public string CiudadanoDocumento { get; set; } = string.Empty;

    public int TotalTramitesActivos { get; set; }
    public int TotalProyectos { get; set; }
    public List<TramiteProyectoDto> Proyectos { get; set; } = new();

    public string? SedeNombre { get; set; }
    public string? OperadorNombre { get; set; }
    public DateTime FechaGeneracion { get; set; }
}
