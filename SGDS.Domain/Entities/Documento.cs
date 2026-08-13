namespace SGDS.Domain.Entities;

public class Documento
{
    public int Id { get; set; }
    public int SolicitudId { get; set; }
    public Solicitud Solicitud { get; set; } = null!;
    public string NombreArchivo { get; set; } = string.Empty;
    public string RutaArchivo { get; set; } = string.Empty;
    public DateTime FechaCarga { get; set; } = DateTime.UtcNow;
    public long? TamanoBytes { get; set; }
    public string? TipoArchivo { get; set; }
}