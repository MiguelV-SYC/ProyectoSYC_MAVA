// Cadena de custodia fija (RN-GT03 de Reglas_de_negocio_GoTrace.md) — mismo orden que el
// mockup del certificado de trazabilidad.
export const PUNTOS_CONTROL_GOTRACE = ['Fábrica', 'Bodega', 'Distribuidor', 'Punto de venta'];

// Categoría de negocio de la empresa (Reglas_de_negocio_GoTrace.md, "Nueva Empresa" ->
// "tipo de empresa": [Alcohol] - [Cigarrillo]) — determina qué catálogo de productos se
// habilita más abajo en el mismo formulario.
export type CategoriaNegocioGoTrace = 'Alcohol' | 'Cigarrillo';
export const CATEGORIAS_NEGOCIO_GOTRACE: CategoriaNegocioGoTrace[] = ['Alcohol', 'Cigarrillo'];
export const ESTADOS_EMPRESA_GOTRACE = ['Activa', 'Inactiva'];

// Catálogo legal de bebidas y tabaco gravados — nota al final del formulario de "Nueva
// Empresa" en Reglas_de_negocio_GoTrace.md. El subtipo depende del tipo elegido; el tipo, a su
// vez, queda acotado por la categoría de negocio de la empresa (2 tipos de Alcohol, 1 de
// Cigarrillo).
export const TIPOS_PRODUCTO_GOTRACE: { categoria: CategoriaNegocioGoTrace; tipo: string; subtipos: string[] }[] = [
  {
    categoria: 'Alcohol',
    tipo: 'Licores, Vinos, Aperitivos y Similares',
    subtipos: [
      'Licores Destilados Nacionales',
      'Licores Destilados Importados',
      'Vinos (Nacionales e Importados)',
      'Aperitivos y Similares',
      'Aperitivos Vínicos',
    ],
  },
  {
    categoria: 'Alcohol',
    tipo: 'Cervezas, Sifones, Refajos y Mezclas',
    subtipos: [
      'Cervezas Nacionales',
      'Cervezas Importadas',
      'Sifones',
      'Refajos',
      'Mezclas de Bebidas Fermentadas',
      'Cervezas Artesanales',
    ],
  },
  {
    categoria: 'Cigarrillo',
    tipo: 'Cigarrillos y Tabaco Elaborado',
    subtipos: [
      'Cigarrillos Nacionales',
      'Cigarrillos Importados',
      'Cigarrillos y Tabacos (puros)',
      'Picadura y Tabaco para Pipa',
    ],
  },
];

export function tiposDe(categoria: CategoriaNegocioGoTrace): string[] {
  return TIPOS_PRODUCTO_GOTRACE.filter((t) => t.categoria === categoria).map((t) => t.tipo);
}

export function subtiposDe(tipo: string): string[] {
  return TIPOS_PRODUCTO_GOTRACE.find((t) => t.tipo === tipo)?.subtipos ?? [];
}

export function categoriaDeTipo(tipo: string): CategoriaNegocioGoTrace | null {
  return TIPOS_PRODUCTO_GOTRACE.find((t) => t.tipo === tipo)?.categoria ?? null;
}

// Presentación/unidad de medida no son las mismas para una botella de licor que para una
// cajetilla de cigarrillos — el documento no las detalla para tabaco, se infieren del uso real
// (cajetilla/cartón, cigarrillos por unidad o gramos para picadura suelta).
export const PRESENTACIONES_POR_CATEGORIA: Record<CategoriaNegocioGoTrace, string[]> = {
  Alcohol: ['Lata', 'Botella', 'Tetrapack'],
  Cigarrillo: ['Cajetilla', 'Cartón', 'Unidad'],
};
export const UNIDADES_MEDIDA_POR_CATEGORIA: Record<CategoriaNegocioGoTrace, string[]> = {
  Alcohol: ['mL', 'L'],
  Cigarrillo: ['Unidades', 'g'],
};

export const ORIGENES_PRODUCTO: { value: 'Nacional' | 'Importado'; label: string }[] = [
  { value: 'Nacional', label: 'Nacional' },
  { value: 'Importado', label: 'Importado' },
];

// Vocabularios de "relación" distintos a propósito para cada categoría — así los definió el
// negocio (alcohol: 2 opciones; tabaco: 3, incluida la combinada).
export const RELACIONES_ALCOHOL: { value: string; label: string }[] = [
  { value: 'Produce', label: 'Produce' },
  { value: 'Comercializa', label: 'Comercializa' },
];
export const RELACIONES_TABACO: { value: string; label: string }[] = [
  { value: 'Productora', label: 'Productora' },
  { value: 'Comercializadora', label: 'Comercializadora' },
  { value: 'Productora y comercializadora', label: 'Productora y comercializadora' },
];
export function relacionesDe(categoria: CategoriaNegocioGoTrace | null): { value: string; label: string }[] {
  return categoria === 'Cigarrillo' ? RELACIONES_TABACO : RELACIONES_ALCOHOL;
}

export interface DatosProducto {
  nombre: string;
  tipo: string;
  subtipo: string;
  presentacion: string;
  contenido: string;
  unidadMedida: string;
  gradoAlcoholimetrico: string;
  origen: string;
  relacion: string;
}

export function datosProductoVacios(categoria: CategoriaNegocioGoTrace | null): DatosProducto {
  const presentaciones = categoria ? PRESENTACIONES_POR_CATEGORIA[categoria] : [];
  const unidades = categoria ? UNIDADES_MEDIDA_POR_CATEGORIA[categoria] : [];
  const tipos = categoria ? tiposDe(categoria) : [];
  return {
    nombre: '',
    tipo: categoria === 'Cigarrillo' ? tipos[0] ?? '' : '',
    subtipo: '',
    presentacion: presentaciones[0] ?? '',
    contenido: '',
    unidadMedida: unidades[0] ?? '',
    gradoAlcoholimetrico: '',
    origen: '',
    relacion: '',
  };
}

// Identificación de Unidades (Reglas_de_negocio_GoTrace.md, "Nueva Solicitud").
export const MODOS_GENERACION_UID: { value: 'Automatico' | 'Archivo'; label: string }[] = [
  { value: 'Automatico', label: 'Generar automáticamente' },
  { value: 'Archivo', label: 'Cargar archivo de UIDs' },
];

export interface DatosLoteGoTrace {
  // El producto se elige del catálogo de la empresa — productoId es el valor real que viaja
  // al backend; los demás campos "productoX" son solo para mostrar el resumen una vez elegido.
  productoId: number | null;
  productoNombre: string;
  productoTipo: string;
  productoPresentacion: string;
  productoContenido: string;
  productoUnidadMedida: string;
  productoRelacion: string;

  numeroLote: string;
  fechaProduccion: string;
  unidadesLote: string;

  modoGeneracionUid: 'Automatico' | 'Archivo';
  archivoUidsNombre: string;

  puntosControlHabilitados: string[];
}

export const DATOS_LOTE_GOTRACE_VACIOS: DatosLoteGoTrace = {
  productoId: null,
  productoNombre: '',
  productoTipo: '',
  productoPresentacion: '',
  productoContenido: '',
  productoUnidadMedida: '',
  productoRelacion: '',

  numeroLote: '',
  fechaProduccion: '',
  unidadesLote: '',

  modoGeneracionUid: 'Automatico',
  archivoUidsNombre: '',

  puntosControlHabilitados: ['Fábrica', 'Bodega'],
};
