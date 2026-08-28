import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import Sidebar from '../components/layout/Sidebar';
import { getSede, type SedeResponseDto } from '../services/libroTotalService';
import { getProyectosActivos } from '../services/proyectoService';
import { getColorProyecto } from '../config/colorPorProyecto';
import GaleriaCultural from '../components/librototal/GaleriaCultural';

export default function SedeDetallePage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  const [sede, setSede] = useState<SedeResponseDto | null>(null);
  const [proyectoId, setProyectoId] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!id) return;
    setLoading(true);
    Promise.all([
      getSede(Number(id)),
      getProyectosActivos().then((lista) => lista.find((p) => p.nombre === 'Libro Total')?.id ?? null),
    ])
      .then(([s, pid]) => { setSede(s); setProyectoId(pid); })
      .finally(() => setLoading(false));
  }, [id]);

  const color = getColorProyecto('Libro Total');
  const colorStyle = { '--color-accento': color.primario, '--color-accento-claro': color.primarioClaro, '--color-accento-oscuro': color.primarioOscuro } as React.CSSProperties;

  return (
    <div className="flex min-h-screen bg-paper" style={colorStyle}>
      <Sidebar active="solicitudes" />

      <main className="flex-1 px-4 md:px-[38px] py-7 pt-16 md:pt-7 overflow-y-auto">
        <div className="flex items-center gap-1.5 text-xs text-ink-400 mb-3.5">
          <button onClick={() => navigate('/librototal/sedes')} className="hover:underline">Sedes</button>
          <span>/</span>
          <span className="text-ink-900 font-semibold">{sede?.nombre ?? '...'}</span>
        </div>

        {loading || !sede ? (
          <div className="text-center text-sm text-ink-400 py-10">Cargando sede...</div>
        ) : (
          <div className="flex flex-col lg:flex-row items-start gap-5">
            <div className="flex flex-col gap-5 max-w-[640px] w-full">
              <div className="relative bg-gradient-to-r from-[var(--color-accento)] to-[var(--color-accento-oscuro)] rounded-2xl p-7 overflow-hidden">
                <div className="flex items-center gap-4 relative z-10">
                  <div className="w-[54px] h-[54px] rounded-2xl bg-white/15 flex items-center justify-center shrink-0">
                    <svg viewBox="0 0 24 24" fill="none" strokeWidth="1.8" className="w-6 h-6 stroke-white">
                      <path d="M4 19.5A2.5 2.5 0 016.5 17H20" /><path d="M6.5 2H20v20H6.5A2.5 2.5 0 014 19.5v-15A2.5 2.5 0 016.5 2z" /><path d="M9 7h7M9 11h7" />
                    </svg>
                  </div>
                  <div>
                    <h1 className="font-display text-[22px] font-bold text-white">{sede.nombre}</h1>
                    <p className="text-white/85 text-[13px] mt-0.5">{sede.esPrincipal ? `Sede principal · ${sede.ciudad}` : sede.ciudad}</p>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                <div className="bg-white border border-line rounded-xl p-5">
                  <div className="text-[12px] text-ink-600 mb-1.5">Atenciones este mes</div>
                  <div className="font-display text-2xl font-bold text-ink-900">{sede.atencionesMes}</div>
                </div>
                <div className="bg-white border border-line rounded-xl p-5">
                  <div className="text-[12px] text-ink-600 mb-1.5">Espera promedio</div>
                  <div className="font-display text-2xl font-bold text-ink-900">
                    {sede.esperaPromedioMinutos != null ? `${sede.esperaPromedioMinutos} min` : 'Sin datos'}
                  </div>
                </div>
              </div>

              <div className="bg-white border border-line rounded-[14px] p-5 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                <div>
                  <div className="font-display text-[14px] font-semibold text-ink-900">Tablero de turnos</div>
                  <p className="text-[12px] text-ink-600 mt-0.5">Fila de atención de hoy en {sede.nombre}.</p>
                </div>
                <button
                  disabled={!proyectoId}
                  onClick={() => navigate(`/workflow?proyectoId=${proyectoId}&sedeId=${sede.id}`)}
                  className="flex items-center gap-1.5 bg-[var(--color-accento)] text-white rounded-[9px] px-4 py-2.5 text-[13px] font-semibold disabled:opacity-60 shrink-0 self-start"
                >
                  Ver turnos de esta sede
                  <svg viewBox="0 0 24 24" fill="none" strokeWidth="2" className="w-3.5 h-3.5 stroke-white">
                    <path d="M5 12h14M13 6l6 6-6 6" />
                  </svg>
                </button>
              </div>
            </div>

            <div className="flex-1 flex justify-center">
              <GaleriaCultural sedeNombre={sede.nombre} />
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
