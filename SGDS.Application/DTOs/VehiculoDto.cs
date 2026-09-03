namespace SGDS.Application.DTOs;

public class VehiculoResponseDto
{
    public int Id { get; set; }
    public int? CiudadanoId { get; set; }
    public string? CiudadanoNombre { get; set; }
    public string? CiudadanoDocumento { get; set; }
    public int? EmpresaId { get; set; }
    public string? EmpresaNombre { get; set; }
    public string? EmpresaNit { get; set; }
    public string Placa { get; set; } = string.Empty;
    public string? Marca { get; set; }
    public string? Linea { get; set; }
    public int? Modelo { get; set; }
    public string? NumeroChasis { get; set; }

    // Características IUVA — atributos fijos del vehículo (Reglas_de_negocio_IUVA.md).
    public string? Cilindraje { get; set; }
    public string? TipoVehiculo { get; set; }
    public string? Subtipo { get; set; }
    public string? MunicipioMatricula { get; set; }
    public string? DepartamentoMatricula { get; set; }
    public bool Blindado { get; set; }
    public bool EsClasicoAntiguo { get; set; }
}

public class CrearVehiculoDto
{
    public int? CiudadanoId { get; set; }
    public int? EmpresaId { get; set; }
    public string? Placa { get; set; }
    public string? Marca { get; set; }
    public string? Linea { get; set; }
    public int? Modelo { get; set; }
    public string? NumeroChasis { get; set; }

    public string? Cilindraje { get; set; }
    public string? TipoVehiculo { get; set; }
    public string? Subtipo { get; set; }
    public string? MunicipioMatricula { get; set; }
    public string? DepartamentoMatricula { get; set; }
    public bool Blindado { get; set; }
    public bool EsClasicoAntiguo { get; set; }
}

// Catálogo Tipo/Subtipo alimentado en vivo desde bases_gravables_vehiculos (no hardcodeado en el
// frontend) — evita el mismo desajuste de catálogo ya corregido hoy en GoTrace/Infoconsumo/SycTrace.
// SubtipoInformativo=true para Tipos donde la tabla oficial NO distingue subtipo (la columna
// "Clase" trae un único valor uniforme) — en ese caso Subtipos son las categorías descriptivas
// del documento de reglas de negocio (Sedán/Hatchback, SUV, etc.), NO un filtro real de la tabla:
// no se envían a /catalogo-marcas ni /catalogo-lineas, que solo filtran por Tipo en ese caso.
public class TipoVehiculoCatalogoDto
{
    public string Tipo { get; set; } = string.Empty;
    public List<string> Subtipos { get; set; } = new();
    public bool SubtipoInformativo { get; set; }
}

// Marca disponible dentro de un Tipo/Subtipo — catálogo en vivo para el select de "Línea".
public class MarcaVehiculoCatalogoDto
{
    public string Marca { get; set; } = string.Empty;
}

// Línea disponible para Tipo/Subtipo/Marca, con los cilindrajes reales que trae la tabla para
// ese nombre comercial exacto — casi siempre uno solo (se autocompleta), pero algunas líneas
// (ej. "CLIO (LINEA BASE ESTANDAR)") existen con varias motorizaciones distintas en la fuente.
public class LineaVehiculoCatalogoDto
{
    public string Linea { get; set; } = string.Empty;
    public List<string> Cilindrajes { get; set; } = new();
}

// Resultado del cálculo de base gravable (Ley 488/1998 Art. 143) para el paso "4. Base gravable"
// de una solicitud IUVA.
public class BaseGravableVehiculoDto
{
    public bool Soportado { get; set; }
    public string? MotivoNoSoportado { get; set; }
    public decimal? ValorTabla { get; set; }
    public decimal? ValorAjustado { get; set; }
    public bool AplicaBlindaje { get; set; }
    public bool AplicaClasicoAntiguo { get; set; }
    public bool EsValorCompra { get; set; }
}