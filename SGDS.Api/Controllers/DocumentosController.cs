using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using SGDS.Application.DTOs;
using SGDS.Infrastructure.Data;

namespace SGDS.Api.Controllers;

[ApiController]
[Route("api/[controller]")]
[Authorize]
public class DocumentosController : ControllerBase
{
    private readonly SgdsDbContext _context;
    public DocumentosController(SgdsDbContext context)
    {
        _context = context;
    }

    [HttpGet]
    public async Task<IActionResult> GetDocumentos([FromQuery] int? ciudadanoId)
    {
        var esAdminSyc = User.FindFirst("esAdminSyc")?.Value == "True";
        var proyectosPermitidos = User.FindAll("proyecto")
            .Select(c => int.Parse(c.Value.Split(':')[0]))
            .ToList();

        var query = _context.Documentos
            .Include(d => d.Solicitud)
                .ThenInclude(s => s!.Proyecto)
            .AsQueryable();

        if (!esAdminSyc)
        {
            query = query.Where(d => d.Solicitud != null && d.Solicitud.ProyectoId != null
                && proyectosPermitidos.Contains(d.Solicitud.ProyectoId.Value));
        }

        if (ciudadanoId.HasValue)
        {
            query = query.Where(d => d.Solicitud != null && d.Solicitud.CiudadanoId == ciudadanoId.Value);
        }

        var documentos = await query 
            .Select(d => new DocumentoResponseDto
            {
                Id = d.Id,
                NombreArchivo = d.NombreArchivo,
                SolicitudNumero = d.Solicitud != null && d.Solicitud.Proyecto != null
                    ? d.Solicitud.Proyecto.Codigo + "-" + d.Solicitud.Id.ToString("000")
                    : d.SolicitudId.ToString(),
                Fecha = d.FechaCarga
            })
            .ToListAsync();

        return Ok(documentos);
    }
}