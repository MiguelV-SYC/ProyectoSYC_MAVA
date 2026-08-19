namespace SGDS.Application.DTOs;

public class GenerarReporteDto
{
    public int? ProyectoId { get; set; }
    public DateTime? Desde { get; set; }
    public DateTime? Hasta { get; set; }
    public int? TipoSolicitudId { get; set; }
    public List<string>? EstadosIncluidos { get; set; }
    public string Formato { get; set; } = string.Empty;
}

public class ReporteResponseDto
{
    public int Id { get; set; }
    public string NombreArchivo { get; set; } = string.Empty;
    public string Formato { get; set; } = string.Empty;
    public int TotalRegistros { get; set; }
    public DateTime FechaGeneracion { get; set; }
}