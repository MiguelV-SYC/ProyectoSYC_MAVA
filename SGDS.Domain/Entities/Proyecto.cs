namespace SGDS.Domain.Entities;

public class Proyecto
{
    public int Id { get; set; }
    public string Nombre { get; set; } = string.Empty;
    public string Codigo { get; set; } = string.Empty;
    public bool Activo { get; set; } = true;


    public ICollection<TipoSolicitud> TiposSolicitud { get; set; } = new List<TipoSolicitud>();
    public ICollection<UsuarioProyecto> UsuariosProyectos { get; set; } = new List<UsuarioProyecto>();
    public ICollection<Solicitud> Solicitudes { get; set; } = new List<Solicitud>();

    public ICollection<SolicitudAccesoProyecto> SolicitudesAcceso { get; set; } = new List<SolicitudAccesoProyecto>();

}

