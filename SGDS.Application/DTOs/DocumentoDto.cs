namespace SGDS.Application.DTOs;

public class DocumentoResponseDto
{
    public int Id { get; set; }
    public string NombreArchivo { get; set; } = string.Empty;
    public string SolicitudNumero { get; set; } = string.Empty;
    public DateTime Fecha { get; set; }
}