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
    public string? NumeroChasis { get; set; }

    // Características IUVA (Reglas_de_negocio_IUVA.md) — atributos fijos del vehículo: se
    // diligencian una sola vez al crearlo y se heredan en cada solicitud (no se repiten por
    // radicación). Cilindraje es texto y no número porque las tablas de base gravable de
    // eléctricos/motos usan valores como "276 KW" o "1,2 KW", no solo cc.
    // Tipo/Clase deben coincidir exactamente con BaseGravableVehiculo.Tipo/Clase (ver
    // /api/Vehiculos/catalogo-tipos) para que la búsqueda de base gravable encuentre la fila.
    public string? Cilindraje { get; set; }
    public string? TipoVehiculo { get; set; }
    public string? Subtipo { get; set; }
    public string? MunicipioMatricula { get; set; }
    public string? DepartamentoMatricula { get; set; }
    public bool Blindado { get; set; }
    public bool EsClasicoAntiguo { get; set; }

    public ICollection<Solicitud> Solicitudes { get; set; } = new List<Solicitud>();
}