using System.Net;
using System.Text;
using System.Text.Json;
using System.Text.Json.Nodes;
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

    public async Task<RespuestaIAHerramientasDto> GenerarConHerramientasAsync(
        string systemPrompt,
        IReadOnlyList<MensajeIADto> historial,
        IReadOnlyList<HerramientaIADto> herramientas,
        CancellationToken ct = default)
    {
        var mensajesJson = new JsonArray
        {
            new JsonObject { ["role"] = "system", ["content"] = systemPrompt },
        };

        foreach (var mensaje in historial)
        {
            if (mensaje.Rol == "tool")
            {
                mensajesJson.Add(new JsonObject
                {
                    ["role"] = "tool",
                    ["tool_call_id"] = mensaje.LlamadaHerramientaId,
                    ["content"] = mensaje.Texto ?? string.Empty,
                });
            }
            else if (mensaje.Rol == "assistant" && mensaje.LlamadasHerramientas is { Count: > 0 })
            {
                var toolCalls = new JsonArray();
                foreach (var llamada in mensaje.LlamadasHerramientas)
                {
                    toolCalls.Add(new JsonObject
                    {
                        ["id"] = llamada.Id,
                        ["type"] = "function",
                        ["function"] = new JsonObject
                        {
                            ["name"] = llamada.Nombre,
                            ["arguments"] = llamada.ArgumentosJson,
                        },
                    });
                }

                mensajesJson.Add(new JsonObject
                {
                    ["role"] = "assistant",
                    ["content"] = null,
                    ["tool_calls"] = toolCalls,
                });
            }
            else
            {
                mensajesJson.Add(new JsonObject { ["role"] = mensaje.Rol, ["content"] = mensaje.Texto ?? string.Empty });
            }
        }

        var toolsJson = new JsonArray();
        foreach (var herramienta in herramientas)
        {
            toolsJson.Add(new JsonObject
            {
                ["type"] = "function",
                ["function"] = new JsonObject
                {
                    ["name"] = herramienta.Nombre,
                    ["description"] = herramienta.Descripcion,
                    ["parameters"] = JsonNode.Parse(herramienta.ParametrosSchema.GetRawText()),
                },
            });
        }

        var cuerpoJson = new JsonObject
        {
            ["model"] = _modelo,
            ["messages"] = mensajesJson,
            ["tools"] = toolsJson,
        };

        using var request = new HttpRequestMessage(HttpMethod.Post, Endpoint)
        {
            Content = new StringContent(cuerpoJson.ToJsonString(), Encoding.UTF8, "application/json"),
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
            var detalle = await response.Content.ReadAsStringAsync(ct);
            throw new IAServiceException($"El servicio de IA no pudo procesar la solicitud ({(int)response.StatusCode}): {detalle}");
        }

        using var stream = await response.Content.ReadAsStreamAsync(ct);
        using var json = await JsonDocument.ParseAsync(stream, cancellationToken: ct);

        var mensajeRespuesta = json.RootElement.GetProperty("choices")[0].GetProperty("message");

        if (mensajeRespuesta.TryGetProperty("tool_calls", out var toolCallsElement)
            && toolCallsElement.ValueKind == JsonValueKind.Array
            && toolCallsElement.GetArrayLength() > 0)
        {
            var llamadas = new List<LlamadaHerramientaDto>();
            foreach (var toolCall in toolCallsElement.EnumerateArray())
            {
                llamadas.Add(new LlamadaHerramientaDto
                {
                    Id = toolCall.GetProperty("id").GetString() ?? string.Empty,
                    Nombre = toolCall.GetProperty("function").GetProperty("name").GetString() ?? string.Empty,
                    ArgumentosJson = toolCall.GetProperty("function").GetProperty("arguments").GetString() ?? "{}",
                });
            }

            return new RespuestaIAHerramientasDto { LlamadasHerramientas = llamadas, Modelo = _modelo };
        }

        var textoFinal = mensajeRespuesta.TryGetProperty("content", out var contentElement) && contentElement.ValueKind == JsonValueKind.String
            ? contentElement.GetString() ?? string.Empty
            : string.Empty;

        return new RespuestaIAHerramientasDto { Texto = textoFinal, Modelo = _modelo };
    }
}
