import axios from 'axios';

const API_URL = 'http://localhost:5158/api';

function authHeader() {
  const saved = localStorage.getItem('sgds_auth_user');
  const token = saved ? JSON.parse(saved).token : null;
  return { Authorization: `Bearer ${token}` };
}

export interface CrearSolicitudSycTraceDto {
  proyectoId: number;
  tipoSolicitudId: number;
  solicitudInfoconsumoId: number;

  categoriaProducto: string;
  nombreProducto: string;
  marca?: string;
  gradoAlcoholimetrico?: number;
  contenidoNetoCc?: number;
  unidadesPorCajetilla?: number;
  registroInvima: string;
  loteProduccion: string;

  origenProducto: string;
  numeroTornaguia?: string;
  numeroDeclaracionImportacion?: string;
  registroIntroduccion?: string;

  prefijo: string;
  cantidadEstampillas: number;
  codigoInicial: number;
}

export type ActualizarSolicitudSycTraceDto = Omit<CrearSolicitudSycTraceDto, 'proyectoId' | 'tipoSolicitudId' | 'solicitudInfoconsumoId'>;

export async function crearSolicitudSycTrace(dto: CrearSolicitudSycTraceDto): Promise<{ id: number }> {
  const { data } = await axios.post(`${API_URL}/SycTrace/solicitudes`, dto, { headers: authHeader() });
  return data;
}

export async function actualizarSolicitudSycTrace(id: number, dto: ActualizarSolicitudSycTraceDto): Promise<void> {
  await axios.put(`${API_URL}/SycTrace/solicitudes/${id}`, dto, { headers: authHeader() });
}

export async function confirmarPagoEstampilla(id: number): Promise<void> {
  await axios.put(`${API_URL}/SycTrace/solicitudes/${id}/confirmar-pago`, {}, { headers: authHeader() });
}

export async function entregarEstampilla(id: number): Promise<void> {
  await axios.put(`${API_URL}/SycTrace/solicitudes/${id}/entregar`, {}, { headers: authHeader() });
}

export async function anularEstampilla(id: number, motivo: string): Promise<void> {
  await axios.put(`${API_URL}/SycTrace/solicitudes/${id}/anular`, { motivo }, { headers: authHeader() });
}

export interface EstampillaResponseDto {
  solicitudId: number;
  numero: string;
  estado: string;

  empresaId: number;
  empresaRazonSocial: string;
  empresaNit: string;

  solicitudInfoconsumoId: number;
  solicitudInfoconsumoNumero: string;

  categoriaProducto: string;
  nombreProducto: string;
  marca?: string;
  gradoAlcoholimetrico?: number;
  contenidoNetoCc?: number;
  unidadesPorCajetilla?: number;
  registroInvima: string;
  loteProduccion: string;

  origenProducto: string;
  numeroTornaguia?: string;
  numeroDeclaracionImportacion?: string;
  registroIntroduccion?: string;

  prefijo: string;
  cantidadEstampillas: number;
  codigoInicial: number;
  codigoFinal: number;
  codigoCompleto: string;

  fechaCreacion: string;
  fechaPago?: string;
  fechaEntrega?: string;
  motivoAnulacion?: string;
}

export async function getEstampilla(id: number): Promise<EstampillaResponseDto> {
  const { data } = await axios.get<EstampillaResponseDto>(`${API_URL}/SycTrace/solicitudes/${id}/estampilla`, {
    headers: authHeader(),
  });
  return data;
}

export async function obtenerEstampillaQrBlobUrl(id: number): Promise<string> {
  const response = await axios.get(`${API_URL}/SycTrace/solicitudes/${id}/estampilla-qr.png`, {
    headers: authHeader(),
    responseType: 'blob',
  });
  return window.URL.createObjectURL(new Blob([response.data]));
}

export async function descargarEstampillaPdf(id: number, nombreArchivo: string): Promise<void> {
  const response = await axios.get(`${API_URL}/SycTrace/solicitudes/${id}/estampilla-pdf`, {
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

export async function obtenerEstampillaBarcodeBlobUrl(id: number): Promise<string> {
  const response = await axios.get(`${API_URL}/SycTrace/solicitudes/${id}/estampilla-barcode.png`, {
    headers: authHeader(),
    responseType: 'blob',
  });
  return window.URL.createObjectURL(new Blob([response.data]));
}

export async function descargarEstampillaArtePdf(id: number, nombreArchivo: string): Promise<void> {
  const response = await axios.get(`${API_URL}/SycTrace/solicitudes/${id}/estampilla-arte-pdf`, {
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

export interface TornaguiaInfoconsumoDisponibleDto {
  id: number;
  numero: string;
  empresaId: number;
  empresaNombre: string;
  empresaNit: string;
  fechaCreacion: string;
  categoriaProducto: string;
  gradoAlcoholimetrico?: number;
  contenidoNetoCc?: number;
}

export async function getTornaguiasDisponibles(buscar?: string): Promise<TornaguiaInfoconsumoDisponibleDto[]> {
  const { data } = await axios.get<TornaguiaInfoconsumoDisponibleDto[]>(`${API_URL}/SycTrace/tornaguias-disponibles`, {
    params: { buscar: buscar || undefined },
    headers: authHeader(),
  });
  return data;
}
