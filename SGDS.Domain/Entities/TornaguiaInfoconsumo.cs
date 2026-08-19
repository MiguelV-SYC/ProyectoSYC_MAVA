namespace SGDS.Domain.Entities;

// Datos propios de una tornaguía de Infoconsumo, 1:1 con la Solicitud que la origina.
// Se modela como entidad aparte (y no como DatosAdicionales jsonb) porque Placa + NIT del
// transportador necesitan poder consultarse por SQL para la validación de doble asignación (2.2).
public class TornaguiaInfoconsumo
{
    public int Id { get; set; }
    public int SolicitudId { get; set; }
    public Solicitud Solicitud { get; set; } = null!;

    // Producto gravado
    public string CategoriaProducto { get; set; } = string.Empty;
    public decimal? GradosAlcoholimetricos { get; set; }
    public int UnidadesFisicas { get; set; }
    public decimal PvpCertificado { get; set; }

    // Movilización
    public string DepartamentoOrigen { get; set; } = string.Empty;
    public string MunicipioOrigen { get; set; } = string.Empty;
    public string DepartamentoDestino { get; set; } = string.Empty;
    public string MunicipioDestino { get; set; } = string.Empty;
    public string EmpresaTransportadora { get; set; } = string.Empty;
    public string? NitTransportador { get; set; }
    public string PlacaVehiculo { get; set; } = string.Empty;
    public string? Conductor { get; set; }
    public string? CedulaConductor { get; set; }
    public string? TipoVehiculo { get; set; }
    public string? Observaciones { get; set; }

    // Ciclo de vida propio de Infoconsumo (fechas; el estado en sí vive en Solicitud.Estado)
    public DateTime? FechaExpedicion { get; set; }
    public DateTime? FechaVigenciaLimite { get; set; }
    public DateTime? FechaLegalizacion { get; set; }
}
