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
public class TiposSolicitudController : ControllerBase
{
    private readonly SgdsDbContext _context;

    public TiposSolicitudController(SgdsDbContext context)
    {
        _context = context;
    }

    // GET: api/TiposSolicitud (cualquier usuario autenticado puede ver la lista)
    [HttpGet]
    public async Task<IActionResult> GetTiposSolicitud()
    {
        var tiposSolicitud = await _context.TiposSolicitudes
            .Select(t => new TipoSolicitudResponseDto
            {
                Id = t.Id,
                ProyectoId = t.ProyectoId,
                Nombre = t.Nombre,
                Activo = t.Activo
            })
            .ToListAsync();

        return Ok(tiposSolicitud);
    }

    // POST: api/TiposSolicitud (solo Admin SYC)
    [HttpPost]
    public async Task<IActionResult> CrearTipoSolicitud(CrearTipoSolicitudDto dto)
    {
        var esAdminSyc = User.FindFirst("esAdminSyc")?.Value == "True";
        if (!esAdminSyc)
            return Forbid();

        var nuevoTipoSolicitud = new TipoSolicitud
        {
            ProyectoId = dto.ProyectoId,
            Nombre = dto.Nombre,
            Activo = true
        };

        _context.TiposSolicitudes.Add(nuevoTipoSolicitud);
        await _context.SaveChangesAsync();

        return CreatedAtAction(nameof(GetTiposSolicitud), new { id = nuevoTipoSolicitud.Id }, nuevoTipoSolicitud);
    }

    // DELETE: api/TiposSolicitud/5 (inactivar, solo Admin SYC)
    [HttpDelete("{id}")]
    public async Task<IActionResult> InactivarTipoSolicitud(int id)
    {
        var esAdminSyc = User.FindFirst("esAdminSyc")?.Value == "True";
        if (!esAdminSyc)
            return Forbid();

        var tipoSolicitud = await _context.TiposSolicitudes.FindAsync(id);
        if (tipoSolicitud == null)
            return NotFound();

        tipoSolicitud.Activo = false;
        await _context.SaveChangesAsync();

        return NoContent();
    }
}