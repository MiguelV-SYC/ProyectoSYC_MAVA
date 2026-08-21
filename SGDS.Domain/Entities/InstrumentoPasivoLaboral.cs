namespace SGDS.Domain.Entities;

// Datos propios de un trámite de Pasivos Laborales, 1:1 con la Solicitud que lo origina.
// Cubre los tres tipos de trámite del proyecto (Gestión de pasivo pensional, Gestión de
// pasivo laboral, Consulta de expediente digital) en una sola tabla — solo cambia qué
// campos se diligencian según el Instrumento (Reglas_de_negocio_PasivosLaborales.md).
public class InstrumentoPasivoLaboral
{
    public int Id { get; set; }
    public int SolicitudId { get; set; }
    public Solicitud Solicitud { get; set; } = null!;

    // CuotaParte | BonoPensionalB | BonoPensionalT | CalculoActuarial (pasivo pensional)
    // DemandaSentencia | CesantiasRetroactivas | SueldosRemanentes (pasivo laboral)
    // null para Consulta de expediente digital — flujo de solo lectura, no genera cálculos.
    public string? Instrumento { get; set; }

    // El servidor/pensionado no se busca contra el catálogo de Ciudadanos (así lo definen
    // los mockups): puede no estar afiliado a ningún otro trámite de SGDS todavía.
    public string? ServidorNombre { get; set; }
    public string? ServidorDocumento { get; set; }
    public string? RegimenPensional { get; set; }

    // Tiempo laborado en la entidad territorial vinculada (Solicitud.EmpresaId).
    public int? TiempoLaboradoMeses { get; set; }
    // Tiempo total de aportes del servidor en toda su carrera — necesario para el % de
    // concurrencia (RN "Regla de Prorrateo"). Colpensiones no expone hoy una Historia Laboral
    // estructurada por periodos (ver decisiones de diseño), así que se digita manualmente.
    public int? TiempoTotalAportesMeses { get; set; }
    public decimal? ValorMesadaPensional { get; set; }

    public string? Observaciones { get; set; }

    // Puente Colpensiones -> Pasivos Laborales (Fase 1 "Disparador" del flujo, RN): solicitud
    // de pensión ya radicada en Colpensiones para el mismo servidor. Opcional y no editable
    // una vez creada (mismo patrón que los demás puentes entre proyectos).
    public int? SolicitudColpensionesId { get; set; }
    public Solicitud? SolicitudColpensiones { get; set; }
}
