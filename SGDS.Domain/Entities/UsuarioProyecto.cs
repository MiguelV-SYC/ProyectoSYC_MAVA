namespace SGDS.Domain.Entities;

public class UsuarioProyecto
{
    public int UsuarioId { get; set; }
    public Usuario Usuario { get; set; } = null!;
    public int ProyectoId { get; set; }
    public Proyecto Proyecto { get; set; } = null!;

    public int RolId { get; set; }
    public Rol Rol { get; set; } = null!;
}