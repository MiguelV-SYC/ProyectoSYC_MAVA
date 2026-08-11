using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Http.HttpResults;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using SGDS.Application.DTOs;
using SGDS.Infrastructure.Data;

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
       
}
