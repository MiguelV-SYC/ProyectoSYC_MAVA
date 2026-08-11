import axios from 'axios';

const API_URL = 'http://localhost:5158/api';

export interface TipoSolicitudResponseDto {
  id: number;
  nombre: string;
  proyectoId: number;
}

export interface CrearTipoSolicitudDto {
  nombre: string;
  proyectoId: number;
}

export interface ActualizarTipoSolicitudDto {
  nombre: string;
}

function authHeader() {
  const saved = localStorage.getItem('sgds_auth_user');
  const token = saved ? JSON.parse(saved).token : null;
  return { Authorization: `Bearer ${token}` };
}

export async function getTiposSolicitudPorProyecto(
  proyectoId: number
): Promise<TipoSolicitudResponseDto[]> {
  const { data } = await axios.get<TipoSolicitudResponseDto[]>(`${API_URL}/TiposSolicitud`, {
    params: { proyectoId },
    headers: authHeader(),
  });
  return data;
}

export async function crearTipoSolicitud(
  dto: CrearTipoSolicitudDto
): Promise<TipoSolicitudResponseDto> {
  const { data } = await axios.post<TipoSolicitudResponseDto>(`${API_URL}/TiposSolicitud`, dto, {
    headers: authHeader(),
  });
  return data;
}

export async function actualizarTipoSolicitud(
  id: number,
  dto: ActualizarTipoSolicitudDto
): Promise<void> {
  await axios.put(`${API_URL}/TiposSolicitud/${id}`, dto, { headers: authHeader() });
}

export async function eliminarTipoSolicitud(id: number): Promise<void> {
  await axios.delete(`${API_URL}/TiposSolicitud/${id}`, { headers: authHeader() });
}