namespace SGDS.Application.DTOs;

public class CrearSolicitudPasivosLaboralesDto
{
    public int ProyectoId { get; set; }
    public int TipoSolicitudId { get; set; }
    public int EmpresaId { get; set; }

    public string? Instrumento { get; set; }
    public string? ServidorNombre { get; set; }
    public string? ServidorDocumento { get; set; }
    public string? RegimenPensional { get; set; }
    public int? TiempoLaboradoMeses { get; set; }
    public int? TiempoTotalAportesMeses { get; set; }
    public decimal? ValorMesadaPensional { get; set; }
    public string? Observaciones { get; set; }

    // Puente Colpensiones -> Pasivos Laborales (opcional).
    public int? SolicitudColpensionesId { get; set; }
}

public class ActualizarSolicitudPasivosLaboralesDto
{
    public string? Instrumento { get; set; }
    public string? ServidorNombre { get; set; }
    public string? ServidorDocumento { get; set; }
    public string? RegimenPensional { get; set; }
    public int? TiempoLaboradoMeses { get; set; }
    public int? TiempoTotalAportesMeses { get; set; }
    public decimal? ValorMesadaPensional { get; set; }
    public string? Observaciones { get; set; }
}

public class InstrumentoPasivoResponseDto
{
    public int SolicitudId { get; set; }
    public string Numero { get; set; } = string.Empty;
    public string Estado { get; set; } = string.Empty;
    public string TipoSolicitudNombre { get; set; } = string.Empty;

    public int EmpresaId { get; set; }
    public string EmpresaRazonSocial { get; set; } = string.Empty;
    public string EmpresaNit { get; set; } = string.Empty;

    public string? Instrumento { get; set; }
    public string? ServidorNombre { get; set; }
    public string? ServidorDocumento { get; set; }
    public string? RegimenPensional { get; set; }
    public int? TiempoLaboradoMeses { get; set; }
    public int? TiempoTotalAportesMeses { get; set; }
    public decimal? ValorMesadaPensional { get; set; }
    public string? Observaciones { get; set; }

    public int? SolicitudColpensionesId { get; set; }
    public string? SolicitudColpensionesNumero { get; set; }
    public string? SolicitudColpensionesCiudadanoNombre { get; set; }

    public DateTime FechaCreacion { get; set; }
}

// Candidato del puente Colpensiones -> Pasivos Laborales: una solicitud de pensión (vejez o
// invalidez) ya radicada en Colpensiones, para heredar los datos del servidor/pensionado.
public class SolicitudColpensionesDisponibleDto
{
    public int Id { get; set; }
    public string Numero { get; set; } = string.Empty;
    public string TipoSolicitudNombre { get; set; } = string.Empty;
    public string Estado { get; set; } = string.Empty;
    public string? CiudadanoNombre { get; set; }
    public string? CiudadanoDocumento { get; set; }
    public DateTime FechaCreacion { get; set; }
}

public class LiquidacionCuotaParteResponseDto
{
    public int SolicitudId { get; set; }
    public string Numero { get; set; } = string.Empty;
    public string Referencia { get; set; } = string.Empty;
    public string Instrumento { get; set; } = string.Empty;

    public string EmpresaRazonSocial { get; set; } = string.Empty;
    public string EmpresaNit { get; set; } = string.Empty;

    public string? ServidorNombre { get; set; }
    public string? ServidorDocumento { get; set; }
    public string? RegimenPensional { get; set; }

    public bool Soportado { get; set; }
    public string? MotivoNoSoportado { get; set; }

    public int? TiempoLaboradoMeses { get; set; }
    public int? TiempoTotalAportesMeses { get; set; }
    public decimal? ValorMesadaPensional { get; set; }
    public decimal? PorcentajeConcurrencia { get; set; }
    public decimal? ValorMensualACargo { get; set; }

    public string? OperadorNombre { get; set; }
    public DateTime FechaGeneracion { get; set; }
}
