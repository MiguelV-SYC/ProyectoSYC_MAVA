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
    public async Task<IActionResult> GetCiudadanos()
    {
        var ciudadanos = await _context.Ciudadanos
            .Select(c => new CiudadanoResponseDto
            {
                Id = c.Id,
                TipoDocumento = c.TipoDocumento,
                NumeroDocumento = c.NumeroDocumento,
                NombreCompleto = c.NombreCompleto,
                Telefono = c.Telefono,
                Email = c.Email
            })
            .ToListAsync();

        return Ok(ciudadanos);
    }
    

    // GET: api/Ciudadanos/5
    [HttpGet("{id}")]
    public async Task<IActionResult> GetCiudadano(int id)
    {
        var ciudadano = await _context.Ciudadanos.FindAsync(id);

        if (ciudadano == null)
            return NotFound();

        var dto = new CiudadanoResponseDto
        {
            Id = ciudadano.Id,
            TipoDocumento = ciudadano.TipoDocumento,
            NumeroDocumento = ciudadano.NumeroDocumento,
            NombreCompleto = ciudadano.NombreCompleto,
            Telefono = ciudadano.Telefono,
            Email = ciudadano.Email
        };

        return Ok(dto);
    }

    // POST: api/Ciudadanos
    [HttpPost]
    public async Task<IActionResult> CrearCiudadano(CrearCiudadanoDto dto)
    {
        var nuevoCiudadano = new Ciudadano
        {
            TipoDocumento = dto.TipoDocumento,
            NumeroDocumento = dto.NumeroDocumento,
            NombreCompleto = dto.NombreCompleto,
            Telefono = dto.Telefono,
            Email = dto.Email
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
    public async Task<IActionResult> ActualizarCiudadano(int id, CrearCiudadanoDto dto)    {
        var ciudadano = await _context.Ciudadanos.FindAsync(id);

        if (ciudadano == null)
            return NotFound();

        ciudadano.NombreCompleto = dto.NombreCompleto;
        ciudadano.Telefono = dto.Telefono;
        ciudadano.Email = dto.Email;

        await _context.SaveChangesAsync();

        return NoContent();
    }

    // DELETE: api/Ciudadanos/5  (en realidad inactiva, no borra)
    [HttpDelete("{id}")]
    public async Task<IActionResult> EliminarCiudadano(int id)
    {
        var ciudadano = await _context.Ciudadanos.FindAsync(id);

        if (ciudadano == null)
            return NotFound();

        _context.Ciudadanos.Remove(ciudadano);
        await _context.SaveChangesAsync();

        return NoContent();
    }
}