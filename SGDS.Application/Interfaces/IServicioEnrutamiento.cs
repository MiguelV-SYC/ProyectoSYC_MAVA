namespace SGDS.Application.Interfaces;

// Distancia real por carretera entre dos coordenadas (no línea recta). Implementación actual
// usa el servidor demo público de OSRM — ver OsrmServicioEnrutamiento en SGDS.Infrastructure.
// Devuelve null si el servicio no responde a tiempo o falla, para que el caller pueda caer a
// un cálculo de respaldo (línea recta) en vez de romper el flujo.
public interface IServicioEnrutamiento
{
    Task<double?> ObtenerDistanciaCarreteraKmAsync(double latOrigen, double lngOrigen, double latDestino, double lngDestino, CancellationToken ct = default);
}
