import { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import Sidebar from '../components/layout/Sidebar';
import {
  generarReporte,
  getReportesRecientes,
  descargarReporte,
  type ReporteGeneradoDto,
} from '../services/reporteService';
import { getSolicitudesListado } from '../services/solicitudService';
import { getTiposSolicitudPorProyecto, type TipoSolicitudDto } from '../services/solicitudService';
import { getProyectosActivos, type ProyectoResponseDto } from '../services/proyectoService';

const ESTADOS = ['Radicada', 'En revisión', 'Pendiente', 'Requiere información', 'Aprobada', 'Rechazada'];

function formatearFechaHora(iso: string) {
  const fecha = new Date(iso);
  if (isNaN(fecha.getTime())) return '—';
  return fecha.toLocaleString('es-CO', { day: '2-digit', month: 'short', year: 'numeric', hour: 'numeric', minute: '2-digit' });
}

function diasDesde(iso: string) {
  const dias = Math.floor((Date.now() - new Date(iso).getTime()) / 86400000);
  if (dias <= 0) return 'Generado hoy';
  if (dias === 1) return 'Generado hace 1 día';
  if (dias < 7) return `Generado hace ${dias} días`;
  const semanas = Math.floor(dias / 7);
  return `Generado hace ${semanas} semana${semanas === 1 ? '' : 's'}`;
}

export default function ReportesPage() {
  const [searchParams] = useSearchParams();
  const proyectoId = Number(searchParams.get('proyectoId'));

  const [proyecto, setProyecto] = useState<ProyectoResponseDto | null>(null);
  const [tipos, setTipos] = useState<TipoSolicitudDto[]>([]);
  const [recientes, setRecientes] = useState<ReporteGeneradoDto[]>([]);

  const hoy = new Date().toISOString().slice(0, 10);
  const hace30 = new Date(Date.now() - 30 * 86400000).toISOString().slice(0, 10);

  const [desde, setDesde] = useState(hace30);
  const [hasta, setHasta] = useState(hoy);
  const [tipoSolicitudId, setTipoSolicitudId] = useState('');
  const [estadosMarcados, setEstadosMarcados] = useState<Set<string>>(new Set(ESTADOS));
  const [formato, setFormato] = useState<'xlsx' | 'pdf'>('xlsx');

  const [vistaPreviaTotal, setVistaPreviaTotal] = useState<number | null>(null);
  const [generando, setGenerando] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!proyectoId) return;
    getProyectosActivos().then((lista) => setProyecto(lista.find((p) => p.id === proyectoId) ?? null));
    getTiposSolicitudPorProyecto(proyectoId).then(setTipos);
    getReportesRecientes(proyectoId).then(setRecientes).catch(() => setRecientes([]));
  }, [proyectoId]);

  // Vista previa aproximada: suma los conteos por estado marcado desde el listado real.
  // No aplica el rango de fechas (el endpoint de listado no lo soporta todavía), así que
  // el número final que confirme "generar" puede diferir un poco de este estimado.
  useEffect(() => {
    if (!proyectoId) return;
    getSolicitudesListado({
      proyectoId,
      tipoSolicitudId: tipoSolicitudId ? Number(tipoSolicitudId) : undefined,
      pagina: 1,
      tamanoPagina: 1,
    }).then((res) => {
      const total = res.conteosPorEstado
        .filter((c) => estadosMarcados.has(c.estado))
        .reduce((sum, c) => sum + c.total, 0);
      setVistaPreviaTotal(total);
    });
  }, [proyectoId, tipoSolicitudId, estadosMarcados]);

  function toggleEstado(estado: string) {
    setEstadosMarcados((prev) => {
      const next = new Set(prev);
      next.has(estado) ? next.delete(estado) : next.add(estado);
      return next;
    });
  }

  const rangoDias = Math.max(0, Math.round((new Date(hasta).getTime() - new Date(desde).getTime()) / 86400000));

  async function handleGenerar() {
    setGenerando(true);
    setError(null);
    try {
      const reporte = await generarReporte({
        proyectoId,
        desde,
        hasta,
        tipoSolicitudId: tipoSolicitudId ? Number(tipoSolicitudId) : undefined,
        estadosIncluidos: Array.from(estadosMarcados),
        formato,
      });
      await descargarReporte(reporte.id, reporte.nombreArchivo);
      const lista = await getReportesRecientes(proyectoId);
      setRecientes(lista);
    } catch (err: any) {
      setError(err?.response?.data?.mensaje ?? 'No se pudo generar el reporte.');
    } finally {
      setGenerando(false);
    }
  }

  if (!proyectoId) {
    return (
      <div className="flex min-h-screen bg-paper">
        <Sidebar active="reportes" />
        <main className="flex-1 flex items-center justify-center text-sm text-ink-600">
          Selecciona un proyecto en "Mis proyectos" para generar reportes.
        </main>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen bg-paper">
      <Sidebar active="reportes" />

      <main className="flex-1 px-[38px] py-7 overflow-y-auto">
        <div className="mb-6">
          <h1 className="font-display text-[19px] font-semibold text-ink-900">
            Reportes — {proyecto?.nombre ?? '...'}
          </h1>
          <p className="text-ink-600 text-[12.5px] mt-[3px]">Exporta listados de solicitudes filtrados a Excel o PDF</p>
        </div>

        <div className="grid grid-cols-[1fr_300px] gap-5 items-start">
          <div className="flex flex-col gap-5">
            <div className="bg-white border border-line rounded-[14px] p-5">
              <h3 className="font-display text-[13.5px] font-semibold text-ink-900 mb-4">Filtros del reporte</h3>
              <div className="grid grid-cols-2 gap-4 mb-4">
                <div>
                  <label className="block text-xs font-semibold text-ink-900 mb-1.5">Desde</label>
                  <input
                    type="date"
                    value={desde}
                    onChange={(e) => setDesde(e.target.value)}
                    className="w-full py-2.5 px-3 border-[1.5px] border-line rounded-[9px] text-[13px] outline-none focus:border-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-ink-900 mb-1.5">Hasta</label>
                  <input
                    type="date"
                    value={hasta}
                    onChange={(e) => setHasta(e.target.value)}
                    className="w-full py-2.5 px-3 border-[1.5px] border-line rounded-[9px] text-[13px] outline-none focus:border-blue-500"
                  />
                </div>
              </div>

              <label className="block text-xs font-semibold text-ink-900 mb-1.5">Tipo de solicitud</label>
              <select
                value={tipoSolicitudId}
                onChange={(e) => setTipoSolicitudId(e.target.value)}
                className="w-full py-2.5 px-3 border-[1.5px] border-line rounded-[9px] text-[13px] outline-none mb-4"
              >
                <option value="">Todos los tipos</option>
                {tipos.map((t) => (
                  <option key={t.id} value={t.id}>{t.nombre}</option>
                ))}
              </select>

              <label className="block text-xs font-semibold text-ink-900 mb-2">Estados a incluir</label>
              <div className="grid grid-cols-2 gap-2.5">
                {ESTADOS.map((estado) => (
                  <label
                    key={estado}
                    className="flex items-center gap-2.5 border border-line rounded-[9px] px-3.5 py-2.5 cursor-pointer"
                  >
                    <input
                      type="checkbox"
                      checked={estadosMarcados.has(estado)}
                      onChange={() => toggleEstado(estado)}
                      className="accent-[#0d9488] w-4 h-4"
                    />
                    <span className="text-[13px] text-ink-900">{estado}</span>
                  </label>
                ))}
              </div>
            </div>

            <div className="bg-white border border-line rounded-[14px] p-5">
              <h3 className="font-display text-[13.5px] font-semibold text-ink-900 mb-4">Formato de salida</h3>
              <div className="grid grid-cols-2 gap-3 mb-4">
                {(['xlsx', 'pdf'] as const).map((f) => (
                  <button
                    key={f}
                    type="button"
                    onClick={() => setFormato(f)}
                    className={`flex flex-col items-center gap-2 py-6 rounded-xl border-2 ${
                      formato === f ? 'border-[#0d9488] bg-[#e3f7f4]' : 'border-line'
                    }`}
                  >
                    <svg viewBox="0 0 24 24" fill="none" strokeWidth="1.8" className={`w-6 h-6 ${formato === f ? 'stroke-[#0d9488]' : 'stroke-ink-400'}`}>
                      <rect x="5" y="3" width="14" height="18" rx="2" /><path d="M9 8h6M9 12h6M9 16h3" />
                    </svg>
                    <span className="text-[13.5px] font-semibold text-ink-900">
                      {f === 'xlsx' ? 'Excel (.xlsx)' : 'PDF'}
                    </span>
                  </button>
                ))}
              </div>

              {error && (
                <div className="text-xs text-red-600 bg-red-50 border border-red-200 rounded-lg px-3 py-2 mb-4">
                  {error}
                </div>
              )}

              <button
                onClick={handleGenerar}
                disabled={generando || estadosMarcados.size === 0}
                className="w-full flex items-center justify-center gap-2 py-3 rounded-[10px] bg-[#0d9488] text-white text-sm font-semibold disabled:opacity-60"
              >
                <svg viewBox="0 0 24 24" fill="none" strokeWidth="2.2" className="w-4 h-4 stroke-white">
                  <path d="M12 3v13M6 10l6 6 6-6" /><path d="M5 21h14" />
                </svg>
                {generando ? 'Generando...' : 'Generar reporte'}
              </button>
            </div>
          </div>

          <div className="flex flex-col gap-4">
            <div className="bg-white border border-line rounded-[14px] p-4">
              <div className="text-[10.5px] uppercase tracking-wide text-ink-400 font-semibold mb-3">Vista previa</div>
              <div className="flex justify-between items-center py-1.5">
                <span className="text-[12.5px] text-ink-600">Solicitudes incluidas</span>
                <span className="font-display text-[15px] font-bold text-ink-900">{vistaPreviaTotal ?? '—'}</span>
              </div>
              <div className="flex justify-between items-center py-1.5">
                <span className="text-[12.5px] text-ink-600">Rango de fechas</span>
                <span className="font-display text-[15px] font-bold text-ink-900">{rangoDias} días</span>
              </div>
              <div className="flex justify-between items-center py-1.5">
                <span className="text-[12.5px] text-ink-600">Columnas</span>
                <span className="font-display text-[15px] font-bold text-ink-900">9</span>
              </div>
              <p className="text-[10.5px] text-ink-400 mt-2 leading-relaxed">
                Estimado — no incluye el filtro de fechas. El total exacto se confirma al generar.
              </p>
            </div>

            <div className="bg-white border border-line rounded-[14px] p-4">
              <div className="text-[10.5px] uppercase tracking-wide text-ink-400 font-semibold mb-3">Reportes recientes</div>
              {recientes.length === 0 ? (
                <p className="text-xs text-ink-400">Todavía no has generado ningún reporte.</p>
              ) : (
                <div className="flex flex-col gap-2.5">
                  {recientes.map((r) => (
                    <button
                      key={r.id}
                      onClick={() => descargarReporte(r.id, r.nombreArchivo)}
                      className="flex items-center gap-2.5 text-left"
                    >
                      <div className="w-8 h-8 rounded-lg bg-[#e3f7f4] flex items-center justify-center shrink-0">
                        <svg viewBox="0 0 24 24" fill="none" strokeWidth="1.8" className="w-4 h-4 stroke-[#0d9488]">
                          <rect x="5" y="3" width="14" height="18" rx="2" /><path d="M9 8h6M9 12h6" />
                        </svg>
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="text-[12.5px] font-semibold text-ink-900 truncate">{r.nombreArchivo}</div>
                        <div className="text-[11px] text-ink-400">{diasDesde(r.fechaGeneracion)}</div>
                      </div>
                      <svg viewBox="0 0 24 24" fill="none" strokeWidth="1.8" className="w-4 h-4 stroke-ink-400 shrink-0">
                        <path d="M12 3v13M6 10l6 6 6-6" /><path d="M5 21h14" />
                      </svg>
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}