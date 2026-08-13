namespace SGDS.Domain.Entities;
public class Empresa
{
    public int Id { get; set; }
    public string Nit { get; set; } = string.Empty;
    public string RazonSocial { get; set; } = string.Empty;

    public ICollection<Solicitud> Solicitudes { get; set; } = new List<Solicitud>();
    public ICollection<Vehiculo> Vehiculos { get; set; } = new List<Vehiculo>();
    public string? RepresentanteLegal { get; set; }
    public string? Telefono { get; set; }
    public string? Correo { get; set; }
    public string? Ciudad { get; set; }
    public string? Direccion { get; set; }
    public DateTime FechaRegistro { get; set; } = DateTime.UtcNow;
}