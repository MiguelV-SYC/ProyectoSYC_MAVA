namespace SGDS.Application.DTOs;

public class SolicitudResponseDto
{
    public int Id { get; set; }
    public int? CiudadanoId { get; set; }
    public string? CiudadanoNombre { get; set; }
    public int? EmpresaId { get; set; }
    public string? EmpresaNombre { get; set; }
    public int? UsuarioAsignadoId { get; set; }
    public string? UsuarioAsignadoNombre { get; set; }
    public string Estado { get; set; } = string.Empty;
    public string Numero { get; set; } = string.Empty;
    public string? TipoSolicitudNombre { get; set; }
    public DateTime FechaCreacion { get; set; }
    public DateTime? FechaCierre { get; set; }
}

public class CrearSolicitudDto
{
    public int? CiudadanoId { get; set; }
    public int? EmpresaId { get; set; }
    public int? ProyectoId { get; set; }
    public int? TipoSolicitudId { get; set; }
    public int? VehiculoId { get; set; }
}

public class CambiarEstadoDto
{
    public string NuevoEstado { get; set; } = string.Empty;
}

public class AsignarUsuarioDto
{
    public int UsuarioId { get; set; }
}

public class ConteoProyectoDto
{
    public int ProyectoId { get; set; }
    public string ProyectoNombre { get; set; } = string.Empty;
    public int TotalAsignadas { get; set; }
}

public class IndicadoresOperadorDto
{
    public int AsignadasAMi { get; set; }
    public int VenceHoy { get; set; }
    public int RequierenMiRespuesta { get; set; }
    public int CompletadasEstaSemana { get; set; }
}

public class SolicitudAtencionDto
{
    public int SolicitudId { get; set; }
    public string Numero { get; set; } = string.Empty;
    public string? TipoSolicitud { get; set; }
    public string? CiudadanoNombre { get; set; }
    public string ProyectoNombre { get; set; } = string.Empty;
    public string EstadoDescripcion { get; set; } = string.Empty;
    public string Urgencia { get; set; } = string.Empty;
    public string AccionSugerida { get; set; }= string.Empty;
}

public class SolicitudColaDto
{
    public int SolicitudId { get; set; }
    public string Numero { get; set; } = string.Empty;
    public string? TipoSolicitud { get; set; }
    public string? CiudadanoNombre { get; set; }
    public string? CiudadanoDocumento { get; set; }
    public string Estado { get; set; } = string.Empty;
    public DateTime Fecha { get; set; }
}

