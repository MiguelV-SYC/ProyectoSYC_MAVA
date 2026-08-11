namespace SGDS.Domain.Entities;

public class SolicitudAcceso
{
    public int Id { get; set; }
    public string NombreCompleto { get; set; } = string.Empty;
    public string Email { get; set; } = string.Empty; 
    public string DocumentoIdentidad { get; set; } = string.Empty;
    public string? Telefono { get; set; }
    public string RolSolicitado { get; set; } = string.Empty;
    public string? Motivo { get; set; }
    public string Estado { get; set; } = "Pendiente";
    public DateTime FechaSolicitud { get; set; } = DateTime.UtcNow;

    public ICollection<SolicitudAccesoProyecto> ProyectosSolicitados { get; set; } = new List<SolicitudAccesoProyecto>();

}