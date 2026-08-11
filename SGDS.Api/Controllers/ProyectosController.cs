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
public class ProyectosController : ControllerBase
{
    private readonly SgdsDbContext _context;

    public ProyectosController(SgdsDbContext context)
    {
        _context = context;
    }

    // GET: api/Proyectos (público ve solo activos; Admin SYC ve todos)
    [HttpGet]
    [AllowAnonymous]
    public async Task<IActionResult> GetProyectos()
    {
        var esAdminSyc = User.FindFirst("esAdminSyc")?.Value == "True";

        var query = _context.Proyectos
            .Include(p => p.TiposSolicitud)
            .Include(p => p.UsuarioProyectos)
            .AsQueryable();

        if (!esAdminSyc)
        {
            query = query.Where(p => p.Activo);
        }

        var proyectos = await query.ToListAsync();

        var resultado = proyectos.Select(p => new ProyectoResponseDto
        {
            Id = p.Id,
            Nombre = p.Nombre,
            Codigo = p.Codigo,
            Descripcion = p.Descripcion,
            Activo = p.Activo,
            EstadoPersonalizado = p.EstadoPersonalizado,
            TotalTiposSolicitud = p.TiposSolicitud.Count(t => t.Activo),
            TotalOperadores = p.UsuarioProyectos.Count
        }).ToList();

        return Ok(resultado);
    }

    // POST: api/Proyectos (solo Admin SYC)
    [HttpPost]
    public async Task<IActionResult> CrearProyecto(CrearProyectoDto dto)
    {
        var esAdminSyc = User.FindFirst("esAdminSyc")?.Value == "True";
        if (!esAdminSyc)
            return Forbid();

        var nuevoProyecto = new Proyecto
        {
            Nombre = dto.Nombre,
            Codigo = dto.Codigo,
            Descripcion = dto.Descripcion,
            Activo = true
        };

        _context.Proyectos.Add(nuevoProyecto);
        await _context.SaveChangesAsync();

        return CreatedAtAction(nameof(GetProyectos), new { id = nuevoProyecto.Id }, nuevoProyecto);
    }

    // PUT: api/Proyectos/5 (editar, solo Admin SYC)
    [HttpPut("{id}")]
    public async Task<IActionResult> ActualizarProyecto(int id, ActualizarProyectoDto dto)
    {
        var esAdminSyc = User.FindFirst("esAdminSyc")?.Value == "True";
        if (!esAdminSyc)
            return Forbid();

        var proyecto = await _context.Proyectos.FindAsync(id);
        if (proyecto == null)
            return NotFound();

        proyecto.Nombre = dto.Nombre;
        proyecto.Descripcion = dto.Descripcion;
        proyecto.Activo = dto.Activo;
        proyecto.EstadoPersonalizado = dto.EstadoPersonalizado;

        await _context.SaveChangesAsync();

        return NoContent();
    }

    // DELETE: api/Proyectos/5 (inactivar, solo Admin SYC)
    [HttpDelete("{id}")]
    public async Task<IActionResult> InactivarProyecto(int id)
    {
        var esAdminSyc = User.FindFirst("esAdminSyc")?.Value == "True";
        if (!esAdminSyc)
            return Forbid();

        var proyecto = await _context.Proyectos.FindAsync(id);
        if (proyecto == null)
            return NotFound();

        proyecto.Activo = false;
        await _context.SaveChangesAsync();

        return NoContent();
    }
}