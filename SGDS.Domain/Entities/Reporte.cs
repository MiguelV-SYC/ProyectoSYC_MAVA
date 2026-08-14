namespace SGDS.Domain.Entities;

public class Reporte
{
    public int Id { get; set; }
    public int? ProyectoId { get; set; }
    public Proyecto? Proyecto { get; set; }
    public int? UsuarioId { get; set; }
    public Usuario? Usuario { get; set; }
    public string NombreArchivo { get; set; } = string.Empty;
    public string Formato { get; set; } = string.Empty;
    public string RutaArchivo { get; set; } = string.Empty;
    public int TotalRegistros { get; set; }
    public DateTime FechaGeneracion { get; set; } = DateTime.UtcNow;
}