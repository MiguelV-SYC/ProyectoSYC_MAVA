using SGDS.Domain.Entities;

namespace SGDS.Application.Helpers;

// Motor de base gravable para IUVA — Reglas_de_negocio_IUVA.md, Ley 488/1998 Art. 143. Para
// vehículos usados, la base es el valor comercial de la tabla del Ministerio de Transporte
// (Reglas_de_Negocio.MD/Bases_gravables/*.xlsx, importadas a BasesGravablesVehiculos, ~16.090
// filas). Para vehículos nuevos (primera matrícula), la base es el valor de factura/importación
// (Art. 143) — no se consulta la tabla, ver InfoconsumoController-style: ese caso se resuelve
// en el controller antes de llamar aquí. Todos los valores quedan en MILES DE PESOS, la misma
// unidad de la tabla fuente — no se multiplica por 1000, para poder verificar a mano contra el
// xlsx sin conversión.
public static class CalculadoraBaseGravableVehiculo
{
    public record Resultado(
        bool Soportado,
        string? MotivoNoSoportado,
        decimal? ValorTabla,
        decimal? ValorAjustado,
        bool AplicaBlindaje,
        bool AplicaClasicoAntiguo
    );

    public static Resultado Calcular(BaseGravableVehiculo? fila, int anioModelo, bool blindado, bool esClasicoAntiguo, ConfiguracionBaseGravableVehiculo config)
    {
        // Antiguo/clásico reemplaza la tabla por una base fija — RN confirmada con el usuario:
        // el valor exacto todavía no está definido, se deja sin configurar a propósito (mismo
        // patrón que TarifaEspecificaCigarrillos en CalculadoraImpuestoConsumo) en vez de
        // inventar una cifra.
        if (esClasicoAntiguo)
        {
            if (config.TarifaBaseClasicoAntiguo == null)
            {
                return new Resultado(false,
                    "Falta configurar la base gravable fija para vehículos antiguos o clásicos — el sistema no debe inventar ese valor.",
                    null, null, blindado, true);
            }

            var valorClasico = config.TarifaBaseClasicoAntiguo.Value;
            var ajustadoClasico = blindado ? valorClasico * (1 + config.RecargoBlindaje) : valorClasico;
            return new Resultado(true, null, valorClasico, ajustadoClasico, blindado, true);
        }

        if (fila == null)
        {
            return new Resultado(false,
                "No se encontró el vehículo en la tabla del Ministerio de Transporte — verifica marca, línea y cilindraje, o diligencia la base gravable manualmente.",
                null, null, blindado, false);
        }

        var valorTabla = ObtenerValorPorAnio(fila, anioModelo);
        if (valorTabla == null)
        {
            return new Resultado(false,
                $"La tabla no tiene un valor de base gravable para el año modelo {anioModelo} en esta línea.",
                null, null, blindado, false);
        }

        var ajustado = blindado ? valorTabla.Value * (1 + config.RecargoBlindaje) : valorTabla.Value;
        return new Resultado(true, null, valorTabla, ajustado, blindado, false);
    }

    // Años fuera del rango cubierto por la tabla (2001-2025) se saturan al extremo disponible
    // en vez de fallar — un modelo 2026 usa la misma columna que un modelo 2025.
    public static decimal? ObtenerValorPorAnio(BaseGravableVehiculo fila, int anioModelo)
    {
        if (anioModelo <= 2001) return fila.Valor2001OAnterior;
        if (anioModelo >= 2025) return fila.Valor2025;

        return anioModelo switch
        {
            2002 => fila.Valor2002,
            2003 => fila.Valor2003,
            2004 => fila.Valor2004,
            2005 => fila.Valor2005,
            2006 => fila.Valor2006,
            2007 => fila.Valor2007,
            2008 => fila.Valor2008,
            2009 => fila.Valor2009,
            2010 => fila.Valor2010,
            2011 => fila.Valor2011,
            2012 => fila.Valor2012,
            2013 => fila.Valor2013,
            2014 => fila.Valor2014,
            2015 => fila.Valor2015,
            2016 => fila.Valor2016,
            2017 => fila.Valor2017,
            2018 => fila.Valor2018,
            2019 => fila.Valor2019,
            2020 => fila.Valor2020,
            2021 => fila.Valor2021,
            2022 => fila.Valor2022,
            2023 => fila.Valor2023,
            2024 => fila.Valor2024,
            _ => null,
        };
    }
}

public class ConfiguracionBaseGravableVehiculo
{
    // Blindado: +10% sobre el avalúo de tabla (confirmado con el usuario).
    public decimal RecargoBlindaje { get; set; } = 0.10m;

    // Antiguo/clásico: base fija en miles de pesos — deliberadamente sin valor por defecto, el
    // usuario confirmó que la regla exacta todavía no está definida.
    public decimal? TarifaBaseClasicoAntiguo { get; set; }
}
