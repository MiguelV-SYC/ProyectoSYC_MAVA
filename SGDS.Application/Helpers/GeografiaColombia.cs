namespace SGDS.Application.Helpers;

// Coordenadas de las capitales de los 32 departamentos + Bogotá D.C., usadas como punto de
// referencia del mapa y del cálculo de distancia aproximada origen-destino de una tornaguía.
// No se geocodifican los ~1.122 municipios de Colombia (dato que no se puede garantizar preciso
// de memoria) — el mapa ubica siempre a nivel de capital departamental, aunque el formulario
// capture el municipio exacto como texto libre.
public static class GeografiaColombia
{
    public record Coordenada(double Lat, double Lng);

    public static readonly Dictionary<string, Coordenada> CapitalesPorDepartamento = new()
    {
        ["Amazonas"] = new(-4.2153, -69.9406),
        ["Antioquia"] = new(6.2442, -75.5812),
        ["Arauca"] = new(7.0847, -70.7591),
        ["Atlántico"] = new(10.9639, -74.7964),
        ["Bogotá D.C."] = new(4.7110, -74.0721),
        ["Bolívar"] = new(10.3910, -75.4794),
        ["Boyacá"] = new(5.5353, -73.3678),
        ["Caldas"] = new(5.0689, -75.5174),
        ["Caquetá"] = new(1.6144, -75.6062),
        ["Casanare"] = new(5.3378, -72.3959),
        ["Cauca"] = new(2.4448, -76.6147),
        ["Cesar"] = new(10.4631, -73.2532),
        ["Chocó"] = new(5.6947, -76.6611),
        ["Córdoba"] = new(8.7479, -75.8814),
        ["Cundinamarca"] = new(4.7110, -74.0721),
        ["Guainía"] = new(3.8653, -67.9239),
        ["Guaviare"] = new(2.5728, -72.6406),
        ["Huila"] = new(2.9273, -75.2819),
        ["La Guajira"] = new(11.5444, -72.9072),
        ["Magdalena"] = new(11.2408, -74.1990),
        ["Meta"] = new(4.1420, -73.6266),
        ["Nariño"] = new(1.2136, -77.2811),
        ["Norte de Santander"] = new(7.8891, -72.4967),
        ["Putumayo"] = new(1.1466, -76.6486),
        ["Quindío"] = new(4.5389, -75.6722),
        ["Risaralda"] = new(4.8087, -75.6906),
        ["San Andrés y Providencia"] = new(12.5847, -81.7006),
        ["Santander"] = new(7.1193, -73.1227),
        ["Sucre"] = new(9.3047, -75.3978),
        ["Tolima"] = new(4.4389, -75.2322),
        ["Valle del Cauca"] = new(3.4516, -76.5320),
        ["Vaupés"] = new(1.2537, -70.2340),
        ["Vichada"] = new(6.1891, -67.4859),
    };

    public static Coordenada? ObtenerCapital(string? departamento) =>
        departamento != null && CapitalesPorDepartamento.TryGetValue(departamento, out var c) ? c : null;

    public static double? DistanciaAproximadaKm(string? departamentoOrigen, string? departamentoDestino)
    {
        var origen = ObtenerCapital(departamentoOrigen);
        var destino = ObtenerCapital(departamentoDestino);
        if (origen == null || destino == null) return null;
        return Haversine(origen.Lat, origen.Lng, destino.Lat, destino.Lng);
    }

    private static double Haversine(double lat1, double lon1, double lat2, double lon2)
    {
        const double radioTierraKm = 6371;
        var dLat = ARadianes(lat2 - lat1);
        var dLon = ARadianes(lon2 - lon1);
        var a = Math.Sin(dLat / 2) * Math.Sin(dLat / 2) +
                Math.Cos(ARadianes(lat1)) * Math.Cos(ARadianes(lat2)) *
                Math.Sin(dLon / 2) * Math.Sin(dLon / 2);
        var c = 2 * Math.Atan2(Math.Sqrt(a), Math.Sqrt(1 - a));
        return radioTierraKm * c;
    }

    private static double ARadianes(double grados) => grados * Math.PI / 180;
}
