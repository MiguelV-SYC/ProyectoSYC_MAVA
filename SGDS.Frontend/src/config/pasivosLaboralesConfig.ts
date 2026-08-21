export const TIPO_GESTION_PENSIONAL = 'Gestión de pasivo pensional';
export const TIPO_GESTION_LABORAL = 'Gestión de pasivo laboral';
export const TIPO_CONSULTA_EXPEDIENTE = 'Consulta de expediente digital';

export const INSTRUMENTOS_PENSIONAL = [
  { value: 'CuotaParte', label: 'Cuota parte pensional' },
  { value: 'BonoPensionalB', label: 'Bono pensional tipo B' },
  { value: 'BonoPensionalT', label: 'Bono pensional tipo T' },
  { value: 'CalculoActuarial', label: 'Cálculo actuarial' },
];

export const INSTRUMENTOS_LABORAL = [
  { value: 'DemandaSentencia', label: 'Demanda o sentencia judicial laboral' },
  { value: 'CesantiasRetroactivas', label: 'Cesantías retroactivas' },
  { value: 'SueldosRemanentes', label: 'Sueldos o prestaciones remanentes' },
];

export const REGIMENES_PENSIONALES = ['Prima Media', 'Ahorro Individual', 'Régimen de transición'];

export function instrumentosPorTipo(tipoTramiteNombre: string) {
  if (tipoTramiteNombre === TIPO_GESTION_PENSIONAL) return INSTRUMENTOS_PENSIONAL;
  if (tipoTramiteNombre === TIPO_GESTION_LABORAL) return INSTRUMENTOS_LABORAL;
  return [];
}

export function etiquetaInstrumento(instrumento?: string | null): string {
  const todos = [...INSTRUMENTOS_PENSIONAL, ...INSTRUMENTOS_LABORAL];
  return todos.find((i) => i.value === instrumento)?.label ?? instrumento ?? '—';
}

export interface DatosInstrumentoPasivo {
  instrumento: string;
  servidorNombre: string;
  servidorDocumento: string;
  regimenPensional: string;
  tiempoLaboradoAnios: string;
  tiempoLaboradoMesesAdicionales: string;
  tiempoTotalAportesAnios: string;
  tiempoTotalAportesMesesAdicionales: string;
  valorMesadaPensional: string;
  observaciones: string;
  solicitudColpensionesId: number | null;
  solicitudColpensionesNumero: string;
}

export const DATOS_INSTRUMENTO_PASIVO_VACIOS: DatosInstrumentoPasivo = {
  instrumento: '',
  servidorNombre: '',
  servidorDocumento: '',
  regimenPensional: REGIMENES_PENSIONALES[0],
  tiempoLaboradoAnios: '',
  tiempoLaboradoMesesAdicionales: '',
  tiempoTotalAportesAnios: '',
  tiempoTotalAportesMesesAdicionales: '',
  valorMesadaPensional: '',
  observaciones: '',
  solicitudColpensionesId: null,
  solicitudColpensionesNumero: '',
};

// Convierte años + meses (tal como se digitan en el formulario) al total de meses que
// espera el backend para el cálculo del % de concurrencia.
export function totalMeses(anios: string, mesesAdicionales: string): number | undefined {
  const a = Number(anios) || 0;
  const m = Number(mesesAdicionales) || 0;
  const total = a * 12 + m;
  return total > 0 ? total : undefined;
}

export function aniosYMeses(totalDeMeses?: number | null): { anios: string; meses: string } {
  if (!totalDeMeses || totalDeMeses <= 0) return { anios: '', meses: '' };
  return { anios: String(Math.floor(totalDeMeses / 12)), meses: String(totalDeMeses % 12) };
}
