namespace SGDS.Domain.Entities;

// Tabla de referencia del Ministerio de Transporte para el año fiscal 2026 — Reglas_de_negocio_IUVA.md,
// Ley 488/1998 Art. 143 (base gravable para vehículos usados). Se carga una sola vez desde
// Reglas_de_Negocio.MD/Bases_gravables/*.xlsx (9 tablas oficiales, ~16.090 filas) vía \copy desde el
// CSV consolidado en SGDS.Infrastructure/Data/Seed/bases_gravables_vehiculos.csv — no se genera por
// migración fila a fila. Tipo = una de las 9 tablas (AUTOMOVILES, CAMIONETAS Y CAMPEROS, CAMIONETAS
// DOBLECABINA, ELECTRICOS, MOTOCICLETAS Y MOTOCARROS, PASAJEROS, CARGA, AMBULANCIAS, HIBRIDOS); Clase
// es el subtipo real dentro de cada tipo (ej. MOTOCICLETA/CUATRIMOTO/MOTOCARRO dentro de MOTOCICLETAS
// Y MOTOCARROS). Los 25 ValorXXXX están en miles de pesos, tal cual la fuente.
public class BaseGravableVehiculo
{
    public int Id { get; set; }

    public string Tipo { get; set; } = string.Empty;
    public string Clase { get; set; } = string.Empty;
    public string Marca { get; set; } = string.Empty;
    public string Linea { get; set; } = string.Empty;
    // Nullable: algunos eléctricos vienen sin cilindraje/potencia diligenciada en la fuente.
    public string? Cilindraje { get; set; }
    public decimal? Tonelaje { get; set; }
    public int? Pasajeros { get; set; }

    public decimal? Valor2001OAnterior { get; set; }
    public decimal? Valor2002 { get; set; }
    public decimal? Valor2003 { get; set; }
    public decimal? Valor2004 { get; set; }
    public decimal? Valor2005 { get; set; }
    public decimal? Valor2006 { get; set; }
    public decimal? Valor2007 { get; set; }
    public decimal? Valor2008 { get; set; }
    public decimal? Valor2009 { get; set; }
    public decimal? Valor2010 { get; set; }
    public decimal? Valor2011 { get; set; }
    public decimal? Valor2012 { get; set; }
    public decimal? Valor2013 { get; set; }
    public decimal? Valor2014 { get; set; }
    public decimal? Valor2015 { get; set; }
    public decimal? Valor2016 { get; set; }
    public decimal? Valor2017 { get; set; }
    public decimal? Valor2018 { get; set; }
    public decimal? Valor2019 { get; set; }
    public decimal? Valor2020 { get; set; }
    public decimal? Valor2021 { get; set; }
    public decimal? Valor2022 { get; set; }
    public decimal? Valor2023 { get; set; }
    public decimal? Valor2024 { get; set; }
    public decimal? Valor2025 { get; set; }
}
