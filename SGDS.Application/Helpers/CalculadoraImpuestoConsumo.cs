namespace SGDS.Application.Helpers;

// Motor de liquidación del Impuesto al Consumo — Reglas_de_negocio_infoconsumo_v.2.md, sección
// "REGLAS PARA LA APLICACIÓN DEL IMPUESTO AL CONSUMO POR CATEGORÍAS". Cubre las 3 categorías
// legales (mismo catálogo que GoTrace.TIPOS_PRODUCTO_GOTRACE, para que el puente GoTrace ->
// Infoconsumo autocomplete sin tabla de traducción):
//   1. Licores, Vinos, Aperitivos y Similares (Ley 1816/2016) — bifásico: específico + ad valorem.
//   2. Cervezas, Sifones, Refajos y Mezclas (Ley 223/1995) — porcentual sobre base gravable.
//   3. Cigarrillos y Tabaco Elaborado (Ley 223/1995, Ley 1393/2010, Ley 1819/2016) — específico
//      (cigarrillos/puros: parámetro pendiente de configurar; picadura: $354/g) + 10% ad valorem.
//      Vapeo queda explícitamente sin parametrizar (Decreto 1474/2025 inexequible, Sentencia C-079/2026).
public static class CalculadoraImpuestoConsumo
{
    public const string CategoriaLicores = "Licores, Vinos, Aperitivos y Similares";
    public const string CategoriaCervezas = "Cervezas, Sifones, Refajos y Mezclas";
    public const string CategoriaCigarrillos = "Cigarrillos y Tabaco Elaborado";

    // Subcategorías — idénticas a GoTrace.TIPOS_PRODUCTO_GOTRACE salvo "Vapeo", que no existe
    // en el catálogo de producción de GoTrace (solo se puede radicar a mano en Infoconsumo).
    public const string SubLicoresDestiladosNacionales = "Licores Destilados Nacionales";
    public const string SubLicoresDestiladosImportados = "Licores Destilados Importados";
    public const string SubVinos = "Vinos (Nacionales e Importados)";
    public const string SubAperitivos = "Aperitivos y Similares";
    public const string SubAperitivosVinicos = "Aperitivos Vínicos";

    public const string SubCervezasNacionales = "Cervezas Nacionales";
    public const string SubCervezasImportadas = "Cervezas Importadas";
    public const string SubSifones = "Sifones";
    public const string SubRefajos = "Refajos";
    public const string SubMezclas = "Mezclas de Bebidas Fermentadas";
    public const string SubCervezaArtesanal = "Cervezas Artesanales";

    public const string SubCigarrillosNacionales = "Cigarrillos Nacionales";
    public const string SubCigarrillosImportados = "Cigarrillos Importados";
    public const string SubPuros = "Cigarrillos y Tabacos (puros)";
    public const string SubPicadura = "Picadura y Tabaco para Pipa";
    public const string SubVapeo = "Sistema Electrónico de Vapeo";

    public const string OrigenNacional = "Nacional";
    public const string OrigenImportado = "Importado";

    public const string DepartamentoSanAndres = "San Andrés y Providencia";

    // La ley define la tarifa del componente específico de licores/vinos en referencia a un
    // envase estándar de 750 cc — se usa ese mismo estándar para derivar el volumen total.
    public const decimal PresentacionEstandarCc = 750m;
    public const int UnidadesPorCajetillaCigarrillos = 20;

    public record Entrada(
        string Categoria,
        string Subcategoria,
        int UnidadesFisicas,
        decimal? GradosAlcoholimetricos,
        decimal PvpCertificado,
        decimal? PesoGramos,               // Picadura y Tabaco para Pipa
        decimal? ValorAduana,               // Cervezas Importadas
        decimal? GravamenesArancelarios,    // Cervezas Importadas
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
        decimal ImpuestoInformativo,
        decimal TotalAPagar,
        bool AplicaExcepcionSanAndres,
        bool EsSoloInformativo
    );

    private static readonly Resultado NoAplica = new(false, null, 0, 0, 0, 0, 0, 0, 0, false, false);

    public static void Validar(Entrada e)
    {
        if (e.UnidadesFisicas < 0)
            throw new ArgumentException("Las unidades físicas no pueden ser negativas.");
        if (e.GradosAlcoholimetricos is < 0)
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

        var crudo = e.Categoria switch
        {
            CategoriaLicores => CalcularLicores(e, config),
            CategoriaCervezas => CalcularCervezas(e, config),
            CategoriaCigarrillos => CalcularCigarrillos(e, config),
            _ => NoAplica with { MotivoNoSoportado = $"La categoría \"{e.Categoria}\" no existe en las reglas de negocio vigentes." },
        };

        if (!crudo.Soportado) return crudo;

        // Excepción por tipo de trámite (RN de excepción del documento): en Tránsito/Tránsito
        // local/Tránsito declarado el impuesto no se causa en ese departamento — se calcula de
        // forma informativa pero el neto a pagar es $0. Aplica a cualquier categoría.
        var esSoloInformativo = e.TipoTramite is "Tránsito" or "Tránsito local" or "Tránsito declarado";
        var totalAPagar = esSoloInformativo ? 0m : crudo.ImpuestoInformativo;

        return crudo with { TotalAPagar = totalAPagar, EsSoloInformativo = esSoloInformativo };
    }

    // ===== 1. Licores, Vinos, Aperitivos y Similares (4.1-4.5 del documento) =====
    private static Resultado CalcularLicores(Entrada e, ConfiguracionImpuestoConsumo c)
    {
        var (tarifaEspecifica, tarifaAdValorem) = e.Subcategoria switch
        {
            SubLicoresDestiladosNacionales or SubLicoresDestiladosImportados or SubAperitivos
                => (c.TarifaEspecificaLicores, c.TarifaAdValoremLicores),
            SubVinos or SubAperitivosVinicos
                => (c.TarifaEspecificaVinos, c.TarifaAdValoremVinos),
            _ => (-1m, -1m),
        };
        if (tarifaEspecifica < 0)
            return NoAplica with { MotivoNoSoportado = $"El subtipo \"{e.Subcategoria}\" no corresponde a la categoría Licores/Vinos/Aperitivos." };

        // Excepción geográfica (San Andrés) — 4.1: ignora $360/$243 y aplica $57/grado/750cc,
        // sin afectar el ad valorem.
        var aplicaSanAndres = e.DepartamentoDestino == DepartamentoSanAndres;
        if (aplicaSanAndres) tarifaEspecifica = c.TarifaSanAndres;

        var grados = e.GradosAlcoholimetricos ?? 0m;
        var volumenTotalCc = e.UnidadesFisicas * PresentacionEstandarCc;
        var componenteEspecifico = grados * tarifaEspecifica * (volumenTotalCc / PresentacionEstandarCc);
        var componenteAdValorem = e.UnidadesFisicas * e.PvpCertificado * tarifaAdValorem;
        var total = componenteEspecifico + componenteAdValorem;

        return new Resultado(true, null, volumenTotalCc, tarifaEspecifica, tarifaAdValorem,
            componenteEspecifico, componenteAdValorem, total, total, aplicaSanAndres, false);
    }

    // ===== 2. Cervezas, Sifones, Refajos y Mezclas (5.1-5.7 del documento) =====
    // Régimen distinto al ICL — porcentual sobre base gravable, sin componente específico por
    // grado de alcohol (Ley 223 de 1995, artículos 189-190).
    private static Resultado CalcularCervezas(Entrada e, ConfiguracionImpuestoConsumo c)
    {
        switch (e.Subcategoria)
        {
            case SubCervezasNacionales:
            case SubSifones:
            case SubCervezaArtesanal:
                // "Artesanal" es un atributo comercial, no una tarifa distinta (5.7) — misma
                // fórmula de cerveza nacional: BaseGravable = PVP detallista.
                return CervezaPorcentual(e, c.TarifaAdValoremCervezasSifones);

            case SubRefajos:
            case SubMezclas:
                return CervezaPorcentual(e, c.TarifaAdValoremRefajosMezclas);

            case SubCervezasImportadas:
                return CervezaImportada(e, c);

            default:
                return NoAplica with { MotivoNoSoportado = $"El subtipo \"{e.Subcategoria}\" no corresponde a la categoría Cervezas/Sifones/Refajos/Mezclas." };
        }
    }

    private static Resultado CervezaPorcentual(Entrada e, decimal tarifa)
    {
        // BaseGravable = PrecioVentaDetallista (Decreto 2141/1996) — ImpuestoUnidad = Base × tarifa.
        var componenteAdValorem = e.UnidadesFisicas * e.PvpCertificado * tarifa;
        return new Resultado(true, null, 0, 0, tarifa, 0, componenteAdValorem, componenteAdValorem, componenteAdValorem, false, false);
    }

    private static Resultado CervezaImportada(Entrada e, ConfiguracionImpuestoConsumo c)
    {
        // 5.3: BaseImportado = ValorAduana + GravámenesArancelarios + 30% de margen sobre esa
        // base comercial. El documento advierte explícitamente no simplificar a
        // "impuesto = valorAduana * 0.48" porque se pierde la estructura de la base — y que
        // falta verificar la regla de impuesto mínimo frente al promedio nacional (no
        // implementada aquí por no tener un valor de referencia certificado).
        if (e.ValorAduana is null || e.GravamenesArancelarios is null)
            return NoAplica with { MotivoNoSoportado = "Para cerveza importada se requiere el valor en aduana y los gravámenes arancelarios." };

        var baseComercial = e.ValorAduana.Value + e.GravamenesArancelarios.Value;
        var baseImportado = baseComercial * (1 + c.MargenComercialCervezaImportada);
        var impuesto = baseImportado * c.TarifaAdValoremCervezasSifones;

        return new Resultado(true, null, 0, 0, c.TarifaAdValoremCervezasSifones, 0, impuesto, impuesto, impuesto, false, false);
    }

    // ===== 3. Cigarrillos y Tabaco Elaborado (6.1-6.4 del documento) =====
    private static Resultado CalcularCigarrillos(Entrada e, ConfiguracionImpuestoConsumo c)
    {
        switch (e.Subcategoria)
        {
            case SubCigarrillosNacionales:
            case SubCigarrillosImportados:
                // 6.1: el motor no debe asumir que "importado" cambia la tarifa nominal — la
                // diferencia está en la base/documentación, no en el porcentaje. Misma fórmula
                // para ambos; el origen queda registrado solo como dato informativo.
                return CigarrilloOPuro(e, c.TarifaEspecificaCigarrillos, c);

            case SubPuros:
                return CigarrilloOPuro(e, c.TarifaEspecificaPuros, c);

            case SubPicadura:
                return Picadura(e, c);

            case SubVapeo:
                // 6.4: el Decreto 1474/2025 que parametrizaba vapeo fue declarado inexequible
                // (Sentencia C-079/2026) — no se debe asignar tarifa automática.
                return NoAplica with
                {
                    MotivoNoSoportado = "Los sistemas electrónicos de vapeo están sujetos a verificación normativa " +
                        "(Sentencia C-079 de 2026 sobre el Decreto 1474 de 2025) — no se parametriza tarifa en esta fase.",
                };

            default:
                return NoAplica with { MotivoNoSoportado = $"El subtipo \"{e.Subcategoria}\" no corresponde a la categoría Cigarrillos y Tabaco Elaborado." };
        }
    }

    private static Resultado CigarrilloOPuro(Entrada e, decimal? tarifaEspecifica, ConfiguracionImpuestoConsumo c)
    {
        // 6.1/6.2: la tarifa específica 2026 debe almacenarse como parámetro configurable, no
        // como constante — y el documento prohíbe explícitamente usar los valores del Decreto
        // 1474/2025 ($11.200/$891), declarados inexequibles. Mientras no se configure un valor
        // real certificado, se reporta como no soportado en vez de calcular con un número
        // inventado.
        if (tarifaEspecifica is null)
            return NoAplica with
            {
                MotivoNoSoportado = "Falta configurar la tarifa específica 2026 vigente para esta subcategoría " +
                    "(ConfiguracionImpuestoConsumo) — no se deben usar los valores del Decreto 1474 de 2025, declarados inexequibles.",
            };

        // Unidades físicas = número de cajetillas de 20 unidades (o el contenido equivalente
        // para puros/cigarros) — la tarifa ya está definida por cajetilla/contenido.
        var componenteEspecifico = tarifaEspecifica.Value * e.UnidadesFisicas;
        var componenteAdValorem = e.UnidadesFisicas * e.PvpCertificado * c.TarifaAdValoremCigarrillosTabaco;
        var total = componenteEspecifico + componenteAdValorem;

        return new Resultado(true, null, 0, tarifaEspecifica.Value, c.TarifaAdValoremCigarrillosTabaco,
            componenteEspecifico, componenteAdValorem, total, total, false, false);
    }

    private static Resultado Picadura(Entrada e, ConfiguracionImpuestoConsumo c)
    {
        // 6.3: unidad de liquidación por peso, no por cajetilla — Gramos × $354/g (valor
        // certificado 2026) + 10% ad valorem sobre la base (PVP por gramo × gramos).
        if (e.PesoGramos is null or <= 0)
            return NoAplica with { MotivoNoSoportado = "Para picadura y sucedáneos se requiere el peso total en gramos." };

        var componenteEspecifico = e.PesoGramos.Value * c.TarifaEspecificaPicaduraPorGramo;
        var componenteAdValorem = e.PesoGramos.Value * e.PvpCertificado * c.TarifaAdValoremCigarrillosTabaco;
        var total = componenteEspecifico + componenteAdValorem;

        return new Resultado(true, null, 0, c.TarifaEspecificaPicaduraPorGramo, c.TarifaAdValoremCigarrillosTabaco,
            componenteEspecifico, componenteAdValorem, total, total, false, false);
    }
}

public class ConfiguracionImpuestoConsumo
{
    // Licores, Vinos, Aperitivos y Similares — Certificación 003/2025 (vigente desde 01/01/2026).
    public decimal TarifaEspecificaLicores { get; set; } = 360m;
    public decimal TarifaEspecificaVinos { get; set; } = 243m;
    public decimal TarifaSanAndres { get; set; } = 57m;
    public decimal TarifaAdValoremLicores { get; set; } = 0.25m;
    public decimal TarifaAdValoremVinos { get; set; } = 0.20m;

    // Cervezas, Sifones, Refajos y Mezclas — Ley 223 de 1995.
    public decimal TarifaAdValoremCervezasSifones { get; set; } = 0.48m;
    public decimal TarifaAdValoremRefajosMezclas { get; set; } = 0.20m;
    public decimal MargenComercialCervezaImportada { get; set; } = 0.30m;

    // Cigarrillos y Tabaco Elaborado — Ley 223/1995, Ley 1393/2010, Ley 1819/2016. Las tarifas
    // específicas de cigarrillos y puros quedan sin valor por defecto a propósito: el documento
    // de reglas de negocio prohíbe usar los valores del Decreto 1474/2025 (inexequible) como si
    // fueran la tarifa ordinaria vigente — deben configurarse con el parámetro certificado real.
    public decimal? TarifaEspecificaCigarrillos { get; set; }
    public decimal? TarifaEspecificaPuros { get; set; }
    public decimal TarifaEspecificaPicaduraPorGramo { get; set; } = 354m;
    public decimal TarifaAdValoremCigarrillosTabaco { get; set; } = 0.10m;
}
