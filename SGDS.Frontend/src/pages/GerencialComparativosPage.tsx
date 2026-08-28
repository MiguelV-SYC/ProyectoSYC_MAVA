import { useState, useEffect } from 'react';
import Sidebar from '../components/layout/Sidebar';
import { getComparativosGerencial, type ComparativosGerencialResponseDto } from '../services/gerencialService';
import { getColorProyecto } from '../config/colorPorProyecto';
import KpiCard from '../components/gerencial/KpiCard';

const OPCIONES_PERIODO = [
  { valor: 7, label: 'Últimos 7 días' },
  { valor: 30, label: 'Últimos 30 días' },
  { valor: 90, label: 'Últimos 90 días' },
];

function DeltaTag({ delta }: { delta?: number }) {
  if (delta == null) return <span className="text-[11px] text-ink-400">—</span>;
  const esPositivo = delta >= 0;
  return (
    <span className={`inline-flex items-center gap-0.5 text-[11px] font-bold ${esPositivo ? 'text-[#0d9488]' : 'text-[#dc2626]'}`}>
      <svg viewBox="0 0 24 24" fill="none" strokeWidth={3} className="w-2.5 h-2.5">
        {esPositivo ? <path d="M12 19V5M5 12l7-7 7 7" /> : <path d="M12 5v14M5 12l7 7 7-7" />}
      </svg>
      {Math.abs(delta)}%
    </span>
  );
}

export default function GerencialComparativosPage() {
  const [periodo, setPeriodo] = useState(30);
  const [datos, setDatos] = useState<ComparativosGerencialResponseDto | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    getComparativosGerencial(periodo).then(setDatos).finally(() => setLoading(false));
  }, [periodo]);

  return (
    <div className="flex min-h-screen bg-paper">
      <Sidebar active="comparativos" />

      <main className="flex-1 px-4 md:px-8 py-6 pt-16 md:pt-6 overflow-y-auto overflow-x-hidden">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-5">
          <div>
            <h1 className="font-display text-[22px] font-semibold text-ink-900">Comparativos</h1>
            <p className="text-ink-600 text-[12.5px] mt-0.5">Período actual vs. anterior, y proyecto vs. proyecto</p>
          </div>
          <select
            value={periodo}
            onChange={(e) => setPeriodo(Number(e.target.value))}
            className="bg-white border border-line rounded-[10px] px-3.5 py-2.5 text-xs font-semibold text-ink-600 outline-none"
          >
            {OPCIONES_PERIODO.map((o) => <option key={o.valor} value={o.valor}>{o.label}</option>)}
          </select>
        </div>

        {loading || !datos ? (
          <div className="text-center text-sm text-ink-400 py-10">Cargando comparativos...</div>
        ) : (
          <>
            <p className="text-[11px] text-ink-400 mb-2.5">
              Actual: {new Date(datos.desde).toLocaleDateString('es-CO')} — {new Date(datos.hasta).toLocaleDateString('es-CO')}
              {'  ·  '}Anterior: {new Date(datos.desdeAnterior).toLocaleDateString('es-CO')} — {new Date(datos.desde).toLocaleDateString('es-CO')}
            </p>

            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3 mb-5">
              <KpiCard
                icono={<svg viewBox="0 0 24 24" fill="none" strokeWidth="1.8"><path d="M6 3h9l5 5v13H6z" /><path d="M14 3v5h5" /></svg>}
                colorFondo="#e8f0ff" colorIcono="#2f6fed"
                valor={datos.resumen.actual.total.toLocaleString('es-CO')} label="Solicitudes totales"
                delta={datos.resumen.deltaTotalPorcentaje}
              />
              <KpiCard
                icono={<svg viewBox="0 0 24 24" fill="none" strokeWidth="2"><path d="M5 12l4 4 10-10" /></svg>}
                colorFondo="#dcfce7" colorIcono="#0d9488"
                valor={datos.resumen.actual.finalizadas.toLocaleString('es-CO')} label="Finalizadas"
                delta={datos.resumen.deltaFinalizadasPorcentaje}
              />
              <KpiCard
                icono={<svg viewBox="0 0 24 24" fill="none" strokeWidth="1.8"><circle cx="12" cy="12" r="9" /><path d="M12 7v5l3 3" /></svg>}
                colorFondo="#fdf3e7" colorIcono="#d97706"
                valor={datos.resumen.actual.enTramite.toLocaleString('es-CO')} label="En trámite"
                delta={datos.resumen.deltaEnTramitePorcentaje}
              />
              <KpiCard
                icono={<svg viewBox="0 0 24 24" fill="none" strokeWidth="1.8"><circle cx="9" cy="8" r="3.2" /><path d="M3 20c0-3.3 2.7-5.5 6-5.5s6 2.2 6 5.5" /></svg>}
                colorFondo="#f3e8ff" colorIcono="#9333ea"
                valor={datos.resumen.actual.pendientes.toLocaleString('es-CO')} label="Pendientes"
                delta={datos.resumen.deltaPendientesPorcentaje}
              />
              <KpiCard
                icono={<svg viewBox="0 0 24 24" fill="none" strokeWidth="1.8"><path d="M3 12h4l2 6 4-14 2 8h6" /></svg>}
                colorFondo="#cffafe" colorIcono="#0891b2"
                valor={datos.resumen.actual.cumplimientoSlaPorcentaje != null ? `${datos.resumen.actual.cumplimientoSlaPorcentaje}%` : '—'}
                label="Cumplimiento SLA"
                delta={datos.resumen.deltaSlaPorcentaje}
              />
            </div>

            <div className="bg-white border border-line rounded-[14px] p-5">
              <h3 className="font-display text-[14px] font-semibold text-ink-900 mb-4">Proyecto vs. proyecto (actual vs. anterior)</h3>
              {datos.porProyecto.length === 0 ? (
                <p className="text-[12px] text-ink-400 py-4 text-center">Sin solicitudes en estos períodos.</p>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full border-collapse min-w-[720px]">
                    <thead>
                      <tr>
                        {['Proyecto', 'Total actual', 'Total anterior', 'Δ Total', 'SLA actual', 'SLA anterior', 'Δ SLA'].map((h) => (
                          <th key={h} className="text-left text-[10px] uppercase tracking-wide text-ink-400 font-bold px-2 py-2 border-b border-line">{h}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {datos.porProyecto.map((p) => {
                        const color = getColorProyecto(p.proyectoNombre);
                        return (
                          <tr key={p.proyectoId} className="hover:bg-paper">
                            <td className="px-2 py-2.5 border-b border-line">
                              <span className="inline-flex items-center gap-1.5 text-[11px] font-semibold">
                                <span className="w-[7px] h-[7px] rounded-full shrink-0" style={{ background: color.primario }} />
                                {p.proyectoNombre}
                              </span>
                            </td>
                            <td className="px-2 py-2.5 text-[12px] font-semibold text-ink-900 border-b border-line">{p.totalActual}</td>
                            <td className="px-2 py-2.5 text-[12px] text-ink-600 border-b border-line">{p.totalAnterior}</td>
                            <td className="px-2 py-2.5 border-b border-line"><DeltaTag delta={p.deltaTotalPorcentaje} /></td>
                            <td className="px-2 py-2.5 text-[12px] font-semibold text-ink-900 border-b border-line">
                              {p.slaActualPorcentaje != null ? `${p.slaActualPorcentaje}%` : '—'}
                            </td>
                            <td className="px-2 py-2.5 text-[12px] text-ink-600 border-b border-line">
                              {p.slaAnteriorPorcentaje != null ? `${p.slaAnteriorPorcentaje}%` : '—'}
                            </td>
                            <td className="px-2 py-2.5 border-b border-line"><DeltaTag delta={p.deltaSlaPorcentaje} /></td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </>
        )}
      </main>
    </div>
  );
}
