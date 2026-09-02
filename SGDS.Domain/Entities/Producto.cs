namespace SGDS.Domain.Entities;

// Catálogo de productos de una empresa — exclusivo de GoTrace (Reglas_de_negocio_GoTrace.md,
// "Nueva Empresa" -> "Productos que comercializa y/o produce"). Un lote de GoTrace
// (LoteGoTrace) se vincula a una fila de este catálogo en vez de escribir el producto a mano.
public class Producto
{
    public int Id { get; set; }
    public int EmpresaId { get; set; }
    public Empresa Empresa { get; set; } = null!;

    public string Nombre { get; set; } = string.Empty;

    // Tipo/Subtipo: catálogo legal de bebidas y tabaco gravados (Reglas_de_negocio_GoTrace.md,
    // nota al final del formulario de "Nueva Empresa") — 2 tipos de alcohol (Licores, Vinos,
    // Aperitivos y Similares / Cervezas, Sifones, Refajos y Mezclas) + 1 de tabaco (Cigarrillos
    // y Tabaco Elaborado). Subtipo depende del Tipo elegido; ambos quedan implícitos por la
    // categoría de negocio de la empresa (Empresa.TipoEmpresa = "Alcohol" | "Cigarrillo").
    public string Tipo { get; set; } = string.Empty;
    public string Subtipo { get; set; } = string.Empty;

    public string Presentacion { get; set; } = string.Empty;
    public decimal Contenido { get; set; }
    public string UnidadMedida { get; set; } = string.Empty;

    // Exclusivo de alcohol (null en productos de tabaco).
    public decimal? GradoAlcoholimetrico { get; set; }
    // Exclusivo de tabaco: Nacional | Importado (null en productos de alcohol — ahí el
    // nacional/importado ya va implícito en el Subtipo, ej. "Licores Destilados Nacionales").
    public string? Origen { get; set; }

    // Alcohol: Produce | Comercializa. Tabaco: Productora | Comercializadora | Productora y
    // comercializadora — vocabularios distintos a propósito, tal como los definió el negocio.
    public string Relacion { get; set; } = "Produce";
}
