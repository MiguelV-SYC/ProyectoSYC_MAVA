import axios from 'axios';
import { jwtDecode } from 'jwt-decode';

const API_URL = 'http://localhost:5158/api';

export interface LoginResponseDto {
  token: string;
  email: string;
  nombreCompleto: string;
}

export interface SolicitarAccesoDto {
  nombreCompleto: string; 
  email: string; 
  documentoIdentidad: string;
  telefono?: string; 
  proyectosSolicitados: number[];
  rolSolicitado: string;
  motivo?: string; 
}

interface MensajeResponse {
  mensaje: string;
}

export async function solicitarAcceso(dto: SolicitarAccesoDto): Promise<string> {
  const { data } =await axios.post<MensajeResponse>(`${API_URL}/Auth/solicitar-acceso`, dto );
  return data.mensaje;
  
}

interface JwtClaims {
  sub: string;
  email: string;
  nombreCompleto: string;
  esAdminSyc: string; // el JWT trae todo como string, hay que convertir a boolean
  proyecto?: string | string[]; // repetido por proyecto: "id:rol" — puede venir como string único o array
  exp: number;
}

export interface AuthUser {
  id: string;
  email: string;
  nombreCompleto: string;
  esAdminSyc: boolean;
  proyectos: { proyectoId: string; rol: string }[];
  token: string;
}

function parseProyectoClaim(claim?: string | string[]): { proyectoId: string; rol: string }[] {
  if (!claim) return [];
  const lista = Array.isArray(claim) ? claim : [claim];
  return lista.map((p) => {
    const [proyectoId, rol] = p.split(':');
    return { proyectoId, rol };
  });
}

export async function login(email: string, password: string): Promise<AuthUser> {
  const { data } = await axios.post<LoginResponseDto>(`${API_URL}/auth/login`, {
    email,
    password,
  });

  const decoded = jwtDecode<JwtClaims>(data.token);

  return {
    id: decoded.sub,
    email: data.email,
    nombreCompleto: data.nombreCompleto,
    esAdminSyc: decoded.esAdminSyc === 'True',
    proyectos: parseProyectoClaim(decoded.proyecto),
    token: data.token,
  };
}