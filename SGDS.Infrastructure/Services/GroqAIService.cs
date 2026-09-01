using System.Net;
using System.Text;
using System.Text.Json;
using Microsoft.Extensions.Configuration;
using SGDS.Application.Interfaces;

namespace SGDS.Infrastructure.Services;

// Implementación de IIAService sobre la capa gratuita de Groq — API compatible con el formato
// de OpenAI (chat completions), vía HTTP crudo. Alternativa a ClaudeAIService/GeminiAIService —
// cuál está activa se decide en Program.cs (RNF-IA-05: el resto de la app nunca sabe cuál
// proveedor está detrás de IIAService).
public class GroqAIService : IIAService
{
    private const string Endpoint = "https://api.groq.com/openai/v1/chat/completions";

    private readonly IHttpClientFactory _httpClientFactory;
    private readonly string _apiKey;
    private readonly string _modelo;

    public GroqAIService(IHttpClientFactory httpClientFactory, IConfiguration configuration)
    {
        _httpClientFactory = httpClientFactory;
        _apiKey = configuration["Groq:ApiKey"] ?? string.Empty;
        _modelo = configuration["Groq:Model"] ?? "openai/gpt-oss-20b";
    }

    public async Task<RespuestaIADto> GenerarAsync(string systemPrompt, string contexto, string pregunta, CancellationToken ct = default)
    {
        var cuerpo = JsonSerializer.Serialize(new
        {
            model = _modelo,
            messages = new object[]
            {
                new { role = "system", content = systemPrompt },
                new { role = "user", content = $"Contexto:\n{contexto}\n\nPregunta:\n{pregunta}" },
            },
        });

        using var request = new HttpRequestMessage(HttpMethod.Post, Endpoint)
        {
            Content = new StringContent(cuerpo, Encoding.UTF8, "application/json"),
        };
        request.Headers.Add("Authorization", $"Bearer {_apiKey}");

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

        var texto = json.RootElement
            .GetProperty("choices")[0]
            .GetProperty("message")
            .GetProperty("content")
            .GetString() ?? string.Empty;

        return new RespuestaIADto { Texto = texto, Modelo = _modelo };
    }
}
