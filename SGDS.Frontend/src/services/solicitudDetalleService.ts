import axios from 'axios';

const API_URL = 'http://localhost:5158/api';

export interface SolicitudResumenDto {
  id: number;
  numero: string;
  tipoSolicitudNombre: string;
  proyectoNombre: string;
  estado: string;
  fecha: string;
}

function authHeader() {
  const saved = localStorage.getItem('sgds_auth_user');
  const token = saved ? JSON.parse(saved).token : null;
  return { Authorization: `Bearer ${token}` };
}

export async function getSolicitudesPorCiudadano(ciudadanoId: number): Promise<SolicitudResumenDto[]> {
  const { data } = await axios.get<SolicitudResumenDto[]>(`${API_URL}/Solicitudes`, {
    params: { ciudadanoId },
    headers: authHeader(),
  });
  return data;
}

export async function getSolicitudesPorEmpresa(empresaId: number): Promise<SolicitudResumenDto[]> {
  const { data } = await axios.get<SolicitudResumenDto[]>(`${API_URL}/Solicitudes`, {
    params: { empresaId }, 
    headers: authHeader(), 
  });
  return data; 
}