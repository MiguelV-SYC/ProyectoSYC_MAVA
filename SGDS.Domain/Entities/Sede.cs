namespace SGDS.Domain.Entities;

// Sede física de atención de Libro Total (Bucaramanga, San Gil, Barrancabermeja, Sincelejo,
// Florencia, Neiva) — catálogo propio, no es un TipoSolicitud: representa un punto de
// atención, no un tipo de trámite.
public class Sede
{
    public int Id { get; set; }
    public string Nombre { get; set; } = string.Empty;
    public string Ciudad { get; set; } = string.Empty;
    public bool EsPrincipal { get; set; }
    public bool Activo { get; set; } = true;

    public ICollection<TurnoLibroTotal> Turnos { get; set; } = new List<TurnoLibroTotal>();
}
