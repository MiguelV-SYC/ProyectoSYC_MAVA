export const CATEGORIAS_PRODUCTO_INFOCONSUMO = [
  { value: 'Licores_Aperitivos', label: 'Licores, aperitivos y similares' },
  { value: 'Vinos_Aperitivos_Vinicos', label: 'Vinos y aperitivos vínicos' },
  { value: 'Cervezas_Sifones_Refajos', label: 'Cervezas, sifones, refajos y mezclas' },
  { value: 'Cigarrillos_Tabaco', label: 'Cigarrillos y tabaco elaborado' },
];

// Categorías sin fórmula de ICL soportada — régimen tributario independiente
// (Ley 223 de 1995 para cerveza, tarifa por cajetilla para cigarrillos).
export const CATEGORIAS_SIN_ICL = ['Cervezas_Sifones_Refajos', 'Cigarrillos_Tabaco'];

export const TIPOS_TRANSPORTE_INFOCONSUMO = [
  { value: 'Terrestre', label: 'Terrestre' },
  { value: 'Fluvial', label: 'Fluvial' },
  { value: 'Marítimo', label: 'Marítimo' },
  { value: 'Aéreo', label: 'Aéreo' },
];

// Clasificación por capacidad y configuración de ejes — Norma NTC 4788 / Ministerio de
// Transporte de Colombia (ver Reglas de Negocio.MD/Reglas_de_negocio_infoconsumo_v.2.md,
// sección "Tipos de Vehículos según su Carrocería").
export interface TipoVehiculoInfo {
  value: string;
  label: string;
  designacionRndc: string;
  capacidadAprox: string;
  usoComun: string;
}

export const TIPOS_VEHICULO_CARGA: TipoVehiculoInfo[] = [
  { value: 'Turbo', label: 'Turbo', designacionRndc: 'C2 (Liviano)', capacidadAprox: 'Hasta 4.5 toneladas', usoComun: 'Distribución urbana de cigarrillos y licores en almacenes de cadena o tiendas.' },
  { value: 'Camión sencillo', label: 'Camión sencillo', designacionRndc: 'C2 (Mediano)', capacidadAprox: 'Hasta 8.5 toneladas', usoComun: 'Despachos regionales o entregas masivas en centros urbanos.' },
  { value: 'Doble troque', label: 'Doble troque', designacionRndc: 'C3', capacidadAprox: 'Hasta 17 toneladas', usoComun: 'Transporte intermunicipal de producto terminado desde plantas de producción.' },
  { value: 'Cuatro manos', label: 'Cuatro manos', designacionRndc: 'C4', capacidadAprox: 'Hasta 22 toneladas', usoComun: 'Abastecimiento mayorista y movimiento de carga pesada a nivel nacional.' },
  { value: 'Tractocamión (mula)', label: 'Tractocamión (mula)', designacionRndc: 'C3S2 / C3S3', capacidadAprox: 'Hasta 32-35 toneladas', usoComun: 'Transporte masivo de materias primas o distribución de cerveza y licores a grandes centros de acopio.' },
];

// Configuración de carrocería — se ofrece como subselección una vez elegido el tipo de
// vehículo (misma fuente de las reglas de negocio).
export interface CarroceriaVehiculoInfo {
  value: string;
  label: string;
  descripcion: string;
}

export const CARROCERIAS_VEHICULO: CarroceriaVehiculoInfo[] = [
  { value: 'Furgón cerrado (caja seca)', label: 'Furgón cerrado (caja seca)', descripcion: 'Protege la mercancía de la humedad y la luz solar; mayor seguridad contra robos.' },
  { value: 'Botellero / sider (cortinas laterales)', label: 'Botellero / sider (cortinas laterales)', descripcion: 'Carga y descarga rápida con montacargas en estibas — estándar de cervecerías y distribuidoras.' },
  { value: 'Estacas con carpa', label: 'Estacas con carpa', descripcion: 'Distribución minorista o zonas rurales; la carpa debe ir completamente sellada.' },
];

export interface DatosTornaguia {
  tipoTransporte: string;
  categoriaProducto: string;
  gradosAlcoholimetricos: string;
  unidadesFisicas: string;
  pvpCertificado: string;
  departamentoOrigen: string;
  municipioOrigen: string;
  departamentoDestino: string;
  municipioDestino: string;

  // Dirección exacta opcional (búsqueda en vivo, Nominatim) — cuando están presentes, lat/lng
  // tienen prioridad sobre el centroide del municipio para el mapa y el cálculo de distancia.
  direccionEspecificaOrigen: string;
  latOrigen: number | null;
  lngOrigen: number | null;
  direccionEspecificaDestino: string;
  latDestino: number | null;
  lngDestino: number | null;

  empresaTransportadora: string;
  nitTransportador: string;
  placaVehiculo: string;
  conductor: string;
  cedulaConductor: string;
  tipoVehiculo: string;
  observaciones: string;

  // Puente GoTrace -> Infoconsumo (opcional): lote ya Aprobado en GoTrace del que se
  // heredan empresa y unidades físicas.
  loteGoTraceSolicitudId: number | null;
  loteGoTraceNumero: string;
  loteGoTraceEmpresaNombre: string;
  loteGoTraceEmpresaNit: string;
  loteGoTraceProducto: string;
  loteGoTraceNumeroLote: string;
}

export const DATOS_TORNAGUIA_VACIOS: DatosTornaguia = {
  tipoTransporte: 'Terrestre',
  categoriaProducto: CATEGORIAS_PRODUCTO_INFOCONSUMO[0].value,
  gradosAlcoholimetricos: '',
  unidadesFisicas: '',
  pvpCertificado: '',
  departamentoOrigen: 'Cundinamarca',
  municipioOrigen: '',
  departamentoDestino: 'Santander',
  municipioDestino: '',

  direccionEspecificaOrigen: '',
  latOrigen: null,
  lngOrigen: null,
  direccionEspecificaDestino: '',
  latDestino: null,
  lngDestino: null,

  empresaTransportadora: '',
  nitTransportador: '',
  placaVehiculo: '',
  conductor: '',
  cedulaConductor: '',
  tipoVehiculo: '',
  observaciones: '',

  loteGoTraceSolicitudId: null,
  loteGoTraceNumero: '',
  loteGoTraceEmpresaNombre: '',
  loteGoTraceEmpresaNit: '',
  loteGoTraceProducto: '',
  loteGoTraceNumeroLote: '',
};

// Reglas de negocio, sección 2.1: coherencia origen/destino según el tipo de trámite.
export function validarCoherenciaOrigenDestino(tipoTramite: string, depOrigen: string, depDestino: string): string | null {
  if (tipoTramite === 'Tránsito local' && depOrigen !== depDestino) {
    return 'Tránsito local exige que el departamento de origen y el de destino sean el mismo.';
  }
  if ((tipoTramite === 'Movilización' || tipoTramite === 'Reenvío') && depOrigen === depDestino) {
    return `${tipoTramite} exige que el departamento de origen y el de destino sean diferentes.`;
  }
  return null;
}
