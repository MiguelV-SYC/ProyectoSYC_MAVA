using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using SGDS.Application.DTOs;
using SGDS.Application.Helpers;
using SGDS.Domain.Entities;
using SGDS.Infrastructure.Data;

namespace SGDS.Api.Controllers;

[ApiController]
[Route("api/[controller]")]
[Authorize]
public class EmpresasController : ControllerBase
{
    private readonly SgdsDbContext _context;

    public EmpresasController(SgdsDbContext context)
    {
        _context = context;
    }

    // GET: api/Empresas?buscar=texto&pagina=1&tamanoPagina=20
    [HttpGet]
    public async Task<IActionResult> GetEmpresas([FromQuery] string? buscar, [FromQuery] int pagina = 1, [FromQuery] int tamanoPagina = 20)
    {
        var esAdminSyc = User.FindFirst("esAdminSyc")?.Value == "True";
        var proyectosPermitidos = User.FindAll("proyecto")
            .Select(c => int.Parse(c.Value.Split(':')[0]))
            .ToList();

        var query = _context.Empresas
            .Include(e => e.Solicitudes)
                .ThenInclude(s => s.Proyecto)
            .AsQueryable();

        if (!esAdminSyc)
        {
            query = query.Where(e => e.Solicitudes.Any(s => s.ProyectoId != null && proyectosPermitidos.Contains(s.ProyectoId.Value)));
        }

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
            TotalSolicitudes = e.Solicitudes.Count
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
            FechaRegistro = empresa.FechaRegistro,
            ProyectosConActividad = proyectosConActividad
        };

        return Ok(dto);
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
            Direccion = dto.Direccion
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

        await _context.SaveChangesAsync();

        return NoContent();
    }

    // DELETE: api/Empresas/5
    [HttpDelete("{id}")]
    public async Task<IActionResult> EliminarEmpresa(int id)
    {
        var empresa = await _context.Empresas.FindAsync(id);

        if (empresa == null)
            return NotFound();

        _context.Empresas.Remove(empresa);
        await _context.SaveChangesAsync();

        return NoContent();
    }
}