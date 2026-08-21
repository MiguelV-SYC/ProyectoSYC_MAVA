using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using SGDS.Application.DTOs;
using SGDS.Infrastructure.Data;

namespace SGDS.Api.Controllers;

[ApiController]
[Route("api/[controller]")]
[Authorize]
public class AuditoriaController : ControllerBase
{
    private readonly SgdsDbContext _context;

    public AuditoriaController(SgdsDbContext context)
    {
        _context = context;
    }

    [HttpGet]
    public async Task<IActionResult> GetAuditoria(
        [FromQuery] string? buscar,
        [FromQuery] int? proyectoId,
        [FromQuery] string? modulo,
        [FromQuery] DateTime? fecha,
        [FromQuery] int pagina = 1,
        [FromQuery] int tamanoPagina = 20)
    {
        var esAdminSyc = User.FindFirst("esAdminSyc")?.Value == "True";
        var esGerencial = User.FindFirst("esGerencial")?.Value == "True";
        if (!esAdminSyc && !esGerencial)
            return Forbid();

        var query = _context.Auditorias
            .Include(a => a.Usuario)
            .Include(a => a.Proyecto)
            .AsQueryable();

        if (!string.IsNullOrWhiteSpace(buscar))
        {
            query = query.Where(a =>
                (a.Usuario != null && a.Usuario.NombreCompleto.Contains(buscar)) ||
                a.Accion.Contains(buscar));
        }

        if (proyectoId.HasValue)
        {
            query = query.Where(a => a.ProyectoId == proyectoId.Value);
        }

        if (!string.IsNullOrWhiteSpace(modulo))
        {
            query = query.Where(a => a.Modulo == modulo);
        }

        if (fecha.HasValue)
        {
            var fechaUtc = DateTime.SpecifyKind(fecha.Value.Date, DateTimeKind.Utc);
            query = query.Where(a => a.FechaHora >= fechaUtc && a.FechaHora < fechaUtc.AddDays(1));
        }

        var totalRegistros = await query.CountAsync();
        var totalPaginas = (int)Math.Ceiling(totalRegistros / (double)tamanoPagina);

        var registros = await query
            .OrderByDescending(a => a.FechaHora)
            .Skip((pagina - 1) * tamanoPagina)
            .Take(tamanoPagina)
            .Select(a => new AuditoriaResponseDto
            {
                Id = a.Id,
                UsuarioNombre = a.Usuario != null ? a.Usuario.NombreCompleto : "Sistema",
                Accion = a.Accion,
                Modulo = a.Modulo,
                ProyectoNombre = a.Proyecto != null ? a.Proyecto.Nombre : null,
                FechaHora = a.FechaHora,
                DireccionIp = a.DireccionIp
            })
            .ToListAsync();

        var respuesta = new ListadoAuditoriaResponseDto
        {
            Pagina = new PaginacionResponseDto<AuditoriaResponseDto>
            {
                Datos = registros,
                TotalRegistros = totalRegistros,
                PaginaActual = pagina,
                TotalPaginas = totalPaginas
            }
        };

        return Ok(respuesta);
    }

    [HttpGet("modulos")]
    public async Task<IActionResult> GetModulos()
    {
        var esAdminSyc = User.FindFirst("esAdminSyc")?.Value == "True";
        var esGerencial = User.FindFirst("esGerencial")?.Value == "True";
        if (!esAdminSyc && !esGerencial)
            return Forbid();

        var modulos = await _context.Auditorias
            .Where(a => a.Modulo != null)
            .Select(a => a.Modulo!)
            .Distinct()
            .OrderBy(m => m)
            .ToListAsync();

        return Ok(modulos);
    }

[HttpGet("exportar")]
    public IActionResult ExportarAuditoria(
        [FromQuery] string? buscar,
        [FromQuery] int? proyectoId,
        [FromQuery] string? modulo,
        [FromQuery] DateTime? fecha)
    {
        var esAdminSyc = User.FindFirst("esAdminSyc")?.Value == "True";
        var esGerencial = User.FindFirst("esGerencial")?.Value == "True";
        if (!esAdminSyc && !esGerencial)
            return Forbid();

        var query = _context.Auditorias
            .Include(a => a.Usuario)
            .Include(a => a.Proyecto)
            .AsQueryable();

        if (!string.IsNullOrWhiteSpace(buscar))
        {
            query = query.Where(a =>
                (a.Usuario != null && a.Usuario.NombreCompleto.Contains(buscar)) ||
                a.Accion.Contains(buscar));
        }

        if (proyectoId.HasValue)
        {
            query = query.Where(a => a.ProyectoId == proyectoId.Value);
        }

        if (!string.IsNullOrWhiteSpace(modulo))
        {
            query = query.Where(a => a.Modulo == modulo);
        }

        if (fecha.HasValue)
        {
            var fechaUtc = DateTime.SpecifyKind(fecha.Value.Date, DateTimeKind.Utc);
            query = query.Where(a => a.FechaHora >= fechaUtc && a.FechaHora < fechaUtc.AddDays(1));
        }

        var registros = query.OrderByDescending(a => a.FechaHora).ToList();

        using var libro = new ClosedXML.Excel.XLWorkbook();
        var hoja = libro.Worksheets.Add("Auditoria");

        var encabezados = new[] { "Usuario", "Acción", "Módulo", "Proyecto", "Fecha", "IP" };
        for (var i = 0; i < encabezados.Length; i++)
        {
            hoja.Cell(1, i + 1).Value = encabezados[i];
            hoja.Cell(1, i + 1).Style.Font.Bold = true;
        }

        var fila = 2;
        foreach (var a in registros)
        {
            hoja.Cell(fila, 1).Value = a.Usuario?.NombreCompleto ?? "Sistema";
            hoja.Cell(fila, 2).Value = a.Accion;
            hoja.Cell(fila, 3).Value = a.Modulo ?? "";
            hoja.Cell(fila, 4).Value = a.Proyecto?.Nombre ?? "";
            hoja.Cell(fila, 5).Value = a.FechaHora.ToString("yyyy-MM-dd HH:mm");
            hoja.Cell(fila, 6).Value = a.DireccionIp ?? "";
            fila++;
        }

        hoja.Columns().AdjustToContents();

        using var stream = new MemoryStream();
        libro.SaveAs(stream);

        var nombreArchivo = $"Auditoria_{DateTime.UtcNow:yyyyMMdd_HHmmss}.xlsx";
        return File(stream.ToArray(), "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet", nombreArchivo);
    }
}