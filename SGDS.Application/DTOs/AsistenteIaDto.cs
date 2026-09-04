namespace SGDS.Application.DTOs;

public class MensajeChatDto
{
    public string Rol { get; set; } = string.Empty; // "usuario" | "asistente"
    public string Texto { get; set; } = string.Empty;
}

public class PreguntaAsistenteOperadorDto
{
    public string Pregunta { get; set; } = string.Empty;
    public List<MensajeChatDto>? Historial { get; set; }
}

public class RespuestaAsistenteOperadorDto
{
    public string Texto { get; set; } = string.Empty;
}
