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
    { key: 'fechaAfiliacionSolicitada', label: 'Fecha de afiliación solicitada', tipo: 'fecha' },
    { key: 'observaciones', label: 'Observaciones', tipo: 'texto' },
  ],
  'Afiliación - Traslado de fondo de pensiones': [
    {
      key: 'fondoOrigen',
      label: 'Fondo de origen',
      tipo: 'select',
      opciones: ['Porvenir', 'Protección', 'Colfondos', 'Skandia']
    },
    {
      key: 'fondoDestino',
      label: 'Fondo destino',
      tipo: 'select',
      opciones: ['Colpensiones']
    },
    { key: 'fechaTraslado', label: 'Fecha de traslado', tipo: 'fecha' },
    { key: 'observaciones', label: 'Observaciones', tipo: 'texto' },
  ],
  // IUVA ("Causación de impuesto vehicular") no usa esta configuración genérica: tiene un
  // formulario dedicado en NuevaSolicitudPage.tsx (pasos "Vehículo", "Características del
  // vehículo" y "Base gravable") porque necesita checkboxes, campos condicionales y el
  // cálculo del impuesto — cosas que CampoConfig no modela.
};

// Fallback cuando el tipo de solicitud no tiene campos configurados todavía
export const CAMPO_FALLBACK: CampoConfig = {
  key: 'observaciones',
  label: 'Información adicional relevante para el trámite',
  tipo: 'texto',
};