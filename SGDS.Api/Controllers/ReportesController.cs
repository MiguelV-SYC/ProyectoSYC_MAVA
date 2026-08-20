using ClosedXML.Excel;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using SGDS.Application.DTOs;
using SGDS.Application.Interfaces;
using SGDS.Domain.Entities;
using SGDS.Infrastructure.Data;
using QuestPDF.Fluent;
using QuestPDF.Helpers;
using QuestPDF.Infrastructure;

namespace SGDS.Api.Controllers;

[ApiController]
[Route("api/[controller]")]
[Authorize]
public class ReportesController : ControllerBase
{
    private readonly SgdsDbContext _context;
    private readonly IAlmacenamientoService _almacenamiento;

    public ReportesController(SgdsDbContext context, IAlmacenamientoService almacenamiento)
    {
        _context = context;
        _almacenamiento = almacenamiento;
    }

    private async Task<List<Solicitud>> ObtenerSolicitudesParaReporte(GenerarReporteDto dto)
    {
        var esAdminSyc = User.FindFirst("esAdminSyc")?.Value == "True";
        var proyectosPermitidos = User.FindAll("proyecto")
            .Select(c => int.Parse(c.Value.Split(':')[0]))
            .ToList();

        var query = _context.Solicitudes
            .Include(s => s.Ciudadano)
            .Include(s => s.Empresa)
            .Include(s => s.Proyecto)
            .Include(s => s.TipoSolicitud)
            .Include(s => s.UsuarioAsignado)
            .Include(s => s.TornaguiaInfoconsumo)
            .AsQueryable();

        if (!esAdminSyc)
        {
            query = query.Where(s => s.ProyectoId != null && proyectosPermitidos.Contains(s.ProyectoId.Value));
        }

        if (dto.ProyectoId.HasValue)
        {
            query = query.Where(s => s.ProyectoId == dto.ProyectoId.Value);
        }

        if (dto.Desde.HasValue)
        {
            var desdeUtc = DateTime.SpecifyKind(dto.Desde.Value, DateTimeKind.Utc);
            query = query.Where(s => s.FechaCreacion >= desdeUtc);
        }

        if (dto.Hasta.HasValue)
        {
            var hastaUtc = DateTime.SpecifyKind(dto.Hasta.Value.Date.AddDays(1).AddTicks(-1), DateTimeKind.Utc);
            query = query.Where(s => s.FechaCreacion <= hastaUtc);
        }

        if (dto.TipoSolicitudId.HasValue)
        {
            query = query.Where(s => s.TipoSolicitudId == dto.TipoSolicitudId.Value);
        }

        if (dto.EstadosIncluidos != null && dto.EstadosIncluidos.Count > 0)
        {
            // "Vencida" (Infoconsumo) nunca se persiste en Estado — se deriva de la vigencia
            // de la tornaguía, igual que EstadoEfectivo en InfoconsumoController.
            var estadosLiterales = dto.EstadosIncluidos.Where(e => e != "Vencida").ToList();
            var incluyeVencida = dto.EstadosIncluidos.Contains("Vencida");
            var ahora = DateTime.UtcNow;
            query = query.Where(s =>
                estadosLiterales.Contains(s.Estado) ||
                (incluyeVencida && s.Estado == "Expedida" && s.TornaguiaInfoconsumo != null
                    && s.TornaguiaInfoconsumo.FechaVigenciaLimite != null && s.TornaguiaInfoconsumo.FechaVigenciaLimite < ahora));
        }

        return await query.OrderByDescending(s => s.FechaCreacion).ToListAsync();
    }

    private static string EstadoEfectivoReporte(Solicitud s)
    {
        var t = s.TornaguiaInfoconsumo;
        if (s.Estado == "Expedida" && t?.FechaVigenciaLimite != null && t.FechaVigenciaLimite < DateTime.UtcNow)
            return "Vencida";
        return s.Estado;
    }

    private byte[] GenerarExcel(List<Solicitud> solicitudes)
    {
        using var libro = new XLWorkbook();
        var hoja = libro.Worksheets.Add("Solicitudes");

        var encabezados = new[] { "Número", "Proyecto", "Tipo", "Ciudadano/Empresa", "Documento", "Estado", "Fecha Radicación", "Fecha Cierre", "Asignado a" };
        for (var i = 0; i < encabezados.Length; i++)
        {
            hoja.Cell(1, i + 1).Value = encabezados[i];
            hoja.Cell(1, i + 1).Style.Font.Bold = true;
        }

        var fila = 2;
        foreach (var s in solicitudes)
        {
            var numero = s.Proyecto != null ? $"{s.Proyecto.Codigo}-{s.Id:0000}" : s.Id.ToString();
            var nombreAfiliado = s.Ciudadano?.NombreCompleto ?? s.Empresa?.RazonSocial ?? "";
            var documento = s.Ciudadano != null ? $"{s.Ciudadano.TipoDocumento} {s.Ciudadano.NumeroDocumento}" : s.Empresa?.Nit ?? "";

            hoja.Cell(fila, 1).Value = numero;
            hoja.Cell(fila, 2).Value = s.Proyecto?.Nombre ?? "";
            hoja.Cell(fila, 3).Value = s.TipoSolicitud?.Nombre ?? "";
            hoja.Cell(fila, 4).Value = nombreAfiliado;
            hoja.Cell(fila, 5).Value = documento;
            hoja.Cell(fila, 6).Value = EstadoEfectivoReporte(s);
            hoja.Cell(fila, 7).Value = s.FechaCreacion.ToString("yyyy-MM-dd");
            hoja.Cell(fila, 8).Value = s.FechaCierre?.ToString("yyyy-MM-dd") ?? "";
            hoja.Cell(fila, 9).Value = s.UsuarioAsignado?.NombreCompleto ?? "Sin asignar";
            fila++;
        }

        hoja.Columns().AdjustToContents();

        using var stream = new MemoryStream();
        libro.SaveAs(stream);
        return stream.ToArray();
    }


    private byte[] GenerarPdf(List<Solicitud> solicitudes)
    {
        var documento = Document.Create(contenedor =>
        {
            contenedor.Page(pagina =>
            {
                pagina.Size(PageSizes.A4.Landscape());
                pagina.Margin(30);

                pagina.Header()
                    .Text("Reporte de Solicitudes - SGDS")
                    .FontSize(16)
                    .Bold();

                pagina.Content().Table(tabla =>
                {
                    tabla.ColumnsDefinition(columnas =>
                    {
                        columnas.RelativeColumn();
                        columnas.RelativeColumn();
                        columnas.RelativeColumn(2);
                        columnas.RelativeColumn();
                        columnas.RelativeColumn();
                        columnas.RelativeColumn();
                    });

                    tabla.Header(encabezado =>
                    {
                        string[] titulos = { "Número", "Proyecto", "Ciudadano/Empresa", "Estado", "Fecha", "Asignado a" };
                        foreach (var titulo in titulos)
                        {
                            encabezado.Cell().Text(titulo).Bold();
                        }
                    });

                    foreach (var s in solicitudes)
                    {
                        var numero = s.Proyecto != null ? $"{s.Proyecto.Codigo}-{s.Id:0000}" : s.Id.ToString();
                        var nombreAfiliado = s.Ciudadano?.NombreCompleto ?? s.Empresa?.RazonSocial ?? "";

                        tabla.Cell().Text(numero);
                        tabla.Cell().Text(s.Proyecto?.Nombre ?? "");
                        tabla.Cell().Text(nombreAfiliado);
                        tabla.Cell().Text(EstadoEfectivoReporte(s));
                        tabla.Cell().Text(s.FechaCreacion.ToString("yyyy-MM-dd"));
                        tabla.Cell().Text(s.UsuarioAsignado?.NombreCompleto ?? "Sin asignar");
                    }
                });

                pagina.Footer()
                    .AlignCenter()
                    .Text(texto =>
                    {
                        texto.Span("Generado el ");
                        texto.Span(DateTime.UtcNow.ToString("yyyy-MM-dd HH:mm")).Bold();
                    });
            });
        });

        return documento.GeneratePdf();
    }

    [HttpGet("recientes")]
    public async Task<IActionResult> GetReportesRecientes([FromQuery] int? proyectoId, [FromQuery] int limite = 5)
        {
            var esAdminSyc = User.FindFirst("esAdminSyc")?.Value == "True";
            var proyectosPermitidos = User.FindAll("proyecto")
                .Select(c => int.Parse(c.Value.Split(':')[0]))
                .ToList();

            var query = _context.Reportes.AsQueryable();

            if (!esAdminSyc)
            {
                query = query.Where(r => r.ProyectoId != null && proyectosPermitidos.Contains(r.ProyectoId.Value));
            }

            if (proyectoId.HasValue)
            {
                query = query.Where(r => r.ProyectoId == proyectoId.Value);
            }

            var reportes = await query
                .OrderByDescending(r => r.FechaGeneracion)
                .Take(limite)
                .Select(r => new ReporteResponseDto
                {
                    Id = r.Id,
                    NombreArchivo = r.NombreArchivo,
                    Formato = r.Formato,
                    TotalRegistros = r.TotalRegistros,
                    FechaGeneracion = r.FechaGeneracion
                })
                .ToListAsync();

            return Ok(reportes);
    }

    [HttpGet("{id}/descargar")]
    public async Task<IActionResult> DescargarReporte(int id)
    {
        var esAdminSyc = User.FindFirst("esAdminSyc")?.Value == "True";
        var proyectosPermitidos = User.FindAll("proyecto")
            .Select(c => int.Parse(c.Value.Split(':')[0]))
            .ToList();

        var reporte = await _context.Reportes.FirstOrDefaultAsync(r => r.Id == id);

        if (reporte == null)
            return NotFound();

        if (!esAdminSyc && (reporte.ProyectoId == null || !proyectosPermitidos.Contains(reporte.ProyectoId.Value)))
        {
            return NotFound();
        }

        try
        {
            var stream = await _almacenamiento.ObtenerArchivoAsync(reporte.RutaArchivo);
            var tipoContenido = reporte.Formato == "xlsx"
                ? "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
                : "application/pdf";

            return File(stream, tipoContenido, reporte.NombreArchivo);
        }
        catch (FileNotFoundException)
        {
            return NotFound(new { mensaje = "El archivo físico no se encuentra disponible" });
        }
    }

     [HttpPost("generar")]
    public async Task<IActionResult> GenerarReporte(GenerarReporteDto dto)
    {
        if (dto.Formato != "xlsx" && dto.Formato != "pdf")
        {
            return BadRequest(new { mensaje = "El formato debe ser 'xlsx' o 'pdf'" });
        }

        var solicitudes = await ObtenerSolicitudesParaReporte(dto);

        byte[] contenido;
        string extension;
        

        if (dto.Formato == "xlsx")
        {
            contenido = GenerarExcel(solicitudes);
            extension = "xlsx";
        }
        else
        {
            contenido = GenerarPdf(solicitudes);
            extension = "pdf";
        }

        var nombreArchivo = $"Solicitudes_{DateTime.UtcNow:yyyyMMdd_HHmmss}.{extension}";
        var usuarioId = int.Parse(User.FindFirst("sub")!.Value);

        using var stream = new MemoryStream(contenido);
        var rutaGuardada = await _almacenamiento.GuardarArchivoAsync(stream, nombreArchivo, "reportes");

        var nuevoReporte = new Reporte
        {
            ProyectoId = dto.ProyectoId,
            UsuarioId = usuarioId,
            NombreArchivo = nombreArchivo,
            Formato = dto.Formato,
            RutaArchivo = rutaGuardada,
            TotalRegistros = solicitudes.Count,
            FechaGeneracion = DateTime.UtcNow
        };

        _context.Reportes.Add(nuevoReporte);
        await _context.SaveChangesAsync();

        return Ok(new ReporteResponseDto
        {
            Id = nuevoReporte.Id,
            NombreArchivo = nuevoReporte.NombreArchivo,
            Formato = nuevoReporte.Formato,
            TotalRegistros = nuevoReporte.TotalRegistros,
            FechaGeneracion = nuevoReporte.FechaGeneracion
        });
    }

}