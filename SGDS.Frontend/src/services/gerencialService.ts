import axios from 'axios';

const API_URL = 'http://localhost:5158/api';

function authHeader() {
  const saved = localStorage.getItem('sgds_auth_user');
  const token = saved ? JSON.parse(saved).token : null;
  return { Authorization: `Bearer ${token}` };
}

export interface KpiGerencialDto {
  total: number;
  finalizadas: number;
  enTramite: number;
  pendientes: number;
  cumplimientoSlaPorcentaje?: number;
  deltaTotalPorcentaje?: number;
  deltaFinalizadasPorcentaje?: number;
  deltaEnTramitePorcentaje?: number;
  deltaPendientesPorcentaje?: number;
  deltaSlaPorcentaje?: number;
}

export interface PuntoTendenciaDto {
  fecha: string;
  radicadas: number;
  finalizadas: number;
  enTramite: number;
}

export interface DistribucionEstadoDto {
  bucket: string;
  total: number;
  porcentaje: number;
}

export interface SolicitudesPorProyectoDto {
  proyectoId: number;
  proyectoNombre: string;
  total: number;
}

export interface SlaPorProyectoDto {
  proyectoId: number;
  proyectoNombre: string;
  cumplimientoPorcentaje?: number;
}

export interface SolicitudCriticaDto {
  solicitudId: number;
  numero: string;
  proyectoNombre: string;
  asunto: string;
  diasParaVencer: number;
  prioridad: string;
  estado: string;
}

export interface AlertaGerencialDto {
  severidad: string;
  texto: string;
  etiqueta: string;
}

export interface PuntoSerieDto {
  fecha: string;
  valor?: number;
}

export interface TiempoRespuestaDto {
  promedioDias?: number;
  deltaDias?: number;
  serie: PuntoSerieDto[];
}

export interface ResumenProyectoGerencialDto {
  proyectoId: number;
  proyectoNombre: string;
  proyectoCodigo: string;
  totalSolicitudes: number;
  enTramite: number;
  cumplimientoSlaPorcentaje?: number;
}

export interface DashboardGerencialResponseDto {
  desde: string;
  hasta: string;
  kpis: KpiGerencialDto;
  tendencia: PuntoTendenciaDto[];
  distribucionEstado: DistribucionEstadoDto[];
  solicitudesPorProyecto: SolicitudesPorProyectoDto[];
  slaPorProyecto: SlaPorProyectoDto[];
  tiempoRespuesta: TiempoRespuestaDto;
  criticas: SolicitudCriticaDto[];
  alertas: AlertaGerencialDto[];
  proyectos: ResumenProyectoGerencialDto[];
}

export async function getDashboardGerencial(dias = 30): Promise<DashboardGerencialResponseDto> {
  const { data } = await axios.get<DashboardGerencialResponseDto>(`${API_URL}/Gerencial/dashboard`, {
    params: { dias },
    headers: authHeader(),
  });
  return data;
}

export interface IndicadorPorTipoDto {
  proyectoId: number;
  proyectoNombre: string;
  tipoSolicitudNombre: string;
  total: number;
  finalizadas: number;
  cumplimientoSlaPorcentaje?: number;
  tiempoRespuestaPromedioDias?: number;
  tasaAprobacionPorcentaje?: number;
  tasaRechazoPorcentaje?: number;
  porcentajeRequiereInformacion?: number;
}

export interface IndicadoresGerencialResponseDto {
  desde: string;
  hasta: string;
  indicadores: IndicadorPorTipoDto[];
}

export async function getIndicadoresGerencial(dias = 30): Promise<IndicadoresGerencialResponseDto> {
  const { data } = await axios.get<IndicadoresGerencialResponseDto>(`${API_URL}/Gerencial/indicadores`, {
    params: { dias },
    headers: authHeader(),
  });
  return data;
}

export interface PuntoTendenciaExtendidoDto {
  fecha: string;
  radicadas: number;
  finalizadas: number;
  enTramite: number;
  cumplimientoSlaPorcentaje?: number;
}

export type Granularidad = 'dia' | 'semana' | 'mes';

export interface TendenciasGerencialResponseDto {
  desde: string;
  hasta: string;
  granularidad: Granularidad;
  puntos: PuntoTendenciaExtendidoDto[];
}

export async function getTendenciasGerencial(dias = 90, granularidad: Granularidad = 'dia'): Promise<TendenciasGerencialResponseDto> {
  const { data } = await axios.get<TendenciasGerencialResponseDto>(`${API_URL}/Gerencial/tendencias`, {
    params: { dias, granularidad },
    headers: authHeader(),
  });
  return data;
}

export interface ComparativoPeriodoDto {
  total: number;
  finalizadas: number;
  enTramite: number;
  pendientes: number;
  cumplimientoSlaPorcentaje?: number;
}

export interface ResumenComparativoDto {
  actual: ComparativoPeriodoDto;
  anterior: ComparativoPeriodoDto;
  deltaTotalPorcentaje?: number;
  deltaFinalizadasPorcentaje?: number;
  deltaEnTramitePorcentaje?: number;
  deltaPendientesPorcentaje?: number;
  deltaSlaPorcentaje?: number;
}

export interface ComparativoProyectoDto {
  proyectoId: number;
  proyectoNombre: string;
  totalActual: number;
  totalAnterior: number;
  deltaTotalPorcentaje?: number;
  slaActualPorcentaje?: number;
  slaAnteriorPorcentaje?: number;
  deltaSlaPorcentaje?: number;
}

export interface ComparativosGerencialResponseDto {
  desde: string;
  hasta: string;
  desdeAnterior: string;
  resumen: ResumenComparativoDto;
  porProyecto: ComparativoProyectoDto[];
}

export async function getComparativosGerencial(dias = 30): Promise<ComparativosGerencialResponseDto> {
  const { data } = await axios.get<ComparativosGerencialResponseDto>(`${API_URL}/Gerencial/comparativos`, {
    params: { dias },
    headers: authHeader(),
  });
  return data;
}
