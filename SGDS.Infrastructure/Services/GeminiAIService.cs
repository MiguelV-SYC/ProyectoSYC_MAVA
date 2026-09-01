using System.Net;
using System.Net.Http;
using System.Text;
using System.Text.Json;
using Microsoft.Extensions.Configuration;
using SGDS.Application.Interfaces;

namespace SGDS.Infrastructure.Services;

// Implementación de IIAService sobre la capa gratuita de la API de Gemini (Google), vía HTTP
// crudo (Google no publica un SDK oficial de C# tan directo como el de Anthropic para esto).
// Alternativa a ClaudeAIService — cuál de las dos está activa se decide en Program.cs
// (RNF-IA-05: el resto de la app nunca sabe cuál proveedor está detrás de IIAService).
public class GeminiAIService : IIAService
{
    private const string Endpoint = "https://generativelanguage.googleapis.com/v1beta/interactions";

    private readonly IHttpClientFactory _httpClientFactory;
    private readonly string _apiKey;
    private readonly string _modelo;

    public GeminiAIService(IHttpClientFactory httpClientFactory, IConfiguration configuration)
    {
        _httpClientFactory = httpClientFactory;
        _apiKey = configuration["Gemini:ApiKey"] ?? string.Empty;
        _modelo = configuration["Gemini:Model"] ?? "gemini-3.6-flash";
    }

    public async Task<RespuestaIADto> GenerarAsync(string systemPrompt, string contexto, string pregunta, CancellationToken ct = default)
    {
        var cuerpo = JsonSerializer.Serialize(new
        {
            model = _modelo,
            system_instruction = systemPrompt,
            input = $"Contexto:\n{contexto}\n\nPregunta:\n{pregunta}",
        });

        using var request = new HttpRequestMessage(HttpMethod.Post, Endpoint)
        {
            Content = new StringContent(cuerpo, Encoding.UTF8, "application/json"),
        };
        request.Headers.Add("x-goog-api-key", _apiKey);

        HttpResponseMessage response;
        try
        {
            response = await _httpClientFactory.CreateClient().SendAsync(request, ct);
        }
        catch (HttpRequestException ex)
        {
            throw new IAServiceException("No fue posible conectar con el servicio de IA.", ex);
        }

        if (response.StatusCode == HttpStatusCode.TooManyRequests)
        {
            throw new IAServiceException("El servicio de IA alcanzó su límite de solicitudes. Intenta de nuevo en unos minutos.");
        }

        if (!response.IsSuccessStatusCode)
        {
            throw new IAServiceException($"El servicio de IA no pudo procesar la solicitud ({(int)response.StatusCode}).");
        }

        using var stream = await response.Content.ReadAsStreamAsync(ct);
        using var json = await JsonDocument.ParseAsync(stream, cancellationToken: ct);

        var texto = ExtraerTexto(json.RootElement);
        return new RespuestaIADto { Texto = texto, Modelo = _modelo };
    }

    // La respuesta de la Interactions API trae un arreglo "steps" con distintos tipos de paso
    // (razonamiento, llamadas a herramientas, etc.) — el texto final vive en el primer paso de
    // tipo "model_output", dentro de un bloque de contenido de tipo "text".
    private static string ExtraerTexto(JsonElement raiz)
    {
        if (!raiz.TryGetProperty("steps", out var steps)) return string.Empty;

        foreach (var paso in steps.EnumerateArray())
        {
            if (!paso.TryGetProperty("type", out var tipoPaso) || tipoPaso.GetString() != "model_output") continue;
            if (!paso.TryGetProperty("content", out var contenido)) continue;

            foreach (var bloque in contenido.EnumerateArray())
            {
                if (bloque.TryGetProperty("type", out var tipoBloque) && tipoBloque.GetString() == "text" &&
                    bloque.TryGetProperty("text", out var texto))
                {
                    return texto.GetString() ?? string.Empty;
                }
            }
        }

        return string.Empty;
    }
}
