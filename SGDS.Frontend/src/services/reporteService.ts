import axios from 'axios';

const API_URL = 'http://localhost:5158/api';

function authHeader() {
  const saved = localStorage.getItem('sgds_auth_user');
  const token = saved ? JSON.parse(saved).token : null;
  return { Authorization: `Bearer ${token}` };
}

export interface GenerarReporteDto {
  proyectoId: number;
  desde?: string;
  hasta?: string;
  tipoSolicitudId?: number;
  estadosIncluidos?: string[];
  formato: 'xlsx' | 'pdf';
}

export interface ReporteGeneradoDto {
  id: number;
  nombreArchivo: string;
  formato: string;
  totalRegistros: number;
  fechaGeneracion: string;
}

export async function generarReporte(dto: GenerarReporteDto): Promise<ReporteGeneradoDto> {
  const { data } = await axios.post<ReporteGeneradoDto>(`${API_URL}/Reportes/generar`, dto, {
    headers: authHeader(),
  });
  return data;
}

export async function getReportesRecientes(proyectoId: number, limite = 5): Promise<ReporteGeneradoDto[]> {
  const { data } = await axios.get<ReporteGeneradoDto[]>(`${API_URL}/Reportes/recientes`, {
    params: { proyectoId, limite },
    headers: authHeader(),
  });
  return data;
}

export async function descargarReporte(id: number, nombreArchivo: string): Promise<void> {
  const response = await axios.get(`${API_URL}/Reportes/${id}/descargar`, {
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