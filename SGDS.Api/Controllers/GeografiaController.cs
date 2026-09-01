using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using SGDS.Application.Interfaces;

namespace SGDS.Api.Controllers;

// Endpoints de referencia geográfica — sin scoping por proyecto (no son datos de negocio,
// son catálogos/datos abiertos), pero igual requieren sesión autenticada como el resto de la API.
[ApiController]
[Route("api/[controller]")]
[Authorize]
public class GeografiaController : ControllerBase
{
    private readonly IServicioGeografia _geografia;
    private readonly IServicioGeocodificacion _geocodificacion;

    public GeografiaController(IServicioGeografia geografia, IServicioGeocodificacion geocodificacion)
    {
        _geografia = geografia;
        _geocodificacion = geocodificacion;
    }

    // GET: api/Geografia/municipios?buscar=zipa&departamento=Cundinamarca
    // Autocompletado de municipios (dataset DIVIPOLA-DANE, 1.104 municipios con coordenadas).
    [HttpGet("municipios")]
    public IActionResult GetMunicipios([FromQuery] string? buscar, [FromQuery] string? departamento)
    {
        var resultado = _geografia.BuscarMunicipios(buscar, departamento).Select(m => new
        {
            m.Departamento,
            m.Municipio,
            m.Lat,
            m.Lng,
        });

        return Ok(resultado);
    }

    // GET: api/Geografia/direcciones?texto=calle 45 %23 12-34 bucaramanga&latSesgo=&lngSesgo=
    // Búsqueda en vivo de direcciones libres (Nominatim/OSM) — usada para precisar el punto
    // exacto de origen/destino más allá del centroide del municipio. latSesgo/lngSesgo son el
    // centro del municipio ya elegido en el formulario, para priorizar resultados cercanos.
    [HttpGet("direcciones")]
    public async Task<IActionResult> GetDirecciones([FromQuery] string texto, [FromQuery] double? latSesgo, [FromQuery] double? lngSesgo, CancellationToken ct)
    {
        var resultado = await _geocodificacion.BuscarDireccionesAsync(texto, latSesgo, lngSesgo, ct);
        return Ok(resultado);
    }
}
