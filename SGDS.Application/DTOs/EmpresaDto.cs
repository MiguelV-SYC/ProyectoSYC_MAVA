namespace SGDS.Application.DTOs;

public class EmpresaResponseDto
{
  public int Id { get; set; }
  public string Nit { get; set; } = string.Empty;
  public string DigitoVerificacion { get; set; } = string.Empty;
  public string RazonSocial { get; set; } = string.Empty;
  public List<string> ProyectosConActividad { get; set; } = new();
  public int TotalSolicitudes { get; set; }
  public bool TieneLogo { get; set; }
}

public class CrearEmpresaDto
{
  public string Nit { get; set; } = string.Empty;
  public string RazonSocial { get; set; } = string.Empty;
  public string? RepresentanteLegal { get; set; }
  public string? Telefono { get; set; }
  public string? Correo { get; set; }
  public string? Ciudad { get; set; }
  public string? Direccion { get; set; }

  // Exclusivos del formulario extendido de GoTrace — null desde cualquier otro proyecto.
  public string? TipoEmpresa { get; set; }
  public string? Estado { get; set; }
  public string? Departamento { get; set; }
}

public class ProyectoActividadEmpresaDto
{
  public int ProyectoId { get; set; }
  public string ProyectoNombre { get; set; } = string.Empty;
  public DateTime PrimeraActividad { get; set; }
  public int TotalSolicitudes { get; set; }
}

public class EmpresaDetalleResponseDto
{
  public int Id { get; set; }
  public string Nit { get; set; } = string.Empty;
  public string DigitoVerificacion { get; set; } = string.Empty;
  public string RazonSocial { get; set; } = string.Empty;
  public string? RepresentanteLegal { get; set; }
  public string? Telefono { get; set; }
  public string? Correo { get; set; }
  public string? Ciudad { get; set; }
  public string? Direccion { get; set; }
  public string? TipoEmpresa { get; set; }
  public string? Estado { get; set; }
  public string? Departamento { get; set; }
  public DateTime FechaRegistro { get; set; }
  public List<ProyectoActividadEmpresaDto> ProyectosConActividad { get; set; } = new();
  public bool TieneLogo { get; set; }
  public int TotalProductos { get; set; }
}

// Catálogo de productos de la empresa — GoTrace ("Nueva Empresa" -> "Productos que
// comercializa y/o produce").
public class ProductoResponseDto
{
  public int Id { get; set; }
  public string Nombre { get; set; } = string.Empty;
  public string Tipo { get; set; } = string.Empty;
  public string Subtipo { get; set; } = string.Empty;
  public string Presentacion { get; set; } = string.Empty;
  public decimal Contenido { get; set; }
  public string UnidadMedida { get; set; } = string.Empty;
  public decimal? GradoAlcoholimetrico { get; set; }
  public string? Origen { get; set; }
  public string Relacion { get; set; } = string.Empty;
}

public class GuardarProductoDto
{
  public string Nombre { get; set; } = string.Empty;
  public string Tipo { get; set; } = string.Empty;
  public string Subtipo { get; set; } = string.Empty;
  public string Presentacion { get; set; } = string.Empty;
  public decimal Contenido { get; set; }
  public string UnidadMedida { get; set; } = string.Empty;
  public decimal? GradoAlcoholimetrico { get; set; }
  public string? Origen { get; set; }
  public string Relacion { get; set; } = "Produce";
}

public class EmpresaBusquedaResponseDto
{
  public bool Existe { get; set; }
  public EmpresaBusquedaDto? Empresa { get; set; }
}

public class EmpresaBusquedaDto
{
  public int Id { get; set; }
  public string RazonSocial { get; set; } = string.Empty;
}