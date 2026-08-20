// Cadena de custodia fija (RN-GT03 de Reglas_de_negocio_GoTrace.md) — mismo orden que el
// mockup del certificado de trazabilidad.
export const PUNTOS_CONTROL_GOTRACE = ['Fábrica', 'Bodega', 'Distribuidor', 'Punto de venta'];

export interface DatosLoteGoTrace {
  producto: string;
  numeroLote: string;
  fechaProduccion: string;
  unidadesLote: string;

  prefijoUid: string;
  cantidadUids: string;
  uidInicial: string;

  puntosControlHabilitados: string[];
}

export const DATOS_LOTE_GOTRACE_VACIOS: DatosLoteGoTrace = {
  producto: '',
  numeroLote: '',
  fechaProduccion: '',
  unidadesLote: '',

  prefijoUid: '',
  cantidadUids: '',
  uidInicial: '',

  puntosControlHabilitados: ['Fábrica', 'Bodega'],
};
