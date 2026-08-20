using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using SGDS.Application.DTOs;
using SGDS.Application.Helpers;
using SGDS.Domain.Entities;
using SGDS.Infrastructure.Data;
using QuestPDF.Fluent;
using QuestPDF.Helpers;
using QuestPDF.Infrastructure;
using QRCoder;
using ZXing;
using ZXing.Windows.Compatibility;

namespace SGDS.Api.Controllers;

// El generador de código de barras (ZXing + System.Drawing) solo corre en Windows —
// coherente con que el pilotaje corre en Windows.
[System.Runtime.Versioning.SupportedOSPlatform("windows")]
[ApiController]
[Route("api/[controller]")]
[Authorize]
public class SycTraceController : ControllerBase
{
    private readonly SgdsDbContext _context;

    // Categorías cuya clasificación en el menú (RN de SYCTrace) exige grado alcoholimétrico
    // y contenido neto, y las que exigen unidades por cajetilla en vez de eso.
    private static readonly string[] CategoriasLicorVino = { "Licores_Destilados", "Vinos_Fermentados" };
    private const string CategoriaCigarrillos = "Tabaco_Cigarrillos";
    private const string CategoriaCervezas = "Cervezas_Sifones_Refajos";

    public SycTraceController(SgdsDbContext context)
    {
        _context = context;
    }

    // ===== Creación y edición =====

    // POST: api/SycTrace/solicitudes
    [HttpPost("solicitudes")]
    public async Task<IActionResult> CrearSolicitud(CrearSolicitudSycTraceDto dto)
    {
        var tipo = await _context.TiposSolicitudes.FindAsync(dto.TipoSolicitudId);
        if (tipo == null)
            return BadRequest(new { mensaje = "El tipo de solicitud no es válido." });

        var (errorTornaguia, tornaguiaSolicitud) = await ObtenerTornaguiaPagadaAsync(dto.SolicitudInfoconsumoId);
        if (errorTornaguia != null) return errorTornaguia;

        if (tornaguiaSolicitud!.EmpresaId == null)
            return BadRequest(new { mensaje = "La tornaguía de Infoconsumo referenciada no tiene una empresa asociada." });

        var errorProducto = ValidarCamposProducto(dto.CategoriaProducto, dto.GradoAlcoholimetrico, dto.ContenidoNetoCc, dto.UnidadesPorCajetilla);
        if (errorProducto != null) return BadRequest(new { mensaje = errorProducto });

        var errorOrigen = ValidarOrigen(dto.OrigenProducto, dto.NumeroTornaguia, dto.NumeroDeclaracionImportacion, dto.RegistroIntroduccion);
        if (errorOrigen != null) return BadRequest(new { mensaje = errorOrigen });

        var errorRango = ValidarRango(dto.Prefijo, dto.CantidadEstampillas, dto.CodigoInicial, dto.RegistroInvima, dto.NombreProducto, dto.LoteProduccion);
        if (errorRango != null) return BadRequest(new { mensaje = errorRango });

        var nuevaSolicitud = new Solicitud
        {
            EmpresaId = tornaguiaSolicitud.EmpresaId,
            ProyectoId = dto.ProyectoId,
            TipoSolicitudId = dto.TipoSolicitudId,
            Estado = "Generada",
            FechaCreacion = DateTime.UtcNow,
            EstampillaFisica = new EstampillaFisica
            {
                SolicitudInfoconsumoId = dto.SolicitudInfoconsumoId,
                CategoriaProducto = dto.CategoriaProducto,
                NombreProducto = dto.NombreProducto,
                Marca = dto.Marca,
                GradoAlcoholimetrico = dto.GradoAlcoholimetrico,
                ContenidoNetoCc = dto.ContenidoNetoCc,
                UnidadesPorCajetilla = dto.UnidadesPorCajetilla,
                RegistroInvima = dto.RegistroInvima,
                LoteProduccion = dto.LoteProduccion,
                OrigenProducto = dto.OrigenProducto,
                NumeroTornaguia = dto.NumeroTornaguia,
                NumeroDeclaracionImportacion = dto.NumeroDeclaracionImportacion,
                RegistroIntroduccion = dto.RegistroIntroduccion,
                Prefijo = dto.Prefijo,
                CantidadEstampillas = dto.CantidadEstampillas,
                CodigoInicial = dto.CodigoInicial,
                CodigoFinal = dto.CodigoInicial + dto.CantidadEstampillas - 1,
            },
        };

        _context.Solicitudes.Add(nuevaSolicitud);
        await _context.SaveChangesAsync();

        return CreatedAtAction(nameof(GetEstampilla), new { id = nuevaSolicitud.Id }, new { nuevaSolicitud.Id });
    }

    // PUT: api/SycTrace/solicitudes/5
    [HttpPut("solicitudes/{id}")]
    public async Task<IActionResult> ActualizarSolicitud(int id, ActualizarSolicitudSycTraceDto dto)
    {
        var (error, solicitud) = await ObtenerSolicitudSycTraceAsync(id);
        if (error != null) return error;

        if (solicitud!.Estado != "Generada")
            return BadRequest(new { mensaje = "Solo se puede editar una expedición que esté en estado Generada." });

        var errorProducto = ValidarCamposProducto(dto.CategoriaProducto, dto.GradoAlcoholimetrico, dto.ContenidoNetoCc, dto.UnidadesPorCajetilla);
        if (errorProducto != null) return BadRequest(new { mensaje = errorProducto });

        var errorOrigen = ValidarOrigen(dto.OrigenProducto, dto.NumeroTornaguia, dto.NumeroDeclaracionImportacion, dto.RegistroIntroduccion);
        if (errorOrigen != null) return BadRequest(new { mensaje = errorOrigen });

        var errorRango = ValidarRango(dto.Prefijo, dto.CantidadEstampillas, dto.CodigoInicial, dto.RegistroInvima, dto.NombreProducto, dto.LoteProduccion);
        if (errorRango != null) return BadRequest(new { mensaje = errorRango });

        var e = solicitud.EstampillaFisica!;
        e.CategoriaProducto = dto.CategoriaProducto;
        e.NombreProducto = dto.NombreProducto;
        e.Marca = dto.Marca;
        e.GradoAlcoholimetrico = dto.GradoAlcoholimetrico;
        e.ContenidoNetoCc = dto.ContenidoNetoCc;
        e.UnidadesPorCajetilla = dto.UnidadesPorCajetilla;
        e.RegistroInvima = dto.RegistroInvima;
        e.LoteProduccion = dto.LoteProduccion;
        e.OrigenProducto = dto.OrigenProducto;
        e.NumeroTornaguia = dto.NumeroTornaguia;
        e.NumeroDeclaracionImportacion = dto.NumeroDeclaracionImportacion;
        e.RegistroIntroduccion = dto.RegistroIntroduccion;
        e.Prefijo = dto.Prefijo;
        e.CantidadEstampillas = dto.CantidadEstampillas;
        e.CodigoInicial = dto.CodigoInicial;
        e.CodigoFinal = dto.CodigoInicial + dto.CantidadEstampillas - 1;

        await _context.SaveChangesAsync();
        return NoContent();
    }

    // ===== Ciclo de vida propio de SYCTrace (RN-04) =====

    // PUT: api/SycTrace/solicitudes/5/confirmar-pago
    [HttpPut("solicitudes/{id}/confirmar-pago")]
    public async Task<IActionResult> ConfirmarPago(int id)
    {
        var (error, solicitud) = await ObtenerSolicitudSycTraceAsync(id);
        if (error != null) return error;

        if (solicitud!.Estado != "Generada")
            return BadRequest(new { mensaje = "Solo se puede confirmar el pago de una expedición que esté en estado Generada." });

        RegistrarCambioEstado(solicitud, "Pagada");
        solicitud.EstampillaFisica!.FechaPago = DateTime.UtcNow;

        await _context.SaveChangesAsync();
        return NoContent();
    }

    // PUT: api/SycTrace/solicitudes/5/entregar
    [HttpPut("solicitudes/{id}/entregar")]
    public async Task<IActionResult> Entregar(int id)
    {
        var (error, solicitud) = await ObtenerSolicitudSycTraceAsync(id);
        if (error != null) return error;

        if (solicitud!.Estado != "Pagada")
            return BadRequest(new { mensaje = "Solo se puede marcar como entregada una expedición que esté Pagada." });

        RegistrarCambioEstado(solicitud, "Entregada");
        solicitud.FechaCierre = DateTime.UtcNow;
        solicitud.EstampillaFisica!.FechaEntrega = DateTime.UtcNow;

        await _context.SaveChangesAsync();
        return NoContent();
    }

    // PUT: api/SycTrace/solicitudes/5/anular
    [HttpPut("solicitudes/{id}/anular")]
    public async Task<IActionResult> Anular(int id, AnularEstampillaDto dto)
    {
        var (error, solicitud) = await ObtenerSolicitudSycTraceAsync(id);
        if (error != null) return error;

        if (solicitud!.Estado != "Generada" && solicitud.Estado != "Pagada")
            return BadRequest(new { mensaje = "Solo se puede anular una expedición Generada o Pagada — una vez Entregada, ya está aplicada al lote." });

        if (string.IsNullOrWhiteSpace(dto.Motivo))
            return BadRequest(new { mensaje = "Indica el motivo de anulación (error de impresión, avería física, etc.)." });

        RegistrarCambioEstado(solicitud, "Anulada");
        solicitud.FechaCierre = DateTime.UtcNow;
        solicitud.EstampillaFisica!.MotivoAnulacion = dto.Motivo;

        await _context.SaveChangesAsync();
        return NoContent();
    }

    // ===== Estampilla física =====

    // GET: api/SycTrace/solicitudes/5/estampilla
    [HttpGet("solicitudes/{id}/estampilla")]
    public async Task<IActionResult> GetEstampilla(int id)
    {
        var (error, solicitud) = await ObtenerSolicitudSycTraceAsync(id);
        return error ?? Ok(ConstruirEstampillaDto(solicitud!));
    }

    // GET: api/SycTrace/solicitudes/5/estampilla-pdf
    [HttpGet("solicitudes/{id}/estampilla-pdf")]
    public async Task<IActionResult> GetEstampillaPdf(int id)
    {
        var (error, solicitud) = await ObtenerSolicitudSycTraceAsync(id);
        if (error != null) return error;

        var dto = ConstruirEstampillaDto(solicitud!);
        var qrBytes = GenerarQrPng(ContenidoQr(dto));
        var pdfBytes = GenerarEstampillaPdf(dto, qrBytes);
        return File(pdfBytes, "application/pdf", $"Estampilla_{dto.Numero}.pdf");
    }

    // GET: api/SycTrace/solicitudes/5/estampilla-qr.png
    [HttpGet("solicitudes/{id}/estampilla-qr.png")]
    public async Task<IActionResult> GetEstampillaQr(int id)
    {
        var (error, solicitud) = await ObtenerSolicitudSycTraceAsync(id);
        if (error != null) return error;

        var dto = ConstruirEstampillaDto(solicitud!);
        var qrBytes = GenerarQrPng(ContenidoQr(dto));
        return File(qrBytes, "image/png");
    }

    // GET: api/SycTrace/solicitudes/5/estampilla-barcode.png
    [HttpGet("solicitudes/{id}/estampilla-barcode.png")]
    public async Task<IActionResult> GetEstampillaBarcode(int id)
    {
        var (error, solicitud) = await ObtenerSolicitudSycTraceAsync(id);
        if (error != null) return error;

        var dto = ConstruirEstampillaDto(solicitud!);
        var barcodeBytes = GenerarBarcodePng(dto.CodigoCompleto);
        return File(barcodeBytes, "image/png");
    }

    // ===== Arte de la estampilla (vista visual + PDF con ambiente realista) =====

    // GET: api/SycTrace/solicitudes/5/estampilla-arte-pdf
    [HttpGet("solicitudes/{id}/estampilla-arte-pdf")]
    public async Task<IActionResult> GetEstampillaArtePdf(int id)
    {
        var (error, solicitud) = await ObtenerSolicitudSycTraceAsync(id);
        if (error != null) return error;

        var dto = ConstruirEstampillaDto(solicitud!);
        var qrBytes = GenerarQrPng(ContenidoQr(dto));
        var barcodeBytes = GenerarBarcodePng(dto.CodigoCompleto);
        var pdfBytes = GenerarEstampillaArtePdf(dto, qrBytes, barcodeBytes);
        return File(pdfBytes, "application/pdf", $"Estampilla_Arte_{dto.Numero}.pdf");
    }

    // ===== Búsqueda de tornaguías de Infoconsumo con pago confirmado (paso 2 del formulario) =====
    // Infoconsumo origina el trámite y liquida el impuesto; una vez el operador confirma el
    // pago allí, la tornaguía queda disponible aquí como origen de la expedición física.

    // GET: api/SycTrace/tornaguias-disponibles?buscar=INFOCONSUMO-0089
    [HttpGet("tornaguias-disponibles")]
    public async Task<IActionResult> GetTornaguiasDisponibles([FromQuery] string? buscar)
    {
        var esAdminSyc = User.FindFirst("esAdminSyc")?.Value == "True";
        var proyectosPermitidos = User.FindAll("proyecto")
            .Select(c => int.Parse(c.Value.Split(':')[0]))
            .ToList();

        var query = _context.Solicitudes
            .Include(s => s.Proyecto)
            .Include(s => s.Empresa)
            .Include(s => s.TornaguiaInfoconsumo!).ThenInclude(t => t.LoteGoTraceSolicitud!).ThenInclude(l => l.Proyecto)
            .Include(s => s.TornaguiaInfoconsumo!).ThenInclude(t => t.LoteGoTraceSolicitud!).ThenInclude(l => l.LoteGoTrace)
            .Where(s => s.Proyecto != null && s.Proyecto.Nombre == "Infoconsumo"
                     && s.TornaguiaInfoconsumo != null && s.TornaguiaInfoconsumo.PagoConfirmado);

        if (!esAdminSyc)
            query = query.Where(s => s.ProyectoId != null && proyectosPermitidos.Contains(s.ProyectoId.Value));

        var solicitudes = await query.OrderByDescending(s => s.FechaCreacion).Take(200).ToListAsync();

        var resultado = solicitudes
            .Select(s => new TornaguiaInfoconsumoDisponibleDto
            {
                Id = s.Id,
                Numero = s.Proyecto != null ? $"{s.Proyecto.Codigo}-{s.Id:0000}" : s.Id.ToString(),
                EmpresaId = s.EmpresaId ?? 0,
                EmpresaNombre = s.Empresa?.RazonSocial ?? string.Empty,
                EmpresaNit = s.Empresa?.Nit ?? string.Empty,
                FechaCreacion = s.FechaCreacion,
                CategoriaProducto = MapearCategoriaInfoconsumo(s.TornaguiaInfoconsumo!.CategoriaProducto),
                GradoAlcoholimetrico = s.TornaguiaInfoconsumo.GradosAlcoholimetricos,
                ContenidoNetoCc = (int)CalculadoraImpuestoConsumo.PresentacionEstandarCc,
                LoteGoTraceNumero = s.TornaguiaInfoconsumo.LoteGoTraceSolicitud?.Proyecto != null
                    ? $"{s.TornaguiaInfoconsumo.LoteGoTraceSolicitud.Proyecto.Codigo}-{s.TornaguiaInfoconsumo.LoteGoTraceSolicitud.Id:0000}"
                    : null,
                RangoUidGoTrace = s.TornaguiaInfoconsumo.LoteGoTraceSolicitud?.LoteGoTrace != null
                    ? FormatearRangoUid(s.TornaguiaInfoconsumo.LoteGoTraceSolicitud.LoteGoTrace)
                    : null,
            })
            .Where(d => string.IsNullOrWhiteSpace(buscar)
                     || d.Numero.Contains(buscar, StringComparison.OrdinalIgnoreCase)
                     || d.EmpresaNombre.Contains(buscar, StringComparison.OrdinalIgnoreCase)
                     || d.EmpresaNit.Contains(buscar, StringComparison.OrdinalIgnoreCase))
            .ToList();

        return Ok(resultado);
    }

    // ===== Helpers =====

    // Infoconsumo y SYCTrace clasifican el mismo tipo de producto con valores de categoría
    // distintos (catálogos definidos por separado) — se traduce al autocompletar desde una
    // tornaguía, si no el valor heredado no coincide con ninguna opción de SYCTrace.
    private static string MapearCategoriaInfoconsumo(string categoriaInfoconsumo) => categoriaInfoconsumo switch
    {
        "Licores_Aperitivos" => "Licores_Destilados",
        "Vinos_Aperitivos_Vinicos" => "Vinos_Fermentados",
        "Cigarrillos_Tabaco" => "Tabaco_Cigarrillos",
        "Cervezas_Sifones_Refajos" => "Cervezas_Sifones_Refajos",
        _ => categoriaInfoconsumo,
    };

    private static string? ValidarCamposProducto(string categoria, decimal? grado, int? contenidoCc, int? unidadesCajetilla)
    {
        if (categoria == CategoriaCervezas)
            return "Las cervezas, sifones y refajos no están sujetas a estampilla de señalización física en este flujo — solo a declaración remota de impuesto al consumo.";

        if (CategoriasLicorVino.Contains(categoria))
        {
            if (grado == null || contenidoCc == null)
                return "Licores y vinos exigen el grado alcoholimétrico y el contenido neto (cc) del envase.";
        }
        else if (categoria == CategoriaCigarrillos)
        {
            if (unidadesCajetilla == null)
                return "Cigarrillos y tabaco exigen la cantidad de unidades por cajetilla (o el peso, para tabaco elaborado).";
        }
        else
        {
            return "Categoría de producto no reconocida.";
        }

        return null;
    }

    private static string? ValidarOrigen(string origen, string? tornaguia, string? declaracionImportacion, string? registroIntroduccion)
    {
        if (origen == "Nacional")
        {
            if (string.IsNullOrWhiteSpace(tornaguia))
                return "Origen Nacional exige el número de la Tornaguía de Movilización expedida por el departamento de origen o la fábrica autorizada.";
        }
        else if (origen == "Importado")
        {
            if (string.IsNullOrWhiteSpace(declaracionImportacion) || string.IsNullOrWhiteSpace(registroIntroduccion))
                return "Origen Importado exige el número de la Declaración de Importación y el registro de introducción al departamento de Santander.";
        }
        else
        {
            return "Origen del producto no reconocido (debe ser Nacional o Importado).";
        }

        return null;
    }

    private static string? ValidarRango(string prefijo, int cantidad, int codigoInicial, string registroInvima, string nombreProducto, string lote)
    {
        if (string.IsNullOrWhiteSpace(prefijo)) return "Indica el prefijo del código de expedición.";
        if (cantidad <= 0) return "La cantidad de estampillas a expedir debe ser mayor que cero.";
        if (codigoInicial < 0) return "El código inicial no puede ser negativo.";
        if (string.IsNullOrWhiteSpace(registroInvima)) return "El registro sanitario INVIMA es obligatorio para el QR de la estampilla.";
        if (string.IsNullOrWhiteSpace(nombreProducto)) return "El nombre comercial del producto es obligatorio.";
        if (string.IsNullOrWhiteSpace(lote)) return "El lote de producción es obligatorio.";
        return null;
    }

    private async Task<(IActionResult? Error, Solicitud? Solicitud)> ObtenerTornaguiaPagadaAsync(int solicitudInfoconsumoId)
    {
        var solicitud = await _context.Solicitudes
            .Include(s => s.Proyecto)
            .Include(s => s.TornaguiaInfoconsumo)
            .FirstOrDefaultAsync(s => s.Id == solicitudInfoconsumoId);

        if (solicitud == null || solicitud.Proyecto == null || solicitud.Proyecto.Nombre != "Infoconsumo" || solicitud.TornaguiaInfoconsumo == null)
            return (BadRequest(new { mensaje = "La tornaguía de Infoconsumo referenciada no existe." }), null);

        if (!solicitud.TornaguiaInfoconsumo.PagoConfirmado)
            return (BadRequest(new { mensaje = "Solo se pueden expedir estampillas de tornaguías de Infoconsumo con pago confirmado." }), null);

        return (null, solicitud);
    }

    private async Task<(IActionResult? Error, Solicitud? Solicitud)> ObtenerSolicitudSycTraceAsync(int id)
    {
        var esAdminSyc = User.FindFirst("esAdminSyc")?.Value == "True";
        var proyectosPermitidos = User.FindAll("proyecto")
            .Select(c => int.Parse(c.Value.Split(':')[0]))
            .ToList();

        var solicitud = await _context.Solicitudes
            .Include(s => s.Empresa)
            .Include(s => s.Proyecto)
            .Include(s => s.EstampillaFisica!).ThenInclude(e => e.SolicitudInfoconsumo).ThenInclude(se => se.Proyecto)
            .Include(s => s.EstampillaFisica!).ThenInclude(e => e.SolicitudInfoconsumo).ThenInclude(se => se.TornaguiaInfoconsumo!).ThenInclude(t => t.LoteGoTraceSolicitud!).ThenInclude(l => l.Proyecto)
            .Include(s => s.EstampillaFisica!).ThenInclude(e => e.SolicitudInfoconsumo).ThenInclude(se => se.TornaguiaInfoconsumo!).ThenInclude(t => t.LoteGoTraceSolicitud!).ThenInclude(l => l.LoteGoTrace)
            .FirstOrDefaultAsync(s => s.Id == id);

        if (solicitud == null || solicitud.EstampillaFisica == null)
            return (NotFound(), null);

        if (!esAdminSyc && (solicitud.ProyectoId == null || !proyectosPermitidos.Contains(solicitud.ProyectoId.Value)))
            return (NotFound(), null);

        return (null, solicitud);
    }

    private void RegistrarCambioEstado(Solicitud solicitud, string nuevoEstado)
    {
        _context.HistorialEstados.Add(new HistorialEstado
        {
            SolicitudId = solicitud.Id,
            EstadoAnterior = solicitud.Estado,
            EstadoNuevo = nuevoEstado,
            FechaCambio = DateTime.UtcNow,
        });
        solicitud.Estado = nuevoEstado;
    }

    private static string ContenidoQr(EstampillaResponseDto dto) =>
        $"SGDS-SYCTRACE|{dto.Numero}|{dto.CodigoCompleto}|INVIMA:{dto.RegistroInvima}|Lote:{dto.LoteProduccion}|Para distribuir en el Departamento de Santander";

    // Infoconsumo y SYCTrace clasifican el mismo tipo de producto con valores de categoría
    // distintos — se reutiliza el mismo formato de rango que Infoconsumo para mostrar el
    // tramo de UIDs heredado transitivamente desde GoTrace.
    private static string? FormatearRangoUid(LoteGoTrace lote)
    {
        if (string.IsNullOrWhiteSpace(lote.PrefijoUid) || lote.UidInicial == null || lote.UidFinal == null)
            return null;

        return $"{lote.PrefijoUid}-{lote.UidInicial:00000} a {lote.PrefijoUid}-{lote.UidFinal:00000}";
    }

    private static EstampillaResponseDto ConstruirEstampillaDto(Solicitud s)
    {
        var e = s.EstampillaFisica!;
        var numero = s.Proyecto != null ? $"{s.Proyecto.Codigo}-{s.Id:0000}" : s.Id.ToString();
        var solicitudInfoconsumoNumero = e.SolicitudInfoconsumo?.Proyecto != null
            ? $"{e.SolicitudInfoconsumo.Proyecto.Codigo}-{e.SolicitudInfoconsumo.Id:0000}"
            : e.SolicitudInfoconsumoId.ToString();

        var loteGoTraceSolicitud = e.SolicitudInfoconsumo?.TornaguiaInfoconsumo?.LoteGoTraceSolicitud;
        var loteGoTrace = loteGoTraceSolicitud?.LoteGoTrace;
        var loteGoTraceNumero = loteGoTraceSolicitud?.Proyecto != null
            ? $"{loteGoTraceSolicitud.Proyecto.Codigo}-{loteGoTraceSolicitud.Id:0000}"
            : null;

        // Alerta suave (no bloqueante): la cantidad de estampillas físicas expedidas no
        // necesariamente coincide con la cantidad de UIDs trazados en fábrica — una misma
        // botella puede consumir varias estampillas de presentación o el lote traer excedente.
        string? alertaDesajusteUid = null;
        if (loteGoTrace?.CantidadUids != null && loteGoTrace.CantidadUids.Value != e.CantidadEstampillas)
        {
            alertaDesajusteUid = $"La cantidad de estampillas ({e.CantidadEstampillas:N0}) no coincide con la cantidad de UIDs trazados en GoTrace ({loteGoTrace.CantidadUids.Value:N0}).";
        }

        return new EstampillaResponseDto
        {
            SolicitudId = s.Id,
            Numero = numero,
            Estado = s.Estado,
            EmpresaId = s.EmpresaId ?? 0,
            EmpresaRazonSocial = s.Empresa?.RazonSocial ?? string.Empty,
            EmpresaNit = s.Empresa?.Nit ?? string.Empty,
            SolicitudInfoconsumoId = e.SolicitudInfoconsumoId,
            SolicitudInfoconsumoNumero = solicitudInfoconsumoNumero,
            CategoriaProducto = e.CategoriaProducto,
            NombreProducto = e.NombreProducto,
            Marca = e.Marca,
            GradoAlcoholimetrico = e.GradoAlcoholimetrico,
            ContenidoNetoCc = e.ContenidoNetoCc,
            UnidadesPorCajetilla = e.UnidadesPorCajetilla,
            RegistroInvima = e.RegistroInvima,
            LoteProduccion = e.LoteProduccion,
            OrigenProducto = e.OrigenProducto,
            NumeroTornaguia = e.NumeroTornaguia,
            NumeroDeclaracionImportacion = e.NumeroDeclaracionImportacion,
            RegistroIntroduccion = e.RegistroIntroduccion,
            Prefijo = e.Prefijo,
            CantidadEstampillas = e.CantidadEstampillas,
            CodigoInicial = e.CodigoInicial,
            CodigoFinal = e.CodigoFinal,
            CodigoCompleto = $"{e.Prefijo}-{e.CodigoInicial:00000}",
            FechaCreacion = s.FechaCreacion,
            FechaPago = e.FechaPago,
            FechaEntrega = e.FechaEntrega,
            MotivoAnulacion = e.MotivoAnulacion,
            LoteGoTraceNumero = loteGoTraceNumero,
            RangoUidGoTrace = loteGoTrace != null ? FormatearRangoUid(loteGoTrace) : null,
            CantidadUidsGoTrace = loteGoTrace?.CantidadUids,
            AlertaDesajusteUid = alertaDesajusteUid,
        };
    }

    private static byte[] GenerarQrPng(string contenido)
    {
        using var generador = new QRCodeGenerator();
        using var datosQr = generador.CreateQrCode(contenido, QRCodeGenerator.ECCLevel.Q);
        var pngQr = new PngByteQRCode(datosQr);
        return pngQr.GetGraphic(20);
    }

    // Código de barras Code128 real (escaneable), no la banda decorativa del mockup —
    // codifica el código completo de la estampilla (prefijo + código inicial).
    // Requiere System.Drawing (Windows) para el renderizado a Bitmap.
    private static byte[] GenerarBarcodePng(string contenido)
    {
        var escritor = new BarcodeWriter
        {
            Format = BarcodeFormat.CODE_128,
            Options = new ZXing.Common.EncodingOptions
            {
                Width = 360,
                Height = 90,
                Margin = 5,
                PureBarcode = false,
            },
        };
        using var bitmap = escritor.Write(contenido);
        using var stream = new MemoryStream();
        bitmap.Save(stream, System.Drawing.Imaging.ImageFormat.Png);
        return stream.ToArray();
    }

    private static byte[] GenerarEstampillaPdf(EstampillaResponseDto dto, byte[] qrBytes)
    {
        var documento = Document.Create(contenedor =>
        {
            contenedor.Page(pagina =>
            {
                pagina.Size(PageSizes.A5);
                pagina.Margin(30);
                pagina.DefaultTextStyle(x => x.FontSize(10));

                pagina.Header().Column(col =>
                {
                    col.Item().Text("Secretaría de Hacienda Departamental de Santander — Control de Rentas").FontSize(10);
                    col.Item().Text("Estampilla de control — SYCTrace").FontSize(16).Bold();
                    col.Item().PaddingTop(4).Text($"Número: {dto.Numero}").FontSize(10).Bold();
                });

                pagina.Content().PaddingTop(15).Column(col =>
                {
                    col.Spacing(10);

                    if (dto.OrigenProducto == "Importado")
                        col.Item().Text("IMPORTADO").FontColor(Colors.Orange.Darken2).Bold();

                    col.Item().Text("Producto").Bold();
                    col.Item().Table(t =>
                    {
                        t.ColumnsDefinition(c => { c.RelativeColumn(); c.RelativeColumn(); });
                        void Fila(string l, string v) { t.Cell().Text(l); t.Cell().Text(v); }
                        Fila("Nombre comercial", dto.NombreProducto);
                        Fila("Marca", dto.Marca ?? "—");
                        Fila("Categoría", dto.CategoriaProducto);
                        if (dto.GradoAlcoholimetrico.HasValue || dto.ContenidoNetoCc.HasValue)
                            Fila("Grado / Contenido neto", $"{dto.GradoAlcoholimetrico?.ToString("0.#°") ?? "—"} · {dto.ContenidoNetoCc?.ToString() ?? "—"} cc");
                        if (dto.UnidadesPorCajetilla.HasValue)
                            Fila("Unidades por cajetilla", dto.UnidadesPorCajetilla.Value.ToString());
                        Fila("Registro INVIMA", dto.RegistroInvima);
                        Fila("Lote de producción", dto.LoteProduccion);
                    });

                    col.Item().Text("Empresa").Bold();
                    col.Item().Table(t =>
                    {
                        t.ColumnsDefinition(c => { c.RelativeColumn(); c.RelativeColumn(); });
                        t.Cell().Text("Razón social"); t.Cell().Text(dto.EmpresaRazonSocial);
                        t.Cell().Text("NIT"); t.Cell().Text(dto.EmpresaNit);
                    });

                    col.Item().Text("Origen").Bold();
                    col.Item().Table(t =>
                    {
                        t.ColumnsDefinition(c => { c.RelativeColumn(); c.RelativeColumn(); });
                        if (dto.OrigenProducto == "Nacional")
                        {
                            t.Cell().Text("Tornaguía de movilización"); t.Cell().Text(dto.NumeroTornaguia ?? "—");
                        }
                        else
                        {
                            t.Cell().Text("Declaración de importación"); t.Cell().Text(dto.NumeroDeclaracionImportacion ?? "—");
                            t.Cell().Text("Registro de introducción"); t.Cell().Text(dto.RegistroIntroduccion ?? "—");
                        }
                    });

                    col.Item().Text("Rango de expedición").Bold();
                    col.Item().Table(t =>
                    {
                        t.ColumnsDefinition(c => { c.RelativeColumn(); c.RelativeColumn(); });
                        t.Cell().Text("Código"); t.Cell().Text(dto.CodigoCompleto).Bold();
                        t.Cell().Text("Cantidad expedida"); t.Cell().Text($"{dto.CantidadEstampillas:N0}");
                        t.Cell().Text("Rango"); t.Cell().Text($"{dto.Prefijo}-{dto.CodigoInicial:00000} a {dto.Prefijo}-{dto.CodigoFinal:00000}");
                    });

                    col.Item().PaddingTop(4).Text("Para distribuir en el Departamento de Santander — prohibida su comercialización fuera de este territorio.")
                        .FontSize(9).Italic();

                    col.Item().PaddingTop(10).AlignCenter().Width(110).Image(qrBytes);
                    col.Item().AlignCenter().Text(dto.CodigoCompleto).FontSize(8);
                });

                pagina.Footer().AlignCenter().Text(texto =>
                {
                    texto.Span("Generado el ");
                    texto.Span(DateTime.UtcNow.ToString("yyyy-MM-dd HH:mm")).Bold();
                });
            });
        });

        return documento.GeneratePdf();
    }

    // Réplica en PDF del arte de la estampilla física (banda tricolor, sello, código de
    // barras real y QR real) — el documento tabular de GenerarEstampillaPdf sigue siendo
    // el respaldo administrativo; este es el que se acerca visualmente a lo que se
    // imprimiría en el papel de seguridad. El "holograma" del mockup es un efecto físico
    // de la lámina de seguridad que aplica la imprenta — aquí se representa como un sello
    // circular sólido, no se finge un holograma que un PDF no puede reproducir.
    private static byte[] GenerarEstampillaArtePdf(EstampillaResponseDto dto, byte[] qrBytes, byte[] barcodeBytes)
    {
        var colorDept = "#0f1a2e";
        var colorAccento = "#ea580c";

        var documento = Document.Create(contenedor =>
        {
            contenedor.Page(pagina =>
            {
                pagina.Size(PageSizes.A5);
                pagina.Margin(0);
                pagina.DefaultTextStyle(x => x.FontSize(9));

                pagina.Content().Column(pageCol =>
                {
                    // Banda tricolor (bandera de Colombia) — elemento de seguridad visual del mockup
                    pageCol.Item().Row(row =>
                    {
                        row.RelativeItem().Height(10).Background("#fbbf24");
                        row.RelativeItem().Height(10).Background("#2563eb");
                        row.RelativeItem().Height(10).Background("#dc2626");
                    });

                    pageCol.Item().Padding(24).Column(col =>
                    {
                        col.Spacing(4);

                        col.Item().Row(row =>
                        {
                            row.RelativeItem().Column(c =>
                            {
                                c.Item().Text("SANTANDER").FontSize(20).Bold().FontColor(colorDept);
                                c.Item().Text($"Control de Rentas · {(dto.OrigenProducto == "Nacional" ? "Nacional" : "Extranjero")}")
                                    .FontSize(9).FontColor(Colors.Grey.Medium).LetterSpacing(0.05f);
                            });
                            row.ConstantItem(46).Height(46).Background(colorAccento).Extend()
                                .AlignMiddle().AlignCenter()
                                .Text("SYC").FontSize(12).Bold().FontColor(Colors.White);
                        });

                        if (dto.OrigenProducto == "Importado")
                        {
                            col.Item().PaddingTop(4).Background("#fef3c7").Padding(4)
                                .Text("PRODUCTO IMPORTADO").FontSize(8).Bold().FontColor("#92400e");
                        }

                        col.Item().PaddingVertical(10).LineHorizontal(1).LineColor(Colors.Grey.Lighten2);

                        col.Item().Text(dto.NombreProducto).FontSize(15).Bold().FontColor(colorDept);
                        col.Item().Text(text =>
                        {
                            if (dto.GradoAlcoholimetrico.HasValue || dto.ContenidoNetoCc.HasValue)
                                text.Span($"{dto.GradoAlcoholimetrico?.ToString("0.#°") ?? ""} · {dto.ContenidoNetoCc?.ToString() ?? "—"} cc  —  ").FontColor(Colors.Grey.Darken1);
                            if (dto.UnidadesPorCajetilla.HasValue)
                                text.Span($"{dto.UnidadesPorCajetilla} un./cajetilla  —  ").FontColor(Colors.Grey.Darken1);
                            text.Span(dto.EmpresaRazonSocial).FontColor(Colors.Grey.Darken1);
                        });

                        col.Item().PaddingTop(14).Image(barcodeBytes).FitWidth();
                        col.Item().AlignCenter().Text(dto.CodigoCompleto).FontSize(11).Bold().FontFamily("Courier New").FontColor(colorDept);

                        col.Item().PaddingTop(10).Row(row =>
                        {
                            row.ConstantItem(90).Image(qrBytes);
                            row.RelativeItem().PaddingLeft(14).Column(c =>
                            {
                                c.Item().Text("Verificable en SycTrace").FontSize(9).Bold();
                                c.Item().Text($"Lote {dto.LoteProduccion} · INVIMA {dto.RegistroInvima}").FontSize(8).FontColor(Colors.Grey.Darken1);
                                c.Item().Text($"Rango expedido: {dto.CantidadEstampillas:N0} estampillas").FontSize(8).FontColor(Colors.Grey.Darken1);
                                c.Item().PaddingTop(6).Text("Para distribuir en el Departamento de Santander").FontSize(7.5f).Italic().FontColor(Colors.Grey.Medium);
                            });
                        });
                    });

                    pageCol.Item().Background(colorDept).Padding(8).AlignCenter()
                        .Text("SYCTRACE · CONTROL DE RENTAS · SANTANDER").FontSize(9).Bold().FontColor(Colors.White).LetterSpacing(0.08f);
                });
            });
        });

        return documento.GeneratePdf();
    }
}
