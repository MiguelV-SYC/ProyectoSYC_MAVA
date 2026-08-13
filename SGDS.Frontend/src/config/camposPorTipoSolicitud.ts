export interface CampoConfig {
  key: string;
  label: string;
  tipo: 'texto' | 'numero' | 'select';
  opciones?: string[];
  placeholder?: string;
}

export const CAMPOS_POR_TIPO: Record<string, CampoConfig[]> = {
  'Subsidio de vivienda': [
    { key: 'tipoVivienda', label: 'Tipo de vivienda', tipo: 'select', opciones: ['VIS (Vivienda de Interés Social)', 'No VIS'] },
    { key: 'valorSolicitado', label: 'Valor solicitado', tipo: 'numero', placeholder: '$ 0' },
    { key: 'ciudad', label: 'Ciudad', tipo: 'texto' },
  ],
};

// Fallback cuando el tipo de solicitud no tiene campos configurados todavía
export const CAMPO_FALLBACK: CampoConfig = {
  key: 'observaciones',
  label: 'Información adicional relevante para el trámite',
  tipo: 'texto',
};