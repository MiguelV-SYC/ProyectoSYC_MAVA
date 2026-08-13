using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using SGDS.Application.DTOs;
using SGDS.Infrastructure.Data;
using SGDS.Application.Interfaces;

namespace SGDS.Api.Controllers;

[ApiController]
[Route("api/[controller]")]
[Authorize]
public class DocumentosController : ControllerBase
{
    private readonly SgdsDbContext _context;
    private readonly IAlmacenamientoService _almacenamiento;

    public DocumentosController(SgdsDbContext context, IAlmacenamientoService almacenamiento)
{
    _context = context;
    _almacenamiento = almacenamiento;
}
private static string ClasificarTipo(string? tipoArchivo)
{
    if (string.IsNullOrWhiteSpace(tipoArchivo))
        return "Otros";

    if (tipoArchivo == "application/pdf")
        return "PDF";

    if (tipoArchivo.StartsWith("image/"))
        return "Imágenes";

    return "Otros";
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

//metodo get para descargue de documentos 
    [HttpGet("{id}/descargar")]
public async Task<IActionResult> DescargarDocumento(int id)
{
    var esAdminSyc = User.FindFirst("esAdminSyc")?.Value == "True";
    var proyectosPermitidos = User.FindAll("proyecto")
        .Select(c => int.Parse(c.Value.Split(':')[0]))
        .ToList();

    var documento = await _context.Documentos
        .Include(d => d.Solicitud)
        .FirstOrDefaultAsync(d => d.Id == id);

    if (documento == null)
        return NotFound();

    if (!esAdminSyc && (documento.Solicitud == null || documento.Solicitud.ProyectoId == null
        || !proyectosPermitidos.Contains(documento.Solicitud.ProyectoId.Value)))
    {
        return NotFound();
    }

    try
    {
        var stream = await _almacenamiento.ObtenerArchivoAsync(documento.RutaArchivo);
        var tipoContenido = documento.TipoArchivo ?? "application/octet-stream";

        return File(stream, tipoContenido, documento.NombreArchivo);
    }
    catch (FileNotFoundException)
    {
        return NotFound(new { mensaje = "El archivo físico no se encuentra disponible" });
    }
}


[HttpGet("listado")]
public async Task<IActionResult> GetListadoDocumentos(
    [FromQuery] int? proyectoId,
    [FromQuery] int? ciudadanoId,
    [FromQuery] string? buscar,
    [FromQuery] string? tipo,
    [FromQuery] int pagina = 1,
    [FromQuery] int tamanoPagina = 20)
{
    var esAdminSyc = User.FindFirst("esAdminSyc")?.Value == "True";
    var proyectosPermitidos = User.FindAll("proyecto")
        .Select(c => int.Parse(c.Value.Split(':')[0]))
        .ToList();

    var queryBase = _context.Documentos
        .Include(d => d.Solicitud)
            .ThenInclude(s => s!.Proyecto)
        .AsQueryable();

    if (!esAdminSyc)
    {
        queryBase = queryBase.Where(d => d.Solicitud != null && d.Solicitud.ProyectoId != null
            && proyectosPermitidos.Contains(d.Solicitud.ProyectoId.Value));
    }

    if (proyectoId.HasValue)
    {
        queryBase = queryBase.Where(d => d.Solicitud != null && d.Solicitud.ProyectoId == proyectoId.Value);
    }

    if (ciudadanoId.HasValue)
    {
        queryBase = queryBase.Where(d => d.Solicitud != null && d.Solicitud.CiudadanoId == ciudadanoId.Value);
    }

    if (!string.IsNullOrWhiteSpace(buscar))
    {
        queryBase = queryBase.Where(d =>
            d.NombreArchivo.Contains(buscar) ||
            (d.Solicitud != null && d.Solicitud.Id.ToString().Contains(buscar)));
    }

    // A partir de aquí trabajamos en memoria, porque ClasificarTipo() no se puede traducir a SQL
    var todosLosDocumentos = await queryBase
        .OrderByDescending(d => d.FechaCarga)
        .ToListAsync();

    var conteosPorTipo = todosLosDocumentos
        .GroupBy(d => ClasificarTipo(d.TipoArchivo))
        .Select(g => new ConteoTipoArchivoDto { Tipo = g.Key, Total = g.Count() })
        .ToList();

    var documentosFiltrados = todosLosDocumentos;
    if (!string.IsNullOrWhiteSpace(tipo) && tipo != "Todos")
    {
        documentosFiltrados = documentosFiltrados
            .Where(d => ClasificarTipo(d.TipoArchivo) == tipo)
            .ToList();
    }

    var totalRegistros = documentosFiltrados.Count;
    var totalPaginas = (int)Math.Ceiling(totalRegistros / (double)tamanoPagina);

    var datos = documentosFiltrados
        .Skip((pagina - 1) * tamanoPagina)
        .Take(tamanoPagina)
        .Select(d => new DocumentoResponseDto
        {
            Id = d.Id,
            NombreArchivo = d.NombreArchivo,
            SolicitudNumero = d.Solicitud?.Proyecto != null
                ? $"{d.Solicitud.Proyecto.Codigo}-{d.Solicitud.Id:0000}"
                : d.SolicitudId.ToString(),
            Fecha = d.FechaCarga,
            TamanoBytes = d.TamanoBytes,
            TipoArchivo = d.TipoArchivo,
            Categoria = ClasificarTipo(d.TipoArchivo)
        }).ToList();

    var respuesta = new ListadoDocumentosResponseDto
    {
        Pagina = new PaginacionResponseDto<DocumentoResponseDto>
        {
            Datos = datos,
            TotalRegistros = totalRegistros,
            PaginaActual = pagina,
            TotalPaginas = totalPaginas
        },
        ConteosPorTipo = conteosPorTipo
    };

    return Ok(respuesta);
}
}