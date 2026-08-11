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

public class SolicitudAccesoResponseDto
{
    public int Id { get; set; }
    public string NombreCompleto { get; set; } = string.Empty;
    public string Email { get; set; } = string.Empty;
    public string DocumentoIdentidad { get; set; } = string.Empty; 
    public string?  Telefono { get; set; }
    public string RolSolicitado { get; set; } = string.Empty;
    public string? Motivo { get; set; }
    public string Estado { get; set; } = string.Empty;
    public DateTime FechaSolicitud { get; set; }
    public List<string> ProyectosSolicitados { get; set; } = new();
}

public class AprobarSolicitudAccesoDto
{
    public int RolId { get; set; }
}

public class RechazarSolicitudAccesoDto
{
    public string? Motivo { get; set; }
}

public class AprobarSolicitudAccesoResponseDto
{
    public int UsuarioId { get; set; }
    public string Email { get; set; } = string.Empty;
    public string PasswordTemporal { get; set; } = string.Empty;
}