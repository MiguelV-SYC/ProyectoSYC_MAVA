using System.Text.Json;
using SGDS.Application.Interfaces;

namespace SGDS.Infrastructure.Services;

// Geocodificación de direcciones libres vía Nominatim (OpenStreetMap), servidor público
// demo — igual que OsrmServicioEnrutamiento, sin API key ni SLA. Requiere User-Agent
// identificable (si no, responde 403 — mismo hallazgo que con el servidor de OSRM) y su
// política de uso limita a 1 solicitud/segundo: como el servicio es Singleton, se serializa
// aquí con un semáforo compartido por todo el proceso para no violarla aunque varios
// usuarios busquen direcciones al mismo tiempo.
public class NominatimServicioGeocodificacion : IServicioGeocodificacion
{
    private const string NominatimUrl = "https://nominatim.openstreetmap.org/search";
    private static readonly TimeSpan Timeout = TimeSpan.FromSeconds(6);
    private static readonly TimeSpan IntervaloMinimo = TimeSpan.FromMilliseconds(1100);
    private static readonly SemaphoreSlim Semaforo = new(1, 1);
    private static DateTime _ultimaLlamadaUtc = DateTime.MinValue;

    private readonly IHttpClientFactory _httpClientFactory;

    public NominatimServicioGeocodificacion(IHttpClientFactory httpClientFactory)
    {
        _httpClientFactory = httpClientFactory;
    }

    public async Task<IReadOnlyList<CandidatoDireccion>> BuscarDireccionesAsync(string texto, double? latSesgo = null, double? lngSesgo = null, CancellationToken ct = default)
    {
        if (string.IsNullOrWhiteSpace(texto) || texto.Trim().Length < 3)
            return [];

        try
        {
            await EsperarTurnoAsync(ct);

            using var cts = CancellationTokenSource.CreateLinkedTokenSource(ct);
            cts.CancelAfter(Timeout);

            var query = Uri.EscapeDataString(texto.Trim());
            var url = $"{NominatimUrl}?q={query}&format=json&countrycodes=co&addressdetails=0&limit=5&accept-language=es";

            // Sesgo suave (bounded=0: prioriza sin excluir) hacia el municipio ya elegido en el
            // formulario — una caja de ±0.35° (~35-40 km) alrededor de su centro. Direcciones
            // colombianas del tipo "Carrera 29 # 33-48" son ambiguas en cualquier ciudad; sin
            // este sesgo, Nominatim las resuelve casi siempre contra Bogotá.
            if (latSesgo.HasValue && lngSesgo.HasValue)
            {
                const double radio = 0.35;
                var left = (lngSesgo.Value - radio).ToString(System.Globalization.CultureInfo.InvariantCulture);
                var top = (latSesgo.Value + radio).ToString(System.Globalization.CultureInfo.InvariantCulture);
                var right = (lngSesgo.Value + radio).ToString(System.Globalization.CultureInfo.InvariantCulture);
                var bottom = (latSesgo.Value - radio).ToString(System.Globalization.CultureInfo.InvariantCulture);
                url += $"&viewbox={left},{top},{right},{bottom}&bounded=0";
            }

            using var request = new HttpRequestMessage(HttpMethod.Get, url);
            request.Headers.UserAgent.ParseAdd("SGDS/1.0 (Sistema de Gestion de Solicitudes SYC)");

            var cliente = _httpClientFactory.CreateClient();
            var respuesta = await cliente.SendAsync(request, cts.Token);
            if (!respuesta.IsSuccessStatusCode) return [];

            using var stream = await respuesta.Content.ReadAsStreamAsync(cts.Token);
            using var json = await JsonDocument.ParseAsync(stream, cancellationToken: cts.Token);

            var resultado = new List<CandidatoDireccion>();
            foreach (var el in json.RootElement.EnumerateArray())
            {
                if (!el.TryGetProperty("display_name", out var nombreEl)) continue;
                if (!el.TryGetProperty("lat", out var latEl) || !el.TryGetProperty("lon", out var lonEl)) continue;
                if (!double.TryParse(latEl.GetString(), System.Globalization.CultureInfo.InvariantCulture, out var lat)) continue;
                if (!double.TryParse(lonEl.GetString(), System.Globalization.CultureInfo.InvariantCulture, out var lon)) continue;

                resultado.Add(new CandidatoDireccion(nombreEl.GetString() ?? texto, lat, lon));
            }

            return resultado;
        }
        catch
        {
            // Timeout, sin red, respuesta inesperada — la búsqueda en vivo simplemente no
            // muestra sugerencias en ese intento; nunca rompe el formulario.
            return [];
        }
    }

    private static async Task EsperarTurnoAsync(CancellationToken ct)
    {
        await Semaforo.WaitAsync(ct);
        try
        {
            var transcurrido = DateTime.UtcNow - _ultimaLlamadaUtc;
            if (transcurrido < IntervaloMinimo)
                await Task.Delay(IntervaloMinimo - transcurrido, ct);
            _ultimaLlamadaUtc = DateTime.UtcNow;
        }
        finally
        {
            Semaforo.Release();
        }
    }
}
