import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Sidebar from '../components/layout/Sidebar';
import { useAuth } from '../context/AuthContext';
import { getDashboardGerencial, type DashboardGerencialResponseDto } from '../services/gerencialService';
import { getColorProyecto } from '../config/colorPorProyecto';
import KpiCard from '../components/gerencial/KpiCard';
import GraficoLinea from '../components/gerencial/GraficoLinea';
import Donut from '../components/gerencial/Donut';
import BarraHorizontal from '../components/gerencial/BarraHorizontal';

const OPCIONES_PERIODO = [
  { valor: 7, label: 'Últimos 7 días' },
  { valor: 30, label: 'Últimos 30 días' },
  { valor: 90, label: 'Últimos 90 días' },
];

const ALERTA_ESTILO: Record<string, string> = {
  alta: 'bg-[#fdeaea] border-[#f3c9c9]',
  media: 'bg-[#fdf3e7] border-[#f4dfb8]',
  info: 'bg-blue-100 border-[#c7dbfd]',
};

const ALERTA_ICONO_COLOR: Record<string, string> = {
  alta: 'stroke-[#dc2626]',
  media: 'stroke-[#96631a]',
  info: 'stroke-blue-600',
};

const ALERTA_TAG_COLOR: Record<string, string> = {
  alta: 'text-[#dc2626]',
  media: 'text-[#96631a]',
  info: 'text-blue-600',
};

const PRIORIDAD_COLOR: Record<string, string> = { Alta: 'text-[#dc2626] font-bold', Media: 'text-[#d97706] font-bold' };

export default function GerencialHomePage() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [periodo, setPeriodo] = useState(30);
  const [dashboard, setDashboard] = useState<DashboardGerencialResponseDto | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    getDashboardGerencial(periodo).then(setDashboard).finally(() => setLoading(false));
  }, [periodo]);

  const primerNombre = user?.nombreCompleto?.split(' ')[0] ?? '';
  const hoy = new Date().toLocaleDateString('es-CO', { day: 'numeric', month: 'long', year: 'numeric' });

  return (
    <div className="flex min-h-screen bg-paper">
      <Sidebar active="inicio" />

      <main className="flex-1 px-4 md:px-8 py-6 pt-16 md:pt-6 overflow-y-auto overflow-x-hidden">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-5">
          <div>
            <h1 className="font-display text-[22px] font-semibold text-ink-900">Hola, {primerNombre}</h1>
            <p className="text-ink-600 text-[12.5px] mt-0.5">Resumen ejecutivo del sistema al {hoy}</p>
          </div>
          <select
            value={periodo}
            onChange={(e) => setPeriodo(Number(e.target.value))}
            className="bg-white border border-line rounded-[10px] px-3.5 py-2.5 text-xs font-semibold text-ink-600 outline-none"
          >
            {OPCIONES_PERIODO.map((o) => <option key={o.valor} value={o.valor}>{o.label}</option>)}
          </select>
        </div>

        {loading || !dashboard ? (
          <div className="text-center text-sm text-ink-400 py-10">Cargando resumen ejecutivo...</div>
        ) : (
          <>
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3 mb-5">
              <KpiCard
                icono={<svg viewBox="0 0 24 24" fill="none" strokeWidth="1.8"><path d="M6 3h9l5 5v13H6z" /><path d="M14 3v5h5" /></svg>}
                colorFondo="#e8f0ff" colorIcono="#2f6fed"
                valor={dashboard.kpis.total.toLocaleString('es-CO')} label="Solicitudes totales"
                delta={dashboard.kpis.deltaTotalPorcentaje}
              />
              <KpiCard
                icono={<svg viewBox="0 0 24 24" fill="none" strokeWidth="2"><path d="M5 12l4 4 10-10" /></svg>}
                colorFondo="#dcfce7" colorIcono="#0d9488"
                valor={dashboard.kpis.finalizadas.toLocaleString('es-CO')} label="Finalizadas"
                delta={dashboard.kpis.deltaFinalizadasPorcentaje}
              />
              <KpiCard
                icono={<svg viewBox="0 0 24 24" fill="none" strokeWidth="1.8"><circle cx="12" cy="12" r="9" /><path d="M12 7v5l3 3" /></svg>}
                colorFondo="#fdf3e7" colorIcono="#d97706"
                valor={dashboard.kpis.enTramite.toLocaleString('es-CO')} label="En trámite"
              />
              <KpiCard
                icono={<svg viewBox="0 0 24 24" fill="none" strokeWidth="1.8"><circle cx="9" cy="8" r="3.2" /><path d="M3 20c0-3.3 2.7-5.5 6-5.5s6 2.2 6 5.5" /></svg>}
                colorFondo="#f3e8ff" colorIcono="#9333ea"
                valor={dashboard.kpis.pendientes.toLocaleString('es-CO')} label="Pendientes"
              />
              <KpiCard
                icono={<svg viewBox="0 0 24 24" fill="none" strokeWidth="1.8"><path d="M3 12h4l2 6 4-14 2 8h6" /></svg>}
                colorFondo="#cffafe" colorIcono="#0891b2"
                valor={dashboard.kpis.cumplimientoSlaPorcentaje != null ? `${dashboard.kpis.cumplimientoSlaPorcentaje}%` : '—'}
                label="Cumplimiento SLA"
              />
            </div>

            <div className="grid grid-cols-1 xl:grid-cols-[1.6fr_1fr_1fr] gap-4 mb-4">
              <div className="bg-white border border-line rounded-[14px] p-5">
                <h3 className="font-display text-[14px] font-semibold text-ink-900 mb-3">Comportamiento de solicitudes</h3>
                <div className="flex gap-4 mb-3">
                  <span className="flex items-center gap-1.5 text-[11px] font-semibold text-ink-600"><span className="w-2 h-2 rounded-full bg-blue-600" />Radicadas</span>
                  <span className="flex items-center gap-1.5 text-[11px] font-semibold text-ink-600"><span className="w-2 h-2 rounded-full bg-[#0d9488]" />Finalizadas</span>
                  <span className="flex items-center gap-1.5 text-[11px] font-semibold text-ink-600"><span className="w-2 h-2 rounded-full bg-[#d97706]" />En trámite</span>
                </div>
                <GraficoLinea series={[
                  { color: '#2f6fed', valores: dashboard.tendencia.map((p) => p.radicadas) },
                  { color: '#0d9488', valores: dashboard.tendencia.map((p) => p.finalizadas) },
                  { color: '#d97706', valores: dashboard.tendencia.map((p) => p.enTramite) },
                ]} />
              </div>

              <div className="bg-white border border-line rounded-[14px] p-5">
                <h3 className="font-display text-[14px] font-semibold text-ink-900 mb-4">Solicitudes por estado</h3>
                <Donut
                  totalCentro={dashboard.kpis.total}
                  segmentos={dashboard.distribucionEstado.map((d) => ({
                    label: d.bucket, total: d.total, porcentaje: d.porcentaje,
                    color: d.bucket === 'Finalizadas' ? '#2f6fed' : d.bucket === 'En trámite' ? '#d97706' : '#9333ea',
                  }))}
                />
              </div>

              <div className="bg-white border border-line rounded-[14px] p-5">
                <h3 className="font-display text-[14px] font-semibold text-ink-900 mb-4">Alertas</h3>
                {dashboard.alertas.length === 0 ? (
                  <p className="text-[12px] text-ink-400">Sin alertas relevantes en este periodo.</p>
                ) : (
                  dashboard.alertas.map((a, i) => (
                    <div key={i} className={`flex gap-2.5 p-3 rounded-[10px] mb-2 last:mb-0 border ${ALERTA_ESTILO[a.severidad]}`}>
                      <svg viewBox="0 0 24 24" fill="none" strokeWidth="1.8" className={`w-4 h-4 shrink-0 mt-0.5 ${ALERTA_ICONO_COLOR[a.severidad]}`}>
                        <path d="M12 9v4M12 17h.01" /><path d="M10.3 3.9L2.5 17a2 2 0 001.7 3h15.6a2 2 0 001.7-3L13.7 3.9a2 2 0 00-3.4 0z" />
                      </svg>
                      <div className="text-[12px] leading-relaxed text-ink-900">
                        {a.texto}
                        <span className={`block text-[11px] font-bold mt-0.5 ${ALERTA_TAG_COLOR[a.severidad]}`}>{a.etiqueta} →</span>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>

            <div className="grid grid-cols-1 xl:grid-cols-[1.6fr_1fr_1fr] gap-4 mb-4">
              <div className="bg-white border border-line rounded-[14px] p-5">
                <h3 className="font-display text-[14px] font-semibold text-ink-900 mb-4">Solicitudes por proyecto</h3>
                {dashboard.solicitudesPorProyecto.map((p) => (
                  <BarraHorizontal
                    key={p.proyectoId} label={p.proyectoNombre} valor={p.total}
                    maximo={dashboard.solicitudesPorProyecto[0]?.total ?? 1}
                    color={getColorProyecto(p.proyectoNombre).primario}
                  />
                ))}
              </div>

              <div className="bg-white border border-line rounded-[14px] p-5">
                <h3 className="font-display text-[14px] font-semibold text-ink-900 mb-4">Tiempo promedio de respuesta</h3>
                <div className="font-display text-[26px] font-bold text-ink-900">
                  {dashboard.tiempoRespuesta.promedioDias != null ? `${dashboard.tiempoRespuesta.promedioDias} días` : 'Sin datos'}
                </div>
                {dashboard.tiempoRespuesta.deltaDias != null && (
                  <div className={`flex items-center gap-1 text-[10.5px] font-bold mb-3.5 ${dashboard.tiempoRespuesta.deltaDias <= 0 ? 'text-[#0d9488]' : 'text-[#dc2626]'}`}>
                    {Math.abs(dashboard.tiempoRespuesta.deltaDias)} días vs. anterior
                  </div>
                )}
                <GraficoLinea alturaPx={100} series={[{ color: '#2f6fed', valores: dashboard.tiempoRespuesta.serie.map((p) => p.valor) }]} />
              </div>

              <div className="bg-white border border-line rounded-[14px] p-5">
                <h3 className="font-display text-[14px] font-semibold text-ink-900 mb-4">Cumplimiento SLA por proyecto</h3>
                {dashboard.slaPorProyecto.length === 0 ? (
                  <p className="text-[12px] text-ink-400">Sin cierres en este periodo.</p>
                ) : (
                  dashboard.slaPorProyecto.map((p) => (
                    <BarraHorizontal
                      key={p.proyectoId} label={p.proyectoNombre} valor={p.cumplimientoPorcentaje ?? 0}
                      maximo={100} sufijo="%"
                      color={(p.cumplimientoPorcentaje ?? 0) >= 85 ? '#0d9488' : (p.cumplimientoPorcentaje ?? 0) >= 60 ? '#d97706' : '#dc2626'}
                    />
                  ))
                )}
              </div>
            </div>

            <div className="bg-white border border-line rounded-[14px] p-5 mb-4">
              <div className="flex items-center justify-between mb-3">
                <h3 className="font-display text-[14px] font-semibold text-ink-900">Solicitudes críticas (próximas a vencer)</h3>
              </div>
              {dashboard.criticas.length === 0 ? (
                <p className="text-[12px] text-ink-400 py-4 text-center">No hay solicitudes próximas a vencer.</p>
              ) : (
                <table className="w-full border-collapse">
                  <thead>
                    <tr>
                      {['ID', 'Proyecto', 'Asunto', 'Días', 'Prioridad', 'Estado'].map((h) => (
                        <th key={h} className="text-left text-[10px] uppercase tracking-wide text-ink-400 font-bold px-1 py-2 border-b border-line">{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {dashboard.criticas.map((c) => {
                      const color = getColorProyecto(c.proyectoNombre);
                      return (
                        <tr key={c.solicitudId} onClick={() => navigate(`/solicitudes/${c.solicitudId}`)} className="cursor-pointer hover:bg-paper">
                          <td className="px-1 py-2.5 text-[11px] font-semibold text-ink-400 border-b border-line">#{c.numero}</td>
                          <td className="px-1 py-2.5 border-b border-line">
                            <span className="inline-flex items-center gap-1.5 text-[10.5px] font-semibold">
                              <span className="w-[7px] h-[7px] rounded-full" style={{ background: color.primario }} />
                              {c.proyectoNombre}
                            </span>
                          </td>
                          <td className="px-1 py-2.5 text-[12px] border-b border-line">{c.asunto}</td>
                          <td className="px-1 py-2.5 text-[12px] border-b border-line">{c.diasParaVencer} días</td>
                          <td className={`px-1 py-2.5 text-[12px] border-b border-line ${PRIORIDAD_COLOR[c.prioridad] ?? ''}`}>{c.prioridad}</td>
                          <td className="px-1 py-2.5 border-b border-line">
                            <span className="inline-flex items-center gap-1.5 text-[10.5px] font-semibold px-2.5 py-1 rounded-full bg-blue-100 text-blue-600">
                              <span className="w-[5px] h-[5px] rounded-full bg-blue-600" />{c.estado}
                            </span>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              )}
            </div>

            <div className="bg-white border border-line rounded-[14px] p-5 flex items-center gap-4">
              <div className="w-[44px] h-[44px] rounded-xl bg-[#fef9e7] flex items-center justify-center shrink-0">
                <svg viewBox="0 0 24 24" fill="none" width="22" height="22">
                  <rect x="3" y="3" width="7" height="7" rx="1" fill="#f2c811" /><rect x="14" y="3" width="7" height="7" rx="1" fill="#f2c811" />
                  <rect x="3" y="14" width="7" height="7" rx="1" fill="#f2c811" /><rect x="14" y="14" width="7" height="7" rx="1" fill="#f2c811" />
                </svg>
              </div>
              <div>
                <div className="text-[13.5px] font-bold text-ink-900">Análisis avanzado en Power BI</div>
                <div className="text-[11.5px] text-ink-600 mt-0.5">Explora reportes embebidos con filtros cruzados y drill-down por proyecto</div>
              </div>
              <button
                onClick={() => navigate('/gerencial/analisis-avanzado')}
                className="ml-auto flex items-center gap-1.5 bg-[#0f172a] text-white rounded-[9px] px-4 py-2.5 text-[12.5px] font-semibold shrink-0"
              >
                Abrir
                <svg viewBox="0 0 24 24" fill="none" strokeWidth="2" className="w-3.5 h-3.5 stroke-white"><path d="M5 12h14M13 6l6 6-6 6" /></svg>
              </button>
            </div>
          </>
        )}
      </main>
    </div>
  );
}
