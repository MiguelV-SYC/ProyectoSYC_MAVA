namespace SGDS.Application.Helpers;

// Motor de liquidación de las estampillas departamentales de Santander.
// Reglas de negocio suministradas por la Secretaría de Hacienda — ver cada método Calcular_X.
// REGLA DE ORO (Ordenanza 012/2005, anulada judicialmente): está PROHIBIDO aplicar un recargo
// del 10% por "Derechos de Sistematización" sobre el total o la base gravable. El total es la
// suma lineal y limpia de las estampillas individuales — no se agrega ningún recargo aquí.
public static class CalculadoraEstampillas
{
    public const string TipoEntidadGobernacion = "Gobernacion";
    public const string TipoEntidadEnteDescentralizado = "Ente_Descentralizado";
    public const string TipoEntidadAlcaldiaMunicipal = "Alcaldia_Municipal";

    public const string RegimenDeclaranteRenta = "Declarante_Renta";
    public const string RegimenNoDeclaranteRenta = "No_Declarante_Renta";

    public const string TipoContratoObra = "Obra";
    public const string TipoContratoConsultoria = "Consultoria";
    public const string TipoContratoSuministro = "Suministro";
    public const string TipoContratoPrestacionServicios = "Prestacion_Servicios";
    public const string TipoContratoSaludAsistencial = "Salud_Asistencial";
    public const string TipoContratoConcesion = "Concesion";
    public const string TipoContratoOtros = "Otros";

    public const string FuenteRecursosPropios = "Recursos_Propios";
    public const string FuenteSgsssAsistencial = "SGSSS_Asistencial";
    public const string FuenteOtros = "Otros";

    public record Entrada(
        decimal ValorContratoBruto,
        bool IncluyeIva,
        decimal TarifaIva,
        string TipoEntidad,
        string RegimenContratista,
        string TipoContrato,
        string FuenteRecursos,
        string Municipio
    );

    public record ItemEstampilla(
        string Nombre,
        bool Aplica,
        decimal Tarifa,
        decimal BaseGravable,
        decimal Valor,
        string? Motivo,
        Dictionary<string, decimal>? Distribucion = null
    );

    public record Resultado(decimal BaseGravable, List<ItemEstampilla> Items, decimal Total);

    public static void Validar(Entrada e)
    {
        if (e.ValorContratoBruto < 0)
            throw new ArgumentException("El valor del contrato no puede ser negativo.");
        if (e.TarifaIva < 0 || e.TarifaIva > 1)
            throw new ArgumentException("La tarifa de IVA debe estar entre 0 y 1 (ej. 0.19).");
        if (string.IsNullOrWhiteSpace(e.TipoEntidad))
            throw new ArgumentException("El tipo de entidad es obligatorio.");
        if (string.IsNullOrWhiteSpace(e.RegimenContratista))
            throw new ArgumentException("El régimen del contratista es obligatorio.");
        if (string.IsNullOrWhiteSpace(e.TipoContrato))
            throw new ArgumentException("El tipo de contrato es obligatorio.");
        if (string.IsNullOrWhiteSpace(e.FuenteRecursos))
            throw new ArgumentException("La fuente de los recursos es obligatoria.");
        if (string.IsNullOrWhiteSpace(e.Municipio))
            throw new ArgumentException("El municipio es obligatorio.");
    }

    public static Resultado Calcular(Entrada e, ConfiguracionEstampillas config)
    {
        Validar(e);

        var baseGravable = e.IncluyeIva
            ? e.ValorContratoBruto / (1 + e.TarifaIva)
            : e.ValorContratoBruto;

        var items = new List<ItemEstampilla>
        {
            CalcularProHospital(e, baseGravable, config),
            CalcularProUis(e, baseGravable, config),
            CalcularProElectrificacion(e, baseGravable, config),
            CalcularProCultura(e, baseGravable, config),
            CalcularFondoReforestacion(e, baseGravable, config),
            CalcularProAdultoMayor(e, baseGravable, config),
            CalcularProDeporte(e, baseGravable, config),
        };

        // Suma lineal y limpia — sin recargo adicional (ver REGLA DE ORO en el encabezado).
        var total = items.Where(i => i.Aplica).Sum(i => i.Valor);

        return new Resultado(baseGravable, items, total);
    }

    private static ItemEstampilla CalcularProHospital(Entrada e, decimal baseGravable, ConfiguracionEstampillas config)
    {
        const string nombre = "Pro-Hospital";
        var entidadValida = e.TipoEntidad is TipoEntidadGobernacion or TipoEntidadEnteDescentralizado;
        if (!entidadValida)
            return new ItemEstampilla(nombre, false, 0, baseGravable, 0, "Solo aplica a Gobernación o Ente Descentralizado.");

        if (e.FuenteRecursos == FuenteSgsssAsistencial && e.TipoContrato == TipoContratoSaludAsistencial)
            return new ItemEstampilla(nombre, false, 0, baseGravable, 0, "Excluida por fallo del Consejo de Estado (recursos SGSSS + contrato de salud asistencial).");

        var tarifa = 0.02m;
        var valor = Redondear(baseGravable * tarifa, config);
        return new ItemEstampilla(nombre, true, tarifa, baseGravable, valor, null);
    }

    private static ItemEstampilla CalcularProUis(Entrada e, decimal baseGravable, ConfiguracionEstampillas config)
    {
        const string nombre = "Pro-UIS";
        var tipoContratoValido = e.TipoContrato is TipoContratoObra or TipoContratoConsultoria or TipoContratoSuministro or TipoContratoPrestacionServicios;
        var entidadValida = e.TipoEntidad is TipoEntidadGobernacion or TipoEntidadEnteDescentralizado;

        if (!tipoContratoValido || !entidadValida)
            return new ItemEstampilla(nombre, false, 0, baseGravable, 0, "Solo aplica a Obra/Consultoría/Suministro/Prestación de servicios de Gobernación o Ente Descentralizado.");

        var minimoExento = 3 * config.SmmlvVigente;
        if (baseGravable < minimoExento)
            return new ItemEstampilla(nombre, false, 0, baseGravable, 0, $"Base gravable por debajo del mínimo exento (3 SMMLV = {minimoExento:C0}).");

        var tarifa = e.RegimenContratista == RegimenDeclaranteRenta ? 0.025m : 0.035m;
        var valor = Redondear(baseGravable * tarifa, config);
        var distribucion = new Dictionary<string, decimal>
        {
            ["UIS"] = Redondear(valor * 0.75m, config),
            ["UTS"] = Redondear(valor * 0.15m, config),
            ["Unipaz"] = Redondear(valor * 0.10m, config),
        };
        return new ItemEstampilla(nombre, true, tarifa, baseGravable, valor, null, distribucion);
    }

    private static ItemEstampilla CalcularProElectrificacion(Entrada e, decimal baseGravable, ConfiguracionEstampillas config)
    {
        const string nombre = "Pro-Electrificación Rural";
        var entidadValida = e.TipoEntidad is TipoEntidadGobernacion or TipoEntidadEnteDescentralizado;
        if (!entidadValida)
            return new ItemEstampilla(nombre, false, 0, baseGravable, 0,
                "Solo aplica a Gobernación o Ente Descentralizado en este sistema (contratos de empresas de energía requieren validación manual).");

        var tarifa = 0.02m;
        var valor = Redondear(baseGravable * tarifa, config);
        return new ItemEstampilla(nombre, true, tarifa, baseGravable, valor, null);
    }

    private static ItemEstampilla CalcularProCultura(Entrada e, decimal baseGravable, ConfiguracionEstampillas config)
    {
        const string nombre = "Pro-Cultura";

        if (e.TipoEntidad == TipoEntidadGobernacion)
        {
            var tarifaGobernacion = 0.02m;
            return new ItemEstampilla(nombre, true, tarifaGobernacion, baseGravable, Redondear(baseGravable * tarifaGobernacion, config), null);
        }

        if (e.TipoEntidad == TipoEntidadAlcaldiaMunicipal)
        {
            var tarifaMunicipal = config.TarifaCulturaPorMunicipio.GetValueOrDefault(e.Municipio, 0.01m);
            return new ItemEstampilla(nombre, true, tarifaMunicipal, baseGravable, Redondear(baseGravable * tarifaMunicipal, config), null);
        }

        return new ItemEstampilla(nombre, false, 0, baseGravable, 0, "Solo aplica a Gobernación o Alcaldía Municipal.");
    }

    private static ItemEstampilla CalcularFondoReforestacion(Entrada e, decimal baseGravable, ConfiguracionEstampillas config)
    {
        const string nombre = "Fondo de Reforestación";
        var entidadValida = e.TipoEntidad is TipoEntidadGobernacion or TipoEntidadEnteDescentralizado;
        var tipoContratoValido = e.TipoContrato is TipoContratoObra or TipoContratoConsultoria or TipoContratoConcesion;

        if (!entidadValida || !tipoContratoValido)
            return new ItemEstampilla(nombre, false, 0, baseGravable, 0, "Solo aplica a Obra/Consultoría/Concesión de Gobernación o Ente Descentralizado.");

        var tarifa = 0.01m;
        var valor = Redondear(baseGravable * tarifa, config);
        return new ItemEstampilla(nombre, true, tarifa, baseGravable, valor, null);
    }

    private static ItemEstampilla CalcularProAdultoMayor(Entrada e, decimal baseGravable, ConfiguracionEstampillas config)
    {
        const string nombre = "Pro-Bienestar Adulto Mayor";
        var entidadValida = e.TipoEntidad is TipoEntidadGobernacion or TipoEntidadEnteDescentralizado or TipoEntidadAlcaldiaMunicipal;
        if (!entidadValida)
            return new ItemEstampilla(nombre, false, 0, baseGravable, 0, "Tipo de entidad no reconocido.");

        var tarifa = 0.02m;
        var valor = Redondear(baseGravable * tarifa, config);
        return new ItemEstampilla(nombre, true, tarifa, baseGravable, valor, null);
    }

    private static ItemEstampilla CalcularProDeporte(Entrada e, decimal baseGravable, ConfiguracionEstampillas config)
    {
        const string nombre = "Pro-Deporte y Recreación";

        if (e.TipoEntidad == TipoEntidadGobernacion)
            return new ItemEstampilla(nombre, false, 0, baseGravable, 0, "No aplica a Gobernación (tarifa 0% — Ley 2023 de 2020).");

        if (e.TipoEntidad != TipoEntidadAlcaldiaMunicipal)
            return new ItemEstampilla(nombre, false, 0, baseGravable, 0, "Únicamente aplica a Alcaldía Municipal.");

        var tarifa = config.TarifaDeportePorMunicipio.GetValueOrDefault(e.Municipio, 0.015m);
        var valor = Redondear(baseGravable * tarifa, config);
        return new ItemEstampilla(nombre, true, tarifa, baseGravable, valor, null);
    }

    // Redondeo legal colombiano: al peso o al centenar más cercano, según la política de la entidad.
    private static decimal Redondear(decimal valor, ConfiguracionEstampillas config)
    {
        if (config.ModoRedondeo == ModoRedondeoEstampillas.Centena)
            return Math.Round(valor / 100m, MidpointRounding.AwayFromZero) * 100m;

        return Math.Round(valor, MidpointRounding.AwayFromZero);
    }
}

public static class ModoRedondeoEstampillas
{
    public const string Peso = "Peso";
    public const string Centena = "Centena";
}

public class ConfiguracionEstampillas
{
    public decimal SmmlvVigente { get; set; } = 1_300_000m;
    public string ModoRedondeo { get; set; } = ModoRedondeoEstampillas.Peso;
    public Dictionary<string, decimal> TarifaCulturaPorMunicipio { get; set; } = new();
    public Dictionary<string, decimal> TarifaDeportePorMunicipio { get; set; } = new();
}
