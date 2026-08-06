namespace SGDS.Domain.Entities;

public class TipoSolicitud
{
    public int Id { get; set; }
    public int ProyectoId { get; set; }
    public Proyecto Proyecto { get; set; } = null!;
    public string Nombre { get; set; } = string.Empty;
    public bool Activo { get; set; } = true;

    public ICollection<Solicitud> Solicitudes { get; set; } = new List<Solicitud>();
    
}