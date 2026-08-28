import type { ProyectoResponseDto } from '../../services/proyectoService';

const ICONOS: Record<string, React.ReactNode> = {
  Comfenalco: <svg viewBox="0 0 24 24" fill="none" strokeWidth="1.8"><path d="M3 11l9-8 9 8" /><path d="M5 10v10h14V10" /><path d="M9 21v-6h6v6" /></svg>,
  Colpensiones: <svg viewBox="0 0 24 24" fill="none" strokeWidth="1.8"><path d="M12 2l8 4v6c0 5-3.5 8.5-8 10-4.5-1.5-8-5-8-10V6l8-4z" /><path d="M9 12l2 2 4-4" /></svg>,
  'Pasivos Laborales': <svg viewBox="0 0 24 24" fill="none" strokeWidth="1.8"><path d="M4 21V8l8-5 8 5v13" /><path d="M9 21v-6h6v6" /><path d="M9 12h6" /></svg>,
  SYCTrace: <svg viewBox="0 0 24 24" fill="none" strokeWidth="1.8"><rect x="4" y="9" width="16" height="10" rx="1.5" /><path d="M8 9V6a4 4 0 018 0v3" /><circle cx="12" cy="14" r="1.5" /></svg>,
  Infoconsumo: <svg viewBox="0 0 24 24" fill="none" strokeWidth="1.8"><rect x="3" y="6" width="14" height="10" rx="1.5" /><path d="M17 9l4-2v10l-4-2" /></svg>,
  Gotrace: (
    <svg viewBox="0 0 24 24" fill="none" strokeWidth="1.8" strokeDasharray="3 3">
      <path d="M4 18c4-8 12-8 16 0" />
      <circle cx="4" cy="18" r="1.6" strokeDasharray="0" />
      <circle cx="20" cy="18" r="1.6" strokeDasharray="0" />
    </svg>
  ),
  Estampillas: <svg viewBox="0 0 24 24" fill="none" strokeWidth="1.8"><rect x="5" y="4" width="14" height="16" rx="2" /><circle cx="12" cy="12" r="3.2" /></svg>,
  IUVA: <svg viewBox="0 0 24 24" fill="none" strokeWidth="1.8"><rect x="3" y="10" width="14" height="7" rx="1.5" /><path d="M6 10l1.5-4h6L15 10" /><circle cx="6.5" cy="17.5" r="1.6" /><circle cx="14.5" cy="17.5" r="1.6" /></svg>,
  'Libro Total': <svg viewBox="0 0 24 24" fill="none" strokeWidth="1.8"><path d="M4 7l8-4 8 4-8 4-8-4z" /><path d="M4 12l8 4 8-4M4 17l8 4 8-4" /></svg>,
};

const ICONO_DEFAULT = (
  <svg viewBox="0 0 24 24" fill="none" strokeWidth="1.8"><rect x="3" y="4" width="18" height="16" rx="2" /><path d="M3 9h18" /></svg>
);

interface Props {
  titulo: string;
  descripcion: string;
  proyectos: ProyectoResponseDto[];
  onElegir: (proyectoId: number) => void;
}

export default function SelectorProyecto({ titulo, descripcion, proyectos, onElegir }: Props) {
  return (
    <div className="w-full h-full flex items-center justify-center px-4 sm:px-8 pt-16 md:pt-0">
      <div className="w-full max-w-[1440px]">
        <div className="text-center mb-6">
          <h2 className="font-display text-[25px] font-semibold text-ink-900 mb-1.5">{titulo}</h2>
          <p className="text-[13px] text-ink-600">{descripcion}</p>
          <br/>
        </div>

        {proyectos.length === 0 ? (
          <div className="text-center text-sm text-ink-400 py-10">Cargando proyectos...</div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {proyectos.map((p) => (
              <button
                key={p.id}
                onClick={() => onElegir(p.id)}
                className="flex items-center gap-3 bg-white border border-line rounded-xl px-5 py-5 sm:px-10 sm:py-10 text-left transition-all hover:-translate-y-[2px] hover:shadow-[0_10px_22px_-10px_rgba(15,26,46,0.18)] hover:border-blue-400"
              >
                <div className="w-12 h-12 rounded-[9px] bg-blue-100 flex items-center justify-center shrink-0 [&>svg]:w-[20px] [&>svg]:h-[20px] [&>svg]:stroke-blue-600">
                  {ICONOS[p.nombre] ?? ICONO_DEFAULT}
                </div>
                <div className="min-w-0">
                  <div className="font-display font-semibold text-[20px] text-ink-900 truncate">{p.nombre}</div>
                  <div className="text-[11px] text-ink-400">
                    {p.totalSolicitudes > 0 ? `${p.totalSolicitudes} solicitudes` : 'Sin datos aún'}
                  </div>
                </div>
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}