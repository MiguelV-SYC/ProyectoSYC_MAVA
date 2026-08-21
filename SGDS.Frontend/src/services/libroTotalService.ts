import axios from 'axios';

const API_URL = 'http://localhost:5158/api';

function authHeader() {
  const saved = localStorage.getItem('sgds_auth_user');
  const token = saved ? JSON.parse(saved).token : null;
  return { Authorization: `Bearer ${token}` };
}

export interface SedeResponseDto {
  id: number;
  nombre: string;
  ciudad: string;
  esPrincipal: boolean;
  atencionesMes: number;
  esperaPromedioMinutos?: number;
}

export async function getSedes(): Promise<SedeResponseDto[]> {
  const { data } = await axios.get<SedeResponseDto[]>(`${API_URL}/LibroTotal/sedes`, { headers: authHeader() });
  return data;
}

export async function getSede(id: number): Promise<SedeResponseDto> {
  const { data } = await axios.get<SedeResponseDto>(`${API_URL}/LibroTotal/sedes/${id}`, { headers: authHeader() });
  return data;
}

export interface CrearTurnoDto {
  proyectoId: number;
  tipoSolicitudId: number;
  ciudadanoId: number;
  sedeId: number;
  motivo: string;
  fechaHoraCita: string;
}

export async function agendarTurno(dto: CrearTurnoDto): Promise<{ id: number }> {
  const { data } = await axios.post(`${API_URL}/LibroTotal/solicitudes`, dto, { headers: authHeader() });
  return data;
}

export async function llamarTurno(id: number): Promise<void> {
  await axios.put(`${API_URL}/LibroTotal/solicitudes/${id}/llamar`, {}, { headers: authHeader() });
}

export async function finalizarTurno(id: number, tipificacion: string): Promise<void> {
  await axios.put(`${API_URL}/LibroTotal/solicitudes/${id}/finalizar`, { tipificacion }, { headers: authHeader() });
}

export async function marcarNoAsistio(id: number, motivo?: string): Promise<void> {
  await axios.put(`${API_URL}/LibroTotal/solicitudes/${id}/marcar-no-asistio`, { motivo }, { headers: authHeader() });
}

export interface TurnoResponseDto {
  solicitudId: number;
  numero: string;
  numeroTurno: string;
  estado: string;
  sedeId: number;
  sedeNombre: string;
  sedeCiudad: string;
  ciudadanoId: number;
  ciudadanoNombre: string;
  ciudadanoDocumento: string;
  motivo: string;
  fechaHoraCita: string;
  fechaCreacion: string;
  fechaInicioAtencion?: string;
  fechaFinAtencion?: string;
  tipificacion?: string;
  motivoNoAsistio?: string;
  operadorNombre?: string;
}

export async function getTurno(id: number): Promise<TurnoResponseDto> {
  const { data } = await axios.get<TurnoResponseDto>(`${API_URL}/LibroTotal/solicitudes/${id}/turno`, { headers: authHeader() });
  return data;
}

export interface TarjetaKanbanTurnoDto {
  id: number;
  numero: string;
  numeroTurno: string;
  ciudadanoNombre: string;
  motivo: string;
  estado: string;
  fechaHoraCita: string;
}

export async function getKanbanLibroTotal(sedeId: number): Promise<TarjetaKanbanTurnoDto[]> {
  const { data } = await axios.get<TarjetaKanbanTurnoDto[]>(`${API_URL}/LibroTotal/kanban`, {
    params: { sedeId },
    headers: authHeader(),
  });
  return data;
}

export interface TramiteResumenDto {
  solicitudId: number;
  numero: string;
  descripcion: string;
  estado: string;
}

export interface TramiteProyectoDto {
  proyectoId: number;
  proyectoNombre: string;
  solicitudes: TramiteResumenDto[];
}

export interface ConsultaConsolidadaResponseDto {
  ciudadanoId: number;
  ciudadanoNombre: string;
  ciudadanoDocumento: string;
  ciudadanoCiudad?: string;
  totalTramitesActivos: number;
  totalProyectos: number;
  proyectos: TramiteProyectoDto[];
}

export async function getConsultaConsolidada(documento: string): Promise<ConsultaConsolidadaResponseDto> {
  const { data } = await axios.get<ConsultaConsolidadaResponseDto>(`${API_URL}/LibroTotal/consulta-consolidada`, {
    params: { documento },
    headers: authHeader(),
  });
  return data;
}

export interface EstadoCuentaResponseDto {
  referencia: string;
  ciudadanoId: number;
  ciudadanoNombre: string;
  ciudadanoDocumento: string;
  totalTramitesActivos: number;
  totalProyectos: number;
  proyectos: TramiteProyectoDto[];
  sedeNombre?: string;
  operadorNombre?: string;
  fechaGeneracion: string;
}

export async function getEstadoCuentaPorTurno(solicitudId: number): Promise<EstadoCuentaResponseDto> {
  const { data } = await axios.get<EstadoCuentaResponseDto>(`${API_URL}/LibroTotal/solicitudes/${solicitudId}/estado-cuenta`, {
    headers: authHeader(),
  });
  return data;
}

async function descargarBlob(url: string, nombreArchivo: string) {
  const response = await axios.get(url, { headers: authHeader(), responseType: 'blob' });
  const blobUrl = window.URL.createObjectURL(new Blob([response.data]));
  const link = document.createElement('a');
  link.href = blobUrl;
  link.setAttribute('download', nombreArchivo);
  document.body.appendChild(link);
  link.click();
  link.remove();
  window.URL.revokeObjectURL(blobUrl);
}

export async function descargarEstadoCuentaPorTurno(solicitudId: number, nombreArchivo: string): Promise<void> {
  await descargarBlob(`${API_URL}/LibroTotal/solicitudes/${solicitudId}/estado-cuenta-pdf`, nombreArchivo);
}

export async function obtenerEstadoCuentaQrPorTurnoBlobUrl(solicitudId: number): Promise<string> {
  const response = await axios.get(`${API_URL}/LibroTotal/solicitudes/${solicitudId}/estado-cuenta-qr.png`, {
    headers: authHeader(),
    responseType: 'blob',
  });
  return window.URL.createObjectURL(new Blob([response.data]));
}

export async function descargarEstadoCuentaPorDocumento(documento: string, nombreArchivo: string): Promise<void> {
  await descargarBlob(`${API_URL}/LibroTotal/consulta-consolidada-pdf?documento=${encodeURIComponent(documento)}`, nombreArchivo);
}

export async function obtenerEstadoCuentaQrPorDocumentoBlobUrl(documento: string): Promise<string> {
  const response = await axios.get(`${API_URL}/LibroTotal/consulta-consolidada-qr.png`, {
    params: { documento },
    headers: authHeader(),
    responseType: 'blob',
  });
  return window.URL.createObjectURL(new Blob([response.data]));
}
