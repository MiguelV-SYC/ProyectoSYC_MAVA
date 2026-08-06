using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Microsoft.IdentityModel.Tokens;
using SGDS.Application.DTOs;
using SGDS.Infrastructure.Data;
using System.IdentityModel.Tokens.Jwt;
using System.Security.Claims;
using SGDS.Domain.Entities;
using System.Text;

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
}