import axios from 'axios';

const API_URL = 'http://localhost:5158/api';

export interface ProyectoResponseDto {
  id: number;
  nombre: string;
  codigo: string;
  descripcion: string;
  activo: boolean;
  estadoPersonalizado: string | null;
  totalTiposSolicitud: number;
  totalOperadores: number;
  totalSolicitudes: number;
}

export interface CrearProyectoDto {
  nombre: string;
  codigo: string;
  descripcion: string;
}

export interface ActualizarProyectoDto {
  nombre: string;
  descripcion: string;
  activo: boolean;
  estadoPersonalizado: string | null;
}

function authHeader() {
  const saved = localStorage.getItem('sgds_auth_user');
  const token = saved ? JSON.parse(saved).token : null;
  return { Authorization: `Bearer ${token}` };
}

export async function getProyectosActivos(): Promise<ProyectoResponseDto[]> {
  const { data } = await axios.get<ProyectoResponseDto[]>(`${API_URL}/Proyectos`);
  return data;
}

export async function getProyectosAdmin(): Promise<ProyectoResponseDto[]> {
  const { data } = await axios.get<ProyectoResponseDto[]>(`${API_URL}/Proyectos`, {
    headers: authHeader(),
  });
  return data;
}

export async function crearProyecto(dto: CrearProyectoDto): Promise<ProyectoResponseDto> {
  const { data } = await axios.post<ProyectoResponseDto>(`${API_URL}/Proyectos`, dto, {
    headers: authHeader(),
  });
  return data;
}

export async function actualizarProyecto(id: number, dto: ActualizarProyectoDto): Promise<void> {
  await axios.put(`${API_URL}/Proyectos/${id}`, dto, { headers: authHeader() });
}

export interface OperadorProyectoDto {
  usuarioId: number;
  nombreCompleto: string;
  rolNombre: string;
}

export async function getOperadoresPorProyecto(proyectoId: number): Promise<OperadorProyectoDto[]> {
  const { data } = await axios.get<OperadorProyectoDto[]>(`${API_URL}/Proyectos/${proyectoId}/operadores`, {
    headers: authHeader(),
  });
  return data;
}

export interface ResumenProyectoDto {
  tiempoPromedioResolucion : number | null; 
  radicadasHoy: number; 
  aprobadasEsteMes: number; 
}

export async function getResumenProyecto(id: number): Promise<ResumenProyectoDto> {
  const { data } = await axios.get<ResumenProyectoDto>(`${API_URL}/Proyectos/${id}/resumen`, {
    headers: authHeader(),
  });
  return data; 
}