namespace SGDS.Application.Interfaces;

public record CandidatoDireccion(string DireccionCompleta, double Lat, double Lng);

public interface IServicioGeocodificacion
{
    // latSesgo/lngSesgo: centro del municipio ya seleccionado en el formulario (si lo hay) —
    // sin esto, Nominatim prioriza resultados de las ciudades más grandes de Colombia
    // (típicamente Bogotá) sobre la dirección real que el usuario quiso buscar.
    Task<IReadOnlyList<CandidatoDireccion>> BuscarDireccionesAsync(string texto, double? latSesgo = null, double? lngSesgo = null, CancellationToken ct = default);
}
