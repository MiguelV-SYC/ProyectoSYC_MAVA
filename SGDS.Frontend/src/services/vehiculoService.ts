import axios from 'axios';

const API_URL = 'http://localhost:5158/api';

export interface VehiculoResponseDto {
  id: number;
  ciudadanoId?: number;
  ciudadanoNombre?: string;
  ciudadanoDocumento?: string;
  empresaId?: number;
  empresaNombre?: string;
  empresaNit?: string;
  placa: string;
  marca?: string;
  linea?: string;
  modelo?: number;
  numeroChasis?: string;
}

function authHeader() {
  const saved = localStorage.getItem('sgds_auth_user');
  const token = saved ? JSON.parse(saved).token : null;
  return { Authorization: `Bearer ${token}` };
}

export async function getVehiculos(params: { proyectoId?: number } = {}): Promise<VehiculoResponseDto[]> {
  const { data } = await axios.get<VehiculoResponseDto[]>(`${API_URL}/Vehiculos`, {
    params,
    headers: authHeader(),
  });
  return data;
}

export async function getVehiculoDetalle(id: number): Promise<VehiculoResponseDto> {
  const { data } = await axios.get<VehiculoResponseDto>(`${API_URL}/Vehiculos/${id}`, {
    headers: authHeader(),
  });
  return data;
}

export interface CrearVehiculoDto {
  ciudadanoId?: number;
  empresaId?: number;
  placa: string;
  marca?: string;
  linea?: string;
  modelo?: number;
  numeroChasis?: string;
}

export async function crearVehiculo(dto: CrearVehiculoDto): Promise<VehiculoResponseDto> {
  const { data } = await axios.post<VehiculoResponseDto>(`${API_URL}/Vehiculos`, dto, {
    headers: authHeader(),
  });
  return data;
}

export async function actualizarVehiculo(id: number, dto: CrearVehiculoDto): Promise<void> {
  await axios.put(`${API_URL}/Vehiculos/${id}`, dto, { headers: authHeader() });
}
