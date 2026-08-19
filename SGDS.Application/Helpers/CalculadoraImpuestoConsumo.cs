namespace SGDS.Application.Helpers;

// Motor de liquidación del Impuesto al Consumo de Licores, Vinos, Aperitivos y Similares (ICL)
// — Ley 1816 de 2016, tarifas Certificación 003 (2026). Sistema bifásico: Componente Específico
// (fijo por grado de alcohol) + Componente Ad Valorem (porcentual sobre PVP certificado DANE).
public static class CalculadoraImpuestoConsumo
{
    public const string CategoriaLicores = "Licores_Aperitivos";
    public const string CategoriaVinos = "Vinos_Aperitivos_Vinicos";
    public const string CategoriaCervezas = "Cervezas_Sifones_Refajos";
    public const string CategoriaCigarrillos = "Cigarrillos_Tabaco";

    public const string DepartamentoSanAndres = "San Andrés y Providencia";

    // La ley define ambas tarifas del componente específico en referencia a un envase estándar
    // de 750 cc — se usa ese mismo estándar para derivar el volumen total, en vez de construir
    // un catálogo maestro de producto (marca/presentación) que el mockup tampoco captura.
    public const decimal PresentacionEstandarCc = 750m;

    public record Entrada(
        string Categoria,
        int UnidadesFisicas,
        decimal GradosAlcoholimetricos,
        decimal PvpCertificado,
        string DepartamentoDestino,
        string TipoTramite
    );

    public record Resultado(
        bool Soportado,
        string? MotivoNoSoportado,
        decimal VolumenTotalCc,
        decimal TarifaEspecifica,
        decimal TarifaAdValorem,
        decimal ComponenteEspecifico,
        decimal ComponenteAdValorem,
        decimal IclInformativo,
        decimal TotalAPagar,
        bool AplicaExcepcionSanAndres,
        bool EsSoloInformativo
    );

    public static void Validar(Entrada e)
    {
        if (e.UnidadesFisicas < 0)
            throw new ArgumentException("Las unidades físicas no pueden ser negativas.");
        if (e.GradosAlcoholimetricos < 0)
            throw new ArgumentException("Los grados alcoholimétricos no pueden ser negativos.");
        if (e.PvpCertificado < 0)
            throw new ArgumentException("El PVP certificado no puede ser negativo.");
        if (string.IsNullOrWhiteSpace(e.Categoria))
            throw new ArgumentException("La categoría del producto es obligatoria.");
        if (string.IsNullOrWhiteSpace(e.DepartamentoDestino))
            throw new ArgumentException("El departamento de destino es obligatorio.");
        if (string.IsNullOrWhiteSpace(e.TipoTramite))
            throw new ArgumentException("El tipo de trámite es obligatorio.");
    }

    public static Resultado Calcular(Entrada e, ConfiguracionImpuestoConsumo config)
    {
        Validar(e);

        if (e.Categoria != CategoriaLicores && e.Categoria != CategoriaVinos)
        {
            return new Resultado(false,
                "Esta categoría no tiene tarifa definida en las reglas de negocio vigentes — solo Licores/Aperitivos y Vinos/Aperitivos vínicos tienen fórmula de ICL soportada.",
                0, 0, 0, 0, 0, 0, 0, false, false);
        }

        var aplicaSanAndres = e.DepartamentoDestino == DepartamentoSanAndres;

        var tarifaEspecifica = aplicaSanAndres
            ? config.TarifaSanAndres
            : e.Categoria == CategoriaLicores ? config.TarifaEspecificaLicores : config.TarifaEspecificaVinos;

        var tarifaAdValorem = e.Categoria == CategoriaLicores ? config.TarifaAdValoremLicores : config.TarifaAdValoremVinos;

        var volumenTotalCc = e.UnidadesFisicas * PresentacionEstandarCc;
        var componenteEspecifico = e.GradosAlcoholimetricos * tarifaEspecifica * (volumenTotalCc / PresentacionEstandarCc);
        var componenteAdValorem = e.UnidadesFisicas * e.PvpCertificado * tarifaAdValorem;
        var iclTotal = componenteEspecifico + componenteAdValorem;

        // Excepción por tipo de trámite: en Tránsito/Tránsito local/Tránsito declarado el impuesto
        // no se causa en ese departamento — se calcula de forma informativa pero el neto a pagar es $0.
        var esSoloInformativo = e.TipoTramite is "Tránsito" or "Tránsito local" or "Tránsito declarado";
        var totalAPagar = esSoloInformativo ? 0m : iclTotal;

        return new Resultado(
            true, null, volumenTotalCc, tarifaEspecifica, tarifaAdValorem,
            componenteEspecifico, componenteAdValorem, iclTotal, totalAPagar,
            aplicaSanAndres, esSoloInformativo);
    }
}

public class ConfiguracionImpuestoConsumo
{
    public decimal TarifaEspecificaLicores { get; set; } = 360m;
    public decimal TarifaEspecificaVinos { get; set; } = 243m;
    public decimal TarifaSanAndres { get; set; } = 57m;
    public decimal TarifaAdValoremLicores { get; set; } = 0.30m;
    public decimal TarifaAdValoremVinos { get; set; } = 0.20m;
}
