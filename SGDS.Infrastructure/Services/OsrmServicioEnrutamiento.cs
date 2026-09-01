using System.Globalization;
using System.Text.Json;
using SGDS.Application.Interfaces;

namespace SGDS.Infrastructure.Services;

// Mismo servidor demo público que ya usa el mapa del frontend (MapaRuta.tsx) — solo enruta
// por vías terrestres, sin API key. Es un servicio de demostración de OSRM, no un servicio
// productivo: sin SLA y con límites de uso no publicados, por eso el timeout corto y el
// resultado nullable (el caller siempre debe tener un plan de respaldo).
public class OsrmServicioEnrutamiento : IServicioEnrutamiento
{
    private const string OsrmDemoUrl = "https://router.project-osrm.org/route/v1/driving";
    private static readonly TimeSpan Timeout = TimeSpan.FromSeconds(6);

    private readonly IHttpClientFactory _httpClientFactory;

    public OsrmServicioEnrutamiento(IHttpClientFactory httpClientFactory)
    {
        _httpClientFactory = httpClientFactory;
    }

    public async Task<double?> ObtenerDistanciaCarreteraKmAsync(double latOrigen, double lngOrigen, double latDestino, double lngDestino, CancellationToken ct = default)
    {
        try
        {
            using var cts = CancellationTokenSource.CreateLinkedTokenSource(ct);
            cts.CancelAfter(Timeout);

            var url = string.Create(CultureInfo.InvariantCulture,
                $"{OsrmDemoUrl}/{lngOrigen},{latOrigen};{lngDestino},{latDestino}?overview=false");

            // El servidor demo de OSRM devuelve 403 si el request no trae User-Agent —
            // HttpClient no envía uno por defecto (a diferencia de un navegador).
            using var request = new HttpRequestMessage(HttpMethod.Get, url);
            request.Headers.UserAgent.ParseAdd("SGDS/1.0");

            var cliente = _httpClientFactory.CreateClient();
            var respuesta = await cliente.SendAsync(request, cts.Token);
            if (!respuesta.IsSuccessStatusCode) return null;

            using var stream = await respuesta.Content.ReadAsStreamAsync(cts.Token);
            using var json = await JsonDocument.ParseAsync(stream, cancellationToken: cts.Token);

            if (!json.RootElement.TryGetProperty("routes", out var rutas) || rutas.GetArrayLength() == 0)
                return null;

            var distanciaMetros = rutas[0].GetProperty("distance").GetDouble();
            return distanciaMetros / 1000.0;
        }
        catch
        {
            // Timeout, sin red, respuesta inesperada — cualquier falla cae a null, nunca propaga
            // la excepción (el caller usa Haversine como respaldo).
            return null;
        }
    }
}
