namespace SGDS.Domain.Entities;

// Datos propios de un registro de trazabilidad de lote GoTrace, 1:1 con la Solicitud que lo
// origina. GoTrace es la herramienta B2B de las propias empresas productoras (Diageo, ILV,
// ABInBev) para rastrear sus lotes desde fábrica hasta el consumidor — no depende del ciclo
// fiscal de Infoconsumo/SYCTrace, aunque el documento de reglas describe una integración
// futura (herencia de lote hacia Infoconsumo, cruce de UID contra SYCTrace) que no se
// construye aquí por no tener las APIs/hardware de escaneo reales del piloto.
public class LoteGoTrace
{
    public int Id { get; set; }
    public int SolicitudId { get; set; }
    public Solicitud Solicitud { get; set; } = null!;

    public string Producto { get; set; } = string.Empty;
    public string NumeroLote { get; set; } = string.Empty;
    public DateTime FechaProduccion { get; set; }
    public int UnidadesLote { get; set; }

    // Rango de UIDs (RN-GT01) — códigos de identificación única impresos por láser/inyección
    // de tinta en fábrica sobre cada botella. Opcional: el mockup no lo exige para radicar.
    public string? PrefijoUid { get; set; }
    public int? CantidadUids { get; set; }
    public int? UidInicial { get; set; }
    public int? UidFinal { get; set; }

    public ICollection<PuntoControlGoTrace> PuntosControl { get; set; } = new List<PuntoControlGoTrace>();
}
