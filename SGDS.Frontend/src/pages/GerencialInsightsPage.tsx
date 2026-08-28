import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Sidebar from '../components/layout/Sidebar';
import { getInsightsGerencial, type InsightGerencialDto } from '../services/gerencialService';
import IntelligenceMark from '../components/gerencial/IntelligenceMark';

const OPCIONES_PERIODO = [
  { valor: 7, label: 'Últimos 7 días' },
  { valor: 30, label: 'Últimos 30 días' },
  { valor: 90, label: 'Últimos 90 días' },
];

const CATEGORIA_ESTILO: Record<string, { fondo: string; icono: string; label: string }> = {
  volumen: { fondo: '#e8f0ff', icono: '#2f6fed', label: 'Volumen' },
  sla: { fondo: '#cffafe', icono: '#0891b2', label: 'SLA' },
  tiempo: { fondo: '#fdf3e7', icono: '#d97706', label: 'Tiempo de respuesta' },
  calidad: { fondo: '#f3e8ff', icono: '#9333ea', label: 'Calidad' },
};

const CATEGORIA_ICONO: Record<string, React.ReactNode> = {
  volumen: <svg viewBox="0 0 24 24" fill="none" strokeWidth="1.8"><path d="M4 19V9M12 19V5M20 19v-7" /></svg>,
  sla: <svg viewBox="0 0 24 24" fill="none" strokeWidth="1.8"><path d="M3 12h4l2 6 4-14 2 8h6" /></svg>,
  tiempo: <svg viewBox="0 0 24 24" fill="none" strokeWidth="1.8"><circle cx="12" cy="12" r="9" /><path d="M12 7v5l3 3" /></svg>,
  calidad: <svg viewBox="0 0 24 24" fill="none" strokeWidth="1.8"><path d="M5 12l4 4 10-10" /></svg>,
};

export default function GerencialInsightsPage() {
  const navigate = useNavigate();
  const [periodo, setPeriodo] = useState(30);
  const [insights, setInsights] = useState<InsightGerencialDto[] | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    getInsightsGerencial(periodo).then((d) => setInsights(d.insights)).finally(() => setLoading(false));
  }, [periodo]);

  return (
    <div className="flex min-h-screen bg-paper">
      <Sidebar active="insights" />

      <main className="flex-1 px-4 md:px-8 py-6 pt-16 md:pt-6 overflow-y-auto overflow-x-hidden">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-2">
          <div className="flex items-center gap-3">
            <IntelligenceMark />
            <div>
              <h1 className="font-display text-[22px] font-semibold text-ink-900">Insights</h1>
              <p className="text-ink-600 text-[12.5px] mt-0.5">Observaciones automáticas sobre el comportamiento del sistema</p>
            </div>
          </div>
          <select
            value={periodo}
            onChange={(e) => setPeriodo(Number(e.target.value))}
            className="bg-white border border-line rounded-[10px] px-3.5 py-2.5 text-xs font-semibold text-ink-600 outline-none"
          >
            {OPCIONES_PERIODO.map((o) => <option key={o.valor} value={o.valor}>{o.label}</option>)}
          </select>
        </div>

        <p className="text-[11px] text-ink-400 mb-5">
          Hoy se generan por reglas a partir de los datos ya calculados — cuando se integre el asistente de IA, la
          redacción pasará a generarse por el modelo sin cambiar esta vista.
        </p>

        {loading || !insights ? (
          <div className="text-center text-sm text-ink-400 py-10">Cargando insights...</div>
        ) : insights.length === 0 ? (
          <div className="bg-white border border-line rounded-[14px] p-10 text-center text-[12px] text-ink-400">
            Sin datos suficientes para generar insights en este periodo.
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
            {insights.map((insight, idx) => {
              const estilo = CATEGORIA_ESTILO[insight.categoria] ?? CATEGORIA_ESTILO.volumen;
              return (
                <div key={idx} className="bg-white border border-line rounded-[14px] p-4.5 flex gap-3.5">
                  <div
                    className="w-9 h-9 rounded-[10px] flex items-center justify-center shrink-0 [&_svg]:w-4 [&_svg]:h-4 [&_svg]:stroke-current"
                    style={{ background: estilo.fondo, color: estilo.icono }}
                  >
                    {CATEGORIA_ICONO[insight.categoria] ?? CATEGORIA_ICONO.volumen}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-[10px] font-bold uppercase tracking-wide text-ink-400">{estilo.label}</span>
                      <span className={`text-[9px] font-bold uppercase tracking-wide px-2 py-0.5 rounded-full ${
                        insight.esGeneradoPorIa ? 'bg-[#ede9fe] text-[#6d28d9]' : 'bg-paper text-ink-400 border border-line'
                      }`}>
                        {insight.esGeneradoPorIa ? 'Generado por IA' : 'Generado por reglas'}
                      </span>
                    </div>
                    <div className="font-display text-[13.5px] font-semibold text-ink-900 mb-1">{insight.titulo}</div>
                    <p className="text-[12px] text-ink-600 leading-relaxed">{insight.texto}</p>
                    {insight.enlaceRuta && (
                      <button
                        onClick={() => navigate(insight.enlaceRuta!)}
                        className="mt-2 text-[11px] font-bold text-blue-600 hover:underline"
                      >
                        Ver detalle →
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </main>
    </div>
  );
}
