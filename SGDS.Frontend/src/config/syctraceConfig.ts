// Mismo catálogo de 3 categorías + subcategorías de ley que GoTrace/Infoconsumo (ver
// gotraceConfig.ts / infoconsumoConfig.ts) — a propósito, para que una tornaguía de Infoconsumo
// (que a su vez puede venir de GoTrace) autocomplete el paso 3 sin tabla de traducción.
export const CATEGORIAS_PRODUCTO_SYCTRACE: { categoria: string; subcategorias: string[] }[] = [
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
  return CATEGORIAS_PRODUCTO_SYCTRACE.find((c) => c.categoria === categoria)?.subcategorias ?? [];
}

// Una tornaguía de Infoconsumo puede ser de antes de esta unificación de catálogo (categoría en
// texto libre que ya no existe) — se usa para no heredar/bloquear un valor no reconocido.
export function categoriaReconocida(categoria: string): boolean {
  return CATEGORIAS_PRODUCTO_SYCTRACE.some((c) => c.categoria === categoria);
}

// RN-01: Picadura y Tabaco para Pipa se liquida por peso, no por unidades de cajetilla como el
// resto de la categoría Cigarrillos y Tabaco Elaborado.
export function usaPesoGramos(subcategoria: string): boolean {
  return subcategoria === 'Picadura y Tabaco para Pipa';
}

// RN del documento: cervezas no están sujetas a estampilla física de señalización
// tradicional en este flujo, solo a declaración remota de impuesto al consumo.
export const CATEGORIA_SIN_ESTAMPILLA_FISICA = 'Cervezas, Sifones, Refajos y Mezclas';

export const ORIGENES_PRODUCTO_SYCTRACE = [
  { value: 'Nacional', label: 'Nacional' },
  { value: 'Importado', label: 'Importado' },
];

export interface DatosEstampilla {
  solicitudInfoconsumoId: number | null;
  solicitudInfoconsumoNumero: string;
  empresaNombre: string;
  empresaNit: string;

  categoriaProducto: string;
  subcategoriaProducto: string;
  nombreProducto: string;
  marca: string;
  gradoAlcoholimetrico: string;
  contenidoNetoCc: string;
  unidadesPorCajetilla: string;
  pesoGramos: string;
  registroInvima: string;
  loteProduccion: string;

  origenProducto: string;
  numeroTornaguia: string;
  numeroDeclaracionImportacion: string;
  registroIntroduccion: string;

  prefijo: string;
  cantidadEstampillas: string;
  codigoInicial: string;

  // Puente Infoconsumo -> SYCTrace (opcional): tornaguía con pago confirmado de la que se
  // heredan empresa y ficha de producto. datosDesdeInfoconsumo bloquea la edición manual de los
  // campos de producto que sí llegaron completos; clasificacionSinReconocer se activa cuando la
  // tornaguía es de antes de esta unificación de catálogo (categoría en texto libre que ya no
  // existe) y deja esos campos editables en vez de bloqueados sin salida; origenHeredado marca
  // si el toggle Nacional/Importado vino de la tornaguía o sigue siendo de elección manual.
  datosDesdeInfoconsumo: boolean;
  clasificacionSinReconocer: boolean;
  origenHeredado: boolean;
  loteHeredado: boolean;
  nombreHeredado: boolean;
  // true cuando registroInvima/prefijo/codigoInicial son los códigos oficiales YA generados y
  // guardados (se cargó una solicitud existente en edición) — el formulario no debe volver a
  // pedir una vista previa y sobrescribirlos. false mientras se está creando una solicitud
  // nueva (recién vinculada la tornaguía, todavía sin código real asignado).
  codigosFijados: boolean;
}

export const DATOS_ESTAMPILLA_VACIOS: DatosEstampilla = {
  solicitudInfoconsumoId: null,
  solicitudInfoconsumoNumero: '',
  empresaNombre: '',
  empresaNit: '',

  categoriaProducto: '',
  subcategoriaProducto: '',
  nombreProducto: '',
  marca: '',
  gradoAlcoholimetrico: '',
  contenidoNetoCc: '',
  unidadesPorCajetilla: '',
  pesoGramos: '',
  registroInvima: '',
  loteProduccion: '',

  origenProducto: 'Nacional',
  numeroTornaguia: '',
  numeroDeclaracionImportacion: '',
  registroIntroduccion: '',

  prefijo: '',
  cantidadEstampillas: '',
  codigoInicial: '',

  datosDesdeInfoconsumo: false,
  clasificacionSinReconocer: false,
  origenHeredado: false,
  loteHeredado: false,
  nombreHeredado: false,
  codigosFijados: false,
};
