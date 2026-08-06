namespace SGDS.Domain.Entities;

public class Rol
{
    public int Id { get; set; }
    public string Nombre { get; set; } = string.Empty;

    public ICollection<UsuarioProyecto> UsuarioProyectos { get; set; } = new List<UsuarioProyecto>();
}