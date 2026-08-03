namespace SGDS.Domain.Entities;

public class Usuario
{
    public int Id { get; set; }
    public string NombreCompleto { get; set; } = string.Empty;
    public string Email { get; set; } = string.Empty;
    public string PasswordHash { get; set; } = string.Empty;
    public bool Activo { get; set; } = true;
    public DateTime FechaCreacion { get; set; } = DateTime.UtcNow;

    public ICollection<UsuarioRol> UsuarioRoles { get; set; } = new List<UsuarioRol>();
    public ICollection<Solicitud> SolicitudesAsignadas { get; set; } = new List<Solicitud>();
}

public class Rol
{
    public int Id { get; set; }
    public string Nombre { get; set; } = string.Empty;
    public ICollection<UsuarioRol> UsuarioRoles { get; set; } = new List<UsuarioRol>();
}

public class UsuarioRol
{
    public int UsuarioId { get; set; }
    public Usuario Usuario { get; set; } = null!;
    public int RolId { get; set; }
    public Rol Rol { get; set; } = null!;
}

public class Ciudadano
{
    public int Id  { get; set; }
    public string TipoDocumento { get; set; } = string.Empty;
    public string NumeroDocumento { get; set; } = string.Empty;
    public string NombreCompleto { get; set; } = string.Empty;
    public string? Teelefono { get; set; }
    public string? Email { get; set; }

    public ICollection<Solicitud> Solicitudes { get; set; } = new List<Solicitud>();
}

public class Empresa
{
    public int Id { get; set; }
    public string Nit { get; set; } = string.Empty;
    public string RazonSocial { get; set; } = string.Empty;

    public ICollection<Solicitud> Solicitudes { get; set; } = new List<Solicitud>();
}

public class Solicitud
{
    public int Id { get; set; }
    public int CiudadanoId { get; set; }
    public Ciudadano? Ciudadano { get; set; }
    public int? EmpresaId { get; set; }
    public Empresa? Empresa { get; set; }
    public int? UsuarioAsignadoId { get; set; }
    public Usuario? UsuarioAsignado { get; set; }
    public string Estado { get; set; } = "Radicada";
    public DateTime FechaCreacion { get; set; } = DateTime.UtcNow;
    public DateTime? FechaCierre { get; set; }

    public ICollection<Documento> Documentos { get; set; } = new List<Documento>();
    public ICollection<HitorialEstados> HitorialEstados { get; set; } = new List<HitorialEstados>();
}

public class Documento
{
    public int Id { get; set; }
    public int SolicitudId { get; set; }
    public Solicitud Solicitud { get; set; } = null!;
    public string NombreArchivo { get; set; } = string.Empty;
    public string RutaArchivo { get; set; } = string.Empty;
    public DateTime FechaCarga { get; set; } = DateTime.UtcNow;
}

public class HitorialEstados
{
    public int Id { get; set; }
    public int SolicitudId { get; set; }
    public Solicitud Solicitud { get; set; } = null!;
    public string EstadoAnterior { get; set; } = string.Empty;
    public string EstadoNuevo { get; set; } = string.Empty;
    public DateTime FechaCambio { get; set; } = DateTime.UtcNow;

    public int? UsuarioId { get; set; }
    public Usuario? Usuario { get; set; }
}

public class Auditoria
{
    public int Id { get; set; }
    public int? UsuarioId { get; set; }
    public Usuario? Usuario { get; set; }
    public string Accion { get; set; } = string.Empty;
    public string? Modulo { get; set; }
    public DateTime FechaHora { get; set; } = DateTime.UtcNow;
    public string? DireccionIp { get; set; }
}