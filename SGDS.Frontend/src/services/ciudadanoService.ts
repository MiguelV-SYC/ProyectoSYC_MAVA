import axios from 'axios';

const API_URL =  'http://localhost:5158/api';

export interface CiudadanoResponseDto { 
    id: number; 
    tipoDocumento: string; 
    numeroDocumento: string; 
    nombreCompleto: string; 
    telefono?: string;
    email?: string; 
    proyectosConActividad: string[];
    totalSolicitudes: number; 
}

export interface PagedResult<T> {
    datos: T[];
    totalRegistros: number;
    paginaActual: number;
    totalPaginas: number;
}

function authHeader() {
    const saved = localStorage.getItem('sgds_auth_user');
    const token = saved ? JSON.parse(saved).token : null; 
    return { Authorization: `Bearer ${token}` };
}

export async function getCiudadanos(params:{
    buscar?: string;
    proyectoId?: number;
    pagina?: number;
    tamanoPagina?: number;
}): Promise<PagedResult<CiudadanoResponseDto>> {
    const { data } = await axios.get<PagedResult<CiudadanoResponseDto>>(`${API_URL}/Ciudadanos`, {
        params,
        headers:authHeader(),
    });
    return data;
}

export interface ProyectoActividadDto {
    proyectoId: number; 
    proyectoNombre: string;
    primeraActividad: string; 
    totalSolicitudes: number; 
}

export interface CiudadanoDetalleResponseDto {
    id: number; 
    tipoDocumento: string; 
    numeroDocumento: string; 
    nombreCompleto: string; 
    telefono?: string; 
    email?: string; 
    ciudad?: string; 
    direccion?: string; 
    fechaRegistro: string; 
    proyectosConActividad: ProyectoActividadDto[];
}

export async function getCiudadanoDetalle(id: number): Promise<CiudadanoDetalleResponseDto> {
    const { data } = await axios.get<CiudadanoDetalleResponseDto>(`${API_URL}/Ciudadanos/${id}`, {
        headers: authHeader(),
    });
    return data;
}

export interface CrearCiudadanoDto {
    tipoDocumento: string;
    numeroDocumento: string; 
    nombreCompleto: string; 
    telefono?: string; 
    email?: string;
    ciudad?: string; 
    direccion?: string;
}

export interface ActualizarCiudadanoDto {
    nombreCompleto: string; 
    telefono?: string; 
    email?: string;
    ciudad?: string; 
    direccion?: string;
}

export interface BusquedaDocumentoResponse {
    existe: boolean; 
    ciudadano?: {
        id: number;
        nombreCompleto: string;
        tipoDocumento: string;
    };
}

export async function buscarPorDocumento(numero: string): Promise<BusquedaDocumentoResponse> {
    const { data } = await axios.get<BusquedaDocumentoResponse>(
        `${API_URL}/Ciudadanos/buscar-por-documento`,
        { params: { numero }, headers: authHeader() }
    );
    return data;
}

export async function crearCiudadano(dto: CrearCiudadanoDto) {
    const { data } = await axios.post(`${API_URL}/Ciudadanos`, dto, { headers: authHeader() });
    return data;
}
export async function actualizarCiudadano(id: number, dto: ActualizarCiudadanoDto): Promise<void> {
  await axios.put(`${API_URL}/Ciudadanos/${id}`, dto, { headers: authHeader() });
}