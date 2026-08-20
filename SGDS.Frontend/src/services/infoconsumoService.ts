import axios from 'axios';

const API_URL = 'http://localhost:5158/api';

function authHeader() {
  const saved = localStorage.getItem('sgds_auth_user');
  const token = saved ? JSON.parse(saved).token : null;
  return { Authorization: `Bearer ${token}` };
}

export interface CrearSolicitudInfoconsumoDto {
  proyectoId: number;
  tipoSolicitudId: number;
  empresaId: number;
  tipoTransporte: string;
  categoriaProducto: string;
  gradosAlcoholimetricos?: number;
  unidadesFisicas: number;
  pvpCertificado: number;
  departamentoOrigen: string;
  municipioOrigen: string;
  departamentoDestino: string;
  municipioDestino: string;
  empresaTransportadora: string;
  nitTransportador?: string;
  placaVehiculo: string;
  conductor?: string;
  cedulaConductor?: string;
  tipoVehiculo?: string;
  observaciones?: string;
}

export type ActualizarSolicitudInfoconsumoDto = Omit<CrearSolicitudInfoconsumoDto, 'proyectoId' | 'empresaId' | 'tipoSolicitudId'> & {
  tipoSolicitudId?: number;
};

export async function crearSolicitudInfoconsumo(dto: CrearSolicitudInfoconsumoDto): Promise<{ id: number }> {
  const { data } = await axios.post(`${API_URL}/Infoconsumo/solicitudes`, dto, { headers: authHeader() });
  return data;
}

export async function actualizarSolicitudInfoconsumo(id: number, dto: ActualizarSolicitudInfoconsumoDto): Promise<void> {
  await axios.put(`${API_URL}/Infoconsumo/solicitudes/${id}`, dto, { headers: authHeader() });
}

export async function expedirTornaguia(id: number): Promise<void> {
  await axios.put(`${API_URL}/Infoconsumo/solicitudes/${id}/expedir`, {}, { headers: authHeader() });
}

export async function legalizarTornaguia(id: number): Promise<void> {
  await axios.put(`${API_URL}/Infoconsumo/solicitudes/${id}/legalizar`, {}, { headers: authHeader() });
}

export async function confirmarPagoTornaguia(id: number): Promise<void> {
  await axios.put(`${API_URL}/Infoconsumo/solicitudes/${id}/confirmar-pago`, {}, { headers: authHeader() });
}

export interface TornaguiaResponseDto {
  solicitudId: number;
  numero: string;
  tipoTramite: string;
  estado: string;
  empresaId: number;
  empresaRazonSocial: string;
  empresaNit: string;
  tipoTransporte: string;
  categoriaProducto: string;
  gradosAlcoholimetricos?: number;
  unidadesFisicas: number;
  volumenTotalCc: number;
  pvpCertificado: number;
  departamentoOrigen: string;
  municipioOrigen: string;
  departamentoDestino: string;
  municipioDestino: string;
  distanciaAproximadaKm?: number;
  latOrigen?: number;
  lngOrigen?: number;
  latDestino?: number;
  lngDestino?: number;
  empresaTransportadora: string;
  nitTransportador?: string;
  placaVehiculo: string;
  conductor?: string;
  cedulaConductor?: string;
  tipoVehiculo?: string;
  observaciones?: string;
  fechaCreacion: string;
  fechaExpedicion?: string;
  fechaVigenciaLimite?: string;
  fechaLegalizacion?: string;
  pagoConfirmado: boolean;
  fechaPagoConfirmado?: string;
}

export async function getTornaguia(id: number): Promise<TornaguiaResponseDto> {
  const { data } = await axios.get<TornaguiaResponseDto>(`${API_URL}/Infoconsumo/solicitudes/${id}/tornaguia`, {
    headers: authHeader(),
  });
  return data;
}

export async function obtenerTornaguiaQrBlobUrl(id: number): Promise<string> {
  const response = await axios.get(`${API_URL}/Infoconsumo/solicitudes/${id}/tornaguia-qr.png`, {
    headers: authHeader(),
    responseType: 'blob',
  });
  return window.URL.createObjectURL(new Blob([response.data]));
}

export async function descargarTornaguiaPdf(id: number, nombreArchivo: string): Promise<void> {
  const response = await axios.get(`${API_URL}/Infoconsumo/solicitudes/${id}/tornaguia-pdf`, {
    headers: authHeader(),
    responseType: 'blob',
  });
  const url = window.URL.createObjectURL(new Blob([response.data]));
  const link = document.createElement('a');
  link.href = url;
  link.setAttribute('download', nombreArchivo);
  document.body.appendChild(link);
  link.click();
  link.remove();
  window.URL.revokeObjectURL(url);
}

export interface LiquidacionImpoConsumoResponseDto {
  solicitudId: number;
  numero: string;
  tipoTramite: string;
  contribuyenteNombre: string;
  contribuyenteNit: string;
  categoriaProducto: string;
  unidadesFisicas: number;
  gradosAlcoholimetricos?: number;
  volumenTotalCc: number;
  pvpCertificado: number;
  departamentoDestino: string;
  soportado: boolean;
  motivoNoSoportado?: string;
  tarifaEspecifica: number;
  tarifaAdValorem: number;
  componenteEspecifico: number;
  componenteAdValorem: number;
  iclInformativo: number;
  totalAPagar: number;
  aplicaExcepcionSanAndres: boolean;
  esSoloInformativo: boolean;
}

export async function getLiquidacionImpoConsumo(id: number): Promise<LiquidacionImpoConsumoResponseDto> {
  const { data } = await axios.get<LiquidacionImpoConsumoResponseDto>(`${API_URL}/Infoconsumo/solicitudes/${id}/liquidacion`, {
    headers: authHeader(),
  });
  return data;
}

export async function obtenerLiquidacionQrBlobUrl(id: number): Promise<string> {
  const response = await axios.get(`${API_URL}/Infoconsumo/solicitudes/${id}/liquidacion-qr.png`, {
    headers: authHeader(),
    responseType: 'blob',
  });
  return window.URL.createObjectURL(new Blob([response.data]));
}

export async function descargarLiquidacionPdf(id: number, nombreArchivo: string): Promise<void> {
  const response = await axios.get(`${API_URL}/Infoconsumo/solicitudes/${id}/liquidacion-pdf`, {
    headers: authHeader(),
    responseType: 'blob',
  });
  const url = window.URL.createObjectURL(new Blob([response.data]));
  const link = document.createElement('a');
  link.href = url;
  link.setAttribute('download', nombreArchivo);
  document.body.appendChild(link);
  link.click();
  link.remove();
  window.URL.revokeObjectURL(url);
}

export interface SolicitudHistorialEmpresaDto {
  id: number;
  numero: string;
  tipoSolicitudNombre?: string;
  estado: string;
  fechaCreacion: string;
}

export async function getHistorialEmpresa(empresaId: number): Promise<SolicitudHistorialEmpresaDto[]> {
  const { data } = await axios.get<SolicitudHistorialEmpresaDto[]>(`${API_URL}/Infoconsumo/empresas/${empresaId}/historial`, {
    headers: authHeader(),
  });
  return data;
}

export interface TarjetaKanbanInfoconsumoDto {
  id: number;
  numero: string;
  tipoTramite?: string;
  empresaNombre?: string;
  estado: string;
  fechaCreacion: string;
  fechaVigenciaLimite?: string;
}

export async function getKanbanInfoconsumo(proyectoId: number): Promise<TarjetaKanbanInfoconsumoDto[]> {
  const { data } = await axios.get<TarjetaKanbanInfoconsumoDto[]>(`${API_URL}/Infoconsumo/kanban`, {
    params: { proyectoId },
    headers: authHeader(),
  });
  return data;
}
