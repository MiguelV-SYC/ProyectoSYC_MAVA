namespace SGDS.Domain.Entities;

public class Auditoria
{
    public int Id { get; set; }
    public int? UsuarioId { get; set; }
    public Usuario? Usuario { get; set; }
    public string Accion { get; set; } = string.Empty;
    public string? Modulo { get; set; }
    public DateTime FechaHora { get; set; } = DateTime.UtcNow;
    public string? DireccionIp { get; set; }
    public int? ProyectoId { get; set; }
    public Proyecto? Proyecto { get; set; }
}