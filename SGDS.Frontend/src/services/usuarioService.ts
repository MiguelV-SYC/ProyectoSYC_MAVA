import axios from 'axios';

const API_URL = 'http://localhost:5158/api';

export interface ProyectoRolDto {
    proyectoId: number;
    proyectoNombre: string; 
    rolNombre: string; 
}

export interface UsuarioResponseDto {
    id: number;
    nombreCompleto: string; 
    email: string; 
    activo: boolean; 
    esAdminSyc: boolean; 
    proyectos: ProyectoRolDto[];
}

export interface ProyectoRolAsignacion {
    proyectoId: number;
    rolId: number;
}

export interface CrearUsuarioDto {
    nombreCompleto: string; 
    email: string; 
    password: string;
    proyectos: ProyectoRolAsignacion[];
}

export interface ActualizarUsuarioDto {
    nombreCompleto: string; 
    email: string;
    activo: boolean;
}

export interface ActualizarProyectosDto {
  proyectos: { proyectoId: number; rolId: number }[];
}

export async function actualizarProyectosUsuario(
  id: number,
  dto: ActualizarProyectosDto
): Promise<void> {
  await axios.put(`${API_URL}/Usuarios/${id}/proyectos`, dto, { headers: authHeader() });
}


export interface SolicitudAccesoResponseDto {
    id: number; 
    nombreCompleto: string; 
    email: string; 
    documentoIdentidad: string; 
    telefono?: string; 
    rolSolicitado: string; 
    motivo?: string; 
    estado: string; 
    fechaSolicitud: string; 
    proyectosSolicitados: string[];
}

export interface AprobarSolicitudDto {
    rolId: number;
}

export interface AprobarSolicitudResponseDto {
    usuarioId: number;
    email: string;
    passwordTemporal: string;
}

export interface RechazarSolicitudDto {
    motivo?: string | null; 
}

export async function aprobarSolicitud(
    id: number, 
    dto: AprobarSolicitudDto
): Promise<AprobarSolicitudResponseDto> {
    const { data } = await axios.post<AprobarSolicitudResponseDto>(
        `${API_URL}/SolicitudesAcceso/${id}/aprobar`,
        dto,
        { headers: authHeader() }
    );
    return data;
}

export async function rechazarSolicitud(id: number, dto: RechazarSolicitudDto): Promise<void> {
    await axios.post(`${API_URL}/SolicitudesAcceso/${id}/rechazar`, dto, { headers: authHeader() });
}

function authHeader() {
    const saved = localStorage.getItem('sgds_auth_user');
    const token = saved ? JSON.parse(saved).token : null;
    return { Authorization: `Bearer ${token}` };
}

export async function getUsuarios(): Promise<UsuarioResponseDto[]> {
    const { data } = await axios.get<UsuarioResponseDto[]>(`${API_URL}/Usuarios`, {
        headers: authHeader(),
    });
    return data;
}

export async function getSolicitudesPendientes(): Promise<SolicitudAccesoResponseDto[]> {
    const { data } = await axios.get<SolicitudAccesoResponseDto[]>(
        `${API_URL}/SolicitudesAcceso`,
        { params: { estado: 'Pendiente' }, headers: authHeader() }
    );
    return data;
}

export async function crearUsuario(dto: CrearUsuarioDto): Promise<UsuarioResponseDto> {
    const { data } = await axios.post<UsuarioResponseDto>(`${API_URL}/Usuarios`, dto, {
        headers: authHeader(),
    });
    return data;
}

export async function actualizarUsuario(id: number, dto: ActualizarUsuarioDto): Promise<void> {
    await axios.put(`${API_URL}/Usuarios/${id}`, dto, { headers: authHeader() });
}

export async function inactivarUsuario(id: number): Promise<void> {
    await axios.delete(`${API_URL}/Usuarios/${id}`, { headers: authHeader() });
}

export interface ProyectoUsuarioDto {
  proyectoId: number;
  proyectoNombre: string;
  rolNombre: string;
}

export interface UsuarioDetalleDto {
  id: number;
  nombreCompleto: string;
  email: string;
  esAdminSyc: boolean;
  activo: boolean;
  proyectos: ProyectoUsuarioDto[];
}

export async function getUsuarioPorId(id: number): Promise<UsuarioDetalleDto> {
  const { data } = await axios.get<UsuarioDetalleDto>(`${API_URL}/Usuarios/${id}`, {
    headers: authHeader(),
  });
  return data;
}