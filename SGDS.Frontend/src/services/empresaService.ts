import axios from 'axios';

const API_URL = 'http://localhost:5158/api';

function authHeader() {
  const saved = localStorage.getItem('sgds_auth_user');
  const token = saved ? JSON.parse(saved).token : null;
  return { Authorization: `Bearer ${token}` };
}

export interface EmpresaResponseDto {
  id: number;
  nit: string;
  digitoVerificacion: string;
  razonSocial: string;
  proyectosConActividad: string[];
  totalSolicitudes: number;
}

export interface PagedResult<T> {
  datos: T[];
  totalRegistros: number;
  paginaActual: number;
  totalPaginas: number;
}

export async function getEmpresas(params: {
  buscar?: string;
  proyectoId?: number;
  pagina?: number;
  tamanoPagina?: number;
}): Promise<PagedResult<EmpresaResponseDto>> {
  const { data } = await axios.get<PagedResult<EmpresaResponseDto>>(`${API_URL}/Empresas`, {
    params,
    headers: authHeader(),
  });
  return data;
}

export interface ProyectoActividadDto {
  proyectoId: number;
  proyectoNombre: string;
  primeraActividad: string;
  totalSolicitudes: number;
}

export interface EmpresaDetalleResponseDto {
  id: number;
  nit: string;
  digitoVerificacion: string;
  razonSocial: string;
  representanteLegal?: string;
  telefono?: string;
  correo?: string;
  ciudad?: string;
  direccion?: string;
  fechaRegistro: string;
  proyectosConActividad: ProyectoActividadDto[];
}

export async function getEmpresaDetalle(id: number): Promise<EmpresaDetalleResponseDto> {
  const { data } = await axios.get<EmpresaDetalleResponseDto>(`${API_URL}/Empresas/${id}`, {
    headers: authHeader(),
  });
  return data;
}

export interface BusquedaNitResponse {
  existe: boolean;
  empresa?: {
    id: number;
    razonSocial: string;
    nit: string;
  };
}

export async function buscarPorNit(nit: string): Promise<BusquedaNitResponse> {
  const { data } = await axios.get<BusquedaNitResponse>(`${API_URL}/Empresas/buscar-por-nit`, {
    params: { nit },
    headers: authHeader(),
  });
  return data;
}

export interface CrearEmpresaDto {
  nit: string;
  razonSocial: string;
  representanteLegal?: string;
  telefono?: string;
  correo?: string;
  ciudad?: string;
  direccion?: string;
}

export async function crearEmpresa(dto: CrearEmpresaDto) {
  const { data } = await axios.post(`${API_URL}/Empresas`, dto, { headers: authHeader() });
  return data;
}

export interface ActualizarEmpresaDto {
  razonSocial: string;
  representanteLegal?: string;
  telefono?: string;
  correo?: string;
  ciudad?: string;
  direccion?: string;
}

export async function actualizarEmpresa(id: number, dto: ActualizarEmpresaDto): Promise<void> {
  await axios.put(`${API_URL}/Empresas/${id}`, dto, { headers: authHeader() });
}