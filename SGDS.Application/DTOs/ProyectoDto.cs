namespace SGDS.Application.DTOs;

public class ProyectoResponseDto
{
    public int Id { get; set; }
    public string Nombre { get; set; } = string.Empty;
    public string Codigo { get; set; } = string.Empty;
    public string? Descripcion { get; set; }
    public bool Activo { get; set; } = true;
    public string? EstadoPersonalizado { get; set; }
    public int TotalTiposSolicitud { get; set; }
    public int TotalOperadores { get; set; }
}

public class CrearProyectoDto
{
    public string Nombre { get; set; } = string.Empty;
    public string Codigo { get; set; } = string.Empty;
    public string? Descripcion { get; set; }
}

public class ActualizarProyectoDto
{
    public string Nombre { get; set; } = string.Empty;
    public string? Descripcion { get; set; }
    public bool Activo { get; set; }
    public string? EstadoPersonalizado { get; set; }
}

public class TipoSolicitudResponseDto
{
    public int Id { get; set; }
    public int ProyectoId { get; set; }
    public string Nombre { get; set; } = string.Empty;
    public bool Activo { get; set; } = true;
}

public class CrearTipoSolicitudDto
{
    public int ProyectoId { get; set; }
    public string Nombre { get; set; } = string.Empty;
}