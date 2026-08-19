namespace SGDS.Application.DTOs;

public class VehiculoResponseDto
{
    public int Id { get; set; }
    public int? CiudadanoId { get; set; }
    public string? CiudadanoNombre { get; set; }
    public string? CiudadanoDocumento { get; set; }
    public int? EmpresaId { get; set; }
    public string? EmpresaNombre { get; set; }
    public string? EmpresaNit { get; set; }
    public string Placa { get; set; } = string.Empty;
    public string? Marca { get; set; }
    public string? Linea { get; set; }
    public int? Modelo { get; set; }
    public string? NumeroChasis { get; set; }
}

public class CrearVehiculoDto
{
    public int? CiudadanoId { get; set; }
    public int? EmpresaId { get; set; }
    public string? Placa { get; set; }
    public string? Marca { get; set; }
    public string? Linea { get; set; }
    public int? Modelo { get; set; }
    public string? NumeroChasis { get; set; }
}