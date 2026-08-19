namespace SGDS.Application.DTOs;

public class EstampillaItemResponseDto
{
    public string Nombre { get; set; } = string.Empty;
    public bool Aplica { get; set; }
    public decimal Tarifa { get; set; }
    public decimal BaseGravable { get; set; }
    public decimal Valor { get; set; }
    public string? Motivo { get; set; }
    public Dictionary<string, decimal>? Distribucion { get; set; }
}

public class LiquidacionEstampillasResponseDto
{
    public string Numero { get; set; } = string.Empty;
    public string ContribuyenteNombre { get; set; } = string.Empty;
    public string ContribuyenteDocumento { get; set; } = string.Empty;
    public string? HechoGenerador { get; set; }
    public string? ObjetoContrato { get; set; }
    public string? FechaSuscripcion { get; set; }
    public decimal ValorContrato { get; set; }
    public decimal BaseGravable { get; set; }
    public List<EstampillaItemResponseDto> Items { get; set; } = new();
    public decimal Total { get; set; }
}

public class ActualizarSolicitudDto
{
    public int? TipoSolicitudId { get; set; }
    public string? DatosAdicionales { get; set; }
}
