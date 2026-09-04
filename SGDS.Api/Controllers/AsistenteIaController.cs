using System.Globalization;
using System.Text.Json;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using SGDS.Application.DTOs;
using SGDS.Application.Interfaces;
using SGDS.Domain.Entities;
using SGDS.Infrastructure.Data;

namespace SGDS.Api.Controllers;

// Asistente IA "SGDS Intelligence" para el rol Operador — a diferencia del asistente de
// Gerencial (GerencialController.Preguntar, contexto fijo de 30 días sin tool-calling), este
// deja que el modelo pida buscar un registro puntual (lote/tornaguía/estampilla) contra la BD
// real, en vez de obligar al operador a filtrar manualmente. Piloto acotado a los 3 módulos que
// puede tener asignados un operador: GoTrace, Infoconsumo, SycTrace.
[ApiController]
[Route("api/[controller]")]
[Authorize]
public class AsistenteIaController : ControllerBase
{
    private const int MaxIteracionesHerramientas = 3;

    private readonly SgdsDbContext _context;
    private readonly IIAService _iaService;
    private readonly ILogger<AsistenteIaController> _logger;

    public AsistenteIaController(SgdsDbContext context, IIAService iaService, ILogger<AsistenteIaController> logger)
    {
        _context = context;
        _iaService = iaService;
        _logger = logger;
    }

    // POST: api/AsistenteIa/operador/preguntar
    [HttpPost("operador/preguntar")]
    public async Task<IActionResult> PreguntarOperador([FromBody] PreguntaAsistenteOperadorDto solicitud)
    {
        var esAdminSyc = User.FindFirst("esAdminSyc")?.Value == "True";
        var proyectosPermitidos = User.FindAll("proyecto")
            .Select(c => int.Parse(c.Value.Split(':')[0]))
            .ToList();

        if (!esAdminSyc && proyectosPermitidos.Count == 0)
        {
            return Forbid();
        }

        if (string.IsNullOrWhiteSpace(solicitud.Pregunta))
        {
            return BadRequest("La pregunta no puede estar vacía.");
        }

        var nombresProyectos = esAdminSyc
            ? await _context.Proyectos.Select(p => p.Nombre).ToListAsync()
            : await _context.Proyectos.Where(p => proyectosPermitidos.Contains(p.Id)).Select(p => p.Nombre).ToListAsync();

        var systemPrompt =
            "Eres el asistente de SGDS Intelligence para el perfil Operador. Respondes en español, con tono profesional y breve. " +
            "Tienes tres tipos de herramientas: 'buscar_*' para encontrar UN registro puntual por identificador (número de solicitud, número de lote/tornaguía, código de estampilla, o nombre/NIT de empresa); 'listar_*' para traer TODOS los registros de un módulo dentro de un rango de fechas (úsalas cuando te pidan un resumen, un período, o 'todas las solicitudes de...'; no le pidas al usuario un identificador puntual si lo que quiere es un listado); y 'trazar_cadena_gotrace' para consolidar la trazabilidad completa de un lote de GoTrace incluyendo la tornaguía de Infoconsumo y la estampilla de SycTrace que se hayan generado a partir de él (GoTrace -> Infoconsumo -> SycTrace es una cadena: una tornaguía de Infoconsumo puede haberse creado a partir de un lote de GoTrace, y una estampilla de SycTrace a partir de esa tornaguía — usa esta herramienta, no 'buscar_tornaguia_infoconsumo'/'buscar_estampilla_syctrace', cuando te pidan trazabilidad/resumen consolidado/información asociada de un lote de GoTrace en otros módulos). " +
            "Solo puedes informar sobre datos de estos proyectos del usuario: " + string.Join(", ", nombresProyectos) + ". " +
            "Importante sobre el modelo de datos: GoTrace SOLO registra fábrica y cadena de custodia (producto, número de lote, unidades, y 4 puntos de control fijos: Fábrica/Bodega/Distribuidor/Punto de venta) — NO tiene ciudad de movilización ni empresa transportadora, esos datos viven exclusivamente en Infoconsumo (tornaguía de movilización). Si te piden movilización/ciudades/transportador de GoTrace, aclara esa diferencia en vez de decir que 'no están disponibles' sin explicar por qué. " +
            "Si una herramienta no encuentra nada o el usuario pregunta por otro proyecto, dilo explícitamente en vez de inventar un dato. " +
            "Si una búsqueda puntual devuelve varias coincidencias, pide al usuario que precise cuál antes de responder.";

        var herramientas = ConstruirHerramientas();
        var historial = (solicitud.Historial ?? new List<MensajeChatDto>())
            .TakeLast(6)
            .Select(m => new MensajeIADto { Rol = m.Rol == "asistente" ? "assistant" : "user", Texto = m.Texto })
            .ToList();
        historial.Add(new MensajeIADto { Rol = "user", Texto = solicitud.Pregunta });

        int? proyectoIdConsultado = null;
        var modelo = "desconocido";

        try
        {
            for (var iteracion = 0; iteracion < MaxIteracionesHerramientas; iteracion++)
            {
                var respuesta = await _iaService.GenerarConHerramientasAsync(systemPrompt, historial, herramientas);
                modelo = respuesta.Modelo;

                if (respuesta.LlamadasHerramientas is not { Count: > 0 })
                {
                    var textoFinal = respuesta.Texto ?? string.Empty;
                    await RegistrarOperacionIaAsync(textoFinal, solicitud.Pregunta, proyectoIdConsultado, modelo);
                    return Ok(new RespuestaAsistenteOperadorDto { Texto = textoFinal });
                }

                historial.Add(new MensajeIADto { Rol = "assistant", LlamadasHerramientas = respuesta.LlamadasHerramientas });

                foreach (var llamada in respuesta.LlamadasHerramientas)
                {
                    var (resultado, proyectoId) = await EjecutarHerramientaAsync(llamada, esAdminSyc, proyectosPermitidos);
                    proyectoIdConsultado ??= proyectoId;
                    historial.Add(new MensajeIADto { Rol = "tool", LlamadaHerramientaId = llamada.Id, Texto = resultado });
                }
            }

            const string sinResolver = "No pude terminar de resolver tu pregunta. Intenta reformularla con más detalle (por ejemplo, el número exacto de la solicitud).";
            await RegistrarOperacionIaAsync(sinResolver, solicitud.Pregunta, proyectoIdConsultado, modelo);
            return Ok(new RespuestaAsistenteOperadorDto { Texto = sinResolver });
        }
        catch (IAServiceException ex)
        {
            _logger.LogWarning(ex, "El Asistente IA de Operador no pudo responder.");
            return StatusCode(503, "El asistente no está disponible en este momento. Intenta de nuevo más tarde.");
        }
    }

    private static List<HerramientaIADto> ConstruirHerramientas()
    {
        var schemaIdentificador = JsonDocument.Parse("""
        {
          "type": "object",
          "properties": {
            "identificador": {
              "type": "string",
              "description": "Número de la solicitud (ej. GT-0001), número de lote/tornaguía, código de la estampilla, o nombre/NIT de la empresa."
            }
          },
          "required": ["identificador"]
        }
        """).RootElement.Clone();

        var schemaRangoFechas = JsonDocument.Parse("""
        {
          "type": "object",
          "properties": {
            "desde": {
              "type": "string",
              "description": "Fecha inicial del rango, formato AAAA-MM-DD."
            },
            "hasta": {
              "type": "string",
              "description": "Fecha final del rango, formato AAAA-MM-DD."
            }
          },
          "required": ["desde", "hasta"]
        }
        """).RootElement.Clone();

        return new List<HerramientaIADto>
        {
            new()
            {
                Nombre = "buscar_lote_gotrace",
                Descripcion = "Busca UN lote de trazabilidad de GoTrace por número de solicitud, número de lote o empresa.",
                ParametrosSchema = schemaIdentificador,
            },
            new()
            {
                Nombre = "buscar_tornaguia_infoconsumo",
                Descripcion = "Busca UNA tornaguía de movilización de Infoconsumo por número de solicitud, número de lote o empresa.",
                ParametrosSchema = schemaIdentificador,
            },
            new()
            {
                Nombre = "buscar_estampilla_syctrace",
                Descripcion = "Busca UNA estampilla física de SycTrace por número de solicitud, código de estampilla o empresa.",
                ParametrosSchema = schemaIdentificador,
            },
            new()
            {
                Nombre = "trazar_cadena_gotrace",
                Descripcion = "Dado un lote de GoTrace (por número de solicitud, número de lote o empresa), devuelve su detalle completo MÁS la tornaguía de Infoconsumo y la estampilla de SycTrace generadas a partir de él, si existen. Úsala para trazabilidad/resumen consolidado entre módulos.",
                ParametrosSchema = schemaIdentificador,
            },
            new()
            {
                Nombre = "listar_lotes_gotrace",
                Descripcion = "Lista TODOS los lotes de GoTrace radicados dentro de un rango de fechas (producto, número de lote, unidades, cadena de custodia). No incluye movilización ni transportador — eso es de Infoconsumo.",
                ParametrosSchema = schemaRangoFechas,
            },
            new()
            {
                Nombre = "listar_tornaguias_infoconsumo",
                Descripcion = "Lista TODAS las tornaguías de Infoconsumo radicadas dentro de un rango de fechas (producto, unidades, ciudad origen/destino, empresa transportadora, pago).",
                ParametrosSchema = schemaRangoFechas,
            },
            new()
            {
                Nombre = "listar_estampillas_syctrace",
                Descripcion = "Lista TODAS las estampillas de SycTrace radicadas dentro de un rango de fechas (producto, cantidad expedida, pago).",
                ParametrosSchema = schemaRangoFechas,
            },
        };
    }

    // Ejecuta una tool pedida por el modelo contra la BD, con el mismo scoping por claims que el
    // resto de la app — el operador nunca recibe una fila de un proyecto donde no tiene
    // UsuarioProyecto, sin importar qué pregunte. Devuelve el texto para el modelo y, si hubo
    // exactamente un resultado, el ProyectoId consultado (para loguear en OperacionIA).
    private static readonly HashSet<string> HerramientasDeListado = new()
    {
        "listar_lotes_gotrace", "listar_tornaguias_infoconsumo", "listar_estampillas_syctrace",
    };

    private async Task<(string resultado, int? proyectoId)> EjecutarHerramientaAsync(
        LlamadaHerramientaDto llamada, bool esAdminSyc, List<int> proyectosPermitidos)
    {
        JsonDocument argumentos;
        try
        {
            argumentos = JsonDocument.Parse(llamada.ArgumentosJson);
        }
        catch (JsonException)
        {
            return ("Argumentos inválidos.", null);
        }

        using (argumentos)
        {
            if (HerramientasDeListado.Contains(llamada.Nombre))
            {
                // Postgres (timestamp with time zone) exige DateTime.Kind = Utc — DateTime.TryParse
                // simple deja Kind = Unspecified y Npgsql lo rechaza en tiempo de ejecución.
                const DateTimeStyles estiloUtc = DateTimeStyles.AssumeUniversal | DateTimeStyles.AdjustToUniversal;
                if (!argumentos.RootElement.TryGetProperty("desde", out var desdeEl)
                    || !argumentos.RootElement.TryGetProperty("hasta", out var hastaEl)
                    || !DateTime.TryParse(desdeEl.GetString(), CultureInfo.InvariantCulture, estiloUtc, out var desde)
                    || !DateTime.TryParse(hastaEl.GetString(), CultureInfo.InvariantCulture, estiloUtc, out var hasta))
                {
                    return ("Faltan o son inválidas las fechas 'desde'/'hasta' (formato AAAA-MM-DD).", null);
                }

                hasta = hasta.Date.AddDays(1).AddTicks(-1); // incluir todo el día 'hasta'

                return llamada.Nombre switch
                {
                    "listar_lotes_gotrace" => await ListarLotesGoTraceAsync(desde, hasta, esAdminSyc, proyectosPermitidos),
                    "listar_tornaguias_infoconsumo" => await ListarTornaguiasInfoconsumoAsync(desde, hasta, esAdminSyc, proyectosPermitidos),
                    "listar_estampillas_syctrace" => await ListarEstampillasSycTraceAsync(desde, hasta, esAdminSyc, proyectosPermitidos),
                    _ => ("Herramienta desconocida.", null),
                };
            }

            var identificador = argumentos.RootElement.TryGetProperty("identificador", out var idEl)
                ? idEl.GetString()?.Trim() ?? string.Empty
                : string.Empty;

            if (string.IsNullOrWhiteSpace(identificador))
            {
                return ("Falta el identificador a buscar.", null);
            }

            return llamada.Nombre switch
            {
                "buscar_lote_gotrace" => await BuscarLoteGoTraceAsync(identificador, esAdminSyc, proyectosPermitidos),
                "buscar_tornaguia_infoconsumo" => await BuscarTornaguiaInfoconsumoAsync(identificador, esAdminSyc, proyectosPermitidos),
                "buscar_estampilla_syctrace" => await BuscarEstampillaSycTraceAsync(identificador, esAdminSyc, proyectosPermitidos),
                "trazar_cadena_gotrace" => await TrazarCadenaGoTraceAsync(identificador, esAdminSyc, proyectosPermitidos),
                _ => ("Herramienta desconocida.", null),
            };
        }
    }

    // Sigue la cadena real de FKs entre módulos: TornaguiaInfoconsumo.LoteGoTraceSolicitudId
    // apunta a la Solicitud de GoTrace de la que se heredó, y EstampillaFisica.SolicitudInfoconsumoId
    // apunta a la Solicitud de Infoconsumo de la que se heredó (ver Solicitud.cs / comentarios en
    // TornaguiaInfoconsumo.cs y EstampillaFisica.cs). Los "buscar_*" puntuales no la usan porque
    // buscan por identificador DENTRO de su propio módulo, no por el lote de origen de otro.
    private async Task<(string, int?)> TrazarCadenaGoTraceAsync(string identificador, bool esAdminSyc, List<int> proyectosPermitidos)
    {
        var coincidencias = await ResolverGoTracePorIdentificadorAsync(identificador, esAdminSyc, proyectosPermitidos);

        if (coincidencias.Count == 0)
        {
            return ("No se encontró ningún lote de GoTrace que coincida, dentro de los proyectos a los que el usuario tiene acceso.", null);
        }

        if (coincidencias.Count > 1)
        {
            return (ArmarListaDisambiguacion(coincidencias, s => $"lote {s.LoteGoTrace!.NumeroLote}, empresa {s.Empresa?.RazonSocial}"), null);
        }

        var gotrace = coincidencias[0];
        var partes = new List<string> { "**GoTrace**", FormatearDetalleLoteGoTrace(gotrace) };

        var infoconsumo = await _context.Solicitudes
            .Include(s => s.Proyecto)
            .Include(s => s.Empresa)
            .Include(s => s.TornaguiaInfoconsumo)
            .Where(s => s.TornaguiaInfoconsumo != null && s.TornaguiaInfoconsumo.LoteGoTraceSolicitudId == gotrace.Id)
            .Where(s => esAdminSyc || (s.ProyectoId != null && proyectosPermitidos.Contains(s.ProyectoId.Value)))
            .FirstOrDefaultAsync();

        if (infoconsumo == null)
        {
            partes.Add("**Infoconsumo**: aún no se ha creado una tornaguía de movilización a partir de este lote (o el usuario no tiene acceso a Infoconsumo).");
            return (string.Join("\n\n", partes), gotrace.ProyectoId);
        }

        partes.Add("**Infoconsumo**\n" + FormatearDetalleTornaguiaInfoconsumo(infoconsumo));

        var syctrace = await _context.Solicitudes
            .Include(s => s.Proyecto)
            .Include(s => s.Empresa)
            .Include(s => s.EstampillaFisica)
            .Where(s => s.EstampillaFisica != null && s.EstampillaFisica.SolicitudInfoconsumoId == infoconsumo.Id)
            .Where(s => esAdminSyc || (s.ProyectoId != null && proyectosPermitidos.Contains(s.ProyectoId.Value)))
            .FirstOrDefaultAsync();

        partes.Add(syctrace == null
            ? "**SycTrace**: aún no se ha expedido una estampilla física a partir de esta tornaguía (o el usuario no tiene acceso a SycTrace)."
            : "**SycTrace**\n" + FormatearDetalleEstampillaSycTrace(syctrace));

        return (string.Join("\n\n", partes), gotrace.ProyectoId);
    }

    private async Task<List<Solicitud>> ResolverGoTracePorIdentificadorAsync(string identificador, bool esAdminSyc, List<int> proyectosPermitidos)
    {
        var candidatos = await _context.Solicitudes
            .Include(s => s.Proyecto)
            .Include(s => s.Empresa)
            .Include(s => s.LoteGoTrace!).ThenInclude(l => l.PuntosControl)
            .Where(s => s.LoteGoTrace != null && s.ProyectoId != null)
            .Where(s => esAdminSyc || proyectosPermitidos.Contains(s.ProyectoId!.Value))
            .ToListAsync();

        return candidatos.Where(s => CoincideBusqueda(identificador, s, s.LoteGoTrace!.NumeroLote)).ToList();
    }

    private const int MaxFilasListado = 20;

    private async Task<(string, int?)> ListarLotesGoTraceAsync(DateTime desde, DateTime hasta, bool esAdminSyc, List<int> proyectosPermitidos)
    {
        var candidatos = await _context.Solicitudes
            .Include(s => s.Proyecto)
            .Include(s => s.Empresa)
            .Include(s => s.LoteGoTrace)
            .Where(s => s.LoteGoTrace != null && s.ProyectoId != null && s.FechaCreacion >= desde && s.FechaCreacion <= hasta)
            .Where(s => esAdminSyc || proyectosPermitidos.Contains(s.ProyectoId!.Value))
            .OrderBy(s => s.FechaCreacion)
            .ToListAsync();

        if (candidatos.Count == 0)
        {
            return ($"No hay lotes de GoTrace radicados entre {desde:yyyy-MM-dd} y {hasta:yyyy-MM-dd}, dentro de los proyectos a los que el usuario tiene acceso.", null);
        }

        var lineas = candidatos.Take(MaxFilasListado).Select(s =>
        {
            var l = s.LoteGoTrace!;
            return $"- {NumeroSolicitud(s)} | {s.Estado} | Empresa: {s.Empresa?.RazonSocial} | Producto: {l.Producto} | Lote: {l.NumeroLote} | Unidades: {l.UnidadesLote} | Producción: {l.FechaProduccion:yyyy-MM-dd}";
        });

        var encabezado = $"{candidatos.Count} lote(s) de GoTrace entre {desde:yyyy-MM-dd} y {hasta:yyyy-MM-dd}" +
            (candidatos.Count > MaxFilasListado ? $" (mostrando los primeros {MaxFilasListado})" : "") + ":";

        return (encabezado + "\n" + string.Join("\n", lineas), null);
    }

    private async Task<(string, int?)> ListarTornaguiasInfoconsumoAsync(DateTime desde, DateTime hasta, bool esAdminSyc, List<int> proyectosPermitidos)
    {
        var candidatos = await _context.Solicitudes
            .Include(s => s.Proyecto)
            .Include(s => s.Empresa)
            .Include(s => s.TornaguiaInfoconsumo)
            .Where(s => s.TornaguiaInfoconsumo != null && s.ProyectoId != null && s.FechaCreacion >= desde && s.FechaCreacion <= hasta)
            .Where(s => esAdminSyc || proyectosPermitidos.Contains(s.ProyectoId!.Value))
            .OrderBy(s => s.FechaCreacion)
            .ToListAsync();

        if (candidatos.Count == 0)
        {
            return ($"No hay tornaguías de Infoconsumo radicadas entre {desde:yyyy-MM-dd} y {hasta:yyyy-MM-dd}, dentro de los proyectos a los que el usuario tiene acceso.", null);
        }

        var lineas = candidatos.Take(MaxFilasListado).Select(s =>
        {
            var t = s.TornaguiaInfoconsumo!;
            return $"- {NumeroSolicitud(s)} | {s.Estado} | Empresa: {s.Empresa?.RazonSocial} | Producto: {t.CategoriaProducto}/{t.SubcategoriaProducto} | Unidades: {t.UnidadesFisicas} | " +
                $"Movilización: {t.MunicipioOrigen} -> {t.MunicipioDestino} | Transportador: {t.EmpresaTransportadora} (placa {t.PlacaVehiculo}) | Pago: {(t.PagoConfirmado ? "confirmado" : "pendiente")}";
        });

        var encabezado = $"{candidatos.Count} tornaguía(s) de Infoconsumo entre {desde:yyyy-MM-dd} y {hasta:yyyy-MM-dd}" +
            (candidatos.Count > MaxFilasListado ? $" (mostrando las primeras {MaxFilasListado})" : "") + ":";

        return (encabezado + "\n" + string.Join("\n", lineas), null);
    }

    private async Task<(string, int?)> ListarEstampillasSycTraceAsync(DateTime desde, DateTime hasta, bool esAdminSyc, List<int> proyectosPermitidos)
    {
        var candidatos = await _context.Solicitudes
            .Include(s => s.Proyecto)
            .Include(s => s.Empresa)
            .Include(s => s.EstampillaFisica)
            .Where(s => s.EstampillaFisica != null && s.ProyectoId != null && s.FechaCreacion >= desde && s.FechaCreacion <= hasta)
            .Where(s => esAdminSyc || proyectosPermitidos.Contains(s.ProyectoId!.Value))
            .OrderBy(s => s.FechaCreacion)
            .ToListAsync();

        if (candidatos.Count == 0)
        {
            return ($"No hay estampillas de SycTrace radicadas entre {desde:yyyy-MM-dd} y {hasta:yyyy-MM-dd}, dentro de los proyectos a los que el usuario tiene acceso.", null);
        }

        var lineas = candidatos.Take(MaxFilasListado).Select(s =>
        {
            var e = s.EstampillaFisica!;
            return $"- {NumeroSolicitud(s)} | {s.Estado} | Empresa: {s.Empresa?.RazonSocial} | Producto: {e.NombreProducto} | Cantidad expedida: {e.CantidadEstampillas:N0} | Pago: {(e.FechaPago.HasValue ? e.FechaPago.Value.ToString("yyyy-MM-dd") : "pendiente")}";
        });

        var encabezado = $"{candidatos.Count} estampilla(s) de SycTrace entre {desde:yyyy-MM-dd} y {hasta:yyyy-MM-dd}" +
            (candidatos.Count > MaxFilasListado ? $" (mostrando las primeras {MaxFilasListado})" : "") + ":";

        return (encabezado + "\n" + string.Join("\n", lineas), null);
    }

    private async Task<(string, int?)> BuscarLoteGoTraceAsync(string identificador, bool esAdminSyc, List<int> proyectosPermitidos)
    {
        var coincidencias = await ResolverGoTracePorIdentificadorAsync(identificador, esAdminSyc, proyectosPermitidos);

        if (coincidencias.Count == 0)
        {
            return ("No se encontró ningún lote de GoTrace que coincida, dentro de los proyectos a los que el usuario tiene acceso.", null);
        }

        if (coincidencias.Count > 1)
        {
            return (ArmarListaDisambiguacion(coincidencias, s => $"lote {s.LoteGoTrace!.NumeroLote}, empresa {s.Empresa?.RazonSocial}"), null);
        }

        var s0 = coincidencias[0];
        return (FormatearDetalleLoteGoTrace(s0), s0.ProyectoId);
    }

    private static string FormatearDetalleLoteGoTrace(Solicitud s0)
    {
        var lote = s0.LoteGoTrace!;
        var puntosOrdenados = lote.PuntosControl.OrderBy(p => p.Orden).ToList();
        var puntosConfirmados = puntosOrdenados.Count(p => p.Confirmado);
        var puntosHabilitados = puntosOrdenados.Count(p => p.Habilitado);

        var lineas = new List<string>
        {
            $"Solicitud: {NumeroSolicitud(s0)}",
            $"Estado: {s0.Estado}",
            $"Empresa: {s0.Empresa?.RazonSocial} (NIT {s0.Empresa?.Nit})",
            $"Producto: {lote.Producto}",
            $"Número de lote: {lote.NumeroLote}",
            $"Fecha de producción: {lote.FechaProduccion:yyyy-MM-dd}",
            $"Unidades del lote: {lote.UnidadesLote}",
            $"Cadena de custodia: {puntosConfirmados} de {puntosHabilitados} puntos habilitados confirmados.",
        };
        if (puntosOrdenados.Count > 0)
        {
            lineas.Add("Detalle de puntos: " + string.Join(", ", puntosOrdenados.Select(p =>
                $"{p.Nombre} ({(p.Habilitado ? (p.Confirmado ? "confirmado" : "pendiente") : "no habilitado")})")));
        }

        return string.Join("\n", lineas);
    }

    private async Task<(string, int?)> BuscarTornaguiaInfoconsumoAsync(string identificador, bool esAdminSyc, List<int> proyectosPermitidos)
    {
        var candidatos = await _context.Solicitudes
            .Include(s => s.Proyecto)
            .Include(s => s.Empresa)
            .Include(s => s.TornaguiaInfoconsumo)
            .Where(s => s.TornaguiaInfoconsumo != null && s.ProyectoId != null)
            .Where(s => esAdminSyc || proyectosPermitidos.Contains(s.ProyectoId!.Value))
            .ToListAsync();

        var coincidencias = candidatos.Where(s => CoincideBusqueda(identificador, s, s.TornaguiaInfoconsumo!.NumeroLote)).ToList();

        if (coincidencias.Count == 0)
        {
            return ("No se encontró ninguna tornaguía de Infoconsumo que coincida, dentro de los proyectos a los que el usuario tiene acceso.", null);
        }

        if (coincidencias.Count > 1)
        {
            return (ArmarListaDisambiguacion(coincidencias, s => $"empresa {s.Empresa?.RazonSocial}, {(s.TornaguiaInfoconsumo!.PagoConfirmado ? "pago confirmado" : "pago pendiente")}"), null);
        }

        var s0 = coincidencias[0];
        return (FormatearDetalleTornaguiaInfoconsumo(s0), s0.ProyectoId);
    }

    private static string FormatearDetalleTornaguiaInfoconsumo(Solicitud s0)
    {
        var t = s0.TornaguiaInfoconsumo!;
        var lineas = new List<string>
        {
            $"Solicitud: {NumeroSolicitud(s0)}",
            $"Estado: {s0.Estado}",
            $"Empresa: {s0.Empresa?.RazonSocial} (NIT {s0.Empresa?.Nit})",
            $"Producto: {t.CategoriaProducto} / {t.SubcategoriaProducto}",
            $"Movilización: {t.MunicipioOrigen} ({t.DepartamentoOrigen}) -> {t.MunicipioDestino} ({t.DepartamentoDestino})",
            $"Unidades físicas: {t.UnidadesFisicas}, PVP certificado: {t.PvpCertificado:N0}",
            $"Pago del impuesto: {(t.PagoConfirmado ? $"confirmado el {t.FechaPagoConfirmado:yyyy-MM-dd}" : "pendiente")}",
        };
        if (!string.IsNullOrWhiteSpace(t.NumeroLote))
        {
            lineas.Add($"Número de lote (heredado de GoTrace o manual): {t.NumeroLote}");
        }

        return string.Join("\n", lineas);
    }

    private async Task<(string, int?)> BuscarEstampillaSycTraceAsync(string identificador, bool esAdminSyc, List<int> proyectosPermitidos)
    {
        var candidatos = await _context.Solicitudes
            .Include(s => s.Proyecto)
            .Include(s => s.Empresa)
            .Include(s => s.EstampillaFisica)
            .Where(s => s.EstampillaFisica != null && s.ProyectoId != null)
            .Where(s => esAdminSyc || proyectosPermitidos.Contains(s.ProyectoId!.Value))
            .ToListAsync();

        // CodigoCompleto es calculado (Prefijo + CodigoInicial), no es columna de BD — se compara
        // en memoria, igual que ya hace SycTraceController.
        var coincidencias = candidatos.Where(s =>
        {
            var e = s.EstampillaFisica!;
            var codigoCompleto = $"{e.Prefijo}{e.CodigoInicial:00000000}";
            return CoincideBusqueda(identificador, s, codigoCompleto);
        }).ToList();

        if (coincidencias.Count == 0)
        {
            return ("No se encontró ninguna estampilla de SycTrace que coincida, dentro de los proyectos a los que el usuario tiene acceso.", null);
        }

        if (coincidencias.Count > 1)
        {
            return (ArmarListaDisambiguacion(coincidencias, s => $"producto {s.EstampillaFisica!.NombreProducto}, empresa {s.Empresa?.RazonSocial}"), null);
        }

        var s0 = coincidencias[0];
        return (FormatearDetalleEstampillaSycTrace(s0), s0.ProyectoId);
    }

    private static string FormatearDetalleEstampillaSycTrace(Solicitud s0)
    {
        var e0 = s0.EstampillaFisica!;
        var lineas = new List<string>
        {
            $"Solicitud: {NumeroSolicitud(s0)}",
            $"Estado: {s0.Estado}",
            $"Empresa: {s0.Empresa?.RazonSocial} (NIT {s0.Empresa?.Nit})",
            $"Producto: {e0.NombreProducto} ({e0.CategoriaProducto} / {e0.SubcategoriaProducto})",
            $"Código completo: {e0.Prefijo}{e0.CodigoInicial:00000000}",
            $"Rango expedido: {e0.CantidadEstampillas:N0} estampillas ({e0.Prefijo}-{e0.CodigoInicial:00000} a {e0.Prefijo}-{e0.CodigoFinal:00000})",
            $"Registro INVIMA: {e0.RegistroInvima}, lote de producción: {e0.LoteProduccion}",
            $"Pago: {(e0.FechaPago.HasValue ? e0.FechaPago.Value.ToString("yyyy-MM-dd") : "pendiente")}",
        };
        if (!string.IsNullOrWhiteSpace(e0.MotivoAnulacion))
        {
            lineas.Add($"Anulada: {e0.MotivoAnulacion}");
        }

        return string.Join("\n", lineas);
    }

    private static bool CoincideBusqueda(string identificador, Solicitud s, string? campoEspecifico)
    {
        return NumeroSolicitud(s).Contains(identificador, StringComparison.OrdinalIgnoreCase)
            || (!string.IsNullOrWhiteSpace(campoEspecifico) && campoEspecifico.Contains(identificador, StringComparison.OrdinalIgnoreCase))
            || (s.Empresa != null && (
                s.Empresa.RazonSocial.Contains(identificador, StringComparison.OrdinalIgnoreCase)
                || s.Empresa.Nit.Contains(identificador, StringComparison.OrdinalIgnoreCase)));
    }

    private static string NumeroSolicitud(Solicitud s) => s.Proyecto != null ? $"{s.Proyecto.Codigo}-{s.Id:0000}" : $"{s.Id:0000}";

    private static string ArmarListaDisambiguacion(List<Solicitud> coincidencias, Func<Solicitud, string> detalle)
    {
        var lista = coincidencias.Take(5).Select(s => $"- {NumeroSolicitud(s)}: {detalle(s)}, estado {s.Estado}");
        return "Hay varias coincidencias, pide al usuario que precise cuál antes de responder:\n" + string.Join("\n", lista);
    }

    private async Task RegistrarOperacionIaAsync(string resultado, string entrada, int? proyectoId, string modelo)
    {
        var usuarioId = int.Parse(User.FindFirst("sub")!.Value);
        _context.OperacionesIA.Add(new OperacionIA
        {
            UsuarioId = usuarioId,
            ProyectoId = proyectoId,
            TipoAnalisis = "AsistenteOperador",
            Modelo = modelo,
            Entrada = entrada,
            Resultado = resultado,
        });
        await _context.SaveChangesAsync();
    }
}
