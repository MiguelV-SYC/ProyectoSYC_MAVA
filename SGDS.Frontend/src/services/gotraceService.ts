import axios from 'axios';

const API_URL = 'http://localhost:5158/api';

function authHeader() {
  const saved = localStorage.getItem('sgds_auth_user');
  const token = saved ? JSON.parse(saved).token : null;
  return { Authorization: `Bearer ${token}` };
}

export interface CrearSolicitudGoTraceDto {
  proyectoId: number;
  tipoSolicitudId: number;
  empresaId: number;

  producto: string;
  numeroLote: string;
  fechaProduccion: string;
  unidadesLote: number;

  prefijoUid?: string;
  cantidadUids?: number;
  uidInicial?: number;

  puntosControlHabilitados: string[];
}

export type ActualizarSolicitudGoTraceDto = Omit<CrearSolicitudGoTraceDto, 'proyectoId' | 'tipoSolicitudId' | 'empresaId'>;

export async function crearSolicitudGoTrace(dto: CrearSolicitudGoTraceDto): Promise<{ id: number }> {
  const { data } = await axios.post(`${API_URL}/GoTrace/solicitudes`, dto, { headers: authHeader() });
  return data;
}

export async function actualizarSolicitudGoTrace(id: number, dto: ActualizarSolicitudGoTraceDto): Promise<void> {
  await axios.put(`${API_URL}/GoTrace/solicitudes/${id}`, dto, { headers: authHeader() });
}

export async function confirmarPuntoControl(solicitudId: number, puntoId: number): Promise<void> {
  await axios.put(`${API_URL}/GoTrace/solicitudes/${solicitudId}/puntos-control/${puntoId}/confirmar`, {}, { headers: authHeader() });
}

export interface PuntoControlResponseDto {
  id: number;
  nombre: string;
  orden: number;
  habilitado: boolean;
  confirmado: boolean;
  fechaConfirmacion?: string;
}

export interface CertificadoTrazabilidadResponseDto {
  solicitudId: number;
  numero: string;
  estado: string;

  empresaId: number;
  empresaRazonSocial: string;
  empresaNit: string;

  producto: string;
  numeroLote: string;
  fechaProduccion: string;
  unidadesLote: number;

  prefijoUid?: string;
  cantidadUids?: number;
  uidInicial?: number;
  uidFinal?: number;
  rangoUidCompleto?: string;

  puntosControl: PuntoControlResponseDto[];
  totalPuntosHabilitados: number;
  totalPuntosConfirmados: number;
  ultimaActualizacion?: string;

  fechaCreacion: string;
}

export async function getCertificado(id: number): Promise<CertificadoTrazabilidadResponseDto> {
  const { data } = await axios.get<CertificadoTrazabilidadResponseDto>(`${API_URL}/GoTrace/solicitudes/${id}/certificado`, {
    headers: authHeader(),
  });
  return data;
}

export async function obtenerCertificadoQrBlobUrl(id: number): Promise<string> {
  const response = await axios.get(`${API_URL}/GoTrace/solicitudes/${id}/certificado-qr.png`, {
    headers: authHeader(),
    responseType: 'blob',
  });
  return window.URL.createObjectURL(new Blob([response.data]));
}

export async function descargarCertificadoPdf(id: number, nombreArchivo: string): Promise<void> {
  const response = await axios.get(`${API_URL}/GoTrace/solicitudes/${id}/certificado-pdf`, {
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
