import axios from "axios";

const API_URL = 'http://localhost:5158/api';

export interface ProyectoResponseDto {
    id: number; 
    nombre: string; 
    codigo: string; 
    activo: boolean; 
}

export async function getProyectosActivos(): Promise<ProyectoResponseDto[]> {
    const { data } = await axios.get<ProyectoResponseDto[]>(`${API_URL}/Proyectos`);
    return data;
}