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
public class SolicitudesController : ControllerBase
{
    private readonly SgdsDbContext _context;

    public SolicitudesController(SgdsDbContext context)
    {
        _context = context;
    }

    // GET: api/Solicitudes
    [HttpGet]
    public async Task<IActionResult> GetSolicitudes()
    {
        var solicitudes = await _context.Solicitudes
            .Include(s => s.Ciudadano)
            .Include(s => s.Empresa)
            .Include(s => s.UsuarioAsignado)
            .Select(s => new SolicitudResponseDto
            {
                Id = s.Id,
                CiudadanoId = s.CiudadanoId,
                CiudadanoNombre = s.Ciudadano != null ? s.Ciudadano.NombreCompleto : null,
                EmpresaId = s.EmpresaId,
                EmpresaNombre = s.Empresa != null ? s.Empresa.RazonSocial : null,
                UsuarioAsignadoId = s.UsuarioAsignadoId,
                UsuarioAsignadoNombre = s.UsuarioAsignado != null ? s.UsuarioAsignado.NombreCompleto : null,
                Estado = s.Estado,
                FechaCreacion = s.FechaCreacion,
                FechaCierre = s.FechaCierre
            })
            .ToListAsync();

        return Ok(solicitudes);
    }

    // GET: api/Solicitudes/5
    [HttpGet("{id}")]
    public async Task<IActionResult> GetSolicitud(int id)
    {
        var solicitud = await _context.Solicitudes
            .Include(s => s.Ciudadano)
            .Include(s => s.Empresa)
            .Include(s => s.UsuarioAsignado)
            .FirstOrDefaultAsync(s => s.Id == id);

        if (solicitud == null)
            return NotFound();

        var dto = new SolicitudResponseDto
        {
            Id = solicitud.Id,
            CiudadanoId = solicitud.CiudadanoId,
            CiudadanoNombre = solicitud.Ciudadano?.NombreCompleto,
            EmpresaId = solicitud.EmpresaId,
            EmpresaNombre = solicitud.Empresa?.RazonSocial,
            UsuarioAsignadoId = solicitud.UsuarioAsignadoId,
            UsuarioAsignadoNombre = solicitud.UsuarioAsignado?.NombreCompleto,
            Estado = solicitud.Estado,
            FechaCreacion = solicitud.FechaCreacion,
            FechaCierre = solicitud.FechaCierre
        };

        return Ok(dto);
    }

    // POST: api/Solicitudes
    [HttpPost]
    public async Task<IActionResult> CrearSolicitud(CrearSolicitudDto dto)
    {
        if (dto.CiudadanoId == null && dto.EmpresaId == null)
        {
            return BadRequest(new { mensaje = "Debe indicar un Ciudadano o una Empresa" });
        }

        var nuevaSolicitud = new Solicitud
        {
            CiudadanoId = dto.CiudadanoId,
            EmpresaId = dto.EmpresaId,
            Estado = "Radicada",
            FechaCreacion = DateTime.UtcNow
        };

        _context.Solicitudes.Add(nuevaSolicitud);
        await _context.SaveChangesAsync();

        return CreatedAtAction(nameof(GetSolicitud), new { id = nuevaSolicitud.Id }, new { nuevaSolicitud.Id });
    }

// PUT: api/Solicitudes/5/cambiar-estado
[HttpPut("{id}/cambiar-estado")]
public async Task<IActionResult> CambiarEstado(int id, CambiarEstadoDto dto)
{
    var solicitud = await _context.Solicitudes.FindAsync(id);

    if (solicitud == null)
        return NotFound();

    var estadoAnterior = solicitud.Estado;
    solicitud.Estado = dto.NuevoEstado;

    if (dto.NuevoEstado == "Cerrada" || dto.NuevoEstado == "Finalizada")
    {
        solicitud.FechaCierre = DateTime.UtcNow;
    }

    var historial = new HistorialEstado
    {
        SolicitudId = solicitud.Id,
        EstadoAnterior = estadoAnterior,
        EstadoNuevo = dto.NuevoEstado,
        FechaCambio = DateTime.UtcNow
    };

    _context.HistorialEstados.Add(historial);
    await _context.SaveChangesAsync();

    return NoContent();
}

// PUT: api/Solicitudes/5/asignar-usuario
[HttpPut("{id}/asignar-usuario")]
public async Task<IActionResult> AsignarUsuario(int id, AsignarUsuarioDto dto)
{
    var solicitud = await _context.Solicitudes.FindAsync(id);

    if (solicitud == null)
        return NotFound();

    var usuarioExiste = await _context.Usuarios.AnyAsync(u => u.Id == dto.UsuarioId && u.Activo);

    if (!usuarioExiste)
        return BadRequest(new { mensaje = "El usuario no existe o no está activo" });

    solicitud.UsuarioAsignadoId = dto.UsuarioId;
    await _context.SaveChangesAsync();

    return NoContent();
}





}

