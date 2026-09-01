import axios from 'axios';

const API_URL = 'http://localhost:5158/api';

function authHeader() {
  const saved = localStorage.getItem('sgds_auth_user');
  const token = saved ? JSON.parse(saved).token : null;
  return { Authorization: `Bearer ${token}` };
}

export interface MunicipioColombiaDto {
  departamento: string;
  municipio: string;
  lat: number;
  lng: number;
}

export async function getMunicipios(departamento?: string, buscar?: string): Promise<MunicipioColombiaDto[]> {
  const { data } = await axios.get<MunicipioColombiaDto[]>(`${API_URL}/Geografia/municipios`, {
    params: { departamento: departamento || undefined, buscar: buscar || undefined },
    headers: authHeader(),
  });
  return data;
}

export interface CandidatoDireccionDto {
  direccionCompleta: string;
  lat: number;
  lng: number;
}

export async function buscarDirecciones(
  texto: string,
  sesgo?: { lat: number; lng: number } | null,
  signal?: AbortSignal,
): Promise<CandidatoDireccionDto[]> {
  const { data } = await axios.get<CandidatoDireccionDto[]>(`${API_URL}/Geografia/direcciones`, {
    params: { texto, latSesgo: sesgo?.lat, lngSesgo: sesgo?.lng },
    headers: authHeader(),
    signal,
  });
  return data;
}
