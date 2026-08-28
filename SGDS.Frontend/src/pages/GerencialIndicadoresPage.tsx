import { useState, useEffect, useMemo } from 'react';
import Sidebar from '../components/layout/Sidebar';
import { getIndicadoresGerencial, type IndicadorPorTipoDto } from '../services/gerencialService';
import { getColorProyecto } from '../config/colorPorProyecto';
import KpiCard from '../components/gerencial/KpiCard';

const OPCIONES_PERIODO = [
  { valor: 7, label: 'Últimos 7 días' },
  { valor: 30, label: 'Últimos 30 días' },
  { valor: 90, label: 'Últimos 90 días' },
];

function colorPorcentaje(valor?: number, invertido = false) {
  if (valor == null) return 'text-ink-400';
  const bueno = invertido ? valor <= 15 : valor >= 85;
  const regular = invertido ? valor <= 35 : valor >= 60;
  if (bueno) return 'text-[#0d9488] font-bold';
  if (regular) return 'text-[#d97706] font-bold';
  return 'text-[#dc2626] font-bold';
}

function promedio(valores: number[]): number | null {
  if (valores.length === 0) return null;
  return Math.round((valores.reduce((a, b) => a + b, 0) / valores.length) * 10) / 10;
}

export default function GerencialIndicadoresPage() {
  const [periodo, setPeriodo] = useState(30);
  const [indicadores, setIndicadores] = useState<IndicadorPorTipoDto[] | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    getIndicadoresGerencial(periodo).then((d) => setIndicadores(d.indicadores)).finally(() => setLoading(false));
  }, [periodo]);

  const resumen = useMemo(() => {
    if (!indicadores) return null;
    const totalTramites = indicadores.reduce((sum, i) => sum + i.total, 0);
    const slaProm = promedio(indicadores.filter((i) => i.cumplimientoSlaPorcentaje != null).map((i) => i.cumplimientoSlaPorcentaje!));
    const tiempoProm = promedio(indicadores.filter((i) => i.tiempoRespuestaPromedioDias != null).map((i) => i.tiempoRespuestaPromedioDias!));
    const reqInfoProm = promedio(indicadores.map((i) => i.porcentajeRequiereInformacion ?? 0));
    return { totalTramites, tiposCount: indicadores.length, slaProm, tiempoProm, reqInfoProm };
  }, [indicadores]);

  return (
    <div className="flex min-h-screen bg-paper">
      <Sidebar active="indicadores" />

      <main className="flex-1 px-4 md:px-8 py-6 pt-16 md:pt-6 overflow-y-auto overflow-x-hidden">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-5">
          <div>
            <h1 className="font-display text-[22px] font-semibold text-ink-900">Indicadores</h1>
            <p className="text-ink-600 text-[12.5px] mt-0.5">Catálogo de métricas operativas por proyecto y tipo de trámite</p>
          </div>
          <select
            value={periodo}
            onChange={(e) => setPeriodo(Number(e.target.value))}
            className="bg-white border border-line rounded-[10px] px-3.5 py-2.5 text-xs font-semibold text-ink-600 outline-none"
          >
            {OPCIONES_PERIODO.map((o) => <option key={o.valor} value={o.valor}>{o.label}</option>)}
          </select>
        </div>

        {loading || !indicadores || !resumen ? (
          <div className="text-center text-sm text-ink-400 py-10">Cargando indicadores...</div>
        ) : (
          <>
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-5">
              <KpiCard
                icono={<svg viewBox="0 0 24 24" fill="none" strokeWidth="1.8"><path d="M6 3h9l5 5v13H6z" /><path d="M14 3v5h5" /></svg>}
                colorFondo="#e8f0ff" colorIcono="#2f6fed"
                valor={resumen.totalTramites.toLocaleString('es-CO')} label={`Trámites en ${resumen.tiposCount} categorías`}
              />
              <KpiCard
                icono={<svg viewBox="0 0 24 24" fill="none" strokeWidth="1.8"><path d="M3 12h4l2 6 4-14 2 8h6" /></svg>}
                colorFondo="#cffafe" colorIcono="#0891b2"
                valor={resumen.slaProm != null ? `${resumen.slaProm}%` : '—'} label="SLA promedio (todas las categorías)"
              />
              <KpiCard
                icono={<svg viewBox="0 0 24 24" fill="none" strokeWidth="1.8"><circle cx="12" cy="12" r="9" /><path d="M12 7v5l3 3" /></svg>}
                colorFondo="#fdf3e7" colorIcono="#d97706"
                valor={resumen.tiempoProm != null ? `${resumen.tiempoProm} días` : '—'} label="Tiempo de respuesta promedio"
              />
              <KpiCard
                icono={<svg viewBox="0 0 24 24" fill="none" strokeWidth="1.8"><path d="M12 9v4M12 17h.01" /><path d="M10.3 3.9L2.5 17a2 2 0 001.7 3h15.6a2 2 0 001.7-3L13.7 3.9a2 2 0 00-3.4 0z" /></svg>}
                colorFondo="#f3e8ff" colorIcono="#9333ea"
                valor={resumen.reqInfoProm != null ? `${resumen.reqInfoProm}%` : '—'} label="Pasan por “Requiere información”"
              />
            </div>

            <div className="bg-white border border-line rounded-[14px] p-5">
              <h3 className="font-display text-[14px] font-semibold text-ink-900 mb-4">Detalle por proyecto y tipo de trámite</h3>
              {indicadores.length === 0 ? (
                <p className="text-[12px] text-ink-400 py-4 text-center">Sin solicitudes en este periodo.</p>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full border-collapse min-w-[860px]">
                    <thead>
                      <tr>
                        {['Proyecto', 'Tipo de trámite', 'Total', 'Finalizadas', 'SLA', 'T. respuesta', 'Aprobación', 'Rechazo', 'Req. información'].map((h) => (
                          <th key={h} className="text-left text-[10px] uppercase tracking-wide text-ink-400 font-bold px-2 py-2 border-b border-line">{h}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {indicadores.map((i, idx) => {
                        const color = getColorProyecto(i.proyectoNombre);
                        return (
                          <tr key={idx} className="hover:bg-paper">
                            <td className="px-2 py-2.5 border-b border-line">
                              <span className="inline-flex items-center gap-1.5 text-[11px] font-semibold">
                                <span className="w-[7px] h-[7px] rounded-full shrink-0" style={{ background: color.primario }} />
                                {i.proyectoNombre}
                              </span>
                            </td>
                            <td className="px-2 py-2.5 text-[12px] text-ink-900 border-b border-line">{i.tipoSolicitudNombre}</td>
                            <td className="px-2 py-2.5 text-[12px] font-semibold text-ink-900 border-b border-line">{i.total}</td>
                            <td className="px-2 py-2.5 text-[12px] text-ink-600 border-b border-line">{i.finalizadas}</td>
                            <td className={`px-2 py-2.5 text-[12px] border-b border-line ${colorPorcentaje(i.cumplimientoSlaPorcentaje)}`}>
                              {i.cumplimientoSlaPorcentaje != null ? `${i.cumplimientoSlaPorcentaje}%` : '—'}
                            </td>
                            <td className="px-2 py-2.5 text-[12px] text-ink-600 border-b border-line">
                              {i.tiempoRespuestaPromedioDias != null ? `${i.tiempoRespuestaPromedioDias} días` : '—'}
                            </td>
                            <td className={`px-2 py-2.5 text-[12px] border-b border-line ${colorPorcentaje(i.tasaAprobacionPorcentaje)}`}>
                              {i.tasaAprobacionPorcentaje != null ? `${i.tasaAprobacionPorcentaje}%` : '—'}
                            </td>
                            <td className={`px-2 py-2.5 text-[12px] border-b border-line ${colorPorcentaje(i.tasaRechazoPorcentaje, true)}`}>
                              {i.tasaRechazoPorcentaje != null ? `${i.tasaRechazoPorcentaje}%` : '—'}
                            </td>
                            <td className={`px-2 py-2.5 text-[12px] border-b border-line ${colorPorcentaje(i.porcentajeRequiereInformacion, true)}`}>
                              {i.porcentajeRequiereInformacion ?? 0}%
                            </td>
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
