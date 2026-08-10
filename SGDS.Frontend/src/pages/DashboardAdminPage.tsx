import Sidebar from '../components/layout/Sidebar';
import { useAuth } from '../context/AuthContext';

interface ProyectoCard {
  nombre: string;
  descripcion: string;
  solicitudes: number | null;
  statusPill?: string;
  icon: React.ReactNode;
}

const proyectos: ProyectoCard[] = [
  {
    nombre: 'Comfenalco',
    descripcion: 'Subsidios y beneficios al afiliado',
    solicitudes: 212,
    icon: <svg viewBox="0 0 24 24" fill="none" strokeWidth="1.8"><path d="M3 11l9-8 9 8" /><path d="M5 10v10h14V10" /><path d="M9 21v-6h6v6" /></svg>,
  },
  {
    nombre: 'Colpensiones',
    descripcion: 'Trámites pensionales a nivel nacional',
    solicitudes: 486,
    icon: <svg viewBox="0 0 24 24" fill="none" strokeWidth="1.8"><path d="M12 2l8 4v6c0 5-3.5 8.5-8 10-4.5-1.5-8-5-8-10V6l8-4z" /><path d="M9 12l2 2 4-4" /></svg>,
  },
  {
    nombre: 'Pasivos Laborales',
    descripcion: 'Expedientes y pasivo pensional',
    solicitudes: 97,
    icon: <svg viewBox="0 0 24 24" fill="none" strokeWidth="1.8"><path d="M4 21V8l8-5 8 5v13" /><path d="M9 21v-6h6v6" /><path d="M9 12h6" /></svg>,
  },
  {
    nombre: 'SYCTrace',
    descripcion: 'Trazabilidad de estampillas físicas',
    solicitudes: 153,
    icon: <svg viewBox="0 0 24 24" fill="none" strokeWidth="1.8"><rect x="4" y="9" width="16" height="10" rx="1.5" /><path d="M8 9V6a4 4 0 018 0v3" /><circle cx="12" cy="14" r="1.5" /></svg>,
  },
  {
    nombre: 'Infoconsumo',
    descripcion: 'Control de tornaguías e impuesto al consumo',
    solicitudes: 340,
    icon: <svg viewBox="0 0 24 24" fill="none" strokeWidth="1.8"><rect x="3" y="6" width="14" height="10" rx="1.5" /><path d="M17 9l4-2v10l-4-2" /></svg>,
  },
  {
    nombre: 'Gotrace',
    descripcion: 'Trazabilidad orientada al contribuyente',
    solicitudes: null,
    statusPill: 'En reingeniería',
    icon: (
      <svg viewBox="0 0 24 24" fill="none" strokeWidth="1.8" strokeDasharray="3 3">
        <path d="M4 18c4-8 12-8 16 0" />
        <circle cx="4" cy="18" r="1.6" strokeDasharray="0" />
        <circle cx="20" cy="18" r="1.6" strokeDasharray="0" />
      </svg>
    ),
  },
  {
    nombre: 'Estampillas',
    descripcion: 'Generación ante secretaría de hacienda',
    solicitudes: 128,
    icon: <svg viewBox="0 0 24 24" fill="none" strokeWidth="1.8"><rect x="5" y="4" width="14" height="16" rx="2" /><circle cx="12" cy="12" r="3.2" /></svg>,
  },
  {
    nombre: 'IUVA',
    descripcion: 'Impuesto vehicular — 6 departamentos',
    solicitudes: 75,
    icon: <svg viewBox="0 0 24 24" fill="none" strokeWidth="1.8"><rect x="3" y="10" width="14" height="7" rx="1.5" /><path d="M6 10l1.5-4h6L15 10" /><circle cx="6.5" cy="17.5" r="1.6" /><circle cx="14.5" cy="17.5" r="1.6" /></svg>,
  },
  {
    nombre: 'Libro Total',
    descripcion: 'Agregador multi-sede a nivel nacional',
    solicitudes: 63,
    icon: <svg viewBox="0 0 24 24" fill="none" strokeWidth="1.8"><path d="M4 7l8-4 8 4-8 4-8-4z" /><path d="M4 12l8 4 8-4M4 17l8 4 8-4" /></svg>,
  },
];

function SummaryChip({ icon, num, label }: { icon: React.ReactNode; num: string | number; label: string }) {
  return (
    <div className="flex-1 bg-white border border-line rounded-xl px-5 py-4 flex items-center gap-3">
      <div className="w-[38px] h-[38px] rounded-[10px] bg-blue-100 flex items-center justify-center shrink-0 [&>svg]:w-[18px] [&>svg]:h-[18px] [&>svg]:stroke-blue-600">
        {icon}
      </div>
      <div>
        <div className="font-display text-[19px] font-bold text-ink-900">{num}</div>
        <div className="text-[11.5px] text-ink-600">{label}</div>
      </div>
    </div>
  );
}

export default function DashboardAdminPage() {
  const { user } = useAuth();
  const primerNombre = user?.nombreCompleto?.split(' ')[0] ?? '';

  return (
    <div className="flex min-h-screen bg-paper">
      <Sidebar active="inicio" />

      <main className="flex-1 px-[42px] py-[34px] overflow-y-auto">
        {/* Topbar */}
        <div className="flex items-center justify-between mb-[30px]">
          <div>
            <h1 className="font-display text-2xl font-semibold text-ink-900">Hola, {primerNombre} 👋</h1>
            <p className="text-ink-600 text-[13.5px] mt-[3px]">
              Selecciona un proyecto para continuar, o revisa el resumen general.
            </p>
          </div>
          <div className="flex items-center gap-3.5">
            <div className="flex items-center gap-2 bg-white border border-line rounded-[10px] px-3.5 py-[9px] w-[300px]">
              <svg viewBox="0 0 24 24" fill="none" strokeWidth="2" className="w-[15px] h-[15px] stroke-ink-400 shrink-0">
                <circle cx="11" cy="11" r="7" /><path d="M21 21l-4-4" />
              </svg>
              <input
                placeholder="Buscar proyecto, solicitud, ciudadano..."
                className="border-none outline-none text-[13px] w-full font-body"
              />
            </div>
            <button className="w-[38px] h-[38px] rounded-[10px] bg-white border border-line flex items-center justify-center relative">
              <svg viewBox="0 0 24 24" fill="none" strokeWidth="1.8" className="w-4 h-4 stroke-ink-600">
                <path d="M18 8a6 6 0 10-12 0c0 7-3 9-3 9h18s-3-2-3-9" />
                <path d="M13.7 21a2 2 0 01-3.4 0" />
              </svg>
              <div className="absolute -top-1 -right-1 bg-blue-600 text-white text-[9px] font-bold w-4 h-4 rounded-full flex items-center justify-center border-2 border-paper">
                3
              </div>
            </button>
          </div>
        </div>

        {/* Resumen global */}
        <div className="flex gap-4 mb-8">
          <SummaryChip
            num={9}
            label="Proyectos activos"
            icon={<svg viewBox="0 0 24 24" fill="none" strokeWidth="1.8"><rect x="4" y="4" width="16" height="16" rx="2" /></svg>}
          />
          <SummaryChip
            num="1,284"
            label="Solicitudes totales"
            icon={<svg viewBox="0 0 24 24" fill="none" strokeWidth="1.8"><path d="M6 3h9l5 5v13H6z" /></svg>}
          />
          <SummaryChip
            num={4}
            label="Usuarios pendientes de aprobar"
            icon={<svg viewBox="0 0 24 24" fill="none" strokeWidth="1.8"><circle cx="12" cy="8" r="3.5" /><path d="M5 21c0-3.6 3-6 7-6s7 2.4 7 6" /></svg>}
          />
        </div>

        {/* Grilla de proyectos */}
        <div className="flex items-baseline justify-between mb-4">
          <h2 className="font-display text-[15px] font-semibold text-ink-900">Tus proyectos</h2>
          <span className="text-xs text-ink-400">{proyectos.length} proyectos configurados</span>
        </div>

        <div className="grid grid-cols-3 gap-[18px]">
          {proyectos.map((p) => (
            
              <a key={p.nombre}
              href="#"
              className="relative bg-white border border-line rounded-2xl p-[22px] flex flex-col gap-3.5 transition-all hover:-translate-y-[3px] hover:shadow-[0_16px_32px_-12px_rgba(15,26,46,0.16)] hover:border-blue-400"
            >
              {p.statusPill && (
                <span className="absolute top-[18px] right-[18px] text-[10px] font-semibold px-2.5 py-[3px] rounded-full bg-[#fdf3e7] text-[#96631a] border border-[#f4dfb8]">
                  {p.statusPill}
                </span>
              )}
              <div className="w-[46px] h-[46px] rounded-xl bg-blue-100 flex items-center justify-center [&>svg]:w-[22px] [&>svg]:h-[22px] [&>svg]:stroke-blue-600">
                {p.icon}
              </div>
              <div>
                <div className="font-display font-semibold text-[15px] text-ink-900">{p.nombre}</div>
                <div className="text-xs text-ink-600 leading-relaxed min-h-8">{p.descripcion}</div>
              </div>
              <div className="flex items-center justify-between pt-3 border-t border-line">
                <span className="text-[11.5px] text-ink-600">
                  {p.solicitudes !== null ? (
                    <><b className="text-ink-900 font-bold">{p.solicitudes}</b> solicitudes</>
                  ) : (
                    'Sin datos aún'
                  )}
                </span>
                <div className="w-[26px] h-[26px] rounded-full bg-paper flex items-center justify-center">
                  <svg viewBox="0 0 24 24" fill="none" strokeWidth="2" className="w-[13px] h-[13px] stroke-blue-600">
                    <path d="M5 12h14M13 6l6 6-6 6" />
                  </svg>
                </div>
              </div>
            </a>
          ))}
        </div>
      </main>
    </div>
  );
}