namespace SGDS.Application.DTOs;

public class AuditoriaResponseDto
{
    public int Id { get; set; }
    public string UsuarioNombre { get; set; } = string.Empty;
    public string Accion { get; set; } = string.Empty;
    public string? Modulo { get; set; }
    public string? ProyectoNombre { get; set; }
    public DateTime FechaHora { get; set; }
    public string? DireccionIp { get; set; }
}

public class ListadoAuditoriaResponseDto
{
    public PaginacionResponseDto<AuditoriaResponseDto> Pagina { get; set; } = new();
}