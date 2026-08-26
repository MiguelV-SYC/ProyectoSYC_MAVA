using System.IO.Compression;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using SGDS.Application.DTOs;
using SGDS.Domain.Entities;
using SGDS.Infrastructure.Data;

namespace SGDS.Api.Controllers;

[ApiController]
[Route("api/[controller]")]
[Authorize]
public class CiudadanosController : ControllerBase
{
    private readonly SgdsDbContext _context;

    public CiudadanosController(SgdsDbContext context)
    {
        _context = context;
    }

    // GET: api/Ciudadanos
    [HttpGet]
public async Task<IActionResult> GetCiudadanos([FromQuery] string? buscar, [FromQuery] int? proyectoId, [FromQuery] int pagina = 1, [FromQuery] int tamanoPagina = 20)
{
    var query = _context.Ciudadanos
        .Include(c => c.Solicitudes)
            .ThenInclude(s => s.Proyecto)
        .AsQueryable();

    // Ciudadano es un catálogo compartido entre proyectos (no scoped como Solicitud) —
    // restringir la búsqueda a ciudadanos con actividad previa en un proyecto permitido
    // impedía vincular un ciudadano nuevo (o sin trámites aún) al primer trámite de un
    // operador. El filtro explícito por proyectoId (abajo) sigue disponible para quien
    // lo necesite.

    if (proyectoId.HasValue)
    {
        query = query.Where(c => c.Solicitudes.Any(s => s.ProyectoId == proyectoId.Value));
    }

    if (!string.IsNullOrWhiteSpace(buscar))
    {
        query = query.Where(c => c.NombreCompleto.Contains(buscar) || c.NumeroDocumento.Contains(buscar));
    }

    var totalRegistros = await query.CountAsync();
    var totalPaginas = (int)Math.Ceiling(totalRegistros / (double)tamanoPagina);

    var ciudadanos = await query
        .OrderBy(c => c.NombreCompleto)
        .Skip((pagina - 1) * tamanoPagina)
        .Take(tamanoPagina)
        .ToListAsync();

    var datos = ciudadanos.Select(c => new CiudadanoResponseDto
    {
        Id = c.Id,
        TipoDocumento = c.TipoDocumento,
        NumeroDocumento = c.NumeroDocumento,
        NombreCompleto = c.NombreCompleto,
        Telefono = c.Telefono,
        Email = c.Email,
        ProyectosConActividad = c.Solicitudes
            .Where(s => s.Proyecto != null)
            .Select(s => s.Proyecto!.Nombre)
            .Distinct()
            .ToList(),
        TotalSolicitudes = c.Solicitudes.Count
    }).ToList();

    var respuesta = new PaginacionResponseDto<CiudadanoResponseDto>
    {
        Datos = datos,
        TotalRegistros = totalRegistros,
        PaginaActual = pagina,
        TotalPaginas = totalPaginas
    };

    return Ok(respuesta);
}
    
// GET: api/Ciudadanos/5
    [HttpGet("{id}")]
public async Task<IActionResult> GetCiudadano(int id)
    {
        var esAdminSyc = User.FindFirst("esAdminSyc")?.Value == "True";
        var proyectosPermitidos = User.FindAll("proyecto")
            .Select(c => int.Parse(c.Value.Split(':')[0]))
            .ToList();

        var ciudadano = await _context.Ciudadanos
            .Include(c => c.Solicitudes)
                .ThenInclude(s => s.Proyecto)
            .FirstOrDefaultAsync(c => c.Id == id);

        if (ciudadano == null)
            return NotFound();

        var solicitudesVisibles = esAdminSyc
            ? ciudadano.Solicitudes.Where(s => s.ProyectoId != null)
            : ciudadano.Solicitudes.Where(s => s.ProyectoId != null && proyectosPermitidos.Contains(s.ProyectoId.Value));

        var proyectosConActividad = solicitudesVisibles
            .GroupBy(s => new { s.ProyectoId, s.Proyecto!.Nombre})
            .Select(g => new ProyectoActividadDto
            {
                ProyectoId = g.Key.ProyectoId!.Value,
                ProyectoNombre = g.Key.Nombre,
                PrimeraActividad = g.Min(s => s.FechaCreacion),
                TotalSolicitudes = g.Count()
            })
            .ToList();

        var dto = new CiudadanoDetalleResponseDto
        {
            Id = ciudadano.Id,
            TipoDocumento = ciudadano.TipoDocumento,
            NumeroDocumento = ciudadano.NumeroDocumento,
            NombreCompleto = ciudadano.NombreCompleto,
            Telefono = ciudadano.Telefono,
            Email = ciudadano.Email,
            Ciudad = ciudadano.Ciudad,
            Direccion = ciudadano.Direccion,
            FechaRegistro = ciudadano.FechaRegistro,
            ProyectosConActividad = proyectosConActividad
        };
        
        return Ok(dto);
    }

    // Inicio - metodo get adicionado por la vista formulario-usuario
    [HttpGet("buscar-por-documento")]
    public async Task<IActionResult> BuscarPorDocumento([FromQuery] string numero)
    {
        if (string.IsNullOrWhiteSpace(numero))
        {
            return Ok(new CiudadanoBusquedaResponseDto { Existe = false});
        }

        var esAdminSyc = User.FindFirst("esAdminSyc")?.Value == "True";
        var proyectosPermitidos = User.FindAll("proyecto")
            .Select(c => int.Parse(c.Value.Split(':')[0]))
            .ToList();

        var ciudadano = await _context.Ciudadanos
            .Include(c => c.Solicitudes)
            .FirstOrDefaultAsync(c => c.NumeroDocumento == numero);

        if (ciudadano == null)
        {
            return Ok(new CiudadanoBusquedaResponseDto { Existe = false });
        }
        
        var puedeVerlo = esAdminSyc || ciudadano.Solicitudes.Any(s =>
            s.ProyectoId != null && proyectosPermitidos.Contains(s.ProyectoId.Value));

        if (!puedeVerlo)
        {
            return Ok(new CiudadanoBusquedaResponseDto { Existe = false });
        }

        return Ok(new CiudadanoBusquedaResponseDto
        {
            Existe = true,
            Ciudadano = new CiudadanoBusquedaDto
            {
                Id = ciudadano.Id,
                NombreCompleto = ciudadano.NombreCompleto,
                TipoDocumento = ciudadano.TipoDocumento
            }
        });
    }

    //Fin 

    // POST: api/Ciudadanos
    [HttpPost]
    public async Task<IActionResult> CrearCiudadano(CrearCiudadanoDto dto)
    {
        var documentoYaExiste = await _context.Ciudadanos.AnyAsync(c => c.NumeroDocumento == dto.NumeroDocumento);
        if (documentoYaExiste)
        {
            return Conflict(new { mensaje = "Ya existe un ciudadano registrado con ese número de documento"});
        }

        var nuevoCiudadano = new Ciudadano
        {
            TipoDocumento = dto.TipoDocumento,
            NumeroDocumento = dto.NumeroDocumento,
            NombreCompleto = dto.NombreCompleto,
            Telefono = dto.Telefono, 
            Email = dto.Email, 
            Ciudad = dto.Ciudad,
            Direccion = dto.Direccion
        };

        _context.Ciudadanos.Add(nuevoCiudadano);
        await _context.SaveChangesAsync();

        var respuesta = new CiudadanoResponseDto
        {
            Id = nuevoCiudadano.Id,
            TipoDocumento = nuevoCiudadano.TipoDocumento,
            NumeroDocumento = nuevoCiudadano.NumeroDocumento,
            NombreCompleto = nuevoCiudadano.NombreCompleto,
            Telefono = nuevoCiudadano.Telefono,
            Email = nuevoCiudadano.Email
        };

        return CreatedAtAction(nameof(GetCiudadano), new { id = nuevoCiudadano.Id }, respuesta);
    }
  

    // PUT: api/Ciudadanos/5
    [HttpPut("{id}")]
    public async Task<IActionResult> ActualizarCiudadano(int id, CrearCiudadanoDto dto)
    {
        var ciudadano = await _context.Ciudadanos.FindAsync(id);

        if (ciudadano == null)
            return NotFound();

        ciudadano.NombreCompleto = dto.NombreCompleto;
        ciudadano.Telefono = dto.Telefono;
        ciudadano.Email = dto.Email;
        ciudadano.Ciudad = dto.Ciudad;
        ciudadano.Direccion = dto.Direccion;

        await _context.SaveChangesAsync();

        return NoContent();
    }

    // DELETE: api/Ciudadanos/5  (en realidad inactiva, no borra)
    [HttpDelete("{id}")]
    public async Task<IActionResult> EliminarCiudadano(int id)
    {
        var esAdminSyc = User.FindFirst("esAdminSyc")?.Value == "True";
        if (!esAdminSyc)
            return Forbid();

        var ciudadano = await _context.Ciudadanos.FindAsync(id);

        if (ciudadano == null)
            return NotFound();

        _context.Ciudadanos.Remove(ciudadano);
        await _context.SaveChangesAsync();

        return NoContent();
    }
}