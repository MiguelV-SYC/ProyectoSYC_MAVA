namespace SGDS.Application.DTOs;

public class DocumentoResponseDto
{
    public int Id { get; set; }
    public string NombreArchivo { get; set; } = string.Empty;
    public string SolicitudNumero { get; set; } = string.Empty;
    public DateTime Fecha { get; set; }
    public long? TamanoBytes { get; set; }
    public string? TipoArchivo { get; set; }
    public string Categoria { get; set; } = string.Empty;
    public string? ProyectoNombre { get; set; }
    
}
public class ConteoTipoArchivoDto
{
    public string Tipo { get; set; } = string.Empty;
    public int Total { get; set; }
}

public class ListadoDocumentosResponseDto
{
    public PaginacionResponseDto<DocumentoResponseDto> Pagina { get; set; } = new();
    public List<ConteoTipoArchivoDto> ConteosPorTipo { get; set; } = new();
}