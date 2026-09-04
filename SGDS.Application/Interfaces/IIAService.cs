using System.Text.Json;

namespace SGDS.Application.Interfaces;

// Punto único de acceso a un proveedor de IA (hoy Groq, ver RNF-IA-05). Los Controllers nunca
// referencian el SDK/HTTP del proveedor directamente — solo esta interfaz — para poder sustituir
// o modificar el proveedor sin afectar el resto de las capas.
public interface IIAService
{
    Task<RespuestaIADto> GenerarAsync(string systemPrompt, string contexto, string pregunta, CancellationToken ct = default);

    // Variante con tool-calling: el modelo puede pedir ejecutar una o más `herramientas` en vez
    // de responder directo. El llamador (el Controller) ejecuta esas tools contra la BD y vuelve
    // a invocar este método agregando los resultados como mensajes "tool" a `historial`, repitiendo
    // el ciclo hasta que la respuesta traiga `Texto` en vez de `LlamadasHerramientas`.
    Task<RespuestaIAHerramientasDto> GenerarConHerramientasAsync(
        string systemPrompt,
        IReadOnlyList<MensajeIADto> historial,
        IReadOnlyList<HerramientaIADto> herramientas,
        CancellationToken ct = default);
}

public class RespuestaIADto
{
    public string Texto { get; set; } = string.Empty;
    public string Modelo { get; set; } = string.Empty;
}

// Un turno de la conversación con tool-calling. Rol sigue el vocabulario de la API de OpenAI/Groq:
// "user" (pregunta), "assistant" (respuesta del modelo, puede traer LlamadasHerramientas en vez de
// Texto) y "tool" (resultado de una llamada puntual, identificado por LlamadaHerramientaId).
public class MensajeIADto
{
    public string Rol { get; set; } = string.Empty;
    public string? Texto { get; set; }
    public List<LlamadaHerramientaDto>? LlamadasHerramientas { get; set; }
    public string? LlamadaHerramientaId { get; set; }
}

// Definición de una tool disponible para el modelo en esta conversación.
public class HerramientaIADto
{
    public string Nombre { get; set; } = string.Empty;
    public string Descripcion { get; set; } = string.Empty;
    public JsonElement ParametrosSchema { get; set; }
}

// Una llamada a herramienta que el modelo pidió ejecutar.
public class LlamadaHerramientaDto
{
    public string Id { get; set; } = string.Empty;
    public string Nombre { get; set; } = string.Empty;
    public string ArgumentosJson { get; set; } = string.Empty;
}

public class RespuestaIAHerramientasDto
{
    // Si viene lleno, el modelo ya terminó y no hay más llamadas pendientes.
    public string? Texto { get; set; }
    public List<LlamadaHerramientaDto>? LlamadasHerramientas { get; set; }
    public string Modelo { get; set; } = string.Empty;
}

// Excepción propia para no filtrar tipos del SDK/HTTP del proveedor hacia los Controllers.
public class IAServiceException : Exception
{
    public IAServiceException(string message, Exception? innerException = null) : base(message, innerException)
    {
    }
}
