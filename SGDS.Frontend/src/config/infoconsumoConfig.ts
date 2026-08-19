export const CATEGORIAS_PRODUCTO_INFOCONSUMO = [
  { value: 'Licores_Aperitivos', label: 'Licores, aperitivos y similares' },
  { value: 'Vinos_Aperitivos_Vinicos', label: 'Vinos y aperitivos vínicos' },
  { value: 'Cervezas_Sifones_Refajos', label: 'Cervezas, sifones, refajos y mezclas' },
  { value: 'Cigarrillos_Tabaco', label: 'Cigarrillos y tabaco elaborado' },
];

export interface DatosTornaguia {
  categoriaProducto: string;
  gradosAlcoholimetricos: string;
  unidadesFisicas: string;
  pvpCertificado: string;
  departamentoOrigen: string;
  municipioOrigen: string;
  departamentoDestino: string;
  municipioDestino: string;
  empresaTransportadora: string;
  nitTransportador: string;
  placaVehiculo: string;
  conductor: string;
  cedulaConductor: string;
  tipoVehiculo: string;
  observaciones: string;
}

export const DATOS_TORNAGUIA_VACIOS: DatosTornaguia = {
  categoriaProducto: CATEGORIAS_PRODUCTO_INFOCONSUMO[0].value,
  gradosAlcoholimetricos: '',
  unidadesFisicas: '',
  pvpCertificado: '',
  departamentoOrigen: 'Cundinamarca',
  municipioOrigen: '',
  departamentoDestino: 'Santander',
  municipioDestino: '',
  empresaTransportadora: '',
  nitTransportador: '',
  placaVehiculo: '',
  conductor: '',
  cedulaConductor: '',
  tipoVehiculo: '',
  observaciones: '',
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
