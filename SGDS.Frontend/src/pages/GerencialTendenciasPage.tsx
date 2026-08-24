import { useState, useEffect } from 'react';
import Sidebar from '../components/layout/Sidebar';
import { getTendenciasGerencial, type TendenciasGerencialResponseDto, type Granularidad } from '../services/gerencialService';
import GraficoLinea from '../components/gerencial/GraficoLinea';

const OPCIONES_PERIODO = [
  { valor: 30, label: 'Últimos 30 días' },
  { valor: 90, label: 'Últimos 90 días' },
  { valor: 180, label: 'Últimos 180 días' },
  { valor: 365, label: 'Últimos 365 días' },
];

const OPCIONES_GRANULARIDAD: { valor: Granularidad; label: string }[] = [
  { valor: 'dia', label: 'Por día' },
  { valor: 'semana', label: 'Por semana' },
  { valor: 'mes', label: 'Por mes' },
];

function formatearFecha(iso: string, granularidad: Granularidad) {
  const f = new Date(iso);
  if (granularidad === 'mes') return f.toLocaleDateString('es-CO', { month: 'short', year: '2-digit' });
  return f.toLocaleDateString('es-CO', { day: '2-digit', month: 'short' });
}

export default function GerencialTendenciasPage() {
  const [periodo, setPeriodo] = useState(90);
  const [granularidad, setGranularidad] = useState<Granularidad>('semana');
  const [datos, setDatos] = useState<TendenciasGerencialResponseDto | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    getTendenciasGerencial(periodo, granularidad).then(setDatos).finally(() => setLoading(false));
  }, [periodo, granularidad]);

  return (
    <div className="flex min-h-screen bg-paper">
      <Sidebar active="tendencias" />

      <main className="flex-1 px-8 py-6 overflow-y-auto">
        <div className="flex items-center justify-between mb-5">
          <div>
            <h1 className="font-display text-[22px] font-semibold text-ink-900">Tendencias</h1>
            <p className="text-ink-600 text-[12.5px] mt-0.5">Comportamiento del sistema en el tiempo — misma métrica, muchos períodos</p>
          </div>
          <div className="flex gap-2.5">
            <select
              value={granularidad}
              onChange={(e) => setGranularidad(e.target.value as Granularidad)}
              className="bg-white border border-line rounded-[10px] px-3.5 py-2.5 text-xs font-semibold text-ink-600 outline-none"
            >
              {OPCIONES_GRANULARIDAD.map((o) => <option key={o.valor} value={o.valor}>{o.label}</option>)}
            </select>
            <select
              value={periodo}
              onChange={(e) => setPeriodo(Number(e.target.value))}
              className="bg-white border border-line rounded-[10px] px-3.5 py-2.5 text-xs font-semibold text-ink-600 outline-none"
            >
              {OPCIONES_PERIODO.map((o) => <option key={o.valor} value={o.valor}>{o.label}</option>)}
            </select>
          </div>
        </div>

        {loading || !datos ? (
          <div className="text-center text-sm text-ink-400 py-10">Cargando tendencias...</div>
        ) : datos.puntos.length === 0 ? (
          <div className="bg-white border border-line rounded-[14px] p-10 text-center text-[12px] text-ink-400">
            Sin solicitudes en este periodo.
          </div>
        ) : (
          <>
            <div className="bg-white border border-line rounded-[14px] p-5 mb-4">
              <div className="flex items-center justify-between mb-3">
                <h3 className="font-display text-[14px] font-semibold text-ink-900">Radicadas, finalizadas y en trámite</h3>
                <span className="text-[11px] text-ink-400">
                  {new Date(datos.desde).toLocaleDateString('es-CO')} — {new Date(datos.hasta).toLocaleDateString('es-CO')}
                </span>
              </div>
              <div className="flex gap-4 mb-3">
                <span className="flex items-center gap-1.5 text-[11px] font-semibold text-ink-600"><span className="w-2 h-2 rounded-full bg-blue-600" />Radicadas</span>
                <span className="flex items-center gap-1.5 text-[11px] font-semibold text-ink-600"><span className="w-2 h-2 rounded-full bg-[#0d9488]" />Finalizadas</span>
                <span className="flex items-center gap-1.5 text-[11px] font-semibold text-ink-600"><span className="w-2 h-2 rounded-full bg-[#d97706]" />En trámite</span>
              </div>
              <GraficoLinea alturaPx={240} series={[
                { color: '#2f6fed', valores: datos.puntos.map((p) => p.radicadas) },
                { color: '#0d9488', valores: datos.puntos.map((p) => p.finalizadas) },
                { color: '#d97706', valores: datos.puntos.map((p) => p.enTramite) },
              ]} />
              <div className="flex justify-between mt-2 text-[10px] text-ink-400">
                <span>{formatearFecha(datos.puntos[0].fecha, datos.granularidad)}</span>
                <span>{formatearFecha(datos.puntos[datos.puntos.length - 1].fecha, datos.granularidad)}</span>
              </div>
            </div>

            <div className="bg-white border border-line rounded-[14px] p-5">
              <h3 className="font-display text-[14px] font-semibold text-ink-900 mb-3">Cumplimiento de SLA en el tiempo</h3>
              <div className="flex gap-4 mb-3">
                <span className="flex items-center gap-1.5 text-[11px] font-semibold text-ink-600"><span className="w-2 h-2 rounded-full bg-[#0891b2]" />Cumplimiento SLA</span>
              </div>
              <GraficoLinea alturaPx={140} series={[
                { color: '#0891b2', valores: datos.puntos.map((p) => p.cumplimientoSlaPorcentaje) },
              ]} />
              <div className="flex justify-between mt-2 text-[10px] text-ink-400">
                <span>{formatearFecha(datos.puntos[0].fecha, datos.granularidad)}</span>
                <span>{formatearFecha(datos.puntos[datos.puntos.length - 1].fecha, datos.granularidad)}</span>
              </div>
            </div>
          </>
        )}
      </main>
    </div>
  );
}
