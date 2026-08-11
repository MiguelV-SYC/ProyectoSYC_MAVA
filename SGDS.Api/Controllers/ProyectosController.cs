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

    // GET: api/Proyectos (cualquier usuario autenticado puede ver la lista)
    [HttpGet]
    [AllowAnonymous]
    public async Task<IActionResult> GetProyectos()
    {
        var proyectos = await _context.Proyectos
            .Where(p => p.Activo)
            .Select(p => new ProyectoResponseDto
            {
                Id = p.Id,
                Nombre = p.Nombre,
                Codigo = p.Codigo,
                Activo = p.Activo
            })
            .ToListAsync();

        return Ok(proyectos);
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
            Activo = true
        };

        _context.Proyectos.Add(nuevoProyecto);
        await _context.SaveChangesAsync();

        return CreatedAtAction(nameof(GetProyectos), new { id = nuevoProyecto.Id }, nuevoProyecto);
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