using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Options;
using SGDS.Application.DTOs;
using SGDS.Application.Helpers;
using SGDS.Domain.Entities;
using SGDS.Infrastructure.Data;

namespace SGDS.Api.Controllers;

[ApiController]
[Route("api/[controller]")]
[Authorize]
public class VehiculosController : ControllerBase
{
    private readonly SgdsDbContext _context;
    private readonly ConfiguracionBaseGravableVehiculo _configBaseGravable;

    public VehiculosController(SgdsDbContext context, IOptions<ConfiguracionBaseGravableVehiculo> configBaseGravable)
    {
        _context = context;
        _configBaseGravable = configBaseGravable.Value;
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

        // Un vehículo recién creado ("+ nuevo vehículo") todavía no tiene ninguna solicitud —
        // Vehiculo es una entidad global (como Ciudadano/Empresa), no queda "asignado" a un
        // proyecto hasta su primera solicitud. Sin este OR, quedaba invisible en el listado
        // para cualquier operador no-admin (y en el filtro por proyecto) hasta que se usara.
        if (!esAdminSyc)
        {
            query = query.Where(v => v.Solicitudes.Count == 0
                || v.Solicitudes.Any(s => s.ProyectoId != null && proyectosPermitidos.Contains(s.ProyectoId.Value)));
        }

        if (proyectoId.HasValue)
        {
            query = query.Where(v => v.Solicitudes.Count == 0 || v.Solicitudes.Any(s => s.ProyectoId == proyectoId.Value));
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
                NumeroChasis = v.NumeroChasis,
                Cilindraje = v.Cilindraje,
                TipoVehiculo = v.TipoVehiculo,
                Subtipo = v.Subtipo,
                MunicipioMatricula = v.MunicipioMatricula,
                DepartamentoMatricula = v.DepartamentoMatricula,
                Blindado = v.Blindado,
                EsClasicoAntiguo = v.EsClasicoAntiguo
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

        // Un vehículo recién creado ("+ nuevo vehículo") todavía no tiene ninguna solicitud —
        // bloquearlo hasta que se use en una dejaría al propio operador que lo acaba de crear
        // sin poder ver su ficha (404 justo después de guardar). Solo se restringe cuando el
        // vehículo YA tiene solicitudes y ninguna está en un proyecto permitido para este usuario.
        if (!esAdminSyc && vehiculo.Solicitudes.Count > 0
            && !vehiculo.Solicitudes.Any(s => s.ProyectoId != null && proyectosPermitidos.Contains(s.ProyectoId.Value)))
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
            NumeroChasis = vehiculo.NumeroChasis,
            Cilindraje = vehiculo.Cilindraje,
            TipoVehiculo = vehiculo.TipoVehiculo,
            Subtipo = vehiculo.Subtipo,
            MunicipioMatricula = vehiculo.MunicipioMatricula,
            DepartamentoMatricula = vehiculo.DepartamentoMatricula,
            Blindado = vehiculo.Blindado,
            EsClasicoAntiguo = vehiculo.EsClasicoAntiguo
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

        // Placa tiene índice único en la base — sin este chequeo, un doble envío del formulario
        // (o un reintento tras un error de red que sí alcanzó a guardar) revienta con un
        // DbUpdateException sin manejar y sale como 500 crudo en vez de un mensaje claro.
        var placaDuplicada = await _context.Vehiculos.AnyAsync(v => v.Placa.ToUpper() == dto.Placa.Trim().ToUpper());
        if (placaDuplicada)
        {
            return BadRequest(new { mensaje = $"Ya existe un vehículo registrado con la placa {dto.Placa.Trim().ToUpper()}." });
        }

        var nuevoVehiculo = new Vehiculo
        {
            CiudadanoId = dto.CiudadanoId,
            EmpresaId = dto.EmpresaId,
            Placa = dto.Placa,
            Marca = dto.Marca,
            Linea = dto.Linea,
            Modelo = dto.Modelo,
            NumeroChasis = dto.NumeroChasis,
            Cilindraje = dto.Cilindraje,
            TipoVehiculo = dto.TipoVehiculo,
            Subtipo = dto.Subtipo,
            MunicipioMatricula = dto.MunicipioMatricula,
            DepartamentoMatricula = dto.DepartamentoMatricula,
            Blindado = dto.Blindado,
            EsClasicoAntiguo = dto.EsClasicoAntiguo
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
            NumeroChasis = nuevoVehiculo.NumeroChasis,
            Cilindraje = nuevoVehiculo.Cilindraje,
            TipoVehiculo = nuevoVehiculo.TipoVehiculo,
            Subtipo = nuevoVehiculo.Subtipo,
            MunicipioMatricula = nuevoVehiculo.MunicipioMatricula,
            DepartamentoMatricula = nuevoVehiculo.DepartamentoMatricula,
            Blindado = nuevoVehiculo.Blindado,
            EsClasicoAntiguo = nuevoVehiculo.EsClasicoAntiguo
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
        vehiculo.Cilindraje = dto.Cilindraje;
        vehiculo.TipoVehiculo = dto.TipoVehiculo;
        vehiculo.Subtipo = dto.Subtipo;
        vehiculo.MunicipioMatricula = dto.MunicipioMatricula;
        vehiculo.DepartamentoMatricula = dto.DepartamentoMatricula;
        vehiculo.Blindado = dto.Blindado;
        vehiculo.EsClasicoAntiguo = dto.EsClasicoAntiguo;

        await _context.SaveChangesAsync();

        return NoContent();
    }

    // Reglas_de_negocio_IUVA.md, secciones 1 y 2 — la tabla oficial del Ministerio de Transporte
    // NO distingue estos subtipos (su columna "Clase" trae un único valor uniforme para estos 2
    // tipos: "AUTOMOVIL" y "CAMIONETAS Y CAMPEROS"). Se muestran como categoría descriptiva del
    // usuario, no como filtro real — /catalogo-marcas y /catalogo-lineas los ignoran para estos
    // tipos. "Camionetas Doble Cabina (Pick-Up)" NO se incluye aquí a propósito: en los datos
    // reales ya es su propio Tipo (Tabla 3), no un subtipo dentro de Camionetas y Camperos.
    private static readonly Dictionary<string, string[]> SubtiposNarrativosPorTipo = new()
    {
        ["AUTOMOVILES"] = new[] { "Automóviles de Pasajeros (Sedán / Hatchback)", "Station Wagon / Break", "Automóviles Deportivos / Coupé" },
        ["CAMIONETAS Y CAMPEROS"] = new[] { "Camperos (Cabinados o Carpados)", "Camionetas SUV", "Camionetas Van / Panel" },
    };

    // GET: api/Vehiculos/catalogo-tipos
    // Catálogo Tipo -> Subtipos alimentado en vivo desde BasesGravablesVehiculos (9 tipos, cada
    // uno con sus Clase reales) — no hardcodeado en el frontend, ver TipoVehiculoCatalogoDto.
    [HttpGet("catalogo-tipos")]
    public async Task<IActionResult> GetCatalogoTipos()
    {
        var pares = await _context.BasesGravablesVehiculos
            .Select(b => new { b.Tipo, b.Clase })
            .Distinct()
            .ToListAsync();

        var catalogo = pares
            .GroupBy(p => p.Tipo)
            .OrderBy(g => g.Key)
            .Select(g => new TipoVehiculoCatalogoDto
            {
                Tipo = g.Key,
                Subtipos = SubtiposNarrativosPorTipo.TryGetValue(g.Key, out var narrativos)
                    ? narrativos.ToList()
                    : g.Select(p => p.Clase).Where(c => !string.IsNullOrWhiteSpace(c)).Distinct().OrderBy(c => c).ToList(),
                SubtipoInformativo = SubtiposNarrativosPorTipo.ContainsKey(g.Key),
            })
            .ToList();

        return Ok(catalogo);
    }

    // GET: api/Vehiculos/catalogo-marcas?tipo=X&subtipo=Y
    // subtipo se ignora cuando el Tipo tiene subtipo informativo (ver SubtiposNarrativosPorTipo)
    // — filtrar por él ahí devolvería cero marcas, porque esa categoría no existe en la tabla.
    [HttpGet("catalogo-marcas")]
    public async Task<IActionResult> GetCatalogoMarcas([FromQuery] string tipo, [FromQuery] string? subtipo)
    {
        if (string.IsNullOrWhiteSpace(tipo))
            return BadRequest(new { mensaje = "Indica el tipo de vehículo." });

        var query = _context.BasesGravablesVehiculos.Where(b => b.Tipo == tipo);
        if (!string.IsNullOrWhiteSpace(subtipo) && !SubtiposNarrativosPorTipo.ContainsKey(tipo))
            query = query.Where(b => b.Clase == subtipo);

        var marcas = await query.Select(b => b.Marca).Distinct().OrderBy(m => m).ToListAsync();
        return Ok(marcas);
    }

    // GET: api/Vehiculos/catalogo-lineas?tipo=X&subtipo=Y&marca=Z
    // Agrupa por nombre de línea y trae los cilindrajes reales de esa línea — casi siempre uno
    // solo (el formulario lo autocompleta), pero algunas líneas existen en varias motorizaciones
    // (ej. "CLIO (LINEA BASE ESTANDAR)" en 1200/1400/1600cc), ahí el formulario deja elegir.
    [HttpGet("catalogo-lineas")]
    public async Task<IActionResult> GetCatalogoLineas([FromQuery] string tipo, [FromQuery] string? subtipo, [FromQuery] string marca)
    {
        if (string.IsNullOrWhiteSpace(tipo) || string.IsNullOrWhiteSpace(marca))
            return BadRequest(new { mensaje = "Indica el tipo y la marca del vehículo." });

        var query = _context.BasesGravablesVehiculos.Where(b => b.Tipo == tipo && b.Marca == marca);
        if (!string.IsNullOrWhiteSpace(subtipo) && !SubtiposNarrativosPorTipo.ContainsKey(tipo))
            query = query.Where(b => b.Clase == subtipo);

        var filas = await query.Select(b => new { b.Linea, b.Cilindraje }).ToListAsync();

        var lineas = filas
            .GroupBy(f => f.Linea)
            .OrderBy(g => g.Key)
            .Select(g => new LineaVehiculoCatalogoDto
            {
                Linea = g.Key,
                Cilindrajes = g.Select(f => f.Cilindraje).Where(c => !string.IsNullOrWhiteSpace(c)).Select(c => c!).Distinct().OrderBy(c => c).ToList(),
            })
            .ToList();

        return Ok(lineas);
    }

    // GET: api/Vehiculos/5/base-gravable?vehiculoNuevo=false&valorCompra=
    // Ley 488/1998 Art. 143: vehículo nuevo -> valor de factura/importación (no se consulta la
    // tabla); vehículo usado -> tabla Mintransporte por Tipo/Marca/Línea/Cilindraje + año modelo,
    // ajustada por blindaje (+10%) o reemplazada por la base fija de antiguo/clásico si aplica.
    [HttpGet("{id}/base-gravable")]
    public async Task<IActionResult> GetBaseGravable(int id, [FromQuery] bool vehiculoNuevo = false, [FromQuery] decimal? valorCompra = null)
    {
        var vehiculo = await _context.Vehiculos.FindAsync(id);
        if (vehiculo == null)
            return NotFound();

        if (vehiculoNuevo)
        {
            return Ok(new BaseGravableVehiculoDto
            {
                Soportado = valorCompra.HasValue,
                MotivoNoSoportado = valorCompra.HasValue ? null : "Indica el valor de compra (factura o declaración de importación) del vehículo nuevo.",
                ValorTabla = null,
                ValorAjustado = valorCompra,
                AplicaBlindaje = false,
                AplicaClasicoAntiguo = false,
                EsValorCompra = true,
            });
        }

        if (vehiculo.Modelo == null || string.IsNullOrWhiteSpace(vehiculo.TipoVehiculo))
        {
            return Ok(new BaseGravableVehiculoDto
            {
                Soportado = false,
                MotivoNoSoportado = "El vehículo no tiene tipo o año modelo registrado — complétalo en la ficha del vehículo.",
            });
        }

        var tipo = vehiculo.TipoVehiculo.Trim();
        var marca = (vehiculo.Marca ?? string.Empty).Trim();
        var linea = (vehiculo.Linea ?? string.Empty).Trim();
        var cilindraje = (vehiculo.Cilindraje ?? string.Empty).Trim();

        var fila = await _context.BasesGravablesVehiculos
            .Where(b => b.Tipo.ToUpper() == tipo.ToUpper()
                     && b.Marca.ToUpper() == marca.ToUpper()
                     && b.Linea.ToUpper() == linea.ToUpper()
                     && (b.Cilindraje ?? string.Empty).ToUpper() == cilindraje.ToUpper())
            .FirstOrDefaultAsync();

        var resultado = CalculadoraBaseGravableVehiculo.Calcular(fila, vehiculo.Modelo.Value, vehiculo.Blindado, vehiculo.EsClasicoAntiguo, _configBaseGravable);

        return Ok(new BaseGravableVehiculoDto
        {
            Soportado = resultado.Soportado,
            MotivoNoSoportado = resultado.MotivoNoSoportado,
            ValorTabla = resultado.ValorTabla,
            ValorAjustado = resultado.ValorAjustado,
            AplicaBlindaje = resultado.AplicaBlindaje,
            AplicaClasicoAntiguo = resultado.AplicaClasicoAntiguo,
            EsValorCompra = false,
        });
    }

    // DELETE: api/Vehiculos/5
    [HttpDelete("{id}")]
    public async Task<IActionResult> EliminarVehiculo(int id)
    {
        var esAdminSyc = User.FindFirst("esAdminSyc")?.Value == "True";
        if (!esAdminSyc)
            return Forbid();

        var vehiculo = await _context.Vehiculos.FindAsync(id);

        if (vehiculo == null)
            return NotFound();

        _context.Vehiculos.Remove(vehiculo);
        await _context.SaveChangesAsync();

        return NoContent();
    }
}