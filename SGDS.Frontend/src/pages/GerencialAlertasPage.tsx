import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Sidebar from '../components/layout/Sidebar';
import { getAlertasDetalladasGerencial, type AlertaDetalladaDto } from '../services/gerencialService';
import IntelligenceMark from '../components/gerencial/IntelligenceMark';

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

export default function GerencialAlertasPage() {
  const navigate = useNavigate();
  const [periodo, setPeriodo] = useState(30);
  const [alertas, setAlertas] = useState<AlertaDetalladaDto[] | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    getAlertasDetalladasGerencial(periodo).then((d) => setAlertas(d.alertas)).finally(() => setLoading(false));
  }, [periodo]);

  return (
    <div className="flex min-h-screen bg-paper">
      <Sidebar active="alertas-inteligentes" />

      <main className="flex-1 px-4 md:px-8 py-6 pt-16 md:pt-6 overflow-y-auto overflow-x-hidden">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-2">
          <div className="flex items-center gap-3">
            <IntelligenceMark />
            <div>
              <h1 className="font-display text-[22px] font-semibold text-ink-900">Alertas Inteligentes</h1>
              <p className="text-ink-600 text-[12.5px] mt-0.5">Todos los riesgos detectados por reglas, no solo los principales del resumen</p>
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
          Hoy se detectan por umbrales fijos (vencimientos próximos, incrementos relevantes, SLA bajo). Cuando se
          integre IA, se sumará la detección de desviaciones sin umbral fijo, sobre esta misma estructura.
        </p>

        {loading || !alertas ? (
          <div className="text-center text-sm text-ink-400 py-10">Cargando alertas...</div>
        ) : alertas.length === 0 ? (
          <div className="bg-white border border-line rounded-[14px] p-10 text-center text-[12px] text-ink-400">
            Sin alertas relevantes en este periodo.
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {alertas.map((a, idx) => (
              <div key={idx} className={`flex gap-3 p-4 rounded-[12px] border ${ALERTA_ESTILO[a.severidad]}`}>
                <svg viewBox="0 0 24 24" fill="none" strokeWidth="1.8" className={`w-5 h-5 shrink-0 mt-0.5 ${ALERTA_ICONO_COLOR[a.severidad]}`}>
                  <path d="M12 9v4M12 17h.01" /><path d="M10.3 3.9L2.5 17a2 2 0 001.7 3h15.6a2 2 0 001.7-3L13.7 3.9a2 2 0 00-3.4 0z" />
                </svg>
                <div className="flex-1 min-w-0">
                  <div className="text-[12.5px] leading-relaxed text-ink-900">{a.texto}</div>
                  <div className="flex items-center gap-2 mt-1.5">
                    <span className={`text-[11px] font-bold ${ALERTA_TAG_COLOR[a.severidad]}`}>{a.etiqueta}</span>
                    {a.enlaceRuta && (
                      <button onClick={() => navigate(a.enlaceRuta!)} className="text-[11px] font-bold text-ink-400 hover:text-ink-600">
                        · Ver detalle →
                      </button>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}
