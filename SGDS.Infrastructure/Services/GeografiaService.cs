using System.Globalization;
using System.Text;
using System.Text.Json;
using SGDS.Application.Interfaces;

namespace SGDS.Infrastructure.Services;

// Carga una sola vez (Singleton) los 1.104 municipios de Colombia con coordenadas reales
// (cabecera municipal), extraídos del export oficial DIVIPOLA-DANE que aportó el usuario
// (Assets/Geolocalización/DIVIPOLA_CentrosPoblados.csv, ver script de conversión en el
// historial del proyecto). Reemplaza el antiguo esquema de "solo coordenada de capital
// departamental" — ver comentario histórico en GeografiaColombia.CapitalesPorDepartamento,
// que se mantiene como respaldo cuando un municipio no matchea ninguno del dataset.
public class GeografiaService : IServicioGeografia
{
    private readonly List<MunicipioColombia> _municipios;
    private readonly ILookup<string, MunicipioColombia> _porClaveNormalizada;

    public GeografiaService(string rutaJson)
    {
        var json = File.ReadAllText(rutaJson);
        using var doc = JsonDocument.Parse(json);

        var lista = new List<MunicipioColombia>();
        foreach (var el in doc.RootElement.EnumerateArray())
        {
            lista.Add(new MunicipioColombia(
                el.GetProperty("departamento").GetString()!,
                el.GetProperty("municipio").GetString()!,
                el.GetProperty("lat").GetDouble(),
                el.GetProperty("lng").GetDouble()));
        }

        _municipios = lista;
        _porClaveNormalizada = lista.ToLookup(m => ClaveNormalizada(m.Departamento, m.Municipio));
    }

    public IReadOnlyList<MunicipioColombia> BuscarMunicipios(string? buscar, string? departamento, int limite = 200)
    {
        IEnumerable<MunicipioColombia> query = _municipios;

        if (!string.IsNullOrWhiteSpace(departamento))
        {
            var deptoNorm = Normalizar(departamento);
            query = query.Where(m => Normalizar(m.Departamento) == deptoNorm);
        }

        if (!string.IsNullOrWhiteSpace(buscar))
        {
            var buscarNorm = Normalizar(buscar);
            query = query.Where(m => Normalizar(m.Municipio).Contains(buscarNorm));
        }

        return query.Take(limite).ToList();
    }

    public (double Lat, double Lng)? ObtenerCoordenada(string? departamento, string? municipio)
    {
        if (string.IsNullOrWhiteSpace(departamento) || string.IsNullOrWhiteSpace(municipio)) return null;

        var match = _porClaveNormalizada[ClaveNormalizada(departamento, municipio)].FirstOrDefault();
        return match == null ? null : (match.Lat, match.Lng);
    }

    private static string ClaveNormalizada(string departamento, string municipio) =>
        $"{Normalizar(departamento)}|{Normalizar(municipio)}";

    // Compara ignorando tildes/mayúsculas — el municipio se captura como texto libre en el
    // formulario (autocompletado, pero no forzado a la lista), así que el match debe tolerar
    // variaciones de escritura del mismo nombre.
    private static string Normalizar(string texto)
    {
        var descompuesto = texto.Normalize(NormalizationForm.FormD);
        var sb = new StringBuilder();
        foreach (var c in descompuesto)
        {
            if (CharUnicodeInfo.GetUnicodeCategory(c) != UnicodeCategory.NonSpacingMark)
                sb.Append(c);
        }
        return sb.ToString().Normalize(NormalizationForm.FormC).Trim().ToUpperInvariant();
    }
}
