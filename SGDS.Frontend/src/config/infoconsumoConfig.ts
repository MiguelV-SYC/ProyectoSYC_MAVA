// Catálogo legal de 3 categorías — Reglas_de_negocio_infoconsumo_v.2.md, "REGLAS PARA LA
// APLICACIÓN DEL IMPUESTO AL CONSUMO POR CATEGORÍAS". Mismo catálogo (mismos nombres) que
// GoTrace.TIPOS_PRODUCTO_GOTRACE a propósito, para que un lote heredado de GoTrace autocomplete
// categoría/subcategoría sin tabla de traducción — "Sistema Electrónico de Vapeo" es la única
// subcategoría que no existe en GoTrace (solo se puede radicar a mano en Infoconsumo).
export const CATEGORIAS_PRODUCTO_INFOCONSUMO: { categoria: string; subcategorias: string[] }[] = [
  {
    categoria: 'Licores, Vinos, Aperitivos y Similares',
    subcategorias: [
      'Licores Destilados Nacionales',
      'Licores Destilados Importados',
      'Vinos (Nacionales e Importados)',
      'Aperitivos y Similares',
      'Aperitivos Vínicos',
    ],
  },
  {
    categoria: 'Cervezas, Sifones, Refajos y Mezclas',
    subcategorias: [
      'Cervezas Nacionales',
      'Cervezas Importadas',
      'Sifones',
      'Refajos',
      'Mezclas de Bebidas Fermentadas',
      'Cervezas Artesanales',
    ],
  },
  {
    categoria: 'Cigarrillos y Tabaco Elaborado',
    subcategorias: [
      'Cigarrillos Nacionales',
      'Cigarrillos Importados',
      'Cigarrillos y Tabacos (puros)',
      'Picadura y Tabaco para Pipa',
      'Sistema Electrónico de Vapeo',
    ],
  },
];

export function subcategoriasDe(categoria: string): string[] {
  return CATEGORIAS_PRODUCTO_INFOCONSUMO.find((c) => c.categoria === categoria)?.subcategorias ?? [];
}

// Un lote de GoTrace puede apuntar a un producto del catálogo registrado antes de esta
// taxonomía (Tipo/Subtipo en texto libre, ej. "Licores Destilados" sin categoría de ley
// asociada) — se usa para no heredar/bloquear un valor que no existe en las 3 categorías
// vigentes y así no dejar el formulario sin salida.
export function categoriaReconocida(categoria: string): boolean {
  return CATEGORIAS_PRODUCTO_INFOCONSUMO.some((c) => c.categoria === categoria);
}

// Subcategorías sin componente específico por grado de alcohol — usan solo porcentaje sobre
// base gravable (Ley 223/1995). El campo "Grados alcoholimétricos" no aplica para estas.
const SUBCATEGORIAS_SIN_GRADO_ALCOHOL = new Set([
  'Cervezas Nacionales', 'Cervezas Importadas', 'Sifones', 'Refajos',
  'Mezclas de Bebidas Fermentadas', 'Cervezas Artesanales',
  'Cigarrillos Nacionales', 'Cigarrillos Importados', 'Cigarrillos y Tabacos (puros)',
  'Picadura y Tabaco para Pipa', 'Sistema Electrónico de Vapeo',
]);
export function usaGradoAlcohol(subcategoria: string): boolean {
  return subcategoria !== '' && !SUBCATEGORIAS_SIN_GRADO_ALCOHOL.has(subcategoria);
}

// Solo se pide el origen como campo aparte cuando la subcategoría NO ya lo distingue en su
// propio nombre (a diferencia de "Cigarrillos Nacionales/Importados" o "Cervezas
// Nacionales/Importadas", que ya son subcategorías separadas) — puros y picadura no tienen
// esa distinción en el nombre, pero GoTrace sí la trae en su propio campo Origen.
export function usaOrigenNacionalImportado(subcategoria: string): boolean {
  return ['Cigarrillos y Tabacos (puros)', 'Picadura y Tabaco para Pipa'].includes(subcategoria);
}
export function usaPesoGramos(subcategoria: string): boolean {
  return subcategoria === 'Picadura y Tabaco para Pipa';
}
export function usaDatosImportacion(subcategoria: string): boolean {
  return subcategoria === 'Cervezas Importadas';
}

// Subcategorías sin fórmula de liquidación soportada todavía en el motor de cálculo — Vapeo
// queda explícitamente sin parametrizar (Decreto 1474/2025 inexequible, Sentencia C-079/2026);
// las demás sí calculan (algunas requieren configurar una tarifa 2026 pendiente).
export const SUBCATEGORIAS_SIN_CALCULO = ['Sistema Electrónico de Vapeo'];

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
  subcategoriaProducto: string;
  origenProducto: string;
  numeroLote: string;
  gradosAlcoholimetricos: string;
  unidadesFisicas: string;
  pvpCertificado: string;
  pesoGramos: string;
  valorAduana: string;
  gravamenesArancelarios: string;
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

  // Puente GoTrace -> Infoconsumo (opcional): lote ya Aprobado en GoTrace del que se heredan
  // empresa y toda la ficha del producto. datosDesdeGoTrace=true bloquea la edición manual de
  // los campos de producto en el formulario — el único que se sigue diligenciando a mano es PVP.
  loteGoTraceSolicitudId: number | null;
  loteGoTraceNumero: string;
  loteGoTraceEmpresaNombre: string;
  loteGoTraceEmpresaNit: string;
  loteGoTraceProducto: string;
  loteGoTraceNumeroLote: string;
  datosDesdeGoTrace: boolean;

  // true cuando el lote vinculado apunta a un producto de GoTrace cuya clasificación (Tipo/
  // Subtipo) no existe en las 3 categorías vigentes (dato registrado antes de esta taxonomía).
  // Se fija una sola vez al vincular el lote — a diferencia de soloLectura (=datosDesdeGoTrace),
  // NO se recalcula sobre categoriaProducto/subcategoriaProducto, porque esos dos campos quedan
  // editables a mano en este caso y su valor cambia según lo que el usuario vaya eligiendo.
  clasificacionSinReconocer: boolean;
}

export const DATOS_TORNAGUIA_VACIOS: DatosTornaguia = {
  tipoTransporte: 'Terrestre',
  categoriaProducto: '',
  subcategoriaProducto: '',
  origenProducto: '',
  numeroLote: '',
  gradosAlcoholimetricos: '',
  unidadesFisicas: '',
  pvpCertificado: '',
  pesoGramos: '',
  valorAduana: '',
  gravamenesArancelarios: '',
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
  datosDesdeGoTrace: false,
  clasificacionSinReconocer: false,
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
