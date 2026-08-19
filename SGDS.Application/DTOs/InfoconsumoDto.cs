namespace SGDS.Application.DTOs;

public class CrearSolicitudInfoconsumoDto
{
    public int ProyectoId { get; set; }
    public int TipoSolicitudId { get; set; }
    public int EmpresaId { get; set; }

    public string CategoriaProducto { get; set; } = string.Empty;
    public decimal? GradosAlcoholimetricos { get; set; }
    public int UnidadesFisicas { get; set; }
    public decimal PvpCertificado { get; set; }

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
}

public class ActualizarSolicitudInfoconsumoDto
{
    public int? TipoSolicitudId { get; set; }
    public string CategoriaProducto { get; set; } = string.Empty;
    public decimal? GradosAlcoholimetricos { get; set; }
    public int UnidadesFisicas { get; set; }
    public decimal PvpCertificado { get; set; }
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

    public string CategoriaProducto { get; set; } = string.Empty;
    public decimal? GradosAlcoholimetricos { get; set; }
    public int UnidadesFisicas { get; set; }
    public decimal VolumenTotalCc { get; set; }
    public decimal PvpCertificado { get; set; }

    public string DepartamentoOrigen { get; set; } = string.Empty;
    public string MunicipioOrigen { get; set; } = string.Empty;
    public string DepartamentoDestino { get; set; } = string.Empty;
    public string MunicipioDestino { get; set; } = string.Empty;
    public double? DistanciaAproximadaKm { get; set; }
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
}

public class LiquidacionImpoConsumoResponseDto
{
    public int SolicitudId { get; set; }
    public string Numero { get; set; } = string.Empty;
    public string TipoTramite { get; set; } = string.Empty;
    public string ContribuyenteNombre { get; set; } = string.Empty;
    public string ContribuyenteNit { get; set; } = string.Empty;

    public string CategoriaProducto { get; set; } = string.Empty;
    public int UnidadesFisicas { get; set; }
    public decimal? GradosAlcoholimetricos { get; set; }
    public decimal VolumenTotalCc { get; set; }
    public decimal PvpCertificado { get; set; }
    public string DepartamentoDestino { get; set; } = string.Empty;

    public bool Soportado { get; set; }
    public string? MotivoNoSoportado { get; set; }
    public decimal TarifaEspecifica { get; set; }
    public decimal TarifaAdValorem { get; set; }
    public decimal ComponenteEspecifico { get; set; }
    public decimal ComponenteAdValorem { get; set; }
    public decimal IclInformativo { get; set; }
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
