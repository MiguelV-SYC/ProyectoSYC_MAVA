namespace SGDS.Application.DTOs;

public class ProyectoRolDto
{
    public int ProyectoId { get; set; }
    public string ProyectoNombre { get; set; } = string.Empty;
    public string RolNombre { get; set; } = string.Empty;
}
    public class UsuarioResponseDto
{
    public int Id { get; set; }
    public string NombreCompleto { get; set; } = string.Empty;
    public string Email { get; set; } = string.Empty;
    public bool Activo { get; set; }
    public bool EsAdminSyc { get; set; }
    public List<ProyectoRolDto> Proyectos { get; set; } = new();
}

public class CrearUsuarioDto
{
    public string NombreCompleto { get; set; } = string.Empty;
    public string Email { get; set; } = string.Empty;
    public string Password { get; set; } = string.Empty;
    public List<CrearUsuarioProyectoDto>? Proyectos { get; set; }
}

public class ActualizarUsuarioDto
{
    public string NombreCompleto { get; set; } = string.Empty;
    public string Email { get; set; } = string.Empty;
    public bool Activo { get; set; }

}

public class CrearUsuarioProyectoDto
{
    public int ProyectoId { get; set; }
    public int RolId { get; set; }
}

public class ActualizarProyectosUsuarioDto
{
    public List<CrearUsuarioProyectoDto> Proyectos { get; set; } = new();
}