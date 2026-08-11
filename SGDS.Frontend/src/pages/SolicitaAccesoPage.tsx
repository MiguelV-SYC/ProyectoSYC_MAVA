import { useState, useEffect, type FormEvent } from 'react';
import { Link } from 'react-router-dom';
import { solicitarAcceso } from '../services/authService';
import { getProyectosActivos, type ProyectoResponseDto } from '../services/proyectoService';
import logoSgds from '../assets/logo-sgds.png';

export default function SolicitaAccesoPage() {
  const [proyectos, setProyectos] = useState<ProyectoResponseDto[]>([]);
  const [proyectosLoading, setProyectosLoading] = useState(true);

  const [nombreCompleto, setNombreCompleto] = useState('');
  const [email, setEmail] = useState('');
  const [documento, setDocumento] = useState('');
  const [telefono, setTelefono] = useState('');
  const [proyectosSeleccionados, setProyectosSeleccionados] = useState<number[]>([]);
  const [motivo, setMotivo] = useState('');

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [exito, setExito] = useState<string | null>(null);

  useEffect(() => {
    getProyectosActivos()
      .then(setProyectos)
      .catch(() => setError('No se pudo cargar la lista de proyectos.'))
      .finally(() => setProyectosLoading(false));
  }, []);

  function toggleProyecto(id: number) {
    setProyectosSeleccionados((prev) =>
      prev.includes(id) ? prev.filter((p) => p !== id) : [...prev, id]
    );
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);
    setExito(null);

    if (proyectosSeleccionados.length === 0) {
      setError('Selecciona al menos un proyecto.');
      return;
    }

    setLoading(true);
    try {
      const mensaje = await solicitarAcceso({
        nombreCompleto,
        email,
        documentoIdentidad: documento,
        telefono: telefono || undefined,
        proyectosSolicitados: proyectosSeleccionados,
        rolSolicitado: 'Operador',
        motivo: motivo || undefined,
      });
      setExito(mensaje);
    } catch (err: any) {
      setError(err?.response?.data?.mensaje ?? 'No se pudo enviar la solicitud. Intenta de nuevo.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-paper p-6">
      <div className="w-full max-w-[980px] grid grid-cols-[0.75fr_1fr] rounded-[22px] overflow-hidden shadow-[0_30px_60px_-20px_rgba(10,23,48,0.35)]">

        {/* Panel izquierdo — marca */}
        <div className="relative flex flex-col justify-between px-9 py-11 text-white overflow-hidden bg-[radial-gradient(circle_at_30%_20%,rgba(79,139,255,0.20),transparent_55%),linear-gradient(160deg,var(--color-navy-950),var(--color-navy-900)_60%,var(--color-navy-800))]">
          <div
            className="absolute inset-0"
            style={{
              backgroundImage:
                'linear-gradient(rgba(255,255,255,0.06) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.06) 1px, transparent 1px)',
              backgroundSize: '30px 30px',
              maskImage: 'radial-gradient(circle at 25% 20%, black, transparent 65%)',
              WebkitMaskImage: 'radial-gradient(circle at 25% 20%, black, transparent 65%)',
            }}
          />
          <div className="absolute inset-0 z-0 pointer-events-none">
            <svg viewBox="0 0 320 700" preserveAspectRatio="none" className="w-full h-full">
              <path className="fill-none stroke-white/[0.16] stroke-[1.4] [stroke-linecap:round]" d="M0 160 L60 160 L60 260 L150 260 L150 340" />
              <path className="fill-none stroke-white/[0.55] stroke-[1.4] [stroke-linecap:round] [stroke-dasharray:10_340] animate-[c-travel_7s_linear_infinite] [filter:drop-shadow(0_0_4px_rgba(255,255,255,0.85))_drop-shadow(0_0_1px_rgba(255,255,255,1))]" d="M0 160 L60 160 L60 260 L150 260 L150 340" />
              <path className="fill-none stroke-white/[0.16] stroke-[1.4] [stroke-linecap:round]" d="M320 420 L230 420 L230 500 L120 500 L120 600 L320 600" />
              <path className="fill-none stroke-white/[0.55] stroke-[1.4] [stroke-linecap:round] [stroke-dasharray:10_340] animate-[c-travel_10s_linear_infinite] [animation-delay:-3s] [filter:drop-shadow(0_0_4px_rgba(255,255,255,0.85))_drop-shadow(0_0_1px_rgba(255,255,255,1))]" d="M320 420 L230 420 L230 500 L120 500 L120 600 L320 600" />
              <path className="fill-none stroke-white/[0.16] stroke-[1.4] [stroke-linecap:round]" d="M40 440 L40 560 L100 560 L100 660" />
              <circle className="fill-white/[0.85] [filter:drop-shadow(0_0_4px_rgba(255,255,255,0.9))]" cx="60" cy="160" r="3.2" />
              <circle className="fill-white/30" cx="150" cy="260" r="2.6" />
              <circle className="fill-white/30" cx="230" cy="420" r="2.6" />
              <circle className="fill-white/[0.85] [filter:drop-shadow(0_0_4px_rgba(255,255,255,0.9))]" cx="120" cy="500" r="3.2" />
              <circle className="fill-white/30" cx="100" cy="560" r="2.6" />
            </svg>
          </div>

          <div className="relative z-10 flex items-center gap-3">
            <div className="relative w-[50px] h-[50px] rounded-full flex items-center justify-center">
              <div className="absolute -inset-[6px] rounded-full border-[1.5px] border-dashed border-white/30 animate-[logo-spin_30s_linear_infinite]" />
              <img src={logoSgds} alt="SGDS" className="w-full h-full object-contain [filter:drop-shadow(0_4px_10px_rgba(0,0,0,0.45))]" />
            </div>
            <div>
              <div className="font-display font-bold text-lg">SGDS</div>
              <div className="text-[10.5px] text-white/75 font-medium mt-0.5 max-w-[170px] leading-[1.3]">
                Sistema de Gestión de Solicitudes
              </div>
            </div>
          </div>

          <div className="relative z-10">
            <h2 className="font-display text-[21px] font-semibold leading-[1.35] max-w-[280px]">
              Tu acceso empieza con una solicitud, no con un registro.
            </h2>
            <p className="text-[12.5px] text-white/60 mt-3 max-w-[270px] leading-relaxed">
              Un Administrador SYC revisa cada solicitud y asigna el proyecto y rol correspondiente antes de habilitar tu cuenta.
            </p>
          </div>

          <div className="relative z-10 flex flex-col gap-3">
            {[
              'Completas este formulario',
              'Un administrador revisa y aprueba',
              'Recibes tus credenciales por correo',
            ].map((texto, i) => (
              <div key={texto} className="flex items-center gap-2.5">
                <div className="w-[22px] h-[22px] rounded-full bg-white/10 border border-white/25 flex items-center justify-center text-[10.5px] font-bold shrink-0">
                  {i + 1}
                </div>
                <div className="text-[11.5px] text-white/70">{texto}</div>
              </div>
            ))}
          </div>
        </div>

        {/* Panel derecho — formulario */}
        <div className="bg-white px-11 py-10 overflow-y-auto max-h-[92vh]">
          <h1 className="font-display text-[22px] font-semibold text-ink-900">Solicita acceso</h1>
          <p className="text-ink-600 text-[13px] mt-[5px] mb-[26px]">
            Completa tus datos y el proyecto al que necesitas acceso. Te contactaremos una vez sea aprobada.
          </p>

          {exito ? (
            <div className="text-center py-8">
              <div className="text-[15px] font-semibold text-ink-900 mb-2">¡Solicitud enviada!</div>
              <p className="text-[13px] text-ink-600 mb-6">{exito}</p>
              <Link to="/login" className="text-blue-600 font-semibold text-[13px] hover:underline">
                Volver a inicio de sesión
              </Link>
            </div>
          ) : (
            <form onSubmit={handleSubmit}>
              <div className="mb-[18px]">
                <label className="block text-xs font-semibold text-ink-900 mb-1.5">Nombre completo</label>
                <input
                  type="text"
                  placeholder="Laura Martínez Gómez"
                  value={nombreCompleto}
                  onChange={(e) => setNombreCompleto(e.target.value)}
                  required
                  className="w-full py-[11px] px-[13px] border-[1.5px] border-line rounded-[9px] text-[13px] text-ink-900 outline-none transition-colors focus:border-blue-500 focus:shadow-[0_0_0_3px_rgba(47,111,237,0.12)] placeholder:text-ink-400"
                />
              </div>

              <div className="grid grid-cols-2 gap-3.5 mb-[18px]">
                <div>
                  <label className="block text-xs font-semibold text-ink-900 mb-1.5">Correo electrónico institucional</label>
                  <input
                    type="email"
                    placeholder="usuario@syc.com.co"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                    className="w-full py-[11px] px-[13px] border-[1.5px] border-line rounded-[9px] text-[13px] text-ink-900 outline-none transition-colors focus:border-blue-500 focus:shadow-[0_0_0_3px_rgba(47,111,237,0.12)] placeholder:text-ink-400"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-ink-900 mb-1.5">Documento de identidad</label>
                  <input
                    type="text"
                    placeholder="CC 1098765432"
                    value={documento}
                    onChange={(e) => setDocumento(e.target.value)}
                    required
                    className="w-full py-[11px] px-[13px] border-[1.5px] border-line rounded-[9px] text-[13px] text-ink-900 outline-none transition-colors focus:border-blue-500 focus:shadow-[0_0_0_3px_rgba(47,111,237,0.12)] placeholder:text-ink-400"
                  />
                </div>
              </div>

              <div className="mb-[18px]">
                <label className="block text-xs font-semibold text-ink-900 mb-1.5">
                  Teléfono de contacto <span className="font-normal text-ink-400">(opcional)</span>
                </label>
                <input
                  type="tel"
                  placeholder="300 000 0000"
                  value={telefono}
                  onChange={(e) => setTelefono(e.target.value)}
                  className="w-full py-[11px] px-[13px] border-[1.5px] border-line rounded-[9px] text-[13px] text-ink-900 outline-none transition-colors focus:border-blue-500 focus:shadow-[0_0_0_3px_rgba(47,111,237,0.12)] placeholder:text-ink-400"
                />
              </div>

              <div className="mb-[18px]">
                <label className="block text-xs font-semibold text-ink-900 mb-1.5">Proyecto(s) a los que necesitas acceso</label>
                {proyectosLoading ? (
                  <p className="text-xs text-ink-400">Cargando proyectos...</p>
                ) : (
                  <div className="grid grid-cols-3 gap-2">
                    {proyectos.map((p) => (
                      <label
                        key={p.id}
                        className="flex items-center gap-[7px] border-[1.5px] border-line rounded-lg px-[9px] py-2 cursor-pointer transition-colors hover:border-blue-400 hover:bg-blue-50"
                      >
                        <input
                          type="checkbox"
                          checked={proyectosSeleccionados.includes(p.id)}
                          onChange={() => toggleProyecto(p.id)}
                          className="w-3.5 h-3.5 accent-blue-600 shrink-0"
                        />
                        <span className="text-[11.5px] font-medium text-ink-900">{p.nombre}</span>
                      </label>
                    ))}
                  </div>
                )}
              </div>

              <div className="mb-[18px]">
                <label className="block text-xs font-semibold text-ink-900 mb-1.5">Rol solicitado</label>
                <select
                  disabled
                  className="w-full py-[11px] px-[13px] border-[1.5px] border-line rounded-[9px] text-[13px] text-ink-900 outline-none bg-white"
                >
                  <option>Operador / Analista de Proyecto</option>
                </select>
                <div className="flex gap-2 bg-paper border border-line rounded-lg px-[11px] py-[9px] mt-2">
                  <svg viewBox="0 0 24 24" fill="none" strokeWidth="1.8" className="w-3.5 h-3.5 stroke-ink-400 shrink-0 mt-[1px]">
                    <circle cx="12" cy="12" r="9" /><path d="M12 8v5M12 16h.01" />
                  </svg>
                  <p className="text-[11px] text-ink-600 leading-relaxed">
                    El rol Administrador SYC no se solicita por este formulario — se asigna internamente entre el equipo SYC.
                  </p>
                </div>
              </div>

              <div className="mb-0">
                <label className="block text-xs font-semibold text-ink-900 mb-1.5">Motivo de la solicitud</label>
                <textarea
                  placeholder="Cuéntanos brevemente tu rol en el proyecto y por qué necesitas acceso al sistema."
                  value={motivo}
                  onChange={(e) => setMotivo(e.target.value)}
                  className="w-full py-[11px] px-[13px] border-[1.5px] border-line rounded-[9px] text-[13px] text-ink-900 outline-none transition-colors resize-y min-h-[70px] focus:border-blue-500 focus:shadow-[0_0_0_3px_rgba(47,111,237,0.12)] placeholder:text-ink-400"
                />
              </div>

              {error && (
                <div className="mt-4 text-[12.5px] text-red-600 bg-red-50 border border-red-200 rounded-[9px] px-3 py-2">
                  {error}
                </div>
              )}

              <button
                type="submit"
                disabled={loading}
                className="w-full py-[13px] rounded-[10px] text-white font-semibold text-sm flex items-center justify-center gap-2 shadow-[0_8px_20px_-6px_rgba(47,111,237,0.55)] bg-[linear-gradient(145deg,var(--color-blue-500),var(--color-blue-600))] mt-1.5 disabled:opacity-60 disabled:cursor-not-allowed"
              >
                {loading ? 'Enviando...' : 'Enviar solicitud'}
                {!loading && (
                  <svg viewBox="0 0 24 24" width="15" height="15" fill="none" stroke="white" strokeWidth="2">
                    <path d="M5 12h14M13 6l6 6-6 6" />
                  </svg>
                )}
              </button>
            </form>
          )}

          {!exito && (
            <div className="text-center text-[12.5px] text-ink-600 mt-[18px]">
              ¿Ya tienes cuenta? <Link to="/login" className="text-blue-600 font-semibold hover:underline">Inicia sesión</Link>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}