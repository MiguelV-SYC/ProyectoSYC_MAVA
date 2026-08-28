import { useState, type FormEvent } from 'react';
import { Link } from 'react-router-dom';
import logoSgds from '../assets/logo-sgds.png';
import SGDSBackground from '../components/SGDSBackground';

// NOTA: no existe todavía un endpoint real de recuperación de contraseña en el
// backend (RF-05 quedó marcado como "fase posterior al piloto, no bloquea el MVP").
// Por ahora este formulario simula el envío (loading + éxito) sin llamar a la API.
// Cuando el servicio de correo esté listo, reemplazar handleSubmit por una llamada
// real a algo como POST /api/Auth/recuperar-password.

export default function RecuperarPasswordPage() {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [enviado, setEnviado] = useState(false);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setLoading(true);
    // Simulación temporal — sin backend real todavía.
    await new Promise((resolve) => setTimeout(resolve, 900));
    setLoading(false);
    setEnviado(true);
  }

  return (
    <div className="relative min-h-screen flex items-center justify-center p-6 overflow-hidden">
  <SGDSBackground />
      <div className="relative z-10 w-full max-w-[880px] grid grid-cols-1 md:grid-cols-[0.95fr_1fr] rounded-[22px] overflow-hidden shadow-[0_30px_60px_-20px_rgba(10,23,48,0.35)]">

        {/* Panel izquierdo — marca (oculto en mobile, la marca compacta vive en el panel derecho) */}
        <div className="hidden md:flex relative flex-col items-center justify-center text-center px-10 py-14 text-white overflow-hidden bg-[radial-gradient(circle_at_50%_38%,rgba(255,255,255,0.10),transparent_55%),linear-gradient(160deg,var(--color-navy-950),var(--color-navy-900)_55%,var(--color-navy-800))]">
          <div
            className="absolute inset-0"
            style={{
              backgroundImage:
                'linear-gradient(rgba(255,255,255,0.06) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.06) 1px, transparent 1px)',
              backgroundSize: '32px 32px',
              maskImage: 'radial-gradient(circle at 50% 40%, black, transparent 68%)',
              WebkitMaskImage: 'radial-gradient(circle at 50% 40%, black, transparent 68%)',
            }}
          />
          <div className="absolute inset-0 z-0 pointer-events-none">
            <svg viewBox="0 0 300 600" preserveAspectRatio="none" className="w-full h-full">
              <path className="fill-none stroke-white/[0.16] stroke-[1.4] [stroke-linecap:round]" d="M0 130 L50 130 L50 220 L130 220 L130 300" />
              <path className="fill-none stroke-white/[0.55] stroke-[1.4] [stroke-linecap:round] [stroke-dasharray:10_340] animate-[c-travel_7s_linear_infinite] [filter:drop-shadow(0_0_4px_rgba(255,255,255,0.85))_drop-shadow(0_0_1px_rgba(255,255,255,1))]" d="M0 130 L50 130 L50 220 L130 220 L130 300" />
              <path className="fill-none stroke-white/[0.16] stroke-[1.4] [stroke-linecap:round]" d="M300 380 L220 380 L220 460 L120 460 L120 560 L300 560" />
              <path className="fill-none stroke-white/[0.55] stroke-[1.4] [stroke-linecap:round] [stroke-dasharray:10_340] animate-[c-travel_10s_linear_infinite] [animation-delay:-3s] [filter:drop-shadow(0_0_4px_rgba(255,255,255,0.85))_drop-shadow(0_0_1px_rgba(255,255,255,1))]" d="M300 380 L220 380 L220 460 L120 460 L120 560 L300 560" />
              <circle className="fill-white/[0.85] [filter:drop-shadow(0_0_4px_rgba(255,255,255,0.9))]" cx="50" cy="130" r="3" />
              <circle className="fill-white/30" cx="130" cy="220" r="2.4" />
              <circle className="fill-white/30" cx="220" cy="380" r="2.4" />
              <circle className="fill-white/[0.85] [filter:drop-shadow(0_0_4px_rgba(255,255,255,0.9))]" cx="120" cy="460" r="3" />
            </svg>
          </div>

          <div className="relative z-10 w-[150px] h-[150px] mb-[26px]">
            <div className="absolute inset-0 rounded-full border-2 border-dashed border-white/[0.18] animate-[spin_40s_linear_infinite]">
              <span className="absolute w-2 h-2 rounded-full bg-white shadow-[0_0_10px_rgba(255,255,255,0.8)] top-[-4px] left-1/2 -translate-x-1/2" />
              <span className="absolute w-2 h-2 rounded-full bg-white shadow-[0_0_10px_rgba(255,255,255,0.8)] bottom-[-4px] left-1/2 -translate-x-1/2" />
              <span className="absolute w-2 h-2 rounded-full bg-white shadow-[0_0_10px_rgba(255,255,255,0.8)] left-[-4px] top-1/2 -translate-y-1/2" />
              <span className="absolute w-2 h-2 rounded-full bg-white shadow-[0_0_10px_rgba(255,255,255,0.8)] right-[-4px] top-1/2 -translate-y-1/2" />
            </div>
            <div className="absolute inset-4 flex items-center justify-center [filter:drop-shadow(0_14px_26px_rgba(0,0,0,0.45))]">
              <img src={logoSgds} alt="SGDS" className="w-full h-full object-contain" />
            </div>
          </div>

          <div className="relative z-10 font-display text-[14.5px] font-semibold text-white">SGDS</div>
          <div className="relative z-10 text-[11px] text-white/60 mt-[7px] font-medium max-w-[220px] leading-relaxed">
            Sistema de Gestión de Solicitudes<br />Recuperación segura de contraseña
          </div>
        </div>

        {/* Panel derecho — formulario */}
        <div className="bg-white px-6 py-9 md:px-[46px] md:py-12 flex flex-col items-center">
          <div className="flex md:hidden items-center gap-2.5 mb-6 self-start">
            <img src={logoSgds} alt="Logo SGDS" className="w-9 h-9 object-contain" />
            <span className="font-display font-bold text-lg text-ink-900">SGDS</span>
          </div>
          {enviado ? (
            <div className="text-center w-full max-w-[300px]">
              <div className="w-[52px] h-[52px] rounded-[14px] bg-blue-100 flex items-center justify-center mb-[18px] mx-auto">
                <svg viewBox="0 0 24 24" fill="none" strokeWidth="1.8" className="w-6 h-6 stroke-blue-600">
                  <path d="M3 6.5l9 6 9-6M4 5h16a1 1 0 011 1v12a1 1 0 01-1 1H4a1 1 0 01-1-1V6a1 1 0 011-1z" />
                </svg>
              </div>
              <h1 className="font-display text-[21px] font-semibold text-ink-900">Revisa tu correo</h1>
              <p className="text-ink-600 text-[13px] mt-2 leading-relaxed">
                Si <b>{email}</b> está registrado, te enviamos un enlace para restablecer tu contraseña.
              </p>
              <Link
                to="/login"
                className="inline-flex items-center gap-[5px] text-blue-600 font-semibold text-[12.5px] hover:underline mt-6"
              >
                <svg viewBox="0 0 24 24" fill="none" strokeWidth="2" className="w-[13px] h-[13px] stroke-blue-600">
                  <path d="M19 12H5M11 18l-6-6 6-6" />
                </svg>
                Volver a iniciar sesión
              </Link>
            </div>
          ) : (
            <>
              <div className="w-[52px] h-[52px] rounded-[14px] bg-blue-100 flex items-center justify-center mb-[18px]">
                <svg viewBox="0 0 24 24" fill="none" strokeWidth="1.8" className="w-6 h-6 stroke-blue-600">
                  <rect x="5" y="11" width="14" height="9" rx="2" /><path d="M8 11V7a4 4 0 018 0v4" />
                </svg>
              </div>
              <h1 className="font-display text-[21px] font-semibold text-ink-900 text-center">
                ¿Olvidaste tu contraseña?
              </h1>
              <p className="text-ink-600 text-[13px] mt-2 mb-7 text-center max-w-[300px] leading-relaxed">
                Ingresa tu correo institucional y te enviaremos un enlace para restablecerla.
              </p>

              <form onSubmit={handleSubmit} className="w-full max-w-[300px]">
                <div>
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

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full mt-[22px] py-[13px] rounded-[10px] text-white font-semibold text-sm flex items-center justify-center gap-2 shadow-[0_8px_20px_-6px_rgba(47,111,237,0.55)] bg-[linear-gradient(145deg,var(--color-blue-500),var(--color-blue-600))] disabled:opacity-60 disabled:cursor-not-allowed"
                >
                  {loading ? 'Enviando...' : 'Enviar enlace de recuperación'}
                  {!loading && (
                    <svg viewBox="0 0 24 24" width="15" height="15" fill="none" stroke="white" strokeWidth="2">
                      <path d="M5 12h14M13 6l6 6-6 6" />
                    </svg>
                  )}
                </button>
              </form>

              <div className="flex gap-[9px] mt-5 bg-paper border border-line rounded-[10px] px-[13px] py-[11px] w-full max-w-[300px]">
                <svg viewBox="0 0 24 24" fill="none" strokeWidth="1.8" className="w-[15px] h-[15px] stroke-ink-400 shrink-0 mt-[1px]">
                  <circle cx="12" cy="12" r="9" /><path d="M12 7v5l3 3" />
                </svg>
                <p className="text-[11.5px] text-ink-600 leading-relaxed">
                  El enlace es válido por 30 minutos. Si no lo ves en tu bandeja, revisa spam o solicita uno nuevo.
                </p>
              </div>

              <Link
                to="/login"
                className="inline-flex items-center gap-[5px] text-blue-600 font-semibold text-[12.5px] hover:underline mt-[22px]"
              >
                <svg viewBox="0 0 24 24" fill="none" strokeWidth="2" className="w-[13px] h-[13px] stroke-blue-600">
                  <path d="M19 12H5M11 18l-6-6 6-6" />
                </svg>
                Volver a iniciar sesión
              </Link>
            </>
          )}
        </div>
      </div>
    </div>
  );
}