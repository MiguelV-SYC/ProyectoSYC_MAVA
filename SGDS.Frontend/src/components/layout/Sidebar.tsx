import { useAuth } from '../../context/AuthContext';
import logoSgds from '../../assets/logo-sgds.png';
import { Link } from 'react-router-dom';

interface NavItemProps {
  icon: React.ReactNode;
  label: string;
  active?: boolean;
  to: string;
}

function NavItem({ icon, label, active, to }: NavItemProps) {
  return (
    
    <Link
      to={to}
      className={`relative z-10 flex items-center gap-3 px-3 py-2.5 rounded-[9px] text-[13.5px] font-medium border-l-2 transition-colors ${
        active
          ? 'bg-white/10 text-white border-blue-400 shadow-[inset_0_0_0_1px_rgba(255,255,255,0.06)]'
          : 'text-white/60 border-transparent hover:bg-white/[0.06] hover:text-white/90'
      }`}
    >
      <span className="w-[17px] h-[17px] shrink-0 [&>svg]:w-full [&>svg]:h-full [&>svg]:stroke-current">
        {icon}
      </span>
      {label}
    </Link>
  );
}

function NavSectionLabel({ children }: { children: React.ReactNode }) {
  return (
    <div className="relative z-10 text-[10px] uppercase tracking-wide text-white/30 font-semibold px-3 pt-4 pb-1.5">
      {children}
    </div>
  );
}

export default function Sidebar({ active }: { active: string }) {
  const { user, logout } = useAuth();

  const nombre = user?.nombreCompleto ?? '';
  const iniciales = nombre
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map((p) => p[0])
    .join('')
    .toUpperCase();
  const rol = user?.esAdminSyc ? 'Administrador SYC' : 'Operador';

  return (
    <aside className="w-[260px] shrink-0 relative flex flex-col p-[26px_18px] overflow-hidden text-white bg-[radial-gradient(circle_at_20%_0%,rgba(79,139,255,0.18),transparent_55%),linear-gradient(180deg,var(--color-navy-950),var(--color-navy-900)_55%,var(--color-navy-800))]">
      {/* Grid de fondo */}
      <div
        className="absolute inset-0"
        style={{
          backgroundImage:
            'linear-gradient(rgba(127,171,255,0.07) 1px, transparent 1px), linear-gradient(90deg, rgba(127,171,255,0.07) 1px, transparent 1px)',
          backgroundSize: '32px 32px',
          maskImage: 'radial-gradient(circle at 20% 15%, black, transparent 65%)',
          WebkitMaskImage: 'radial-gradient(circle at 20% 15%, black, transparent 65%)',
        }}
      />

      {/* Circuito animado */}
      <div className="absolute inset-0 z-0 pointer-events-none">
        <svg viewBox="0 0 260 900" preserveAspectRatio="none" className="w-full h-full">
          <path
            className="fill-none stroke-white/[0.16] stroke-[1.4] [stroke-linecap:round]"
            d="M0 210 L55 210 L55 300 L140 300 L140 380"
          />
          <path
            className="fill-none stroke-white/[0.55] stroke-[1.4] [stroke-linecap:round] [stroke-dasharray:10_340] animate-[c-travel_7s_linear_infinite] [filter:drop-shadow(0_0_4px_rgba(255,255,255,0.85))_drop-shadow(0_0_1px_rgba(255,255,255,1))]"
            d="M0 210 L55 210 L55 300 L140 300 L140 380"
          />
          <path
            className="fill-none stroke-white/[0.16] stroke-[1.4] [stroke-linecap:round]"
            d="M260 480 L190 480 L190 560 L95 560 L95 660 L260 660"
          />
          <path
            className="fill-none stroke-white/[0.55] stroke-[1.4] [stroke-linecap:round] [stroke-dasharray:10_340] animate-[c-travel_10s_linear_infinite] [animation-delay:-3s] [filter:drop-shadow(0_0_4px_rgba(255,255,255,0.85))_drop-shadow(0_0_1px_rgba(255,255,255,1))]"
            d="M260 480 L190 480 L190 560 L95 560 L95 660 L260 660"
          />
          <path
            className="fill-none stroke-white/[0.16] stroke-[1.4] [stroke-linecap:round]"
            d="M40 560 L40 700 L120 700 L120 800 L220 800 L220 900"
          />
          <path
            className="fill-none stroke-white/[0.16] stroke-[1.4] [stroke-linecap:round]"
            d="M260 760 L205 760 L205 900"
          />
          <circle className="fill-white/[0.85] [filter:drop-shadow(0_0_4px_rgba(255,255,255,0.9))]" cx="55" cy="210" r="3.2" />
          <circle className="fill-white/30" cx="140" cy="300" r="2.6" />
          <circle className="fill-white/30" cx="190" cy="480" r="2.6" />
          <circle className="fill-white/[0.85] [filter:drop-shadow(0_0_4px_rgba(255,255,255,0.9))]" cx="95" cy="560" r="3.2" />
          <circle className="fill-white/30" cx="120" cy="700" r="2.6" />
          <circle className="fill-white/[0.85] [filter:drop-shadow(0_0_4px_rgba(255,255,255,0.9))]" cx="220" cy="800" r="3" />
          <circle className="fill-white/30" cx="205" cy="760" r="2.4" />
        </svg>
      </div>

      {/* Marca */}
      <div className="relative z-10 flex items-center gap-3 px-2 pb-[26px]">
        <div className="relative w-[46px] h-[46px] rounded-full flex items-center justify-center">
          <div className="absolute -inset-[5px] rounded-full border-[1.5px] border-dashed border-blue-400/35 animate-[logo-spin_30s_linear_infinite]" />
          <img src={logoSgds} alt="SGDS" className="w-full h-full object-contain [filter:drop-shadow(0_4px_10px_rgba(0,0,0,0.45))]" />
        </div>
        <div>
          <div className="font-display font-bold text-[16px] tracking-wide">SGDS</div>
          <div className="text-[10px] text-white/75 font-medium leading-[1.3] max-w-[150px]">
            Sistema de Gestión de Solicitudes
          </div>
        </div>
      </div>

      {/* Navegación */}
      <nav className="relative z-10 flex flex-col gap-0.5 flex-1">
        <NavItem
          active={active === 'inicio'} 
          label="Inicio" 
          to="/dashboard" 
          icon={<svg viewBox="0 0 24 24" fill="none" strokeWidth="1.8"><path d="M3 11l9-8 9 8" /><path d="M5 10v10h14V10" /></svg>}
        />

        <NavItem
          active={active === 'solicitudes'}
          label="Solicitudes" 
          to="/dashboard" 
          icon={<svg viewBox="0 0 24 24" fill="none" strokeWidth="1.8"><path d="M6 3h9l5 5v13H6z" /><path d="M14 3v5h5" /></svg>}
        />

        <NavItem
          active={active === 'ciudadanos'}
          label="Ciudadanos" 
          to="/ciudadanos" 
          icon={<svg viewBox="0 0 24 24" fill="none" strokeWidth="1.8"><circle cx="12" cy="8" r="4" /><path d="M4 21c0-4 4-6 8-6s8 2 8 6" /></svg>}
        />

        <NavItem
          active={active === 'empresas'}
          label="Empresas" 
          to="/dashboard" 
          icon={<svg viewBox="0 0 24 24" fill="none" strokeWidth="1.8"><path d="M4 21V7l8-4 8 4v14" /><path d="M9 21v-6h6v6" /></svg>}
        />

        <NavItem
          active={active === 'documentos'}
          label="Documentos" 
          to="/dashboard" 
          icon={<svg viewBox="0 0 24 24" fill="none" strokeWidth="1.8"><rect x="5" y="3" width="14" height="18" rx="2" /><path d="M9 8h6M9 12h6M9 16h3" /></svg>}
        />

        <NavItem
          active={active === 'workflow'}
          label="Workflow" 
          to="/dashboard" 
          icon={<svg viewBox="0 0 24 24" fill="none" strokeWidth="1.8"><circle cx="6" cy="6" r="2.5" /><circle cx="18" cy="18" r="2.5" /><path d="M8 6h5a3 3 0 013 3v6" /></svg>}
        />

        <NavItem
          active={active === 'reportes'}
          label="Reportes" 
          to="/dashboard" 
          icon={<svg viewBox="0 0 24 24" fill="none" strokeWidth="1.8"><path d="M4 19V9M12 19V5M20 19v-7" /></svg>}
        />

        {user?.esAdminSyc && (
          <>
            <NavSectionLabel>Administración</NavSectionLabel>
            <NavItem
              active={active === 'usuarios'}
              label="Usuarios" 
              to="/usuarios" 
              icon={<svg viewBox="0 0 24 24" fill="none" strokeWidth="1.8"><circle cx="9" cy="8" r="3.2" /><path d="M3 20c0-3.3 2.7-5.5 6-5.5s6 2.2 6 5.5" /><path d="M16 9h5M18.5 6.5v5" /></svg>}
            />

            <NavItem
              active={active === 'auditoria'}
              label="Auditoría" 
              to="/auditoria" 
              icon={<svg viewBox="0 0 24 24" fill="none" strokeWidth="1.8"><circle cx="12" cy="12" r="9" /><path d="M12 7v5l3 3" /></svg>}
            />

            <NavItem
              active={active === 'proyectos'}
              label="Proyectos" 
              to="/proyectos" 
              icon={<svg viewBox="0 0 24 24" fill="none" strokeWidth="1.8"><rect x="3" y="4" width="18" height="16" rx="2" /><path d="M3 9h18" /></svg>}
            />
          </>
        )}
      </nav>

      {/* Usuario */}
      <div className="relative z-10 flex items-center gap-2.5 px-3 pt-4 mt-2.5 border-t border-white/[0.08]">
        <div className="w-[34px] h-[34px] rounded-[9px] flex items-center justify-center font-bold text-xs text-white bg-[linear-gradient(145deg,var(--color-blue-500),var(--color-blue-600))]">
          {iniciales}
        </div>
        <div>
          <div className="text-[12.5px] font-semibold text-white">{nombre}</div>
          <div className="text-[10.5px] text-blue-400">{rol}</div>
        </div>
      </div>
      <button
        onClick={logout}
        className="relative z-10 flex items-center gap-2.5 px-3 py-[9px] mt-1 rounded-[9px] text-[12.5px] font-medium text-white/50 hover:bg-red-600/[0.12] hover:text-red-400 transition-colors"
      >
        <svg viewBox="0 0 24 24" fill="none" strokeWidth="1.8" className="w-[15px] h-[15px] stroke-current">
          <path d="M9 21H5a2 2 0 01-2-2V5a2 2 0 012-2h4" /><path d="M16 17l5-5-5-5" /><path d="M21 12H9" />
        </svg>
        Cerrar sesión
      </button>
    </aside>
  );
}