import axios from 'axios';

const API_URL = 'http://localhost:5158/api';

function authHeader() {
  const saved = localStorage.getItem('sgds_auth_user');
  const token = saved ? JSON.parse(saved).token : null;
  return { Authorization: `Bearer ${token}` };
}

export interface CrearSolicitudPasivosLaboralesDto {
  proyectoId: number;
  tipoSolicitudId: number;
  empresaId: number;
  instrumento?: string;
  servidorNombre?: string;
  servidorDocumento?: string;
  regimenPensional?: string;
  tiempoLaboradoMeses?: number;
  tiempoTotalAportesMeses?: number;
  valorMesadaPensional?: number;
  observaciones?: string;
  solicitudColpensionesId?: number;
}

export type ActualizarSolicitudPasivosLaboralesDto = Omit<
  CrearSolicitudPasivosLaboralesDto,
  'proyectoId' | 'tipoSolicitudId' | 'empresaId' | 'solicitudColpensionesId'
>;

export async function crearSolicitudPasivosLaborales(dto: CrearSolicitudPasivosLaboralesDto): Promise<{ id: number }> {
  const { data } = await axios.post(`${API_URL}/PasivosLaborales/solicitudes`, dto, { headers: authHeader() });
  return data;
}

export async function actualizarSolicitudPasivosLaborales(id: number, dto: ActualizarSolicitudPasivosLaboralesDto): Promise<void> {
  await axios.put(`${API_URL}/PasivosLaborales/solicitudes/${id}`, dto, { headers: authHeader() });
}

export interface InstrumentoPasivoResponseDto {
  solicitudId: number;
  numero: string;
  estado: string;
  tipoSolicitudNombre: string;

  empresaId: number;
  empresaRazonSocial: string;
  empresaNit: string;

  instrumento?: string;
  servidorNombre?: string;
  servidorDocumento?: string;
  regimenPensional?: string;
  tiempoLaboradoMeses?: number;
  tiempoTotalAportesMeses?: number;
  valorMesadaPensional?: number;
  observaciones?: string;

  solicitudColpensionesId?: number;
  solicitudColpensionesNumero?: string;
  solicitudColpensionesCiudadanoNombre?: string;

  fechaCreacion: string;
}

export async function getInstrumento(id: number): Promise<InstrumentoPasivoResponseDto> {
  const { data } = await axios.get<InstrumentoPasivoResponseDto>(`${API_URL}/PasivosLaborales/solicitudes/${id}/instrumento`, {
    headers: authHeader(),
  });
  return data;
}

export interface LiquidacionCuotaParteResponseDto {
  solicitudId: number;
  numero: string;
  referencia: string;
  instrumento: string;

  empresaRazonSocial: string;
  empresaNit: string;

  servidorNombre?: string;
  servidorDocumento?: string;
  regimenPensional?: string;

  soportado: boolean;
  motivoNoSoportado?: string;

  tiempoLaboradoMeses?: number;
  tiempoTotalAportesMeses?: number;
  valorMesadaPensional?: number;
  porcentajeConcurrencia?: number;
  valorMensualACargo?: number;

  operadorNombre?: string;
  fechaGeneracion: string;
}

export async function getLiquidacion(id: number): Promise<LiquidacionCuotaParteResponseDto> {
  const { data } = await axios.get<LiquidacionCuotaParteResponseDto>(`${API_URL}/PasivosLaborales/solicitudes/${id}/liquidacion`, {
    headers: authHeader(),
  });
  return data;
}

export async function obtenerLiquidacionQrBlobUrl(id: number): Promise<string> {
  const response = await axios.get(`${API_URL}/PasivosLaborales/solicitudes/${id}/liquidacion-qr.png`, {
    headers: authHeader(),
    responseType: 'blob',
  });
  return window.URL.createObjectURL(new Blob([response.data]));
}

export async function descargarLiquidacionPdf(id: number, nombreArchivo: string): Promise<void> {
  const response = await axios.get(`${API_URL}/PasivosLaborales/solicitudes/${id}/liquidacion-pdf`, {
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

export interface SolicitudColpensionesDisponibleDto {
  id: number;
  numero: string;
  tipoSolicitudNombre: string;
  estado: string;
  ciudadanoNombre?: string;
  ciudadanoDocumento?: string;
  fechaCreacion: string;
}

export async function getColpensionesDisponibles(buscar?: string): Promise<SolicitudColpensionesDisponibleDto[]> {
  const { data } = await axios.get<SolicitudColpensionesDisponibleDto[]>(`${API_URL}/PasivosLaborales/colpensiones-disponibles`, {
    params: { buscar: buscar || undefined },
    headers: authHeader(),
  });
  return data;
}
