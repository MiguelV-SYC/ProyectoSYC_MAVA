namespace SGDS.Application.DTOs;

public class CrearSolicitudSycTraceDto
{
    public int ProyectoId { get; set; }
    public int TipoSolicitudId { get; set; }
    public int SolicitudInfoconsumoId { get; set; }

    // Categoría/subcategoría/nombre comercial/marca/ficha técnica del producto — llegan
    // heredados de la tornaguía cuando fue posible (ver TornaguiaInfoconsumoDisponibleDto), o
    // diligenciados a mano cuando la tornaguía es de antes de la unificación de catálogo. NO
    // incluye RegistroInvima/Prefijo/CantidadEstampillas/CodigoInicial: esos códigos se generan
    // siempre en el servidor (RSI y código de estampilla, Reglas_de_negocio_SYCTrace.md, sección
    // "LOGICA PARA CREACIÓN DE CODIGO AUTOMÁTICO...") y nunca se aceptan del cliente.
    public string CategoriaProducto { get; set; } = string.Empty;
    public string SubcategoriaProducto { get; set; } = string.Empty;
    public string NombreProducto { get; set; } = string.Empty;
    public string? Marca { get; set; }
    public decimal? GradoAlcoholimetrico { get; set; }
    public int? ContenidoNetoCc { get; set; }
    public int? UnidadesPorCajetilla { get; set; }
    public decimal? PesoGramos { get; set; }
    public string LoteProduccion { get; set; } = string.Empty;

    public string OrigenProducto { get; set; } = "Nacional";
    public string? NumeroTornaguia { get; set; }
    public string? NumeroDeclaracionImportacion { get; set; }
    public string? RegistroIntroduccion { get; set; }
}

public class ActualizarSolicitudSycTraceDto
{
    // Prefijo/CantidadEstampillas/CodigoInicial/CodigoFinal/RegistroInvima quedan fijos desde
    // la creación (identificadores oficiales ya generados) — no se reasignan en edición.
    public string CategoriaProducto { get; set; } = string.Empty;
    public string SubcategoriaProducto { get; set; } = string.Empty;
    public string NombreProducto { get; set; } = string.Empty;
    public string? Marca { get; set; }
    public decimal? GradoAlcoholimetrico { get; set; }
    public int? ContenidoNetoCc { get; set; }
    public int? UnidadesPorCajetilla { get; set; }
    public decimal? PesoGramos { get; set; }
    public string LoteProduccion { get; set; } = string.Empty;

    public string OrigenProducto { get; set; } = "Nacional";
    public string? NumeroTornaguia { get; set; }
    public string? NumeroDeclaracionImportacion { get; set; }
    public string? RegistroIntroduccion { get; set; }
}

public class AnularEstampillaDto
{
    public string Motivo { get; set; } = string.Empty;
}

// Candidato del paso 2 del formulario SYCTrace: una tornaguía de Infoconsumo con pago ya
// confirmado. Trae precargados los datos de producto que Infoconsumo ya capturó, para que
// el operador de SYCTrace no los vuelva a digitar (RN-03, puente Infoconsumo -> SYCTrace).
public class TornaguiaInfoconsumoDisponibleDto
{
    public int Id { get; set; }
    public string Numero { get; set; } = string.Empty;
    public int EmpresaId { get; set; }
    public string EmpresaNombre { get; set; } = string.Empty;
    public string EmpresaNit { get; set; } = string.Empty;
    public DateTime FechaCreacion { get; set; }

    public string CategoriaProducto { get; set; } = string.Empty;
    public string SubcategoriaProducto { get; set; } = string.Empty;
    public decimal? GradoAlcoholimetrico { get; set; }
    public int? ContenidoNetoCc { get; set; }
    public decimal? PesoGramos { get; set; }
    public string? OrigenProducto { get; set; }
    public string? NumeroLote { get; set; }
    // Unidades físicas de la tornaguía — determina "Cantidad a expedir" (una estampilla por
    // unidad física del lote, se hereda tal cual, no se digita a mano).
    public int UnidadesFisicas { get; set; }
    // Nombre comercial del producto — solo disponible cuando la tornaguía a su vez heredó un
    // lote de GoTrace (snapshot en LoteGoTrace.Producto); Infoconsumo por sí solo no captura un
    // nombre de producto en texto libre, solo categoría/subcategoría.
    public string? NombreProducto { get; set; }

    // Trazabilidad GoTrace (Paso 3, "cruce de datos" del documento) — solo informativo,
    // presente cuando la tornaguía de Infoconsumo a su vez heredó un lote de GoTrace.
    public string? LoteGoTraceNumero { get; set; }
    public string? RangoUidGoTrace { get; set; }
}

// Vista previa (no reserva ni persiste nada) del RSI y del código de estampilla que generaría
// el servidor AHORA MISMO para esta categoría/origen — se muestra en el paso 3 apenas se conoce
// la categoría, para que el operador vea un campo "no editable" ya lleno antes de radicar. El
// valor real y definitivo se recalcula de forma independiente al crear la solicitud (ver
// SycTraceController.GenerarRegistroInvimaAsync / SiguienteSecuencialAsync).
public class VistaPreviaCodigosDto
{
    public string RegistroInvima { get; set; } = string.Empty;
    public string Prefijo { get; set; } = string.Empty;
    public int CodigoInicial { get; set; }
}

public class EstampillaResponseDto
{
    public int SolicitudId { get; set; }
    public string Numero { get; set; } = string.Empty;
    public string Estado { get; set; } = string.Empty;

    public int EmpresaId { get; set; }
    public string EmpresaRazonSocial { get; set; } = string.Empty;
    public string EmpresaNit { get; set; } = string.Empty;

    public int SolicitudInfoconsumoId { get; set; }
    public string SolicitudInfoconsumoNumero { get; set; } = string.Empty;

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

    public string OrigenProducto { get; set; } = string.Empty;
    public string? NumeroTornaguia { get; set; }
    public string? NumeroDeclaracionImportacion { get; set; }
    public string? RegistroIntroduccion { get; set; }

    public string Prefijo { get; set; } = string.Empty;
    public int CantidadEstampillas { get; set; }
    public int CodigoInicial { get; set; }
    public int CodigoFinal { get; set; }
    public string CodigoCompleto { get; set; } = string.Empty;

    public DateTime FechaCreacion { get; set; }
    public DateTime? FechaPago { get; set; }
    public DateTime? FechaEntrega { get; set; }
    public string? MotivoAnulacion { get; set; }

    // Trazabilidad GoTrace, heredada transitivamente vía la tornaguía de Infoconsumo.
    public string? LoteGoTraceNumero { get; set; }
    public string? RangoUidGoTrace { get; set; }
    public int? CantidadUidsGoTrace { get; set; }
    public string? AlertaDesajusteUid { get; set; }
}
