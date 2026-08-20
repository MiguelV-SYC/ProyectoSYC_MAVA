namespace SGDS.Application.DTOs;

public class CrearSolicitudSycTraceDto
{
    public int ProyectoId { get; set; }
    public int TipoSolicitudId { get; set; }
    public int SolicitudInfoconsumoId { get; set; }

    public string CategoriaProducto { get; set; } = string.Empty;
    public string NombreProducto { get; set; } = string.Empty;
    public string? Marca { get; set; }
    public decimal? GradoAlcoholimetrico { get; set; }
    public int? ContenidoNetoCc { get; set; }
    public int? UnidadesPorCajetilla { get; set; }
    public string RegistroInvima { get; set; } = string.Empty;
    public string LoteProduccion { get; set; } = string.Empty;

    public string OrigenProducto { get; set; } = "Nacional";
    public string? NumeroTornaguia { get; set; }
    public string? NumeroDeclaracionImportacion { get; set; }
    public string? RegistroIntroduccion { get; set; }

    public string Prefijo { get; set; } = string.Empty;
    public int CantidadEstampillas { get; set; }
    public int CodigoInicial { get; set; }
}

public class ActualizarSolicitudSycTraceDto
{
    public string CategoriaProducto { get; set; } = string.Empty;
    public string NombreProducto { get; set; } = string.Empty;
    public string? Marca { get; set; }
    public decimal? GradoAlcoholimetrico { get; set; }
    public int? ContenidoNetoCc { get; set; }
    public int? UnidadesPorCajetilla { get; set; }
    public string RegistroInvima { get; set; } = string.Empty;
    public string LoteProduccion { get; set; } = string.Empty;

    public string OrigenProducto { get; set; } = "Nacional";
    public string? NumeroTornaguia { get; set; }
    public string? NumeroDeclaracionImportacion { get; set; }
    public string? RegistroIntroduccion { get; set; }

    public string Prefijo { get; set; } = string.Empty;
    public int CantidadEstampillas { get; set; }
    public int CodigoInicial { get; set; }
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
    public decimal? GradoAlcoholimetrico { get; set; }
    public int? ContenidoNetoCc { get; set; }
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
    public string NombreProducto { get; set; } = string.Empty;
    public string? Marca { get; set; }
    public decimal? GradoAlcoholimetrico { get; set; }
    public int? ContenidoNetoCc { get; set; }
    public int? UnidadesPorCajetilla { get; set; }
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
}
