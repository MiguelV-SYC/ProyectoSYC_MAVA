// Menú jerárquico de productos (Codificación Única de Licores FND-DANE) — sección 1 de
// Reglas_de_negocio_SYCTrace.md.
export const CATEGORIAS_PRODUCTO_SYCTRACE = [
  { value: 'Licores_Destilados', label: 'Licores destilados' },
  { value: 'Vinos_Fermentados', label: 'Vinos y fermentados' },
  { value: 'Tabaco_Cigarrillos', label: 'Tabaco y cigarrillos' },
  { value: 'Cervezas_Sifones_Refajos', label: 'Cervezas, sifones y refajos' },
];

// RN del documento: cervezas no están sujetas a estampilla física de señalización
// tradicional en este flujo, solo a declaración remota de impuesto al consumo.
export const CATEGORIA_SIN_ESTAMPILLA_FISICA = 'Cervezas_Sifones_Refajos';

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
  nombreProducto: string;
  marca: string;
  gradoAlcoholimetrico: string;
  contenidoNetoCc: string;
  unidadesPorCajetilla: string;
  registroInvima: string;
  loteProduccion: string;

  origenProducto: string;
  numeroTornaguia: string;
  numeroDeclaracionImportacion: string;
  registroIntroduccion: string;

  prefijo: string;
  cantidadEstampillas: string;
  codigoInicial: string;
}

export const DATOS_ESTAMPILLA_VACIOS: DatosEstampilla = {
  solicitudInfoconsumoId: null,
  solicitudInfoconsumoNumero: '',
  empresaNombre: '',
  empresaNit: '',

  categoriaProducto: CATEGORIAS_PRODUCTO_SYCTRACE[0].value,
  nombreProducto: '',
  marca: '',
  gradoAlcoholimetrico: '',
  contenidoNetoCc: '',
  unidadesPorCajetilla: '',
  registroInvima: '',
  loteProduccion: '',

  origenProducto: 'Nacional',
  numeroTornaguia: '',
  numeroDeclaracionImportacion: '',
  registroIntroduccion: '',

  prefijo: '',
  cantidadEstampillas: '',
  codigoInicial: '',
};
