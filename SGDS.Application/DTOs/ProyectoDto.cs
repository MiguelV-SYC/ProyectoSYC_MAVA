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
    public int TotalSolicitudes { get; set; }
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
public class ActualizarTipoSolicitudDto
{
    public string Nombre { get; set; } = string.Empty;
}
public class OperadorProyectoDto
{
    public int UsuarioId { get; set; }
    public string NombreCompleto { get; set; } = string.Empty;
    public string RolNombre { get; set; } = string.Empty;
}

public class ProyectoResumenDto
{
    public double? TiempoPromedioResolucion { get; set; }
    public int RadicadasHoy { get; set; }
    public int AprobadasEsteMes { get; set; }
}