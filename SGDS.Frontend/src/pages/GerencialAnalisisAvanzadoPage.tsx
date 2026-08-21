import { useState } from 'react';
import Sidebar from '../components/layout/Sidebar';

const TABS = ['Panorama general', 'Solicitudes por proyecto', 'Análisis de SLA', 'Comparativo histórico'];

export default function GerencialAnalisisAvanzadoPage() {
  const [tab, setTab] = useState(0);

  return (
    <div className="flex min-h-screen bg-paper">
      <Sidebar active="analisis-avanzado" />

      <main className="flex-1 px-8 py-6 overflow-y-auto">
        <div className="flex items-center justify-between mb-5">
          <div>
            <h1 className="font-display text-[19px] font-semibold text-ink-900 flex items-center gap-2.5">
              Análisis Avanzado
              <span className="inline-flex items-center gap-1.5 bg-[#fef9e7] text-[#8a6d00] text-[11px] font-bold px-2.5 py-1 rounded-md">
                Power BI Embedded
              </span>
            </h1>
            <p className="text-ink-600 text-[12.5px] mt-0.5">Reportes interactivos con drill-down, filtros cruzados y exportación nativa</p>
          </div>
        </div>

        <div className="flex bg-white border border-line rounded-[10px] p-1 mb-4 w-fit">
          {TABS.map((t, i) => (
            <button
              key={t}
              onClick={() => setTab(i)}
              className={`px-4 py-2 rounded-[7px] text-[12px] font-semibold ${tab === i ? 'bg-[#0f172a] text-white' : 'text-ink-600'}`}
            >
              {t}
            </button>
          ))}
        </div>

        <div className="flex items-center gap-2.5 bg-white border border-line rounded-xl px-4 py-3 mb-4 flex-wrap">
          <span className="flex items-center gap-1.5 bg-paper border border-line rounded-lg px-3 py-1.5 text-[11.5px] font-semibold text-ink-600">
            <svg viewBox="0 0 24 24" fill="none" strokeWidth="2" className="w-3 h-3 stroke-ink-400"><rect x="3" y="4" width="18" height="16" rx="2" /><path d="M3 9h18" /></svg>
            Todos los proyectos
          </span>
          <span className="flex items-center gap-1.5 bg-paper border border-line rounded-lg px-3 py-1.5 text-[11.5px] font-semibold text-ink-600">
            Últimos 30 días
          </span>
          <span className="flex items-center gap-1.5 bg-paper border border-line rounded-lg px-3 py-1.5 text-[11.5px] font-semibold text-ink-600">
            Estado: Todos
          </span>
          <span className="ml-auto flex items-center gap-1.5 text-[11px] text-ink-400">
            <svg viewBox="0 0 24 24" fill="none" strokeWidth="1.8" className="w-3.5 h-3.5 stroke-blue-600"><path d="M21 12a9 9 0 11-2.6-6.4" /><path d="M21 3v6h-6" /></svg>
            Sincronizado con SGDS
          </span>
        </div>

        <div className="bg-white border border-line rounded-2xl overflow-hidden shadow-[0_8px_24px_-12px_rgba(15,26,46,0.12)]">
          <div className="flex items-center gap-2.5 px-4.5 py-3 border-b border-line bg-[#faf9f5]">
            <svg viewBox="0 0 24 24" fill="none" width="20" height="20" className="shrink-0">
              <rect x="3" y="3" width="7" height="7" rx="1" fill="#f2c811" /><rect x="14" y="3" width="7" height="7" rx="1" fill="#f2c811" />
              <rect x="3" y="14" width="7" height="7" rx="1" fill="#f2c811" /><rect x="14" y="14" width="7" height="7" rx="1" fill="#f2c811" />
            </svg>
            <span className="text-[12.5px] font-bold text-ink-900">Power BI</span>
            <span className="w-px h-3.5 bg-line" />
            <span className="text-[12px] text-ink-600">SGDS — {TABS[tab]}.pbix</span>
          </div>
          <div className="min-h-[420px] flex flex-col items-center justify-center gap-3.5 p-10 bg-paper">
            <div className="w-16 h-16 rounded-2xl bg-[#fef9e7] flex items-center justify-center">
              <svg viewBox="0 0 24 24" fill="none" width="30" height="30">
                <rect x="3" y="3" width="7" height="7" rx="1" fill="#f2c811" /><rect x="14" y="3" width="7" height="7" rx="1" fill="#f2c811" />
                <rect x="3" y="14" width="7" height="7" rx="1" fill="#f2c811" /><rect x="14" y="14" width="7" height="7" rx="1" fill="#f2c811" />
              </svg>
            </div>
            <div className="font-display text-[15px] font-semibold text-ink-900">Reporte embebido de Power BI</div>
            <p className="text-[12.5px] text-ink-600 text-center max-w-[380px] leading-relaxed">
              Este panel renderiza el iframe real de Power BI Embedded (SDK <code>powerbi-client</code>) una vez configurado
              el registro de app en Azure AD y el token de embed. Los filtros de la barra superior se sincronizarán
              automáticamente con el contexto de SGDS (proyecto, rango de fechas, estado).
            </p>
          </div>
        </div>

        <div className="flex gap-2.5 bg-blue-100 border border-[#c7dbfd] rounded-xl px-4 py-3 mt-4 max-w-[820px]">
          <svg viewBox="0 0 24 24" fill="none" strokeWidth="1.8" className="w-4 h-4 stroke-blue-600 shrink-0 mt-0.5">
            <circle cx="12" cy="12" r="9" /><path d="M12 8v5M12 16h.01" />
          </svg>
          <p className="text-[12px] text-ink-900 leading-relaxed">
            Requiere licencia Power BI Embedded (Pro/Premium/Embedded SKU) y registro de aplicación en Azure AD. El
            mecanismo de actualización de datos (DirectQuery vs. Import programado) debe definirse con el equipo antes
            de producción — impacta costo y necesidad de gateway con PostgreSQL on-prem.
          </p>
        </div>
      </main>
    </div>
  );
}
