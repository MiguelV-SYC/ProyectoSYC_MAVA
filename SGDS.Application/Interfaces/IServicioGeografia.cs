namespace SGDS.Application.Interfaces;

public record MunicipioColombia(string Departamento, string Municipio, double Lat, double Lng);

public interface IServicioGeografia
{
    // Límite alto por defecto: cuando el frontend pide un departamento completo (sin texto de
    // búsqueda) para filtrar en el cliente, necesita la lista entera — el más grande,
    // Antioquia, tiene 125 municipios. Solo se acota fuerte cuando SÍ hay texto de búsqueda
    // (autocompletado real), donde 20 coincidencias ya es más que suficiente para un dropdown.
    IReadOnlyList<MunicipioColombia> BuscarMunicipios(string? buscar, string? departamento, int limite = 200);

    (double Lat, double Lng)? ObtenerCoordenada(string? departamento, string? municipio);
}
