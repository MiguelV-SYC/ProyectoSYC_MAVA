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
public class EmpresasController : ControllerBase
{
    private readonly SgdsDbContext _context;

    public EmpresasController(SgdsDbContext context)
    {
        _context = context;
    }

    // GET: api/Empresas
    [HttpGet]
public async Task<IActionResult> GetEmpresas()
{
    var esAdminSyc = User.FindFirst("esAdminSyc")?.Value == "True";
    var proyectosPermitidos = User.FindAll("proyecto")
        .Select(c => int.Parse(c.Value.Split(':')[0]))
        .ToList();

    var query = _context.Empresas.AsQueryable();

    if (!esAdminSyc)
    {
        query = query.Where(e => e.Solicitudes.Any(s => s.ProyectoId != null && proyectosPermitidos.Contains(s.ProyectoId.Value)));
    }

    var empresas = await query
        .Select(e => new EmpresaResponseDto
        {
            Id = e.Id,
            Nit = e.Nit,
            RazonSocial = e.RazonSocial
        })
        .ToListAsync();

    return Ok(empresas);
}

    // GET: api/Empresas/5
    [HttpGet("{id}")]
    public async Task<IActionResult> GetEmpresa(int id)
    {
        var empresa = await _context.Empresas.FindAsync(id);

        if (empresa == null)
            return NotFound();

        var dto = new EmpresaResponseDto
        {
            Id = empresa.Id,
            Nit = empresa.Nit,
            RazonSocial = empresa.RazonSocial
        };

        return Ok(dto);
    }

    // POST: api/Empresas
    [HttpPost]
    public async Task<IActionResult> CrearEmpresa(CrearEmpresaDto dto)
    {
        var nuevaEmpresa = new Empresa
        {
            Nit = dto.Nit,
            RazonSocial = dto.RazonSocial
        };

        _context.Empresas.Add(nuevaEmpresa);
        await _context.SaveChangesAsync();

        var respuesta = new EmpresaResponseDto
        {
            Id = nuevaEmpresa.Id,
            Nit = nuevaEmpresa.Nit,
            RazonSocial = nuevaEmpresa.RazonSocial
        };

        return CreatedAtAction(nameof(GetEmpresa), new { id = nuevaEmpresa.Id }, respuesta);
    }

    // PUT: api/Empresas/5
    [HttpPut("{id}")]
    public async Task<IActionResult> ActualizarEmpresa(int id, CrearEmpresaDto dto)    
    {
        var empresa = await _context.Empresas.FindAsync(id);

        if (empresa == null)
            return NotFound();

        empresa.Nit = dto.Nit;
        empresa.RazonSocial = dto.RazonSocial;

        await _context.SaveChangesAsync();

        return NoContent();
    }

    // DELETE: api/Empresas/5  (en realidad inactiva, no borra)
    [HttpDelete("{id}")]
    public async Task<IActionResult> EliminarEmpresa(int id)
    {
        var empresa = await _context.Empresas.FindAsync(id);

        if (empresa == null)
            return NotFound();

        _context.Empresas.Remove(empresa);
        await _context.SaveChangesAsync();

        return NoContent();
    }
}