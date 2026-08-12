import axios from 'axios';
import { interpolate } from 'recharts';

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