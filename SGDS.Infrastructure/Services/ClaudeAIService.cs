using Anthropic;
using Anthropic.Exceptions;
using Anthropic.Models.Messages;
using Microsoft.Extensions.Configuration;
using SGDS.Application.Interfaces;

namespace SGDS.Infrastructure.Services;

// Implementación de IIAService sobre el SDK oficial de Anthropic. Si en el futuro se
// sustituye Claude por otro proveedor, esta es la única clase que cambia (RNF-IA-05).
public class ClaudeAIService : IIAService
{
    private readonly AnthropicClient _client;
    private readonly string _modelo;

    public ClaudeAIService(IConfiguration configuration)
    {
        var apiKey = configuration["Anthropic:ApiKey"];
        _modelo = configuration["Anthropic:Model"] ?? "claude-opus-5";
        _client = new AnthropicClient { ApiKey = apiKey };
    }

    public async Task<RespuestaIADto> GenerarAsync(string systemPrompt, string contexto, string pregunta, CancellationToken ct = default)
    {
        try
        {
            var response = await _client.Messages.Create(new MessageCreateParams
            {
                Model = _modelo,
                MaxTokens = 2000,
                System = systemPrompt,
                Messages = [new() { Role = Role.User, Content = $"Contexto:\n{contexto}\n\nPregunta:\n{pregunta}" }],
            }, ct);

            var texto = string.Join("\n", response.Content.Select(b => b.Value).OfType<TextBlock>().Select(t => t.Text));

            return new RespuestaIADto { Texto = texto, Modelo = _modelo };
        }
        catch (AnthropicRateLimitException ex)
        {
            throw new IAServiceException("El servicio de IA alcanzó su límite de solicitudes. Intenta de nuevo en unos minutos.", ex);
        }
        catch (AnthropicNotFoundException ex)
        {
            throw new IAServiceException("El modelo de IA configurado no está disponible.", ex);
        }
        catch (AnthropicApiException ex)
        {
            throw new IAServiceException("El servicio de IA no pudo procesar la solicitud.", ex);
        }
        catch (AnthropicIOException ex)
        {
            throw new IAServiceException("No fue posible conectar con el servicio de IA.", ex);
        }
    }

    // Claude sí soporta tool use nativamente, pero mientras esta implementación no esté activa
    // (ver Program.cs) no vale la pena portar el loop de tool-calling — se deja explícito en vez
    // de fallar silenciosamente con una respuesta vacía.
    public Task<RespuestaIAHerramientasDto> GenerarConHerramientasAsync(
        string systemPrompt,
        IReadOnlyList<MensajeIADto> historial,
        IReadOnlyList<HerramientaIADto> herramientas,
        CancellationToken ct = default)
    {
        throw new IAServiceException("Este proveedor de IA no soporta herramientas todavía.");
    }
}
