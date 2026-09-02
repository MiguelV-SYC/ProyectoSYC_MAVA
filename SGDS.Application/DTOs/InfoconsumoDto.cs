namespace SGDS.Application.DTOs;

public class CrearSolicitudInfoconsumoDto
{
    public int ProyectoId { get; set; }
    public int TipoSolicitudId { get; set; }
    public int EmpresaId { get; set; }

    public string TipoTransporte { get; set; } = "Terrestre";
    public string CategoriaProducto { get; set; } = string.Empty;
    public string SubcategoriaProducto { get; set; } = string.Empty;
    public string? OrigenProducto { get; set; }
    public string? NumeroLote { get; set; }
    public decimal? GradosAlcoholimetricos { get; set; }
    public int UnidadesFisicas { get; set; }
    public decimal PvpCertificado { get; set; }
    public decimal? PesoGramos { get; set; }
    public decimal? ValorAduana { get; set; }
    public decimal? GravamenesArancelarios { get; set; }

    public string DepartamentoOrigen { get; set; } = string.Empty;
    public string MunicipioOrigen { get; set; } = string.Empty;
    public string DepartamentoDestino { get; set; } = string.Empty;
    public string MunicipioDestino { get; set; } = string.Empty;

    // Dirección exacta opcional (búsqueda en vivo vía Nominatim) — cuando se envían, tienen
    // prioridad sobre el centroide del municipio para el mapa y el cálculo de distancia.
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

    // Puente GoTrace -> Infoconsumo (opcional): lote de trazabilidad ya Aprobado en GoTrace
    // del que se heredan empresa y unidades físicas.
    public int? LoteGoTraceSolicitudId { get; set; }
}

public class ActualizarSolicitudInfoconsumoDto
{
    public int? TipoSolicitudId { get; set; }
    public string TipoTransporte { get; set; } = "Terrestre";
    public string CategoriaProducto { get; set; } = string.Empty;
    public string SubcategoriaProducto { get; set; } = string.Empty;
    public string? OrigenProducto { get; set; }
    public string? NumeroLote { get; set; }
    public decimal? GradosAlcoholimetricos { get; set; }
    public int UnidadesFisicas { get; set; }
    public decimal PvpCertificado { get; set; }
    public decimal? PesoGramos { get; set; }
    public decimal? ValorAduana { get; set; }
    public decimal? GravamenesArancelarios { get; set; }
    public string DepartamentoOrigen { get; set; } = string.Empty;
    public string MunicipioOrigen { get; set; } = string.Empty;
    public string DepartamentoDestino { get; set; } = string.Empty;
    public string MunicipioDestino { get; set; } = string.Empty;

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
}

public class TornaguiaResponseDto
{
    public int SolicitudId { get; set; }
    public string Numero { get; set; } = string.Empty;
    public string TipoTramite { get; set; } = string.Empty;
    public string Estado { get; set; } = string.Empty;

    public int EmpresaId { get; set; }
    public string EmpresaRazonSocial { get; set; } = string.Empty;
    public string EmpresaNit { get; set; } = string.Empty;

    public string TipoTransporte { get; set; } = "Terrestre";
    public string CategoriaProducto { get; set; } = string.Empty;
    public string SubcategoriaProducto { get; set; } = string.Empty;
    public string? OrigenProducto { get; set; }
    public string? NumeroLote { get; set; }
    public decimal? GradosAlcoholimetricos { get; set; }
    public int UnidadesFisicas { get; set; }
    public decimal VolumenTotalCc { get; set; }
    public decimal PvpCertificado { get; set; }
    public decimal? PesoGramos { get; set; }
    public decimal? ValorAduana { get; set; }
    public decimal? GravamenesArancelarios { get; set; }

    // true cuando la solicitud está vinculada a un lote de GoTrace — el frontend usa esta
    // bandera para bloquear la edición manual de los campos de producto (solo PVP queda libre).
    public bool DatosDesdeGoTrace { get; set; }

    public string DepartamentoOrigen { get; set; } = string.Empty;
    public string MunicipioOrigen { get; set; } = string.Empty;
    public string DepartamentoDestino { get; set; } = string.Empty;
    public string MunicipioDestino { get; set; } = string.Empty;
    public string? DireccionEspecificaOrigen { get; set; }
    public string? DireccionEspecificaDestino { get; set; }
    public double? DistanciaAproximadaKm { get; set; }
    // true = distancia real por carretera (OSRM); false = línea recta entre capitales
    // (Haversine, respaldo cuando OSRM no responde).
    public bool DistanciaEsPorCarretera { get; set; }
    public double? LatOrigen { get; set; }
    public double? LngOrigen { get; set; }
    public double? LatDestino { get; set; }
    public double? LngDestino { get; set; }

    public string EmpresaTransportadora { get; set; } = string.Empty;
    public string? NitTransportador { get; set; }
    public string PlacaVehiculo { get; set; } = string.Empty;
    public string? Conductor { get; set; }
    public string? CedulaConductor { get; set; }
    public string? TipoVehiculo { get; set; }
    public string? Observaciones { get; set; }

    public DateTime FechaCreacion { get; set; }
    public DateTime? FechaExpedicion { get; set; }
    public DateTime? FechaVigenciaLimite { get; set; }
    public DateTime? FechaLegalizacion { get; set; }
    public bool PagoConfirmado { get; set; }
    public DateTime? FechaPagoConfirmado { get; set; }

    public int? LoteGoTraceSolicitudId { get; set; }
    public string? LoteGoTraceNumero { get; set; }
    public string? LoteGoTraceProducto { get; set; }
    public string? LoteGoTraceRangoUid { get; set; }
}

// Candidato del puente GoTrace -> Infoconsumo: un lote de trazabilidad ya Aprobado en
// GoTrace, para heredar empresa, unidades físicas y ficha completa del producto al radicar
// una tornaguía (Reglas_de_negocio_infoconsumo_v.2.md, regla "si la solicitud viene de
// GoTrace... debe autocompletar todos los datos disponibles"). Categoria/Subcategoria/
// GradosAlcoholimetricos/Origen vienen del catálogo Producto de GoTrace cuando el lote está
// vinculado a una fila de ese catálogo (LoteGoTrace.ProductoCatalogoId) — si no lo está (lotes
// antiguos con producto en texto libre), quedan null y el usuario los completa a mano.
public class LoteGoTraceDisponibleDto
{
    public int Id { get; set; }
    public string Numero { get; set; } = string.Empty;
    public int EmpresaId { get; set; }
    public string EmpresaNombre { get; set; } = string.Empty;
    public string EmpresaNit { get; set; } = string.Empty;
    public string Producto { get; set; } = string.Empty;
    public string? CategoriaProducto { get; set; }
    public string? SubcategoriaProducto { get; set; }
    public decimal? GradosAlcoholimetricos { get; set; }
    public string? OrigenProducto { get; set; }
    public string NumeroLote { get; set; } = string.Empty;
    public int UnidadesLote { get; set; }
    public string? RangoUidCompleto { get; set; }
}

public class LiquidacionImpoConsumoResponseDto
{
    public int SolicitudId { get; set; }
    public string Numero { get; set; } = string.Empty;
    public string TipoTramite { get; set; } = string.Empty;
    public string ContribuyenteNombre { get; set; } = string.Empty;
    public string ContribuyenteNit { get; set; } = string.Empty;

    public string CategoriaProducto { get; set; } = string.Empty;
    public string SubcategoriaProducto { get; set; } = string.Empty;
    public string? OrigenProducto { get; set; }
    public int UnidadesFisicas { get; set; }
    public decimal? GradosAlcoholimetricos { get; set; }
    public decimal VolumenTotalCc { get; set; }
    public decimal PvpCertificado { get; set; }
    public decimal? PesoGramos { get; set; }
    public string DepartamentoDestino { get; set; } = string.Empty;

    public bool Soportado { get; set; }
    public string? MotivoNoSoportado { get; set; }
    public decimal TarifaEspecifica { get; set; }
    public decimal TarifaAdValorem { get; set; }
    public decimal ComponenteEspecifico { get; set; }
    public decimal ComponenteAdValorem { get; set; }
    public decimal ImpuestoInformativo { get; set; }
    public decimal TotalAPagar { get; set; }
    public bool AplicaExcepcionSanAndres { get; set; }
    public bool EsSoloInformativo { get; set; }
}

public class SolicitudHistorialEmpresaDto
{
    public int Id { get; set; }
    public string Numero { get; set; } = string.Empty;
    public string? TipoSolicitudNombre { get; set; }
    public string Estado { get; set; } = string.Empty;
    public DateTime FechaCreacion { get; set; }
}

public class TarjetaKanbanInfoconsumoDto
{
    public int Id { get; set; }
    public string Numero { get; set; } = string.Empty;
    public string? TipoTramite { get; set; }
    public string? EmpresaNombre { get; set; }
    public string Estado { get; set; } = string.Empty;
    public DateTime FechaCreacion { get; set; }
    public DateTime? FechaVigenciaLimite { get; set; }
}
