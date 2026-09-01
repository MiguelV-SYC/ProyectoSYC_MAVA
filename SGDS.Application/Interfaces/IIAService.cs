namespace SGDS.Application.Interfaces;

// Punto único de acceso a un proveedor de IA (hoy Claude/Anthropic). Los Controllers nunca
// referencian el SDK del proveedor directamente — solo esta interfaz — para poder sustituir
// o modificar el proveedor sin afectar el resto de las capas (RNF-IA-05).
public interface IIAService
{
    Task<RespuestaIADto> GenerarAsync(string systemPrompt, string contexto, string pregunta, CancellationToken ct = default);
}

public class RespuestaIADto
{
    public string Texto { get; set; } = string.Empty;
    public string Modelo { get; set; } = string.Empty;
}

// Excepción propia para no filtrar tipos del SDK de Anthropic hacia los Controllers.
public class IAServiceException : Exception
{
    public IAServiceException(string message, Exception? innerException = null) : base(message, innerException)
    {
    }
}
