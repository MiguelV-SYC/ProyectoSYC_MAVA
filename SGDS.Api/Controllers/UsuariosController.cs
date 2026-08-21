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
public class UsuariosController : ControllerBase
{
    private readonly SgdsDbContext _context;

    public UsuariosController(SgdsDbContext context)
    {
        _context = context;
    }

    // GET: api/Usuarios
    [HttpGet]
    public async Task<IActionResult> GetUsuarios()
    {
        var esAdminSyc = User.FindFirst("esAdminSyc")?.Value == "True";
        if (!esAdminSyc)
            return Forbid();

        var usuarios = await _context.Usuarios
            .Include(u => u.UsuarioProyectos)
                .ThenInclude(up => up.Proyecto)
            .Include(u => u.UsuarioProyectos)
                .ThenInclude(up => up.Rol)
            .ToListAsync();

        var resultado = usuarios.Select(u => new UsuarioResponseDto
            {
                Id = u.Id,
                NombreCompleto = u.NombreCompleto,
                Email = u.Email,
                Activo = u.Activo,
                EsAdminSyc = u.UsuarioProyectos.Any(up => up.Rol.Nombre == "Administrador SYC"),
                Proyectos = u.UsuarioProyectos.Select(up => new ProyectoRolDto
                {
                    ProyectoId = up.ProyectoId,
                    ProyectoNombre = up.Proyecto.Nombre,
                    RolNombre = up.Rol.Nombre
                }).ToList()
            }).ToList();

        return Ok(resultado);
    }

    // GET: api/Usuarios/5
    [HttpGet("{id}")]
    public async Task<IActionResult> GetUsuario(int id)
    {
        var esAdminSyc = User.FindFirst("esAdminSyc")?.Value == "True";
        if (!esAdminSyc)
            return Forbid();

        var usuario = await _context.Usuarios.FindAsync(id);

        if (usuario == null)
            return NotFound();

        var dto = new UsuarioResponseDto
        {
            Id = usuario.Id,
            NombreCompleto = usuario.NombreCompleto,
            Email = usuario.Email,
            Activo = usuario.Activo
        };

        return Ok(dto);
    }

    // POST: api/Usuarios
    // Único punto de creación de usuarios con asignación de rol/proyecto (incluye Gerencial y
    // Administrador SYC) — por eso exige esAdminSyc, igual que PUT {id}/proyectos. El flujo de
    // solicitar-acceso público nunca llega aquí directamente: pasa por su propia aprobación
    // (SolicitudesAccesoController), que ya bloquea el rol Gerencial explícitamente.
    [HttpPost]
    public async Task<IActionResult> CrearUsuario(CrearUsuarioDto dto)
    {
        var esAdminSyc = User.FindFirst("esAdminSyc")?.Value == "True";
        if (!esAdminSyc)
            return Forbid();

        var nuevoUsuario = new Usuario
        {
            NombreCompleto = dto.NombreCompleto,
            Email = dto.Email,
            PasswordHash = BCrypt.Net.BCrypt.HashPassword(dto.Password),
            Activo = true
        };

        _context.Usuarios.Add(nuevoUsuario);
        await _context.SaveChangesAsync();
//--formulario de creación de usuario en modulo admin
        if (dto.Proyectos != null && dto.Proyectos.Count > 0)
        {
            foreach (var asignacion in dto.Proyectos)
            {
                
            
                var proyectoExiste = await _context.Proyectos.AnyAsync(p => p.Id == asignacion.ProyectoId && p.Activo);
                var rolExiste = await _context.Roles.AnyAsync(r => r.Id == asignacion.RolId);

                if ( !proyectoExiste || !rolExiste)
                {
                    return BadRequest(new { mensaje = $"Proyecto o Rol inválido (ProyectoId={asignacion.ProyectoId}, RolId={asignacion.RolId})" });
                }

                _context.UsuarioProyectos.Add(new UsuarioProyecto
                {
                    UsuarioId = nuevoUsuario.Id,
                    ProyectoId = asignacion.ProyectoId,
                    RolId = asignacion.RolId
                });
            }
            await _context.SaveChangesAsync();
        }
//--
        var respuesta = new UsuarioResponseDto
        {
            Id = nuevoUsuario.Id,
            NombreCompleto = nuevoUsuario.NombreCompleto,
            Email = nuevoUsuario.Email,
            Activo = nuevoUsuario.Activo
        };

        return CreatedAtAction(nameof(GetUsuario), new { id = nuevoUsuario.Id }, respuesta);
    }

    // PUT: api/Usuarios/5
    [HttpPut("{id}")]
    public async Task<IActionResult> ActualizarUsuario(int id, ActualizarUsuarioDto dto)
    {
        var esAdminSyc = User.FindFirst("esAdminSyc")?.Value == "True";
        if (!esAdminSyc)
            return Forbid();

        var usuario = await _context.Usuarios.FindAsync(id);

        if (usuario == null)
            return NotFound();

        usuario.NombreCompleto = dto.NombreCompleto;
        usuario.Email = dto.Email;
        usuario.Activo = dto.Activo;

        await _context.SaveChangesAsync();

        return NoContent();
    }

    [HttpPut("{id}/proyectos")]
    public async Task<IActionResult> ActualizarProyectosUsuario(int id, ActualizarProyectosUsuarioDto dto)
    {
        var esAdminSyc = User.FindFirst("esAdminSyc")?.Value == "True";
        if (!esAdminSyc)
            return Forbid();

        var usuario = await _context.Usuarios
            .Include(u => u.UsuarioProyectos)
            .FirstOrDefaultAsync(u => u.Id == id);

        if (usuario == null)
            return NotFound();

        foreach (var asignacion in dto.Proyectos)
        {
            var proyectoExiste = await _context.Proyectos.AnyAsync(p => p.Id == asignacion.ProyectoId && p.Activo);
            var rolExiste = await _context.Roles.AnyAsync(r => r.Id == asignacion.RolId);

            if (!proyectoExiste || !rolExiste)
            {
                return BadRequest(new { mensaje = $"Proyecto o Rol inválido (ProyectoId={asignacion.ProyectoId}, RolId={asignacion.RolId})" });
            }
        }

        _context.UsuarioProyectos.RemoveRange(usuario.UsuarioProyectos);

        foreach (var asignacion in dto.Proyectos)
        {
            _context.UsuarioProyectos.Add(new UsuarioProyecto
            {
                UsuarioId = id,
                ProyectoId = asignacion.ProyectoId,
                RolId = asignacion.RolId
            });
        }

        await _context.SaveChangesAsync();

        return NoContent();
    }

    // DELETE: api/Usuarios/5  (en realidad inactiva, no borra)
    [HttpDelete("{id}")]
    public async Task<IActionResult> InactivarUsuario(int id)
    {
        var esAdminSyc = User.FindFirst("esAdminSyc")?.Value == "True";
        if (!esAdminSyc)
            return Forbid();

        var usuario = await _context.Usuarios.FindAsync(id);

        if (usuario == null)
            return NotFound();

        usuario.Activo = false;
        await _context.SaveChangesAsync();

        return NoContent();
    }
}