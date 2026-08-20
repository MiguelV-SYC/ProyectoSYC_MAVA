namespace SGDS.Domain.Entities;

// Punto de la cadena de custodia (RN-GT03) — Fábrica, Bodega, Distribuidor, Punto de venta.
// Se crea una fila por cada uno de los 4 puntos al radicar la solicitud; Habilitado refleja
// si la empresa lo marcó como parte de su cadena logística, Confirmado si ya se registró el
// paso del lote por ese punto (confirmación manual del operador en este piloto — en
// producción real vendría de un escaneo de caja/pallet en el punto físico).
public class PuntoControlGoTrace
{
    public int Id { get; set; }
    public int LoteGoTraceId { get; set; }
    public LoteGoTrace LoteGoTrace { get; set; } = null!;

    public string Nombre { get; set; } = string.Empty;
    public int Orden { get; set; }
    public bool Habilitado { get; set; }
    public bool Confirmado { get; set; }
    public DateTime? FechaConfirmacion { get; set; }
}
