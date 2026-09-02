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

    // Nombre del producto en el momento de radicar (copia de ProductoCatalogo.Nombre) — se
    // conserva como snapshot de texto para no depender del catálogo en PDFs/certificados ya
    // emitidos, aunque el producto se edite o elimine del catálogo después.
    public string Producto { get; set; } = string.Empty;
    public int? ProductoCatalogoId { get; set; }
    public Producto? ProductoCatalogo { get; set; }

    public string NumeroLote { get; set; } = string.Empty;
    public DateTime FechaProduccion { get; set; }
    public int UnidadesLote { get; set; }

    // Automatico | Archivo — ver Reglas_de_negocio_GoTrace.md, "Identificación de Unidades".
    // En Automatico, Prefijo/Cantidad/Inicial/Final se componen server-side (mismo esquema
    // GT+Producto+fecha+consecutivo del número de lote). En Archivo, los UIDs reales los
    // asigna el hardware de la fábrica (láser/inyección de tinta) fuera de este piloto — no
    // se modela un rango, solo se deja constancia del modo elegido.
    public string ModoGeneracionUid { get; set; } = "Automatico";

    // Rango de UIDs (RN-GT01) — códigos de identificación única impresos por láser/inyección
    // de tinta en fábrica sobre cada botella. Opcional: el mockup no lo exige para radicar.
    public string? PrefijoUid { get; set; }
    public int? CantidadUids { get; set; }
    public int? UidInicial { get; set; }
    public int? UidFinal { get; set; }

    public ICollection<PuntoControlGoTrace> PuntosControl { get; set; } = new List<PuntoControlGoTrace>();
}
