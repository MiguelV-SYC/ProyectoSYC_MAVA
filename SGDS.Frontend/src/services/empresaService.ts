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
  tieneLogo: boolean;
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
  tipoEmpresa?: string;
  estado?: string;
  departamento?: string;
  fechaRegistro: string;
  proyectosConActividad: ProyectoActividadDto[];
  tieneLogo: boolean;
  totalProductos: number;
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
  tipoEmpresa?: string;
  estado?: string;
  departamento?: string;
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
  tipoEmpresa?: string;
  estado?: string;
  departamento?: string;
}

export async function actualizarEmpresa(id: number, dto: ActualizarEmpresaDto): Promise<void> {
  await axios.put(`${API_URL}/Empresas/${id}`, dto, { headers: authHeader() });
}

export async function subirLogoEmpresa(id: number, logo: File): Promise<void> {
  const formData = new FormData();
  formData.append('logo', logo);
  await axios.post(`${API_URL}/Empresas/${id}/logo`, formData, {
    headers: { ...authHeader(), 'Content-Type': 'multipart/form-data' },
  });
}

export async function obtenerLogoEmpresaBlobUrl(id: number): Promise<string> {
  const response = await axios.get(`${API_URL}/Empresas/${id}/logo`, {
    headers: authHeader(),
    responseType: 'blob',
  });
  return window.URL.createObjectURL(new Blob([response.data]));
}

// ===== Catálogo de productos (GoTrace) =====

export interface ProductoDto {
  id: number;
  nombre: string;
  tipo: string;
  subtipo: string;
  presentacion: string;
  contenido: number;
  unidadMedida: string;
  gradoAlcoholimetrico?: number;
  origen?: string;
  relacion: string;
}

export interface GuardarProductoDto {
  nombre: string;
  tipo: string;
  subtipo: string;
  presentacion: string;
  contenido: number;
  unidadMedida: string;
  gradoAlcoholimetrico?: number;
  origen?: string;
  relacion: string;
}

export async function getProductosEmpresa(empresaId: number): Promise<ProductoDto[]> {
  const { data } = await axios.get<ProductoDto[]>(`${API_URL}/Empresas/${empresaId}/productos`, {
    headers: authHeader(),
  });
  return data;
}

export async function crearProducto(empresaId: number, dto: GuardarProductoDto): Promise<ProductoDto> {
  const { data } = await axios.post<ProductoDto>(`${API_URL}/Empresas/${empresaId}/productos`, dto, {
    headers: authHeader(),
  });
  return data;
}

export async function actualizarProducto(empresaId: number, productoId: number, dto: GuardarProductoDto): Promise<void> {
  await axios.put(`${API_URL}/Empresas/${empresaId}/productos/${productoId}`, dto, { headers: authHeader() });
}

export async function eliminarProducto(empresaId: number, productoId: number): Promise<void> {
  await axios.delete(`${API_URL}/Empresas/${empresaId}/productos/${productoId}`, { headers: authHeader() });
}