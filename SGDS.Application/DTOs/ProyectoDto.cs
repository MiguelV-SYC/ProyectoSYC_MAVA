namespace SGDS.Application.DTOs;

public class ProyectoResponseDto
{
    public int Id { get; set; }
    public string Nombre { get; set; } = string.Empty;
    public string Codigo { get; set; } = string.Empty;
    public bool Activo { get; set; } = true;
}

public class CrearProyectoDto
{
    public string Nombre { get; set; } = string.Empty;
    public string Codigo { get; set; } = string.Empty;
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