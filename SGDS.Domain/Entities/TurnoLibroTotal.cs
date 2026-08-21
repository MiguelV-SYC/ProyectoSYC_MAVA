namespace SGDS.Domain.Entities;

// Datos propios de un turno de atención presencial en Libro Total, 1:1 con la Solicitud que
// lo origina. Libro Total no procesa un trámite propio — "la solicitud nace cuando el
// ciudadano llega a la sede y se cierra cuando se le entrega su reporte consolidado"
// (Reglas_de_negocio_LibroTotal.md). El ciclo de vida vive en Solicitud.Estado con valores
// propios: Agendado -> En atención -> Atendido, o Agendado -> No asistió.
public class TurnoLibroTotal
{
    public int Id { get; set; }
    public int SolicitudId { get; set; }
    public Solicitud Solicitud { get; set; } = null!;

    public int SedeId { get; set; }
    public Sede Sede { get; set; } = null!;

    // Proyecto que el ciudadano viene a consultar (IUVA, Colpensiones, Estampillas...) o
    // "Consulta consolidada" si quiere ver todo de una vez — alimenta el filtro/etiqueta del
    // tablero de turnos (RN: "en vez de un Kanban de solicitudes, un tablero de Turnos").
    public string Motivo { get; set; } = string.Empty;

    // Fecha/hora de la cita agendada (paso 3 del mockup) — distinta de FechaCreacion de la
    // Solicitud, que es cuándo se agendó el turno.
    public DateTime FechaHoraCita { get; set; }

    public DateTime? FechaInicioAtencion { get; set; }
    public DateTime? FechaFinAtencion { get; set; }

    // Tipificación de cierre (RN paso 5: "el operador tipifica la atención").
    public string? Tipificacion { get; set; }
    public string? MotivoNoAsistio { get; set; }
}
