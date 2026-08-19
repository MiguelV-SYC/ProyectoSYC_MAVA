import axios from 'axios';

const API_URL = 'http://localhost:5158/api';

function authHeader() {
  const saved = localStorage.getItem('sgds_auth_user');
  const token = saved ? JSON.parse(saved).token : null;
  return { Authorization: `Bearer ${token}` };
}

export interface AuditoriaResponseDto {
  id: number;
  usuarioNombre: string;
  accion: string;
  modulo: string;
  proyectoNombre: string | null;
  fechaHora: string;
  direccionIp: string;
}

export interface PaginacionResponseDto<T> {
  datos: T[];
  totalRegistros: number;
  paginaActual: number;
  totalPaginas: number;
}

export interface ListadoAuditoriaResponseDto {
  pagina: PaginacionResponseDto<AuditoriaResponseDto>;
}

export async function getAuditoriaListado(params: {
  buscar?: string;
  proyectoId?: number;
  modulo?: string;
  fecha?: string;
  pagina?: number;
  tamanoPagina?: number;
}): Promise<ListadoAuditoriaResponseDto> {
  const { data } = await axios.get<ListadoAuditoriaResponseDto>(`${API_URL}/Auditoria`, {
    params,
    headers: authHeader(),
  });
  return data;
}

export async function getAuditoriaModulos(): Promise<string[]> {
  const { data } = await axios.get<string[]>(`${API_URL}/Auditoria/modulos`, {
    headers: authHeader(),
  });
  return data;
}

export async function exportarAuditoria(params: {
  buscar?: string;
  proyectoId?: number;
  modulo?: string;
  fecha?: string;
}): Promise<void> {
  const response = await axios.get(`${API_URL}/Auditoria/exportar`, {
    params,
    headers: authHeader(),
    responseType: 'blob',
  });
  const url = window.URL.createObjectURL(new Blob([response.data]));
  const link = document.createElement('a');
  link.href = url;
  link.setAttribute('download', `Auditoria_${new Date().toISOString().slice(0, 10)}.xlsx`);
  document.body.appendChild(link);
  link.click();
  link.remove();
  window.URL.revokeObjectURL(url);
}