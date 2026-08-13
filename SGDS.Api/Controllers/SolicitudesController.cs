using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using SGDS.Application.DTOs;
using SGDS.Domain.Entities;
using SGDS.Infrastructure.Data;
using SGDS.Application.Interfaces;

namespace SGDS.Api.Controllers;

[ApiController]
[Route("api/[controller]")]
[Authorize]
public class SolicitudesController : ControllerBase
{
    private readonly SgdsDbContext _context;
private readonly IAlmacenamientoService _almacenamiento;

public SolicitudesController(SgdsDbContext context, IAlmacenamientoService almacenamiento)
{
    _context = context;
    _almacenamiento = almacenamiento;
}

    // GET: api/Solicitudes
[HttpGet]
public async Task<IActionResult> GetSolicitudes([FromQuery] int? ciudadanoId, [FromQuery] int? empresaId)
{
    var esAdminSyc = User.FindFirst("esAdminSyc")?.Value == "True";
    var proyectosClaims = User.FindAll("proyecto").Select(c => c.Value.Split(':')[0]).ToList();
    var proyectosPermitidos = proyectosClaims.Select(int.Parse).ToList();

    var query = _context.Solicitudes
        .Include(s => s.Ciudadano)
        .Include(s => s.Empresa)
        .Include(s => s.UsuarioAsignado)
        .Include(s => s.Proyecto)
        .Include(s => s.TipoSolicitud)
        .AsQueryable();

    if (!esAdminSyc)
    {
        query = query.Where(s => s.ProyectoId != null && proyectosPermitidos.Contains(s.ProyectoId.Value));
    }

    if (ciudadanoId.HasValue)
    {
        query = query.Where(s => s.CiudadanoId == ciudadanoId.Value);
    }

    if (empresaId.HasValue)
    {
        query = query.Where(s => s.EmpresaId == empresaId.Value);
    }

    var solicitudes = await query
        .Select(s => new SolicitudResponseDto
        {
            Id = s.Id,
            Numero = s.Proyecto != null ? s.Proyecto.Codigo + "-" + s.Id.ToString("0000") : s.Id.ToString(),
            CiudadanoId = s.CiudadanoId,
            CiudadanoNombre = s.Ciudadano != null ? s.Ciudadano.NombreCompleto : null,
            CiudadanoDocumento = s.Ciudadano != null ? s.Ciudadano.TipoDocumento + " " + s.Ciudadano.NumeroDocumento : null,
            EmpresaId = s.EmpresaId,
            EmpresaNombre = s.Empresa != null ? s.Empresa.RazonSocial : null,
            EmpresaNit = s.Empresa != null ? s.Empresa.Nit : null,
            UsuarioAsignadoId = s.UsuarioAsignadoId,
            UsuarioAsignadoNombre = s.UsuarioAsignado != null ? s.UsuarioAsignado.NombreCompleto : null,
            TipoSolicitudNombre = s.TipoSolicitud != null ? s.TipoSolicitud.Nombre : null,
            Estado = s.Estado,
            FechaCreacion = s.FechaCreacion,
            FechaCierre = s.FechaCierre
        })
        .ToListAsync();

    return Ok(solicitudes);
}
// GET: api/Solicitudes/5
[HttpGet("{id}")]
public async Task<IActionResult> GetSolicitud(int id)
{
    var esAdminSyc = User.FindFirst("esAdminSyc")?.Value == "True";
    var proyectosPermitidos = User.FindAll("proyecto")
        .Select(c => int.Parse(c.Value.Split(':')[0]))
        .ToList();

    var solicitud = await _context.Solicitudes
        .Include(s => s.Ciudadano)
        .Include(s => s.Empresa)
        .Include(s => s.UsuarioAsignado)
        .Include(s => s.Proyecto)
        .Include(s => s.TipoSolicitud)
        .Include(s => s.HistorialEstados)
            .ThenInclude(h => h.Usuario)
        .Include(s => s.Documentos)
        .FirstOrDefaultAsync(s => s.Id == id);

    if (solicitud == null)
        return NotFound();

    if (!esAdminSyc && (solicitud.ProyectoId == null || !proyectosPermitidos.Contains(solicitud.ProyectoId.Value)))
    {
        return NotFound();
    }

    var dto = new SolicitudDetalleResponseDto
    {
        Id = solicitud.Id,
        Numero = solicitud.Proyecto != null ? $"{solicitud.Proyecto.Codigo}-{solicitud.Id:0000}" : solicitud.Id.ToString(),
        CiudadanoId = solicitud.CiudadanoId,
        CiudadanoNombre = solicitud.Ciudadano?.NombreCompleto,
        CiudadanoDocumento = solicitud.Ciudadano != null ? $"{solicitud.Ciudadano.TipoDocumento} {solicitud.Ciudadano.NumeroDocumento}" : null,
        EmpresaId = solicitud.EmpresaId,
        EmpresaNombre = solicitud.Empresa?.RazonSocial,
        EmpresaNit = solicitud.Empresa?.Nit,
        DatosAdicionales = solicitud.DatosAdicionales,
        UsuarioAsignadoId = solicitud.UsuarioAsignadoId,
        UsuarioAsignadoNombre = solicitud.UsuarioAsignado?.NombreCompleto,
        ProyectoNombre = solicitud.Proyecto?.Nombre,
        ProyectoId = solicitud.ProyectoId,
        TipoSolicitudNombre = solicitud.TipoSolicitud?.Nombre,
        Estado = solicitud.Estado,
        FechaCreacion = solicitud.FechaCreacion,
        FechaCierre = solicitud.FechaCierre,
        HistorialEstados = solicitud.HistorialEstados
            .OrderByDescending(h => h.FechaCambio)
            .Select(h => new HistorialEstadoDto
            {
                EstadoAnterior = h.EstadoAnterior,
                EstadoNuevo = h.EstadoNuevo,
                FechaCambio = h.FechaCambio,
                UsuarioNombre = h.Usuario?.NombreCompleto
                
            }).ToList(),
        Documentos = solicitud.Documentos.Select(d => new DocumentoResponseDto
        {
            Id = d.Id,
            NombreArchivo = d.NombreArchivo,
            SolicitudNumero = solicitud.Proyecto != null ? $"{solicitud.Proyecto.Codigo}-{solicitud.Id:0000}" : solicitud.Id.ToString(),
            Fecha = d.FechaCarga
        }).ToList()
    };

    return Ok(dto);
}
//inicio: metodos para el home-operador
    [HttpGet("mis-conteos-por-proyecto")]
public async Task<IActionResult> GetMisConteosPorProyecto()
{
    var usuarioId = int.Parse(User.FindFirst("sub")!.Value);

    var misProyectos = await _context.UsuarioProyectos
        .Where(up => up.UsuarioId == usuarioId)
        .Include(up => up.Proyecto)
        .Select(up => new { up.ProyectoId, up.Proyecto.Nombre })
        .Distinct()
        .ToListAsync();

    var conteos = new List<ConteoProyectoDto>();

    foreach (var proyecto in misProyectos)
    {
        var total = await _context.Solicitudes.CountAsync(s =>
            s.ProyectoId == proyecto.ProyectoId && s.UsuarioAsignadoId == usuarioId && s.FechaCierre == null);

        conteos.Add(new ConteoProyectoDto
        {
            ProyectoId = proyecto.ProyectoId,
            ProyectoNombre = proyecto.Nombre,
            TotalAsignadas = total
        });
    }

    return Ok(conteos);
}

    [HttpGet("mis-indicadores")]
    public async Task<IActionResult> GetMisIndicadores()
    {
        var usuarioId = int.Parse(User.FindFirst("sub")!.Value);
        var hoy = DateTime.UtcNow.Date;
        var inicioSemana = hoy.AddDays(-(int)hoy.DayOfWeek);
        var misSolicitudes = _context.Solicitudes.Where(s => s.UsuarioAsignadoId == usuarioId);
        
        var indicadores = new IndicadoresOperadorDto
        {
            AsignadasAMi = await misSolicitudes.CountAsync(s => s.FechaCierre == null),
            VenceHoy = await misSolicitudes.CountAsync(s =>
                s.FechaCierre == null && s.FechaLimite != null && s.FechaLimite.Value.Date == hoy),
            RequierenMiRespuesta = await misSolicitudes.CountAsync(s =>
                s.Estado == "Requiere información" || s.Estado == "Pendiente" ),
            CompletadasEstaSemana = await misSolicitudes.CountAsync(s =>
                s.FechaCierre != null && s.FechaCierre.Value >= inicioSemana)
        };

        return Ok(indicadores);
    }

    [HttpGet("necesitan-atencion")]
    public async Task<IActionResult> GetNecesitanAtencion([FromQuery] int limite = 5)
    {
    var usuarioId = int.Parse(User.FindFirst("sub")!.Value);
    var proyectosPermitidos = User.FindAll("proyecto")
        .Select(c => int.Parse(c.Value.Split(':')[0]))
        .ToList();
    var hoy = DateTime.UtcNow.Date;

    var sinAsignar = await _context.Solicitudes
        .Include(s => s.Proyecto)
        .Include(s => s.TipoSolicitud)
        .Include(s => s.Ciudadano)
        .Where(s => s.FechaCierre == null && s.UsuarioAsignadoId == null
            && s.ProyectoId != null && proyectosPermitidos.Contains(s.ProyectoId.Value))
        .ToListAsync();

    var requierenAccion = await _context.Solicitudes
        .Include(s => s.Proyecto)
        .Include(s => s.TipoSolicitud)
        .Include(s => s.Ciudadano)
        .Where(s => s.FechaCierre == null && s.UsuarioAsignadoId == usuarioId
            && (s.Estado == "Requiere información" || s.Estado == "Pendiente"))
        .ToListAsync();

    var items = new List<SolicitudAtencionDto>();
    items.AddRange(sinAsignar.Select(s => MapearAtencion(s, hoy, esSinAsignar: true)));
    items.AddRange(requierenAccion.Select(s => MapearAtencion(s, hoy, esSinAsignar: false)));

    var ordenados = items
        .OrderBy(i => i.Urgencia == "vence_hoy" ? 0 : i.Urgencia == "vence_manana" ? 1 : 2)
        .Take(limite)
        .ToList();

    return Ok(ordenados);
}

private SolicitudAtencionDto MapearAtencion(Solicitud s, DateTime hoy, bool esSinAsignar)
{
    var urgencia = "normal";
    if (s.FechaLimite.HasValue)
    {
        if (s.FechaLimite.Value.Date == hoy) urgencia = "vence_hoy";
        else if (s.FechaLimite.Value.Date == hoy.AddDays(1)) urgencia = "vence_manana";
    }

    string estadoDescripcion;
    if (esSinAsignar)
    {
        var dias = (hoy - s.FechaCreacion.Date).Days;
        estadoDescripcion = dias <= 0 ? "Sin asignar hoy" : $"Sin asignar hace {dias} día{(dias == 1 ? "" : "s")}";
    }
    else
    {
        estadoDescripcion = s.Estado;
    }

    return new SolicitudAtencionDto
    {
        SolicitudId = s.Id,
        Numero = s.Proyecto != null ? $"{s.Proyecto.Codigo}-{s.Id:0000}" : s.Id.ToString(),
        TipoSolicitud = s.TipoSolicitud?.Nombre,
        CiudadanoNombre = s.Ciudadano?.NombreCompleto,
        ProyectoNombre = s.Proyecto?.Nombre ?? string.Empty,
        EstadoDescripcion = estadoDescripcion,
        Urgencia = urgencia,
        AccionSugerida = esSinAsignar ? "tomar_caso" : "revisar"
    };
}

    [HttpGet("mi-cola")]
    public async Task<IActionResult> GetMiCola([FromQuery] int? proyectoId, [FromQuery] string filtro = "todas")
    {
        var usuarioId = int.Parse(User.FindFirst("sub")!.Value);

        var query = _context.Solicitudes
            .Include(s => s.Proyecto)
            .Include(s => s.TipoSolicitud)
            .Include(s => s.Ciudadano)
            .Where(s => s.UsuarioAsignadoId == usuarioId)
            .AsQueryable();

        if (proyectoId.HasValue)
        {
            query = query.Where(s => s.ProyectoId == proyectoId.Value);
        }

        query = filtro switch
        {
            "en_revision" => query.Where(s => s.Estado == "En revisión"),
            "pendientes" => query.Where(s => s.Estado == "Pendiente"),
            _ => query
        };

        var solicitudes = await query
            .OrderByDescending(s => s.FechaCreacion)
            .ToListAsync();

        var resultado = solicitudes.Select(s => new SolicitudColaDto
        {
            SolicitudId = s.Id,
            Numero = s.Proyecto != null ? $"{s.Proyecto.Codigo}-{s.Id:0000}" : s.Id.ToString(),
            TipoSolicitud = s.TipoSolicitud?.Nombre,
            CiudadanoNombre = s.Ciudadano?.NombreCompleto,
            CiudadanoDocumento = s.Ciudadano != null ? $"{s.Ciudadano.TipoDocumento} {s.Ciudadano.NumeroDocumento}" : null,
            Estado = s.Estado,
            Fecha = s.FechaCreacion
        }).ToList();

        return Ok(resultado);
    }
//Fin metodos get home-operador

// inicio ger: api/Solicitudes/listado
[HttpGet("listado")]
public async Task<IActionResult> GetListadoSolicitudes(
    [FromQuery] int? proyectoId,
    [FromQuery] string? buscar,
    [FromQuery] string? estado,
    [FromQuery] int? tipoSolicitudId,
    [FromQuery] int pagina = 1,
    [FromQuery] int tamanoPagina = 20)
{
    var esAdminSyc = User.FindFirst("esAdminSyc")?.Value == "True";
    var proyectosPermitidos = User.FindAll("proyecto")
        .Select(c => int.Parse(c.Value.Split(':')[0]))
        .ToList();

    var queryBase = _context.Solicitudes
        .Include(s => s.Ciudadano)
        .Include(s => s.Empresa)
        .Include(s => s.UsuarioAsignado)
        .Include(s => s.Proyecto)
        .Include(s => s.TipoSolicitud)
        .AsQueryable();

    if (!esAdminSyc)
    {
        queryBase = queryBase.Where(s => s.ProyectoId != null && proyectosPermitidos.Contains(s.ProyectoId.Value));
    }

    if (proyectoId.HasValue)
    {
        queryBase = queryBase.Where(s => s.ProyectoId == proyectoId.Value);
    }

    if (tipoSolicitudId.HasValue)
    {
        queryBase = queryBase.Where(s => s.TipoSolicitudId == tipoSolicitudId.Value);
    }

    if (!string.IsNullOrWhiteSpace(buscar))
    {
        queryBase = queryBase.Where(s =>
            (s.Ciudadano != null && s.Ciudadano.NombreCompleto.Contains(buscar)) ||
            (s.Empresa != null && s.Empresa.RazonSocial.Contains(buscar)) ||
            s.Id.ToString().Contains(buscar));
    }

    // Los conteos por estado se calculan ANTES de aplicar el filtro de estado específico,
    // así los chips siempre muestran el total real de cada categoría, no solo la seleccionada
    var conteosPorEstado = await queryBase
        .GroupBy(s => s.Estado)
        .Select(g => new ConteoEstadoDto { Estado = g.Key, Total = g.Count() })
        .ToListAsync();

    var query = queryBase;
    if (!string.IsNullOrWhiteSpace(estado))
    {
        query = query.Where(s => s.Estado == estado);
    }

    var totalRegistros = await query.CountAsync();
    var totalPaginas = (int)Math.Ceiling(totalRegistros / (double)tamanoPagina);

   var solicitudes = await query
    .OrderByDescending(s => s.FechaCreacion)
    .Skip((pagina - 1) * tamanoPagina)
    .Take(tamanoPagina)
    .Select(s => new SolicitudResponseDto
    {
        Id = s.Id,
        Numero = s.Proyecto != null ? s.Proyecto.Codigo + "-" + s.Id.ToString("0000") : s.Id.ToString(),
        CiudadanoId = s.CiudadanoId,
        CiudadanoNombre = s.Ciudadano != null ? s.Ciudadano.NombreCompleto : null,
        EmpresaId = s.EmpresaId,
        EmpresaNombre = s.Empresa != null ? s.Empresa.RazonSocial : null,
        UsuarioAsignadoId = s.UsuarioAsignadoId,
        UsuarioAsignadoNombre = s.UsuarioAsignado != null ? s.UsuarioAsignado.NombreCompleto : null,
        TipoSolicitudNombre = s.TipoSolicitud != null ? s.TipoSolicitud.Nombre : null,
        Estado = s.Estado,
        FechaCreacion = s.FechaCreacion,
        FechaCierre = s.FechaCierre,
        FechaUltimoCambioEstado = s.HistorialEstados.Any()
            ? s.HistorialEstados.Max(h => h.FechaCambio)
            : s.FechaCreacion
    })
    .ToListAsync();

    var respuesta = new ListadoSolicitudesResponseDto
    {
        Pagina = new PaginacionResponseDto<SolicitudResponseDto>
        {
            Datos = solicitudes,
            TotalRegistros = totalRegistros,
            PaginaActual = pagina,
            TotalPaginas = totalPaginas
        },
        ConteosPorEstado = conteosPorEstado
    };

    return Ok(respuesta);
}

    // POST: api/Solicitudes
    [HttpPost]
    public async Task<IActionResult> CrearSolicitud(CrearSolicitudDto dto)
    {
        if (dto.CiudadanoId == null && dto.EmpresaId == null)
        {
            return BadRequest(new { mensaje = "Debe indicar un Ciudadano o una Empresa" });
        }

        var nuevaSolicitud = new Solicitud
        {
            CiudadanoId = dto.CiudadanoId,
            EmpresaId = dto.EmpresaId,
            ProyectoId = dto.ProyectoId,
            TipoSolicitudId = dto.TipoSolicitudId,
            VehiculoId = dto.VehiculoId,
            DatosAdicionales = dto.DatosAdicionales,
            Estado = "Radicada",
            FechaCreacion = DateTime.UtcNow
        };

        _context.Solicitudes.Add(nuevaSolicitud);
        await _context.SaveChangesAsync();

        return CreatedAtAction(nameof(GetSolicitud), new { id = nuevaSolicitud.Id }, new { nuevaSolicitud.Id });
    }

//Inicio metodo post para cargue de documentos 
    [HttpPost("{id}/documentos")]
public async Task<IActionResult> SubirDocumento(int id, IFormFile archivo)
{
    var esAdminSyc = User.FindFirst("esAdminSyc")?.Value == "True";
    var proyectosPermitidos = User.FindAll("proyecto")
        .Select(c => int.Parse(c.Value.Split(':')[0]))
        .ToList();

    var solicitud = await _context.Solicitudes
        .Include(s => s.Proyecto)
        .FirstOrDefaultAsync(s => s.Id == id);

    if (solicitud == null)
        return NotFound();

    if (!esAdminSyc && (solicitud.ProyectoId == null || !proyectosPermitidos.Contains(solicitud.ProyectoId.Value)))
    {
        return NotFound();
    }

    if (archivo == null || archivo.Length == 0)
    {
        return BadRequest(new { mensaje = "Debe adjuntar un archivo" });
    }

    using var stream = archivo.OpenReadStream();
    var rutaGuardada = await _almacenamiento.GuardarArchivoAsync(stream, archivo.FileName, $"solicitudes/{id}");

    var nuevoDocumento = new Documento
    {
        SolicitudId = id,
        NombreArchivo = archivo.FileName,
        RutaArchivo = rutaGuardada,
        TamanoBytes = archivo.Length,
        TipoArchivo = archivo.ContentType,
        FechaCarga = DateTime.UtcNow
    };

    _context.Documentos.Add(nuevoDocumento);
    await _context.SaveChangesAsync();

    var respuesta = new DocumentoResponseDto
    {
        Id = nuevoDocumento.Id,
        NombreArchivo = nuevoDocumento.NombreArchivo,
        SolicitudNumero = solicitud.Proyecto != null ? $"{solicitud.Proyecto.Codigo}-{solicitud.Id:0000}" : solicitud.Id.ToString(),
        Fecha = nuevoDocumento.FechaCarga,
        TamanoBytes = nuevoDocumento.TamanoBytes,
        TipoArchivo = nuevoDocumento.TipoArchivo
    };

    return Ok(respuesta);
}

// fin

// PUT: api/Solicitudes/5/cambiar-estado
    [HttpPut("{id}/cambiar-estado")]
    public async Task<IActionResult> CambiarEstado(int id, CambiarEstadoDto dto)
    {
        var solicitud = await _context.Solicitudes.FindAsync(id);

        if (solicitud == null)
            return NotFound();

        var estadoAnterior = solicitud.Estado;
        solicitud.Estado = dto.NuevoEstado;

        if (dto.NuevoEstado == "Cerrada" || dto.NuevoEstado == "Finalizada")
        {
            solicitud.FechaCierre = DateTime.UtcNow;
        }

        var historial = new HistorialEstado
        {
            SolicitudId = solicitud.Id,
            EstadoAnterior = estadoAnterior,
            EstadoNuevo = dto.NuevoEstado,
            FechaCambio = DateTime.UtcNow
        };

        _context.HistorialEstados.Add(historial);
        await _context.SaveChangesAsync();

        return NoContent();
    }

// PUT: api/Solicitudes/5/asignar-usuario
    [HttpPut("{id}/asignar-usuario")]
    public async Task<IActionResult> AsignarUsuario(int id, AsignarUsuarioDto dto)
    {
        var solicitud = await _context.Solicitudes.FindAsync(id);

        if (solicitud == null)
            return NotFound();

        var usuarioExiste = await _context.Usuarios.AnyAsync(u => u.Id == dto.UsuarioId && u.Activo);

        if (!usuarioExiste)
            return BadRequest(new { mensaje = "El usuario no existe o no está activo" });

        solicitud.UsuarioAsignadoId = dto.UsuarioId;
        await _context.SaveChangesAsync();

        return NoContent();
    }

}

