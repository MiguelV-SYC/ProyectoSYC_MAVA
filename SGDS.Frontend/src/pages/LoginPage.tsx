import { useState, type FormEvent } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import logoSgds from '../assets/logo-sgds.png';
import { Link } from 'react-router-dom';

export default function LoginPage() {
  const { login, loading } = useAuth();
  const navigate = useNavigate();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);

    try {
      await login(email, password);
      navigate('/dashboard');
    } catch (err) {
      setError('Correo o contraseña incorrectos.');
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-paper p-6">
      <div className="w-full max-w-[1280px] grid grid-cols-[0.95fr_1fr] rounded-[22px] overflow-hidden shadow-[0_30px_60px_-20px_rgba(10,23,48,0.35)]">

        {/* Panel izquierdo — marca */}
        <div className="relative flex flex-col items-center justify-center text-center px-10 py-14 text-white overflow-hidden bg-[linear-gradient(160deg,var(--color-navy-950),var(--color-navy-900)_55%,var(--color-navy-800))]">
          <div
            className="absolute inset-0"
            style={{
              backgroundImage:
                'linear-gradient(rgba(255,255,255,0.07) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.07) 1px, transparent 1px)',
              backgroundSize: '34px 34px',
              maskImage: 'radial-gradient(circle at 50% 40%, black, transparent 68%)',
              WebkitMaskImage: 'radial-gradient(circle at 50% 40%, black, transparent 68%)',
            }}
          />
          <div
            className="absolute inset-0"
            style={{
              backgroundImage:
                'radial-gradient(circle at 50% 40%, transparent 0 118px, rgba(255,255,255,0.14) 119px 120px, transparent 121px), radial-gradient(circle at 50% 40%, transparent 0 150px, rgba(255,255,255,0.08) 151px 152px, transparent 153px)',
            }}
          />

          <div className="relative z-10 w-[190px] h-[190px] mb-[30px]">
            <div className="absolute inset-0 rounded-full border-2 border-dashed border-white/[0.18] animate-[spin_40s_linear_infinite]">
              <span className="absolute w-[9px] h-[9px] rounded-full bg-white shadow-[0_0_10px_rgba(255,255,255,0.8)] top-[-4px] left-1/2 -translate-x-1/2" />
              <span className="absolute w-[9px] h-[9px] rounded-full bg-white shadow-[0_0_10px_rgba(255,255,255,0.8)] bottom-[-4px] left-1/2 -translate-x-1/2" />
              <span className="absolute w-[9px] h-[9px] rounded-full bg-white shadow-[0_0_10px_rgba(255,255,255,0.8)] left-[-4px] top-1/2 -translate-y-1/2" />
              <span className="absolute w-[9px] h-[9px] rounded-full bg-white shadow-[0_0_10px_rgba(255,255,255,0.8)] right-[-4px] top-1/2 -translate-y-1/2" />
              <span className="absolute w-[9px] h-[9px] rounded-full bg-white shadow-[0_0_10px_rgba(255,255,255,0.8)] top-[14px] right-[20px]" />
              <span className="absolute w-[9px] h-[9px] rounded-full bg-white shadow-[0_0_10px_rgba(255,255,255,0.8)] bottom-[14px] left-[20px]" />
            </div>
            <div className="absolute inset-[22px] flex items-center justify-center [filter:drop-shadow(0_18px_34px_rgba(0,0,0,0.45))]">
              <img src={logoSgds} alt="Logo SGDS" className="w-full h-full object-contain" />
            </div>
          </div>

          <div className="relative z-10 font-display text-[15px] font-semibold leading-[1.4]">
            Sistema de Gestión<br />de Solicitudes
          </div>
          <div className="relative z-10 text-xs text-white/55 mt-2 font-medium">
            Gestión inteligente. Procesos eficientes.
          </div>
        </div>

        {/* Panel derecho — formulario */}
        <div className="bg-white px-11 pt-11 pb-10 flex flex-col items-center">
          <div className="flex items-center gap-[9px] mb-[18px]">
            <div className="w-[100px] h-[100px] flex items-center justify-center">
              <img src={logoSgds} alt="Logo SGDS" className="w-full h-full object-contain" />
            </div>
            <div className="font-display font-bold text-[30px] text-ink-900">SGDS</div>
          </div>

          <div className="relative w-full h-px bg-line mb-[26px]">
            <span className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 bg-white px-3 text-[11px] font-semibold text-ink-400 tracking-wide uppercase">
              Iniciar sesión
            </span>
          </div>

          <form className="w-full max-w-[320px]" onSubmit={handleSubmit}>
            <div className="mb-[18px]">
              <label className="block text-[12.5px] font-semibold text-ink-900 mb-[7px]">
                Correo electrónico
              </label>
              <div className="relative flex items-center">
                <svg viewBox="0 0 24 24" fill="none" strokeWidth="1.8" className="absolute left-[14px] w-4 h-4 stroke-ink-400">
                  <path d="M3 6.5l9 6 9-6M4 5h16a1 1 0 011 1v12a1 1 0 01-1 1H4a1 1 0 01-1-1V6a1 1 0 011-1z" />
                </svg>
                <input
                  type="email"
                  placeholder="usuario@syc.com.co"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  className="w-full py-3 pr-3.5 pl-10 border-[1.5px] border-line rounded-[10px] text-[13.5px] text-ink-900 outline-none transition-colors focus:border-blue-500 focus:shadow-[0_0_0_3px_rgba(47,111,237,0.12)] placeholder:text-ink-400"
                />
              </div>
            </div>

            <div>
              <label className="block text-[12.5px] font-semibold text-ink-900 mb-[7px]">
                Contraseña
              </label>
              <div className="relative flex items-center">
                <svg viewBox="0 0 24 24" fill="none" strokeWidth="1.8" className="absolute left-[14px] w-4 h-4 stroke-ink-400">
                  <rect x="5" y="11" width="14" height="9" rx="2" />
                  <path d="M8 11V7a4 4 0 018 0v4" />
                </svg>
                <input
                  type="password"
                  placeholder="Ingresa tu contraseña"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  className="w-full py-3 pr-3.5 pl-10 border-[1.5px] border-line rounded-[10px] text-[13.5px] text-ink-900 outline-none transition-colors focus:border-blue-500 focus:shadow-[0_0_0_3px_rgba(47,111,237,0.12)] placeholder:text-ink-400"
                />
              </div>
            </div>

            <div className="flex justify-end -mt-1.5 mb-[22px]">
              <Link to="/recuperar-password" className="text-[12.5px] text-blue-600 font-medium hover:underline">
                <br />¿Olvidaste tu contraseña?
              </Link>
            </div>

            {error && (
              <div className="mb-4 text-[12.5px] text-red-600 bg-red-50 border border-red-200 rounded-[10px] px-3 py-2">
                {error}
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full py-[13px] rounded-[10px] text-white font-semibold text-sm flex items-center justify-center gap-2 shadow-[0_8px_20px_-6px_rgba(47,111,237,0.55)] bg-[linear-gradient(145deg,var(--color-blue-500),var(--color-blue-600))] disabled:opacity-60 disabled:cursor-not-allowed"
            >
              {loading ? 'Ingresando...' : 'Iniciar sesión'}
              {!loading && (
                <svg viewBox="0 0 24 24" width="15" height="15" fill="none" stroke="white" strokeWidth="2">
                  <path d="M5 12h14M13 6l6 6-6 6" />
                </svg>
              )}
            </button>
          </form>

          <div className="mt-[22px] pt-[18px] border-t border-line text-center text-[12.5px] text-ink-600 w-full max-w-[320px]">
            ¿Nuevo en SGDS? <Link to="/solicita-acceso" className="text-blue-600 font-semibold hover:underline"><br/>Solicita acceso</Link> 
          </div>
        </div>
      </div>
    </div>
  );
}