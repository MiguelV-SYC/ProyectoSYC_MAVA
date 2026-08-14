using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Microsoft.IdentityModel.Tokens;
using SGDS.Application.DTOs;
using SGDS.Infrastructure.Data;
using System.IdentityModel.Tokens.Jwt;
using System.Security.Claims;
using SGDS.Domain.Entities;
using System.Text;
using Microsoft.AspNetCore.Authorization;

namespace SGDS.Api.Controllers;

[ApiController]
[Route("api/[controller]")]
public class AuthController : ControllerBase
{
    private readonly SgdsDbContext _context;
    private readonly IConfiguration _configuration;

    public AuthController(SgdsDbContext context, IConfiguration configuration)
    {
        _context = context;
        _configuration = configuration;
    }

   [HttpPost("login")]
    public async Task<IActionResult> Login(LoginDto dto)
    {
        var usuario = await _context.Usuarios
            .Include(u => u.UsuarioProyectos)
                .ThenInclude(up => up.Proyecto)
            .Include(u => u.UsuarioProyectos)
                .ThenInclude(up => up.Rol)
            .FirstOrDefaultAsync(u => u.Email == dto.Email && u.Activo);

        if (usuario == null || !BCrypt.Net.BCrypt.Verify(dto.Password, usuario.PasswordHash))
        {
            return Unauthorized(new { mensaje = "Email o contraseña incorrectos" });
        }

        var token = GenerarToken(usuario);

        var respuesta = new LoginResponseDto
        {
            Token = token,
            Email = usuario.Email,
            NombreCompleto = usuario.NombreCompleto
        };

        return Ok(respuesta);
    }

    private string GenerarToken(Usuario usuario)
    {
        var jwtKey = _configuration["Jwt:Key"]!;
        var jwtIssuer = _configuration["Jwt:Issuer"];
        var jwtAudience = _configuration["Jwt:Audience"];
        var expiresInMinutes = double.Parse(_configuration["Jwt:ExpiresInMinutes"]!);

        var claims = new List<Claim>
        {
            new Claim(JwtRegisteredClaimNames.Sub, usuario.Id.ToString()),
            new Claim(JwtRegisteredClaimNames.Email, usuario.Email),
            new Claim("nombreCompleto", usuario.NombreCompleto)
        };

        var esAdminSyc = usuario.UsuarioProyectos.Any(up => up.Rol.Nombre == "Administrador SYC");
        claims.Add(new Claim("esAdminSyc", esAdminSyc.ToString()));

        foreach (var up in usuario.UsuarioProyectos)
        {
            claims.Add(new Claim("proyecto", $"{up.ProyectoId}:{up.Rol.Nombre}"));
        }

        var key = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(jwtKey));
        var credenciales = new SigningCredentials(key, SecurityAlgorithms.HmacSha256);

        var token = new JwtSecurityToken(
            issuer: jwtIssuer,
            audience: jwtAudience,
            claims: claims,
            expires: DateTime.UtcNow.AddMinutes(expiresInMinutes),
            signingCredentials: credenciales
        );

        return new JwtSecurityTokenHandler().WriteToken(token);
    }

    [HttpPost("solicitar-acceso")]
    public async Task<IActionResult> SolicitarAcceso(SolicitarAccesoDto dto)
    {
        if (dto.ProyectosSolicitados == null || dto.ProyectosSolicitados.Count == 0)
        {
            return BadRequest(new { mensaje = "Debe seleccionar al menos un proyecto" });
        }

        var proyectosValidos = await _context.Proyectos
            .Where(p => dto.ProyectosSolicitados.Contains(p.Id) && p.Activo)
            .Select(p => p.Id)
            .ToListAsync();

        if (proyectosValidos.Count != dto.ProyectosSolicitados.Count)
        {
            return BadRequest(new { mensaje = "Uno o más proyectos seleccionados no son válidos" });
        }

        var nuevaSolicitud = new SolicitudAcceso
        {
            NombreCompleto = dto.NombreCompleto,
            Email = dto.Email,
            DocumentoIdentidad = dto.DocumentoIdentidad,
            Telefono = dto.Telefono,
            RolSolicitado = dto.RolSolicitado,
            Motivo = dto.Motivo,
            Estado = "Pendiente"
        };

        foreach (var proyectoId in proyectosValidos)
        {
            nuevaSolicitud.ProyectosSolicitados.Add(new SolicitudAccesoProyecto { ProyectoId = proyectoId });
        }

        _context.SolicitudesAcceso.Add(nuevaSolicitud);
        await _context.SaveChangesAsync();

        return Ok(new { mensaje = "Solicitud registrada. Un administrador la revisará y te contactará por correo." });
    }
//cambiar contraseña siendo operador y estando logueado
    [HttpPut("cambiar-password")]
    [Authorize]
    public async Task<IActionResult> CambiarPassword(CambiarPasswordDto dto)
    {
        var usuarioId = int.Parse(User.FindFirst("sub")!.Value);

        var usuario = await _context.Usuarios.FindAsync(usuarioId);

        if (usuario == null)
            return NotFound();

        if (!BCrypt.Net.BCrypt.Verify(dto.ContrasenaActual, usuario.PasswordHash))
        {
            return BadRequest(new { mensaje = "La contraseña actual no es correcta" });
        }

        if (string.IsNullOrWhiteSpace(dto.ContrasenaNueva) || dto.ContrasenaNueva.Length < 8)
        {
            return BadRequest(new { mensaje = "La nueva contraseña debe tener al menos 8 caracteres" });
        }

        usuario.PasswordHash = BCrypt.Net.BCrypt.HashPassword(dto.ContrasenaNueva);
        await _context.SaveChangesAsync();

        return NoContent();
    }
}