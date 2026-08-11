namespace SGDS.Application.DTOs;

public class SolicitarAccesoDto
{
    public string NombreCompleto { get; set; } = string.Empty; 
    public string Email { get; set; } = string.Empty; 
    public string DocumentoIdentidad { get; set; } = string.Empty; 
    public string? Telefono { get; set; }
    public List<int> ProyectosSolicitados { get; set; } = new();
    public string RolSolicitado { get; set; } = string.Empty; 
    public string? Motivo { get; set; }
}