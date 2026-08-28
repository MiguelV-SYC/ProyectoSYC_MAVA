import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Sidebar from '../components/layout/Sidebar';
import { getDashboardGerencial, type ResumenProyectoGerencialDto } from '../services/gerencialService';
import { getColorProyecto } from '../config/colorPorProyecto';

export default function GerencialProyectosPage() {
  const navigate = useNavigate();
  const [proyectos, setProyectos] = useState<ResumenProyectoGerencialDto[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getDashboardGerencial(30).then((d) => setProyectos(d.proyectos)).finally(() => setLoading(false));
  }, []);

  return (
    <div className="flex min-h-screen bg-paper">
      <Sidebar active="proyectos" />

      <main className="flex-1 px-4 md:px-8 py-6 pt-16 md:pt-6 overflow-y-auto overflow-x-hidden">
        <h1 className="font-display text-[19px] font-semibold text-ink-900 mb-1">Proyectos</h1>
        <p className="text-ink-600 text-[12.5px] mb-6">
          Vista de solo lectura de los {proyectos.length} proyectos activos — últimos 30 días.
        </p>

        {loading ? (
          <div className="text-center text-sm text-ink-400 py-10">Cargando proyectos...</div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3.5">
            {proyectos.map((p) => {
              const color = getColorProyecto(p.proyectoNombre);
              return (
                <button
                  key={p.proyectoId}
                  onClick={() => navigate(`/solicitudes?proyectoId=${p.proyectoId}`)}
                  className="bg-white border border-line rounded-[14px] p-5 text-left hover:border-[var(--color-accento)] transition-colors"
                  style={{ '--color-accento': color.primario } as React.CSSProperties}
                >
                  <div className="flex items-center gap-3 mb-3.5">
                    <div className="w-[42px] h-[42px] rounded-xl flex items-center justify-center shrink-0" style={{ background: color.primarioClaro }}>
                      <svg viewBox="0 0 24 24" fill="none" strokeWidth="1.8" className="w-[19px] h-[19px]" style={{ stroke: color.primario }}>
                        <rect x="3" y="4" width="18" height="16" rx="2" /><path d="M3 9h18" />
                      </svg>
                    </div>
                    <div>
                      <div className="font-display text-[14.5px] font-semibold text-ink-900">{p.proyectoNombre}</div>
                      <div className="text-[11px] text-ink-400 font-mono">{p.proyectoCodigo}</div>
                    </div>
                  </div>
                  <div className="flex gap-5 pt-3 border-t border-line">
                    <div>
                      <div className="font-display text-[16px] font-bold text-ink-900">{p.totalSolicitudes}</div>
                      <div className="text-[10px] text-ink-400">Solicitudes</div>
                    </div>
                    <div>
                      <div className="font-display text-[16px] font-bold text-ink-900">{p.enTramite}</div>
                      <div className="text-[10px] text-ink-400">En trámite</div>
                    </div>
                    <div>
                      <div className="font-display text-[16px] font-bold text-ink-900">
                        {p.cumplimientoSlaPorcentaje != null ? `${p.cumplimientoSlaPorcentaje}%` : '—'}
                      </div>
                      <div className="text-[10px] text-ink-400">SLA</div>
                    </div>
                  </div>
                </button>
              );
            })}
          </div>
        )}
      </main>
    </div>
  );
}
