using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using SGDS.Application.DTOs;
using SGDS.Domain.Entities;
using SGDS.Infrastructure.Data;

namespace SGDS.Api.Controllers;

[ApiController]
[Route("api/[controller]")]
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
        var usuarios = await _context.Usuarios
            .Select(u => new UsuarioResponseDto
            {
                Id = u.Id,
                NombreCompleto = u.NombreCompleto,
                Email = u.Email,
                Activo = u.Activo
            })
            .ToListAsync();

        return Ok(usuarios);
    }

    // GET: api/Usuarios/5
    [HttpGet("{id}")]
    public async Task<IActionResult> GetUsuario(int id)
    {
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
    [HttpPost]
    public async Task<IActionResult> CrearUsuario(CrearUsuarioDto dto)
    {
        var nuevoUsuario = new Usuario
        {
            NombreCompleto = dto.NombreCompleto,
            Email = dto.Email,
            PasswordHash = BCrypt.Net.BCrypt.HashPassword(dto.Password),
            Activo = true
        };

        _context.Usuarios.Add(nuevoUsuario);
        await _context.SaveChangesAsync();

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
        var usuario = await _context.Usuarios.FindAsync(id);

        if (usuario == null)
            return NotFound();

        usuario.NombreCompleto = dto.NombreCompleto;
        usuario.Email = dto.Email;

        await _context.SaveChangesAsync();

        return NoContent();
    }

    // DELETE: api/Usuarios/5  (en realidad inactiva, no borra)
    [HttpDelete("{id}")]
    public async Task<IActionResult> InactivarUsuario(int id)
    {
        var usuario = await _context.Usuarios.FindAsync(id);

        if (usuario == null)
            return NotFound();

        usuario.Activo = false;
        await _context.SaveChangesAsync();

        return NoContent();
    }
}