namespace SGDS.Domain.Entities;

public class EstampillaFisica
{
    public int Id { get; set; }
    public int SolicitudId { get; set; }
    public Solicitud Solicitud { get; set; } = null!;

    // Tornaguía de Infoconsumo con pago confirmado — Infoconsumo origina el trámite y liquida
    // el impuesto al consumo; una vez pagado, dispara la expedición física en SYCTrace, que
    // hereda del producto ya declarado allí (categoría, grado, empresa) en vez de volver a
    // capturarlo. Ver Reglas_de_negocio_SYCTrace.md RN-03 (Tornaguía de Movilización).
    public int SolicitudInfoconsumoId { get; set; }
    public Solicitud SolicitudInfoconsumo { get; set; } = null!;

    // Producto (RN-01, sección 3 — datos obligatorios para el QR/código de barras). Categoría y
    // subcategoría usan el mismo catálogo de 3 categorías de ley que GoTrace/Infoconsumo (ver
    // syctraceConfig.ts) — puente de herencia sin traducción desde la tornaguía de Infoconsumo.
    public string CategoriaProducto { get; set; } = string.Empty;
    public string SubcategoriaProducto { get; set; } = string.Empty;
    public string NombreProducto { get; set; } = string.Empty;
    public string? Marca { get; set; }
    public decimal? GradoAlcoholimetrico { get; set; }
    public int? ContenidoNetoCc { get; set; }
    public int? UnidadesPorCajetilla { get; set; }
    public decimal? PesoGramos { get; set; }
    public string RegistroInvima { get; set; } = string.Empty;
    public string LoteProduccion { get; set; } = string.Empty;

    // Origen (RN-03)
    public string OrigenProducto { get; set; } = "Nacional";
    public string? NumeroTornaguia { get; set; }
    public string? NumeroDeclaracionImportacion { get; set; }
    public string? RegistroIntroduccion { get; set; }

    // Rango de expedición física
    public string Prefijo { get; set; } = string.Empty;
    public int CantidadEstampillas { get; set; }
    public int CodigoInicial { get; set; }
    public int CodigoFinal { get; set; }

    public DateTime? FechaPago { get; set; }
    public DateTime? FechaEntrega { get; set; }
    public string? MotivoAnulacion { get; set; }
}
