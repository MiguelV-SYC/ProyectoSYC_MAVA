namespace SGDS.Domain.Entities;

// Datos propios de una tornaguía de Infoconsumo, 1:1 con la Solicitud que la origina.
// Se modela como entidad aparte (y no como DatosAdicionales jsonb) porque Placa + NIT del
// transportador necesitan poder consultarse por SQL para la validación de doble asignación (2.2).
public class TornaguiaInfoconsumo
{
    public int Id { get; set; }
    public int SolicitudId { get; set; }
    public Solicitud Solicitud { get; set; } = null!;

    // Terrestre | Fluvial | Marítimo | Aéreo — determina si la ruta se traza por carretera
    // (routing real) o como referencia en línea recta (agua/aire, sin motor de rutas disponible).
    public string TipoTransporte { get; set; } = "Terrestre";

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

    // Punto exacto opcional, resultado de la búsqueda en vivo de direcciones (Nominatim/OSM) —
    // cuando el usuario elige una dirección específica en vez de quedarse en el centroide del
    // municipio. Si es null, la coordenada se resuelve por municipio (o por capital de
    // departamento como último respaldo) — ver InfoconsumoController.ConstruirTornaguiaDtoAsync.
    public string? DireccionEspecificaOrigen { get; set; }
    public double? LatOrigen { get; set; }
    public double? LngOrigen { get; set; }
    public string? DireccionEspecificaDestino { get; set; }
    public double? LatDestino { get; set; }
    public double? LngDestino { get; set; }
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

    // Confirmación de pago del impuesto al consumo — independiente del ciclo de legalización
    // (Elaborada/Expedida/Legalizada/Vencida sigue significando movilización física). Una vez
    // pagada, la tornaguía queda disponible para que SYCTrace la use como origen de una
    // expedición de estampilla física (puente Infoconsumo -> SYCTrace).
    public bool PagoConfirmado { get; set; }
    public DateTime? FechaPagoConfirmado { get; set; }

    // Lote de GoTrace (Solicitud del proyecto Gotrace, ya Aprobada) del que se heredan
    // empresa y unidades físicas — puente GoTrace -> Infoconsumo (Reglas_de_negocio_GoTrace.md,
    // "Paso 2: Inyección de datos a Infoconsumo"). Opcional: solo aplica a empresas que ya
    // trazan sus lotes en GoTrace; el resto sigue radicando directamente como hoy.
    public int? LoteGoTraceSolicitudId { get; set; }
    public Solicitud? LoteGoTraceSolicitud { get; set; }
}
