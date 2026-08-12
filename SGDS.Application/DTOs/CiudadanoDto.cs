namespace SGDS.Application.DTOs;

public class CiudadanoResponseDto
{
    public int Id { get; set; }
    public string TipoDocumento { get; set; } = string.Empty;
    public string NumeroDocumento { get; set; } = string.Empty;
    public string NombreCompleto { get; set; } = string.Empty;
    public string? Telefono { get; set; }
    public string? Email { get; set; }
    public List<string> ProyectosConActividad { get; set; } = new();
    public int TotalSolicitudes { get; set; }
}

public class CrearCiudadanoDto
{
    public string TipoDocumento { get; set; } = string.Empty;
    public string NumeroDocumento { get; set; } = string.Empty;
    public string NombreCompleto { get; set; } = string.Empty;
    public string? Telefono { get; set; }
    public string? Email { get; set; }
    public string? Ciudad { get; set; }
    public string? Direccion { get; set; }
}

public class PaginacionResponseDto<T>
{
    public List<T> Datos { get; set; } = new();
    public int TotalRegistros { get; set; }
    public int PaginaActual { get; set; }
    public int TotalPaginas { get; set; }
}

public class ProyectoActividadDto
{
    public int ProyectoId { get; set; }
    public string ProyectoNombre { get; set; } = string.Empty;
    public DateTime PrimeraActividad { get; set; }
    public int TotalSolicitudes { get; set; }
}

public class CiudadanoDetalleResponseDto
{
    public int Id { get; set; }
    public string TipoDocumento { get; set; } = string. Empty;
    public string NumeroDocumento { get; set; } = string.Empty;
    public string NombreCompleto { get; set; } = string.Empty;
    public string? Telefono { get; set; }
    public string? Email { get; set; }
    public string? Ciudad { get; set; }
    public string? Direccion { get; set; }
    public DateTime FechaRegistro { get; set; }
    public List<ProyectoActividadDto> ProyectosConActividad { get; set; } = new();

}

public class CiudadanoBusquedaResponseDto
{
    public bool Existe { get; set; }
    public CiudadanoBusquedaDto? Ciudadano { get; set; }
}

public class CiudadanoBusquedaDto
{
    public int Id { get; set; }
    public string NombreCompleto { get; set; } = string.Empty;
    public string TipoDocumento { get; set; } = string.Empty;
}