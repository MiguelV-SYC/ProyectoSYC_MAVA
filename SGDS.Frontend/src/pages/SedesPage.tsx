import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Sidebar from '../components/layout/Sidebar';
import { getSedes, type SedeResponseDto } from '../services/libroTotalService';
import { getColorProyecto } from '../config/colorPorProyecto';

export default function SedesPage() {
  const navigate = useNavigate();
  const [sedes, setSedes] = useState<SedeResponseDto[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getSedes().then(setSedes).finally(() => setLoading(false));
  }, []);

  const color = getColorProyecto('Libro Total');

  return (
    <div
      className="flex min-h-screen bg-paper"
      style={{ '--color-accento': color.primario, '--color-accento-claro': color.primarioClaro } as React.CSSProperties}
    >
      <Sidebar active="solicitudes" />

      <main className="flex-1 px-[38px] py-7 overflow-y-auto">
        <div className="flex items-center gap-1.5 text-xs text-ink-400 mb-3.5">
          <button onClick={() => navigate(-1)} className="hover:underline">Libro Total</button>
          <span>/</span>
          <span className="text-ink-900 font-semibold">Sedes</span>
        </div>

        <h1 className="font-display text-[19px] font-semibold text-ink-900 mb-1">Sedes — Libro Total</h1>
        <p className="text-ink-600 text-[12.5px] mb-6">
          {sedes.length} sedes activas a nivel nacional, modelo de atención integrada con espacio cultural.
        </p>

        {loading ? (
          <div className="text-center text-sm text-ink-400 py-10">Cargando sedes...</div>
        ) : (
          <div className="grid grid-cols-3 gap-3.5">
            {sedes.map((s) => (
              <button
                key={s.id}
                onClick={() => navigate(`/librototal/sedes/${s.id}`)}
                className="bg-white border border-line rounded-[14px] p-5 text-left hover:border-[var(--color-accento)] transition-colors"
              >
                <div className="flex items-center gap-3 mb-3.5">
                  <div className="w-[42px] h-[42px] rounded-xl bg-[var(--color-accento-claro)] flex items-center justify-center shrink-0">
                    <svg viewBox="0 0 24 24" fill="none" strokeWidth="1.8" className="w-[19px] h-[19px] stroke-[var(--color-accento)]">
                      <path d="M4 19.5A2.5 2.5 0 016.5 17H20" /><path d="M6.5 2H20v20H6.5A2.5 2.5 0 014 19.5v-15A2.5 2.5 0 016.5 2z" />
                    </svg>
                  </div>
                  <div>
                    <div className="font-display text-[14.5px] font-semibold text-ink-900">{s.nombre}</div>
                    <div className="text-[11.5px] text-ink-600">{s.esPrincipal ? `Sede principal · ${s.ciudad}` : s.ciudad}</div>
                  </div>
                </div>
                <div className="flex gap-4 pt-3 border-t border-line">
                  <div>
                    <div className="font-display text-[16px] font-bold text-ink-900">{s.atencionesMes}</div>
                    <div className="text-[10px] text-ink-400">Atenciones/mes</div>
                  </div>
                  <div>
                    <div className="font-display text-[16px] font-bold text-ink-900">
                      {s.esperaPromedioMinutos != null ? `${s.esperaPromedioMinutos} min` : '—'}
                    </div>
                    <div className="text-[10px] text-ink-400">Espera prom.</div>
                  </div>
                </div>
              </button>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}
