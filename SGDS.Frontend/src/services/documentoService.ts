import axios from 'axios';

const API_URL = 'http://localhost:5158/api';

export interface DocumentoResumenDto {
  id: number;
  nombreArchivo: string;
  solicitudNumero: string;
  fecha: string;
}

function authHeader() {
  const saved = localStorage.getItem('sgds_auth_user');
  const token = saved ? JSON.parse(saved).token : null;
  return { Authorization: `Bearer ${token}` };
}

export async function getDocumentosPorCiudadano(ciudadanoId: number): Promise<DocumentoResumenDto[]> {
  const { data } = await axios.get<DocumentoResumenDto[]>(`${API_URL}/Documentos`, {
    params: { ciudadanoId },
    headers: authHeader(),
  });
  return data;
}