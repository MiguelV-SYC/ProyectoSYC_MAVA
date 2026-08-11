namespace SGDS.Domain.Entities;

public class SolicitudAccesoProyecto
{
    public int SolicitudAccesoId { get; set; }
    public SolicitudAcceso SolicitudAcceso { get; set; } = null!;

    public int ProyectoId { get; set; }
    public Proyecto Proyecto { get; set; } = null!;
}