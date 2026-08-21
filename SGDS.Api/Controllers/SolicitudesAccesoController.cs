using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Http.HttpResults;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using SGDS.Application.DTOs;
using SGDS.Infrastructure.Data;
using SGDS.Domain.Entities;

namespace SGDS.Api.Controllers;

[ApiController]
[Route("api/[controller]")]
[Authorize]
public class SolicitudesAccesoController : ControllerBase
{
    private readonly SgdsDbContext _context;

    public SolicitudesAccesoController (SgdsDbContext context)
    {
        _context = context;
    }

    //get:api/SolicitudesAcceso?estado=pendiente
    [HttpGet]
    public async Task<IActionResult> GetSolicitudesAcceso([FromQuery] string? estado)
    {
        var esAdminSyc = User.FindFirst("esAdminSyc")?.Value == "True";
        if (!esAdminSyc)
            return Forbid();
        
        var query = _context.SolicitudesAcceso
            .Include(s => s.ProyectosSolicitados)
                .ThenInclude(sp => sp.Proyecto)
            .AsQueryable();
        
        if (!string.IsNullOrWhiteSpace(estado))
        {
            query = query.Where(s => s.Estado == estado);
        }

        var solicitudes = await query
            .Select(s => new SolicitudAccesoResponseDto
            {
                Id = s.Id, 
                NombreCompleto = s.NombreCompleto,
                Email = s.Email,
                DocumentoIdentidad = s.DocumentoIdentidad,
                Telefono = s.Telefono,
                RolSolicitado = s.RolSolicitado,
                Motivo = s.Motivo,
                Estado = s.Estado,
                FechaSolicitud = s.FechaSolicitud,
                ProyectosSolicitados = s.ProyectosSolicitados.Select(sp => sp.Proyecto.Nombre).ToList()
            })
            .ToListAsync();
        return Ok(solicitudes);
    }

    [HttpPost("{id}/aprobar")]
public async Task<IActionResult> AprobarSolicitud(int id, AprobarSolicitudAccesoDto dto)
{
    var esAdminSyc = User.FindFirst("esAdminSyc")?.Value == "True";
    if (!esAdminSyc)
        return Forbid();

    var solicitud = await _context.SolicitudesAcceso
        .Include(s => s.ProyectosSolicitados)
        .FirstOrDefaultAsync(s => s.Id == id);

    if (solicitud == null)
        return NotFound();

    if (solicitud.Estado != "Pendiente")
        return BadRequest(new { mensaje = "Esta solicitud ya fue procesada" });

    var rol = await _context.Roles.FindAsync(dto.RolId);
    if (rol == null)
        return BadRequest(new { mensaje = "Rol inválido" });

    // El perfil Gerencial solo lo asigna un Administrador SYC desde Gestión de Usuarios —
    // nunca a través del flujo de solicitud de acceso público, aunque el RolId llegue directo.
    if (rol.Nombre == "Gerencial")
        return BadRequest(new { mensaje = "El perfil Gerencial no se puede asignar por este flujo — créalo desde Gestión de Usuarios." });

    var emailYaExiste = await _context.Usuarios.AnyAsync(u => u.Email == solicitud.Email);
    if (emailYaExiste)
        return BadRequest(new { mensaje = "Ya existe un usuario con este correo" });

    var passwordTemporal = Guid.NewGuid().ToString("N")[..10];

    var nuevoUsuario = new Usuario
    {
        NombreCompleto = solicitud.NombreCompleto,
        Email = solicitud.Email,
        PasswordHash = BCrypt.Net.BCrypt.HashPassword(passwordTemporal),
        Activo = true
    };

    _context.Usuarios.Add(nuevoUsuario);
    await _context.SaveChangesAsync();

    foreach (var sp in solicitud.ProyectosSolicitados)
    {
        _context.UsuarioProyectos.Add(new UsuarioProyecto
        {
            UsuarioId = nuevoUsuario.Id,
            ProyectoId = sp.ProyectoId,
            RolId = dto.RolId
        });
    }

    solicitud.Estado = "Aprobada";
    await _context.SaveChangesAsync();

    return Ok(new AprobarSolicitudAccesoResponseDto
    {
        UsuarioId = nuevoUsuario.Id,
        Email = nuevoUsuario.Email,
        PasswordTemporal = passwordTemporal
    });
}

[HttpPost("{id}/rechazar")]
public async Task<IActionResult> RechazarSolicitud(int id, RechazarSolicitudAccesoDto dto)
{
    var esAdminSyc = User.FindFirst("esAdminSyc")?.Value == "True";
    if (!esAdminSyc)
        return Forbid();

    var solicitud = await _context.SolicitudesAcceso.FindAsync(id);

    if (solicitud == null)
        return NotFound();

    if (solicitud.Estado != "Pendiente")
        return BadRequest(new { mensaje = "Esta solicitud ya fue procesada" });

    solicitud.Estado = "Rechazada";
    await _context.SaveChangesAsync();

    return NoContent();
}

}
