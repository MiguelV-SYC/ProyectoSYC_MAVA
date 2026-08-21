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
    public DateTime? FechaLimite { get; set;}

//acá agregamos las nuevas entidades con relación al ajuste del proyecto
    public int? ProyectoId { get; set; }
    public Proyecto? Proyecto { get; set; }
    public int? TipoSolicitudId { get; set; }
    public TipoSolicitud? TipoSolicitud { get; set; }
    public string? DatosAdicionales { get; set; }

    public int? VehiculoId { get; set; }
    public Vehiculo? Vehiculo { get; set;}

    public TornaguiaInfoconsumo? TornaguiaInfoconsumo { get; set; }
    public EstampillaFisica? EstampillaFisica { get; set; }
    public LoteGoTrace? LoteGoTrace { get; set; }
    public InstrumentoPasivoLaboral? InstrumentoPasivoLaboral { get; set; }
// fin

    public ICollection<Documento> Documentos { get; set; } = new List<Documento>();
    public ICollection<HistorialEstado> HistorialEstados { get; set; } = new List<HistorialEstado>();
}