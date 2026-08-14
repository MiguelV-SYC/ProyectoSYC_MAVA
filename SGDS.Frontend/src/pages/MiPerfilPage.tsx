import { useState, useEffect, type FormEvent } from 'react';
import { useAuth } from '../context/AuthContext';
import Sidebar from '../components/layout/Sidebar';
import { cambiarPassword } from '../services/authService';
import { getUsuarioPorId, type ProyectoUsuarioDto } from '../services/usuarioService';

function calcularFuerza(pass: string) {
  let puntos = 0;
  if (pass.length >= 8) puntos++;
  if (/[A-Z]/.test(pass)) puntos++;
  if (/[0-9]/.test(pass)) puntos++;
  if (/[^A-Za-z0-9]/.test(pass)) puntos++;
  return puntos; // 0 a 4
}

export default function MiPerfilPage() {
  const { user } = useAuth();
  const [proyectos, setProyectos] = useState<ProyectoUsuarioDto[]>([]);

  const [contrasenaActual, setContrasenaActual] = useState('');
  const [contrasenaNueva, setContrasenaNueva] = useState('');
  const [confirmarContrasena, setConfirmarContrasena] = useState('');

  const [guardando, setGuardando] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [exito, setExito] = useState(false);

  useEffect(() => {
    if (!user?.id) return;
    getUsuarioPorId(Number(user.id)).then((u) => setProyectos(u.proyectos));
  }, [user?.id]);

  const nombre = user?.nombreCompleto ?? '';
  const iniciales = nombre
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map((p) => p[0])
    .join('')
    .toUpperCase();
  const rol = user?.esAdminSyc ? 'Administrador SYC' : 'Operador · Analista';

  const fuerza = calcularFuerza(contrasenaNueva);
  const fuerzaLabel = ['', 'Débil', 'Regular', 'Buena', 'Segura'][fuerza];
  const fuerzaColor = ['bg-line', 'bg-red-400', 'bg-[#d97706]', 'bg-blue-500', 'bg-[#0d9488]'][fuerza];

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);
    setExito(false);

    if (contrasenaNueva.length < 8) {
      setError('La nueva contraseña debe tener al menos 8 caracteres.');
      return;
    }
    if (contrasenaNueva !== confirmarContrasena) {
      setError('La confirmación no coincide con la nueva contraseña.');
      return;
    }

    setGuardando(true);
    try {
      await cambiarPassword({ contrasenaActual, contrasenaNueva });
      setExito(true);
      setContrasenaActual('');
      setContrasenaNueva('');
      setConfirmarContrasena('');
    } catch (err: any) {
      setError(err?.response?.data?.mensaje ?? 'No se pudo actualizar la contraseña.');
    } finally {
      setGuardando(false);
    }
  }

  return (
    <div className="flex min-h-screen bg-paper">
      <Sidebar active="mi-perfil" />

      <main className="flex-1 px-[38px] py-7 overflow-y-auto max-w-[760px]">
        <h1 className="font-display text-[22px] font-semibold text-ink-900 mb-1.5">Mi perfil</h1>
        <p className="text-ink-600 text-[13px] mb-5">Consulta tu información de acceso y actualiza tu contraseña.</p>

        <div className="bg-white border border-line rounded-[14px] p-5 mb-5 flex items-center gap-4">
          <div className="w-14 h-14 rounded-2xl bg-blue-100 text-blue-600 flex items-center justify-center text-lg font-bold shrink-0">
            {iniciales}
          </div>
          <div>
            <div className="font-display text-[16px] font-semibold text-ink-900">{nombre}</div>
            <div className="text-[12.5px] text-ink-600 mb-1.5">{rol} · {user?.email}</div>
            <div className="flex gap-1.5 flex-wrap">
              {proyectos.map((p) => (
                <span
                  key={p.proyectoId}
                  className="text-[10.5px] font-semibold text-ink-600 bg-paper border border-line px-2 py-[3px] rounded-[10px]"
                >
                  {p.proyectoNombre}
                </span>
              ))}
            </div>
          </div>
        </div>

        <div className="bg-white border border-line rounded-[14px] p-5 mb-5">
          <h3 className="font-display text-[13.5px] font-semibold text-ink-900 mb-4">Información de la cuenta</h3>
          <div className="mb-4">
            <label className="block text-xs font-semibold text-ink-900 mb-1.5">Nombre completo</label>
            <input
              value={nombre}
              disabled
              className="w-full py-2.5 px-3 border-[1.5px] border-line rounded-[9px] text-[13px] bg-paper text-ink-400"
            />
          </div>
          <div>
            <label className="block text-xs font-semibold text-ink-900 mb-1.5">Correo electrónico</label>
            <input
              value={user?.email ?? ''}
              disabled
              className="w-full py-2.5 px-3 border-[1.5px] border-line rounded-[9px] text-[13px] bg-paper text-ink-400"
            />
          </div>
        </div>

        <form onSubmit={handleSubmit} className="bg-white border border-line rounded-[14px] p-5">
          <h3 className="font-display text-[13.5px] font-semibold text-ink-900 mb-4">Cambiar contraseña</h3>

          <div className="mb-4">
            <label className="block text-xs font-semibold text-ink-900 mb-1.5">Contraseña actual</label>
            <input
              type="password"
              value={contrasenaActual}
              onChange={(e) => setContrasenaActual(e.target.value)}
              required
              placeholder="Ingresa tu contraseña actual"
              className="w-full py-2.5 px-3 border-[1.5px] border-line rounded-[9px] text-[13px] outline-none focus:border-blue-500"
            />
          </div>

          <div className="mb-2">
            <label className="block text-xs font-semibold text-ink-900 mb-1.5">Nueva contraseña</label>
            <input
              type="password"
              value={contrasenaNueva}
              onChange={(e) => setContrasenaNueva(e.target.value)}
              required
              placeholder="Mínimo 8 caracteres"
              className="w-full py-2.5 px-3 border-[1.5px] border-line rounded-[9px] text-[13px] outline-none focus:border-blue-500"
            />
          </div>

          {contrasenaNueva.length > 0 && (
            <div className="mb-4">
              <div className="flex gap-1 mb-1.5">
                {[0, 1, 2, 3].map((i) => (
                  <div key={i} className={`h-1 flex-1 rounded-full ${i < fuerza ? fuerzaColor : 'bg-line'}`} />
                ))}
              </div>
              <p className="text-[11px] text-ink-400">
                {fuerzaLabel} — incluye mayúsculas, números y un símbolo
              </p>
            </div>
          )}

          <div className="mb-5">
            <label className="block text-xs font-semibold text-ink-900 mb-1.5">Confirmar nueva contraseña</label>
            <input
              type="password"
              value={confirmarContrasena}
              onChange={(e) => setConfirmarContrasena(e.target.value)}
              required
              placeholder="Repite la nueva contraseña"
              className="w-full py-2.5 px-3 border-[1.5px] border-line rounded-[9px] text-[13px] outline-none focus:border-blue-500"
            />
          </div>

          {error && (
            <div className="text-xs text-red-600 bg-red-50 border border-red-200 rounded-lg px-3 py-2 mb-4">
              {error}
            </div>
          )}
          {exito && (
            <div className="text-xs text-[#0d9488] bg-[#e3f7f4] border border-[#0d9488]/30 rounded-lg px-3 py-2 mb-4">
              Contraseña actualizada correctamente.
            </div>
          )}

          <div className="flex justify-end gap-2.5">
            <button
              type="button"
              onClick={() => { setContrasenaActual(''); setContrasenaNueva(''); setConfirmarContrasena(''); setError(null); }}
              className="px-5 py-2.5 rounded-[9px] border border-line text-ink-600 text-sm font-medium"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={guardando}
              className="flex items-center gap-2 px-5 py-2.5 rounded-[9px] bg-blue-600 text-white text-sm font-semibold disabled:opacity-60"
            >
              {guardando ? 'Guardando...' : 'Guardar cambios'}
              {!guardando && (
                <svg viewBox="0 0 24 24" fill="none" strokeWidth="2.5" className="w-[13px] h-[13px] stroke-white">
                  <path d="M5 12l4 4 10-10" />
                </svg>
              )}
            </button>
          </div>
        </form>
      </main>
    </div>
  );
}