export const MUNICIPIOS_SANTANDER = [
  'Aguada', 'Albania', 'Aratoca', 'Barbosa', 'Barichara', 'Barrancabermeja', 'Betulia', 'Bolívar',
  'Bucaramanga', 'Cabrera', 'California', 'Capitanejo', 'Carcasí', 'Cepitá', 'Cerrito', 'Charalá',
  'Charta', 'Chima', 'Chipatá', 'Cimitarra', 'Concepción', 'Confines', 'Contratación', 'Coromoro',
  'Curití', 'El Carmen de Chucurí', 'El Guacamayo', 'El Peñón', 'El Playón', 'Encino', 'Enciso',
  'Floridablanca', 'Florián', 'Galán', 'Gámbita', 'Girón', 'Guaca', 'Guadalupe', 'Guapotá',
  'Guavatá', 'Güepsa', 'Hato', 'Jesús María', 'Jordán', 'La Belleza', 'Landázuri', 'La Paz',
  'Lebrija', 'Los Santos', 'Macaravita', 'Málaga', 'Matanza', 'Mogotes', 'Molagavita', 'Ocamonte',
  'Oiba', 'Onzaga', 'Palmar', 'Palmas del Socorro', 'Páramo', 'Piedecuesta', 'Pinchote',
  'Puente Nacional', 'Puerto Parra', 'Puerto Wilches', 'Rionegro', 'Sabana de Torres', 'San Andrés',
  'San Benito', 'San Gil', 'San Joaquín', 'San José de Miranda', 'San Miguel',
  'San Vicente de Chucurí', 'Santa Bárbara', 'Santa Helena del Opón', 'Simacota', 'Socorro',
  'Suaita', 'Sucre', 'Suratá', 'Tona', 'Valle de San José', 'Vélez', 'Vetas', 'Villanueva',
  'Zapatoca',
];

export const TIPOS_ENTIDAD_ESTAMPILLAS = [
  { value: 'Gobernacion', label: 'Gobernación' },
  { value: 'Ente_Descentralizado', label: 'Ente descentralizado' },
  { value: 'Alcaldia_Municipal', label: 'Alcaldía municipal' },
];

export const REGIMENES_CONTRATISTA = [
  { value: 'Declarante_Renta', label: 'Declarante de renta' },
  { value: 'No_Declarante_Renta', label: 'No declarante de renta' },
];

export const TIPOS_CONTRATO_ESTAMPILLAS = [
  { value: 'Obra', label: 'Obra' },
  { value: 'Consultoria', label: 'Consultoría' },
  { value: 'Suministro', label: 'Suministro' },
  { value: 'Prestacion_Servicios', label: 'Prestación de servicios' },
  { value: 'Salud_Asistencial', label: 'Salud asistencial' },
  { value: 'Concesion', label: 'Concesión' },
  { value: 'Otros', label: 'Otros' },
];

export const FUENTES_RECURSOS_ESTAMPILLAS = [
  { value: 'Recursos_Propios', label: 'Recursos propios' },
  { value: 'SGSSS_Asistencial', label: 'SGSSS asistencial' },
  { value: 'Otros', label: 'Otros' },
];

export interface DatosContratoEstampillas {
  objetoContrato: string;
  fechaSuscripcion: string;
  valorContratoBruto: string;
  incluyeIva: boolean;
  tarifaIva: string;
  tipoEntidad: string;
  regimenContratista: string;
  tipoContrato: string;
  fuenteRecursos: string;
  municipio: string;
}

// tarifaIva se maneja en el formulario como porcentaje legible (ej. "19"); solo se convierte
// a fracción (0.19) al construir el JSON que espera el motor de cálculo del backend.
export const DATOS_CONTRATO_VACIOS: DatosContratoEstampillas = {
  objetoContrato: '',
  fechaSuscripcion: '',
  valorContratoBruto: '',
  incluyeIva: false,
  tarifaIva: '19',
  tipoEntidad: 'Gobernacion',
  regimenContratista: 'Declarante_Renta',
  tipoContrato: 'Obra',
  fuenteRecursos: 'Recursos_Propios',
  municipio: 'Bucaramanga',
};

const ETIQUETAS_TIPO_CONTRATO: Record<string, string> = Object.fromEntries(
  TIPOS_CONTRATO_ESTAMPILLAS.map((t) => [t.value, t.label])
);

export function construirDatosAdicionalesEstampillas(d: DatosContratoEstampillas, hechoGeneradorBase: string) {
  const tarifaIvaFraccion = d.incluyeIva && d.tarifaIva ? String(Number(d.tarifaIva) / 100) : '';
  return {
    hechoGenerador: `${hechoGeneradorBase} de ${ETIQUETAS_TIPO_CONTRATO[d.tipoContrato] ?? d.tipoContrato}`,
    objetoContrato: d.objetoContrato,
    fechaSuscripcion: d.fechaSuscripcion,
    valorContratoBruto: d.valorContratoBruto,
    incluyeIva: d.incluyeIva ? 'Sí' : 'No',
    tarifaIva: tarifaIvaFraccion,
    tipoEntidad: d.tipoEntidad,
    regimenContratista: d.regimenContratista,
    tipoContrato: d.tipoContrato,
    fuenteRecursos: d.fuenteRecursos,
    municipio: d.municipio,
  };
}

export function leerDatosContratoEstampillas(datos: Record<string, string>): DatosContratoEstampillas {
  const tarifaIvaFraccion = Number(datos.tarifaIva);
  return {
    objetoContrato: datos.objetoContrato ?? '',
    fechaSuscripcion: datos.fechaSuscripcion ?? '',
    valorContratoBruto: datos.valorContratoBruto ?? '',
    incluyeIva: datos.incluyeIva === 'Sí',
    tarifaIva: Number.isFinite(tarifaIvaFraccion) && tarifaIvaFraccion > 0 ? String(tarifaIvaFraccion * 100) : '19',
    tipoEntidad: datos.tipoEntidad || 'Gobernacion',
    regimenContratista: datos.regimenContratista || 'Declarante_Renta',
    tipoContrato: datos.tipoContrato || 'Obra',
    fuenteRecursos: datos.fuenteRecursos || 'Recursos_Propios',
    municipio: datos.municipio || 'Bucaramanga',
  };
}
