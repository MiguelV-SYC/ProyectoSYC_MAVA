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
public class VehiculosController : ControllerBase
{
    private readonly SgdsDbContext _context;

    public VehiculosController(SgdsDbContext context)
    {
        _context = context;
    }

    [HttpGet]
    public async Task<IActionResult> GetVehiculos([FromQuery] int? proyectoId)
    {
        var esAdminSyc = User.FindFirst("esAdminSyc")?.Value == "True";
        var proyectosPermitidos = User.FindAll("proyecto")
            .Select(c => int.Parse(c.Value.Split(':')[0]))
            .ToList();

        var query = _context.Vehiculos
            .Include(v => v.Ciudadano)
            .Include(v => v.Empresa)
            .AsQueryable();

        if (!esAdminSyc)
        {
            query = query.Where(v => v.Solicitudes.Any(s => s.ProyectoId != null && proyectosPermitidos.Contains(s.ProyectoId.Value)));
        }

        if (proyectoId.HasValue)
        {
            query = query.Where(v => v.Solicitudes.Any(s => s.ProyectoId == proyectoId.Value));
        }

        var vehiculos = await query
            .Select(v => new VehiculoResponseDto
            {
                Id = v.Id,
                CiudadanoId = v.CiudadanoId,
                CiudadanoNombre = v.Ciudadano != null ? v.Ciudadano.NombreCompleto : null,
                CiudadanoDocumento = v.Ciudadano != null ? v.Ciudadano.TipoDocumento + " " + v.Ciudadano.NumeroDocumento : null,
                EmpresaId = v.EmpresaId,
                EmpresaNombre = v.Empresa != null ? v.Empresa.RazonSocial : null,
                EmpresaNit = v.Empresa != null ? v.Empresa.Nit : null,
                Placa = v.Placa,
                Marca = v.Marca,
                Linea = v.Linea,
                Modelo = v.Modelo,
                NumeroChasis = v.NumeroChasis
            })
            .ToListAsync();

        return Ok(vehiculos);
    }

    [HttpGet("{id}")]
    public async Task<IActionResult> GetVehiculo(int id)
    {
        var esAdminSyc = User.FindFirst("esAdminSyc")?.Value == "True";
        var proyectosPermitidos = User.FindAll("proyecto")
            .Select(c => int.Parse(c.Value.Split(':')[0]))
            .ToList();

        var vehiculo = await _context.Vehiculos
            .Include(v => v.Ciudadano)
            .Include(v => v.Empresa)
            .Include(v => v.Solicitudes)
            .FirstOrDefaultAsync(v => v.Id == id);

        if (vehiculo == null)
            return NotFound();

        if (!esAdminSyc && !vehiculo.Solicitudes.Any(s => s.ProyectoId != null && proyectosPermitidos.Contains(s.ProyectoId.Value)))
        {
            return NotFound();
        }

        var dto = new VehiculoResponseDto
        {
            Id = vehiculo.Id,
            CiudadanoId = vehiculo.CiudadanoId,
            CiudadanoNombre = vehiculo.Ciudadano?.NombreCompleto,
            CiudadanoDocumento = vehiculo.Ciudadano != null ? $"{vehiculo.Ciudadano.TipoDocumento} {vehiculo.Ciudadano.NumeroDocumento}" : null,
            EmpresaId = vehiculo.EmpresaId,
            EmpresaNombre = vehiculo.Empresa?.RazonSocial,
            EmpresaNit = vehiculo.Empresa?.Nit,
            Placa = vehiculo.Placa,
            Marca = vehiculo.Marca,
            Linea = vehiculo.Linea,
            Modelo = vehiculo.Modelo,
            NumeroChasis = vehiculo.NumeroChasis
        };

        return Ok(dto);
    }

    [HttpPost]
    public async Task<IActionResult> CrearVehiculo(CrearVehiculoDto dto)
    {
        if (string.IsNullOrWhiteSpace(dto.Placa))
        {
            return BadRequest(new { mensaje = "La placa es obligatoria" });
        }

        var nuevoVehiculo = new Vehiculo
        {
            CiudadanoId = dto.CiudadanoId,
            EmpresaId = dto.EmpresaId,
            Placa = dto.Placa,
            Marca = dto.Marca,
            Linea = dto.Linea,
            Modelo = dto.Modelo,
            NumeroChasis = dto.NumeroChasis
        };

        _context.Vehiculos.Add(nuevoVehiculo);
        await _context.SaveChangesAsync();

        var respuesta = new VehiculoResponseDto
        {
            Id = nuevoVehiculo.Id,
            CiudadanoId = nuevoVehiculo.CiudadanoId,
            EmpresaId = nuevoVehiculo.EmpresaId,
            Placa = nuevoVehiculo.Placa,
            Marca = nuevoVehiculo.Marca,
            Linea = nuevoVehiculo.Linea,
            Modelo = nuevoVehiculo.Modelo,
            NumeroChasis = nuevoVehiculo.NumeroChasis
        };

        return CreatedAtAction(nameof(GetVehiculo), new { id = nuevoVehiculo.Id }, respuesta);
    }

    // PUT: api/Vehiculos/5
    [HttpPut("{id}")]
    public async Task<IActionResult> ActualizarVehiculo(int id, CrearVehiculoDto dto)
    {
        if (string.IsNullOrWhiteSpace(dto.Placa))
        {
            return BadRequest(new { mensaje = "La placa es obligatoria" });
        }

        var vehiculo = await _context.Vehiculos.FindAsync(id);

        if (vehiculo == null)
            return NotFound();

        vehiculo.CiudadanoId = dto.CiudadanoId;
        vehiculo.EmpresaId = dto.EmpresaId;
        vehiculo.Placa = dto.Placa;
        vehiculo.Marca = dto.Marca;
        vehiculo.Linea = dto.Linea;
        vehiculo.Modelo = dto.Modelo;
        vehiculo.NumeroChasis = dto.NumeroChasis;

        await _context.SaveChangesAsync();

        return NoContent();
    }

    // DELETE: api/Vehiculos/5
    [HttpDelete("{id}")]
    public async Task<IActionResult> EliminarVehiculo(int id)
    {
        var vehiculo = await _context.Vehiculos.FindAsync(id);

        if (vehiculo == null)
            return NotFound();

        _context.Vehiculos.Remove(vehiculo);
        await _context.SaveChangesAsync();

        return NoContent();
    }
}