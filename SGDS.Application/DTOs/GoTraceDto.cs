namespace SGDS.Application.DTOs;

public class CrearSolicitudGoTraceDto
{
    public int ProyectoId { get; set; }
    public int TipoSolicitudId { get; set; }
    public int EmpresaId { get; set; }

    // El producto se elige del catálogo de la empresa (Empresa.Productos) — ya no es texto
    // libre. NumeroLote no viaja en el DTO: se compone server-side (GT+Producto+fecha+
    // consecutivo, ver GoTraceController.GenerarNumeroLote).
    public int ProductoId { get; set; }
    public DateTime FechaProduccion { get; set; }
    public int UnidadesLote { get; set; }

    // Automatico | Archivo — ver LoteGoTrace.ModoGeneracionUid.
    public string ModoGeneracionUid { get; set; } = "Automatico";

    public List<string> PuntosControlHabilitados { get; set; } = new();
}

public class ActualizarSolicitudGoTraceDto
{
    public int ProductoId { get; set; }
    public DateTime FechaProduccion { get; set; }
    public int UnidadesLote { get; set; }
    public string ModoGeneracionUid { get; set; } = "Automatico";

    public List<string> PuntosControlHabilitados { get; set; } = new();
}

public class PuntoControlResponseDto
{
    public int Id { get; set; }
    public string Nombre { get; set; } = string.Empty;
    public int Orden { get; set; }
    public bool Habilitado { get; set; }
    public bool Confirmado { get; set; }
    public DateTime? FechaConfirmacion { get; set; }
}

public class CertificadoTrazabilidadResponseDto
{
    public int SolicitudId { get; set; }
    public string Numero { get; set; } = string.Empty;
    public string Estado { get; set; } = string.Empty;

    public int EmpresaId { get; set; }
    public string EmpresaRazonSocial { get; set; } = string.Empty;
    public string EmpresaNit { get; set; } = string.Empty;

    public string Producto { get; set; } = string.Empty;
    public int? ProductoCatalogoId { get; set; }
    public string NumeroLote { get; set; } = string.Empty;
    public DateTime FechaProduccion { get; set; }
    public int UnidadesLote { get; set; }

    public string ModoGeneracionUid { get; set; } = "Automatico";
    public string? PrefijoUid { get; set; }
    public int? CantidadUids { get; set; }
    public int? UidInicial { get; set; }
    public int? UidFinal { get; set; }
    public string? RangoUidCompleto { get; set; }

    public List<PuntoControlResponseDto> PuntosControl { get; set; } = new();
    public int TotalPuntosHabilitados { get; set; }
    public int TotalPuntosConfirmados { get; set; }
    public DateTime? UltimaActualizacion { get; set; }

    public DateTime FechaCreacion { get; set; }
}

// Vista previa del consecutivo antes de radicar (Reglas_de_negocio_GoTrace.md, "Nueva
// Solicitud" -> "Número de Lote": GT + Producto + fecha + consecutivo).
public class SiguienteNumeroLoteResponseDto
{
    public string NumeroLote { get; set; } = string.Empty;
}
