import axios from "axios";
import type { StackId } from "recharts/types/util/ChartUtils";

const API_URL = 'http://localhost:5158/api';

export interface ConteoProyectoDto { 
    proyectoId: number; 
    proyectoNombre: string; 
    totalAsignadas: number;
}

export interface IndicadoresOperadorDto {
    asignadasAMi: number;
    vencenHoy: number; 
    requierenMiRespuesta: number; 
    completadasEstaSemana: number; 
}

export interface NecesitaAtencionDto {
    solicitudId: number; 
    numero: string; 
    tipoSolicitud: string; 
    ciudadanoNombre: string;
    proyectoNombre: string; 
    estadoDescripcion: string; 
    urgencia: 'vence_hoy' | 'vence_mañana' | 'normal';
    accionSugerida: 'tomar_caso' | 'revisar';
}

export interface ColaTrabajoDto {
    solicitudId: number;
    numero: string;
    tipoSolicitud: string; 
    ciudadanoNombre: string;
    ciudadanoDocumento: string;
    estado: string;
    fecha: string;
}

function authHeader() {
    const saved = localStorage.getItem('sgds_auth_user');
    const token = saved ? JSON.parse(saved).token : null;
    return { Authorization: `Bearer ${token}` };
}

export async function getMisConteosPorProyecto(): Promise<ConteoProyectoDto[]> {
    const { data } = await axios.get<ConteoProyectoDto[]>(
        `${API_URL}/Solicitudes/mis-conteos-por-proyecto`,
        { headers: authHeader() }
    );
    return data;
}

export async function getMisIndicadores(): Promise<IndicadoresOperadorDto> {
    const { data } = await axios.get<IndicadoresOperadorDto>(`${API_URL}/Solicitudes/mis-indicadores`, {
        headers: authHeader(),
    });
    return data;
}

export async function getNecesitanAtencion(limite = 5): Promise<NecesitaAtencionDto[]> {
    const { data } = await axios.get<NecesitaAtencionDto[]>(
        `${API_URL}/Solicitudes/necesitan-atencion`,
        { params: { limite }, headers: authHeader() }
    );
    return data; 
}

export async function getMiCola(params: {
    proyectoId: number; 
    filtro?: 'todas' | 'en_revision' | 'pendientes';
    }): Promise<ColaTrabajoDto[]> {
        const { data } = await axios.get<ColaTrabajoDto[]>(`${API_URL}/Solicitudes/mi-cola`, {
            params,
            headers: authHeader(),
    });
    return data;
}

export async function asignarUsuarioSolicitud(solicitudId: number, usuarioId: number): Promise<void> {
    await axios.put(
        `${API_URL}/Solicitudes/${solicitudId}/asignar-usuario`,
        { usuarioId },
        { headers: authHeader() }
    );   
}