namespace SGDS.Domain.Entities;

public class Vehiculo
{
    public int Id { get; set; }
    
    public int? CiudadanoId { get; set; }
    public Ciudadano? Ciudadano { get; set; }
    public int? EmpresaId { get; set; }
    public Empresa? Empresa { get; set; }

    public string Placa { get; set; } = string.Empty;
    public string? Marca { get; set; } 
    public string? Linea { get; set; }
    public int? Modelo { get; set; }

    public ICollection<Solicitud> Solicitudes { get; set; } = new List<Solicitud>();
}