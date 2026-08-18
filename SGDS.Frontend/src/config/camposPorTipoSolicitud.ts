export interface CampoConfig {
  key: string;
  label: string;
  tipo: 'texto' | 'numero' | 'select' | 'fecha';
  opciones?: string[];
  placeholder?: string;
}

export const CAMPOS_POR_TIPO: Record<string, CampoConfig[]> = {
  'Subsidio de vivienda': [
    { key: 'tipoVivienda', label: 'Tipo de vivienda', tipo: 'select', opciones: ['VIS (Vivienda de Interés Social)', 'No VIS'] },
    { key: 'valorSolicitado', label: 'Valor solicitado', tipo: 'numero', placeholder: '$ 0' },
    { key: 'ciudad', label: 'Ciudad', tipo: 'texto' },
  ],
  'Afiliación - Vinculación': [
    { key: 'fechaAfiliacion', label: 'Fecha de afiliación solicitada', tipo: 'fecha' },
  ],
  'Afiliación - Traslado de fondo de pensiones': [
    { key: 'fondoOrigen', label: 'Fondo de origen', tipo: 'select', opciones: ['Porvenir', 'Protección', 'Colfondos', 'Skandia'] },
    { key: 'fondoDestino', label: 'Fondo destino', tipo: 'select', opciones: ['Colpensiones (Prima Media)'] },
    { key: 'fechaTraslado', label: 'Fecha de traslado solicitada', tipo: 'fecha' },
    { key: 'observaciones', label: 'Observaciones', tipo: 'texto', placeholder: 'Información adicional relevante para el trámite' },
  ],
};

// Fallback cuando el tipo de solicitud no tiene campos configurados todavía
export const CAMPO_FALLBACK: CampoConfig = {
  key: 'observaciones',
  label: 'Información adicional relevante para el trámite',
  tipo: 'texto',
};