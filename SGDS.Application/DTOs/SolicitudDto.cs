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
    public DateTime FechaCreacion { get; set; }
    public DateTime? FechaCierre { get; set; }
}

public class CrearSolicitudDto
{
    public int? CiudadanoId { get; set; }
    public int? EmpresaId { get; set; }
}

public class CambiarEstadoDto
{
    public string NuevoEstado { get; set; } = string.Empty;
}

public class AsignarUsuarioDto
{
    public int UsuarioId { get; set; }
}