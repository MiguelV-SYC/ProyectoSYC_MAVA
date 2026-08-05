namespace SGDS.Domain.Entities;

public class Solicitud
{
    public int Id { get; set; }
    public int? CiudadanoId { get; set; }
    public Ciudadano? Ciudadano { get; set; }
    public int? EmpresaId { get; set; }
    public Empresa? Empresa { get; set; }
    public int? UsuarioAsignadoId { get; set; }
    public Usuario? UsuarioAsignado { get; set; }
    public string Estado { get; set; } = "Radicada";
    public DateTime FechaCreacion { get; set; } = DateTime.UtcNow;
    public DateTime? FechaCierre { get; set; }

    public ICollection<Documento> Documentos { get; set; } = new List<Documento>();
    public ICollection<HistorialEstado> HistorialEstados { get; set; } = new List<HistorialEstado>();
}