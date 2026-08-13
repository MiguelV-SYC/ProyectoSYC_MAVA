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

export interface DocumentoListadoDto {
  id: number;
  nombreArchivo: string;
  solicitudNumero: string;
  fecha: string;
  tamanoBytes: number;
  tipoArchivo: string;
  categoria: 'PDF' | 'Imágenes' | 'Otros';
}

export interface PaginacionResponseDto<T> {
  datos: T[];
  totalRegistros: number;
  paginaActual: number;
  totalPaginas: number;
}

export interface ConteoTipoDto {
  tipo: string;
  total: number;
}

export interface ListadoDocumentosResponseDto {
  pagina: PaginacionResponseDto<DocumentoListadoDto>;
  conteosPorTipo: ConteoTipoDto[];
}

export async function getDocumentosListado(params: {
  proyectoId?: number;
  buscar?: string;
  tipo?: string;
  pagina?: number;
  tamanoPagina?: number;
}): Promise<ListadoDocumentosResponseDto> {
  const { data } = await axios.get<ListadoDocumentosResponseDto>(`${API_URL}/Documentos/listado`, {
    params,
    headers: authHeader(),
  });
  return data;
}

export async function subirDocumento(solicitudId: number, archivo: File): Promise<DocumentoListadoDto> {
  const formData = new FormData();
  formData.append('archivo', archivo);
  const { data } = await axios.post<DocumentoListadoDto>(
    `${API_URL}/Solicitudes/${solicitudId}/documentos`,
    formData,
    { headers: { ...authHeader(), 'Content-Type': 'multipart/form-data' } }
  );
  return data;
}

export async function descargarDocumento(id: number, nombreArchivo: string): Promise<void> {
  const response = await axios.get(`${API_URL}/Documentos/${id}/descargar`, {
    headers: authHeader(),
    responseType: 'blob',
  });
  const url = window.URL.createObjectURL(new Blob([response.data]));
  const link = document.createElement('a');
  link.href = url;
  link.setAttribute('download', nombreArchivo);
  document.body.appendChild(link);
  link.click();
  link.remove();
  window.URL.revokeObjectURL(url);
}