using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using SGDS.Application.DTOs;
using SGDS.Application.Helpers;
using SGDS.Application.Interfaces;
using SGDS.Domain.Entities;
using SGDS.Infrastructure.Data;

namespace SGDS.Api.Controllers;

[ApiController]
[Route("api/[controller]")]
[Authorize]
public class EmpresasController : ControllerBase
{
    private readonly SgdsDbContext _context;
    private readonly IAlmacenamientoService _almacenamiento;

    public EmpresasController(SgdsDbContext context, IAlmacenamientoService almacenamiento)
    {
        _context = context;
        _almacenamiento = almacenamiento;
    }

    // GET: api/Empresas?buscar=texto&pagina=1&tamanoPagina=20
    [HttpGet]
    public async Task<IActionResult> GetEmpresas([FromQuery] string? buscar, [FromQuery] int pagina = 1, [FromQuery] int tamanoPagina = 20)
    {
        var query = _context.Empresas
            .Include(e => e.Solicitudes)
                .ThenInclude(s => s.Proyecto)
            .AsQueryable();

        // Empresa es un catálogo compartido entre proyectos (no scoped como Solicitud) —
        // restringir la búsqueda a empresas con actividad previa en un proyecto permitido
        // impedía vincular una empresa nueva (o sin trámites aún) al primer trámite de un
        // operador. GetEmpresa(id) ya no restringe el acceso, solo qué actividad muestra;
        // este listado ahora es consistente con eso.

        if (!string.IsNullOrWhiteSpace(buscar))
        {
            query = query.Where(e => e.RazonSocial.Contains(buscar) || e.Nit.Contains(buscar));
        }

        var totalRegistros = await query.CountAsync();
        var totalPaginas = (int)Math.Ceiling(totalRegistros / (double)tamanoPagina);

        var empresas = await query
            .OrderBy(e => e.RazonSocial)
            .Skip((pagina - 1) * tamanoPagina)
            .Take(tamanoPagina)
            .ToListAsync();

        var datos = empresas.Select(e => new EmpresaResponseDto
        {
            Id = e.Id,
            Nit = e.Nit,
            DigitoVerificacion = CalculadoraDv.Calcular(e.Nit),
            RazonSocial = e.RazonSocial,
            ProyectosConActividad = e.Solicitudes
                .Where(s => s.Proyecto != null)
                .Select(s => s.Proyecto!.Nombre)
                .Distinct()
                .ToList(),
            TotalSolicitudes = e.Solicitudes.Count,
            TieneLogo = e.RutaLogo != null
        }).ToList();

        var respuesta = new PaginacionResponseDto<EmpresaResponseDto>
        {
            Datos = datos,
            TotalRegistros = totalRegistros,
            PaginaActual = pagina,
            TotalPaginas = totalPaginas
        };

        return Ok(respuesta);
    }

    // GET: api/Empresas/5
    [HttpGet("{id}")]
    public async Task<IActionResult> GetEmpresa(int id)
    {
        var esAdminSyc = User.FindFirst("esAdminSyc")?.Value == "True";
        var proyectosPermitidos = User.FindAll("proyecto")
            .Select(c => int.Parse(c.Value.Split(':')[0]))
            .ToList();

        var empresa = await _context.Empresas
            .Include(e => e.Solicitudes)
                .ThenInclude(s => s.Proyecto)
            .FirstOrDefaultAsync(e => e.Id == id);

        if (empresa == null)
            return NotFound();

        var solicitudesVisibles = esAdminSyc
            ? empresa.Solicitudes.Where(s => s.ProyectoId != null)
            : empresa.Solicitudes.Where(s => s.ProyectoId != null && proyectosPermitidos.Contains(s.ProyectoId.Value));

        var proyectosConActividad = solicitudesVisibles
            .GroupBy(s => new { s.ProyectoId, s.Proyecto!.Nombre })
            .Select(g => new ProyectoActividadEmpresaDto
            {
                ProyectoId = g.Key.ProyectoId!.Value,
                ProyectoNombre = g.Key.Nombre,
                PrimeraActividad = g.Min(s => s.FechaCreacion),
                TotalSolicitudes = g.Count()
            })
            .ToList();

        var totalProductos = await _context.Productos.CountAsync(p => p.EmpresaId == id);

        var dto = new EmpresaDetalleResponseDto
        {
            Id = empresa.Id,
            Nit = empresa.Nit,
            DigitoVerificacion = CalculadoraDv.Calcular(empresa.Nit),
            RazonSocial = empresa.RazonSocial,
            RepresentanteLegal = empresa.RepresentanteLegal,
            Telefono = empresa.Telefono,
            Correo = empresa.Correo,
            Ciudad = empresa.Ciudad,
            Direccion = empresa.Direccion,
            TipoEmpresa = empresa.TipoEmpresa,
            Estado = empresa.Estado,
            Departamento = empresa.Departamento,
            FechaRegistro = empresa.FechaRegistro,
            ProyectosConActividad = proyectosConActividad,
            TieneLogo = empresa.RutaLogo != null,
            TotalProductos = totalProductos,
        };

        return Ok(dto);
    }

    // POST: api/Empresas/5/logo
    [HttpPost("{id}/logo")]
    public async Task<IActionResult> SubirLogo(int id, IFormFile logo)
    {
        var empresa = await _context.Empresas.FindAsync(id);
        if (empresa == null)
            return NotFound();

        if (logo == null || logo.Length == 0)
            return BadRequest(new { mensaje = "Debe adjuntar una imagen" });

        if (!logo.ContentType.StartsWith("image/"))
            return BadRequest(new { mensaje = "El logo debe ser una imagen (PNG, JPG o SVG)" });

        using var stream = logo.OpenReadStream();
        empresa.RutaLogo = await _almacenamiento.GuardarArchivoAsync(stream, logo.FileName, $"empresas/{id}");
        await _context.SaveChangesAsync();

        return Ok(new { tieneLogo = true });
    }

    // GET: api/Empresas/5/logo
    [HttpGet("{id}/logo")]
    public async Task<IActionResult> GetLogo(int id)
    {
        var empresa = await _context.Empresas.FindAsync(id);
        if (empresa?.RutaLogo == null)
            return NotFound();

        try
        {
            var stream = await _almacenamiento.ObtenerArchivoAsync(empresa.RutaLogo);
            var tipoContenido = Path.GetExtension(empresa.RutaLogo).ToLowerInvariant() switch
            {
                ".png" => "image/png",
                ".jpg" or ".jpeg" => "image/jpeg",
                ".svg" => "image/svg+xml",
                ".webp" => "image/webp",
                _ => "application/octet-stream",
            };
            return File(stream, tipoContenido);
        }
        catch (FileNotFoundException)
        {
            return NotFound(new { mensaje = "El archivo físico no se encuentra disponible" });
        }
    }

    // GET: api/Empresas/buscar-por-nit?nit=X
    [HttpGet("buscar-por-nit")]
    public async Task<IActionResult> BuscarPorNit([FromQuery] string nit)
    {
        if (string.IsNullOrWhiteSpace(nit))
        {
            return Ok(new EmpresaBusquedaResponseDto { Existe = false });
        }

        var esAdminSyc = User.FindFirst("esAdminSyc")?.Value == "True";
        var proyectosPermitidos = User.FindAll("proyecto")
            .Select(c => int.Parse(c.Value.Split(':')[0]))
            .ToList();

        var empresa = await _context.Empresas
            .Include(e => e.Solicitudes)
            .FirstOrDefaultAsync(e => e.Nit == nit);

        if (empresa == null)
        {
            return Ok(new EmpresaBusquedaResponseDto { Existe = false });
        }

        var puedeVerla = esAdminSyc || empresa.Solicitudes.Any(s =>
            s.ProyectoId != null && proyectosPermitidos.Contains(s.ProyectoId.Value));

        if (!puedeVerla)
        {
            return Ok(new EmpresaBusquedaResponseDto { Existe = false });
        }

        return Ok(new EmpresaBusquedaResponseDto
        {
            Existe = true,
            Empresa = new EmpresaBusquedaDto
            {
                Id = empresa.Id,
                RazonSocial = empresa.RazonSocial
            }
        });
    }

    // POST: api/Empresas
    [HttpPost]
    public async Task<IActionResult> CrearEmpresa(CrearEmpresaDto dto)
    {
        var nitYaExiste = await _context.Empresas.AnyAsync(e => e.Nit == dto.Nit);
        if (nitYaExiste)
        {
            return Conflict(new { mensaje = "Ya existe una empresa registrada con ese NIT" });
        }

        var nuevaEmpresa = new Empresa
        {
            Nit = dto.Nit,
            RazonSocial = dto.RazonSocial,
            RepresentanteLegal = dto.RepresentanteLegal,
            Telefono = dto.Telefono,
            Correo = dto.Correo,
            Ciudad = dto.Ciudad,
            Direccion = dto.Direccion,
            TipoEmpresa = dto.TipoEmpresa,
            Estado = dto.Estado,
            Departamento = dto.Departamento,
        };

        _context.Empresas.Add(nuevaEmpresa);
        await _context.SaveChangesAsync();

        var respuesta = new EmpresaResponseDto
        {
            Id = nuevaEmpresa.Id,
            Nit = nuevaEmpresa.Nit,
            DigitoVerificacion = CalculadoraDv.Calcular(nuevaEmpresa.Nit),
            RazonSocial = nuevaEmpresa.RazonSocial
        };

        return CreatedAtAction(nameof(GetEmpresa), new { id = nuevaEmpresa.Id }, respuesta);
    }

    // PUT: api/Empresas/5
    [HttpPut("{id}")]
    public async Task<IActionResult> ActualizarEmpresa(int id, CrearEmpresaDto dto)
    {
        var empresa = await _context.Empresas.FindAsync(id);

        if (empresa == null)
            return NotFound();

        empresa.RazonSocial = dto.RazonSocial;
        empresa.RepresentanteLegal = dto.RepresentanteLegal;
        empresa.Telefono = dto.Telefono;
        empresa.Correo = dto.Correo;
        empresa.Ciudad = dto.Ciudad;
        empresa.Direccion = dto.Direccion;
        empresa.TipoEmpresa = dto.TipoEmpresa;
        empresa.Estado = dto.Estado;
        empresa.Departamento = dto.Departamento;

        await _context.SaveChangesAsync();

        return NoContent();
    }

    // ===== Catálogo de productos (GoTrace) =====

    // GET: api/Empresas/5/productos
    [HttpGet("{id}/productos")]
    public async Task<IActionResult> GetProductos(int id)
    {
        var empresaExiste = await _context.Empresas.AnyAsync(e => e.Id == id);
        if (!empresaExiste) return NotFound();

        var productos = await _context.Productos
            .Where(p => p.EmpresaId == id)
            .OrderBy(p => p.Nombre)
            .Select(p => new ProductoResponseDto
            {
                Id = p.Id,
                Nombre = p.Nombre,
                Tipo = p.Tipo,
                Subtipo = p.Subtipo,
                Presentacion = p.Presentacion,
                Contenido = p.Contenido,
                UnidadMedida = p.UnidadMedida,
                GradoAlcoholimetrico = p.GradoAlcoholimetrico,
                Origen = p.Origen,
                Relacion = p.Relacion,
            })
            .ToListAsync();

        return Ok(productos);
    }

    // POST: api/Empresas/5/productos
    [HttpPost("{id}/productos")]
    public async Task<IActionResult> CrearProducto(int id, GuardarProductoDto dto)
    {
        var empresaExiste = await _context.Empresas.AnyAsync(e => e.Id == id);
        if (!empresaExiste) return NotFound();

        var errorValidacion = ValidarProducto(dto);
        if (errorValidacion != null) return BadRequest(new { mensaje = errorValidacion });

        var nuevoProducto = new Producto
        {
            EmpresaId = id,
            Nombre = dto.Nombre,
            Tipo = dto.Tipo,
            Subtipo = dto.Subtipo,
            Presentacion = dto.Presentacion,
            Contenido = dto.Contenido,
            UnidadMedida = dto.UnidadMedida,
            GradoAlcoholimetrico = dto.GradoAlcoholimetrico,
            Origen = dto.Origen,
            Relacion = dto.Relacion,
        };

        _context.Productos.Add(nuevoProducto);
        await _context.SaveChangesAsync();

        return Ok(new ProductoResponseDto
        {
            Id = nuevoProducto.Id,
            Nombre = nuevoProducto.Nombre,
            Tipo = nuevoProducto.Tipo,
            Subtipo = nuevoProducto.Subtipo,
            Presentacion = nuevoProducto.Presentacion,
            Contenido = nuevoProducto.Contenido,
            UnidadMedida = nuevoProducto.UnidadMedida,
            GradoAlcoholimetrico = nuevoProducto.GradoAlcoholimetrico,
            Origen = nuevoProducto.Origen,
            Relacion = nuevoProducto.Relacion,
        });
    }

    // PUT: api/Empresas/5/productos/8
    [HttpPut("{id}/productos/{productoId}")]
    public async Task<IActionResult> ActualizarProducto(int id, int productoId, GuardarProductoDto dto)
    {
        var producto = await _context.Productos.FirstOrDefaultAsync(p => p.Id == productoId && p.EmpresaId == id);
        if (producto == null) return NotFound();

        var errorValidacion = ValidarProducto(dto);
        if (errorValidacion != null) return BadRequest(new { mensaje = errorValidacion });

        producto.Nombre = dto.Nombre;
        producto.Tipo = dto.Tipo;
        producto.Subtipo = dto.Subtipo;
        producto.Presentacion = dto.Presentacion;
        producto.Contenido = dto.Contenido;
        producto.UnidadMedida = dto.UnidadMedida;
        producto.GradoAlcoholimetrico = dto.GradoAlcoholimetrico;
        producto.Origen = dto.Origen;
        producto.Relacion = dto.Relacion;

        await _context.SaveChangesAsync();
        return NoContent();
    }

    // DELETE: api/Empresas/5/productos/8
    [HttpDelete("{id}/productos/{productoId}")]
    public async Task<IActionResult> EliminarProducto(int id, int productoId)
    {
        var producto = await _context.Productos.FirstOrDefaultAsync(p => p.Id == productoId && p.EmpresaId == id);
        if (producto == null) return NotFound();

        _context.Productos.Remove(producto);
        await _context.SaveChangesAsync();
        return NoContent();
    }

    // Catálogo legal de bebidas y tabaco gravados (Reglas_de_negocio_GoTrace.md, nota al final
    // del formulario de "Nueva Empresa") — Subtipo depende del Tipo elegido. Los 2 primeros
    // tipos son de la categoría "Alcohol" (Empresa.TipoEmpresa), el tercero de "Cigarrillo".
    private static readonly Dictionary<string, string[]> SubtiposPorTipo = new()
    {
        ["Licores, Vinos, Aperitivos y Similares"] = new[]
        {
            "Licores Destilados Nacionales", "Licores Destilados Importados", "Vinos (Nacionales e Importados)",
            "Aperitivos y Similares", "Aperitivos Vínicos",
        },
        ["Cervezas, Sifones, Refajos y Mezclas"] = new[]
        {
            "Cervezas Nacionales", "Cervezas Importadas", "Sifones", "Refajos",
            "Mezclas de Bebidas Fermentadas", "Cervezas Artesanales",
        },
        ["Cigarrillos y Tabaco Elaborado"] = new[]
        {
            "Cigarrillos Nacionales", "Cigarrillos Importados", "Cigarrillos y Tabacos (puros)",
            "Picadura y Tabaco para Pipa",
        },
    };

    private static readonly HashSet<string> TiposDeTabaco = new() { "Cigarrillos y Tabaco Elaborado" };
    private static readonly string[] RelacionesAlcohol = { "Produce", "Comercializa" };
    private static readonly string[] RelacionesTabaco = { "Productora", "Comercializadora", "Productora y comercializadora" };

    private static string? ValidarProducto(GuardarProductoDto dto)
    {
        if (string.IsNullOrWhiteSpace(dto.Nombre)) return "Indica el nombre del producto.";
        if (string.IsNullOrWhiteSpace(dto.Presentacion)) return "Indica la presentación del producto.";
        if (string.IsNullOrWhiteSpace(dto.UnidadMedida)) return "Indica la unidad de medida.";
        if (dto.Contenido <= 0) return "El contenido debe ser mayor que cero.";
        if (!SubtiposPorTipo.TryGetValue(dto.Tipo, out var subtiposValidos)) return "El tipo de producto no es válido.";
        if (!subtiposValidos.Contains(dto.Subtipo)) return "El subtipo no corresponde al tipo elegido.";

        // Alcohol y tabaco usan vocabularios de "relación" distintos (así los definió el
        // negocio) y campos exclusivos entre sí: grado de alcohol solo aplica a alcohol,
        // origen nacional/importado solo aplica a tabaco.
        if (TiposDeTabaco.Contains(dto.Tipo))
        {
            if (!RelacionesTabaco.Contains(dto.Relacion))
                return $"La relación debe ser una de: {string.Join(", ", RelacionesTabaco)}.";
            if (dto.Origen != "Nacional" && dto.Origen != "Importado")
                return "El origen debe ser \"Nacional\" o \"Importado\".";
        }
        else
        {
            if (!RelacionesAlcohol.Contains(dto.Relacion))
                return $"La relación debe ser una de: {string.Join(", ", RelacionesAlcohol)}.";
            if (dto.GradoAlcoholimetrico is < 0) return "El grado de alcohol no puede ser negativo.";
        }

        return null;
    }

    // DELETE: api/Empresas/5
    [HttpDelete("{id}")]
    public async Task<IActionResult> EliminarEmpresa(int id)
    {
        var esAdminSyc = User.FindFirst("esAdminSyc")?.Value == "True";
        if (!esAdminSyc)
            return Forbid();

        var empresa = await _context.Empresas.FindAsync(id);

        if (empresa == null)
            return NotFound();

        _context.Empresas.Remove(empresa);
        await _context.SaveChangesAsync();

        return NoContent();
    }
}