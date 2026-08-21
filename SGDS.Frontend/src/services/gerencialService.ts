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
