namespace SGDS.Domain.Entities;

// Bitácora de operaciones de IA (RNF-IA-04). Independiente de Auditoria: esa tabla solo se
// dispara sobre cambios detectados por el ChangeTracker de EF (Added/Modified/Deleted), y las
// operaciones de IA aquí son de solo lectura — nunca modifican una entidad de dominio.
public class OperacionIA
{
    public int Id { get; set; }
    public int UsuarioId { get; set; }
    public Usuario? Usuario { get; set; }
    public int? ProyectoId { get; set; }
    public Proyecto? Proyecto { get; set; }
    public string TipoAnalisis { get; set; } = string.Empty;
    public string Modelo { get; set; } = string.Empty;
    public string Entrada { get; set; } = string.Empty;
    public string Resultado { get; set; } = string.Empty;
    public DateTime FechaHora { get; set; } = DateTime.UtcNow;
}
