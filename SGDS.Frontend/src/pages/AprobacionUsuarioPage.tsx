import { useState, useEffect } from 'react';
import Sidebar from '../components/layout/Sidebar';
import {
  getSolicitudesPendientes,
  aprobarSolicitud,
  rechazarSolicitud,
  type SolicitudAccesoResponseDto,
} from '../services/usuarioService';
import { getRoles, type RolDto } from '../services/rolService';
import { Link } from 'react-router-dom';

export default function AprobacionUsuariosPage() {
  const [solicitudes, setSolicitudes] = useState<SolicitudAccesoResponseDto[]>([]);
  const [roles, setRoles] = useState<RolDto[]>([]);
  const [loading, setLoading] = useState(true);

  const [rolSeleccionado, setRolSeleccionado] = useState<Record<number, number>>({});
  const [accionando, setAccionando] = useState<number | null>(null);

  const [modalRechazo, setModalRechazo] = useState<SolicitudAccesoResponseDto | null>(null);
  const [motivoRechazo, setMotivoRechazo] = useState('');

  const [resultadoAprobacion, setResultadoAprobacion] = useState<{
    nombre: string;
    email: string;
    passwordTemporal: string;
  } | null>(null);

  const rolesOperador = roles.filter((r) => r.nombre !== 'Administrador SYC');

  async function cargar() {
    setLoading(true);
    try {
      const [s, r] = await Promise.all([getSolicitudesPendientes(), getRoles()]);
      setSolicitudes(s);
      setRoles(r);
      const defaultRol = r.find((x) => x.nombre !== 'Administrador SYC');
      if (defaultRol) {
        setRolSeleccionado(
          Object.fromEntries(s.map((sol) => [sol.id, defaultRol.id]))
        );
      }
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    cargar();
  }, []);

  function tiempoRelativo(fechaIso: string) {
    const dias = Math.floor((Date.now() - new Date(fechaIso).getTime()) / (1000 * 60 * 60 * 24));
    if (dias <= 0) return 'Solicitado hoy';
    if (dias === 1) return 'Solicitado hace 1 día';
    return `Solicitado hace ${dias} días`;
  }

  function iniciales(nombre: string) {
    return nombre
      .split(' ')
      .filter(Boolean)
      .slice(0, 2)
      .map((p) => p[0])
      .join('')
      .toUpperCase();
  }

  async function handleAprobar(s: SolicitudAccesoResponseDto) {
    const rolId = rolSeleccionado[s.id];
    if (!rolId) return;
    setAccionando(s.id);
    try {
      const resultado = await aprobarSolicitud(s.id, { rolId });
      setSolicitudes((prev) => prev.filter((x) => x.id !== s.id));
      setResultadoAprobacion({
        nombre: s.nombreCompleto,
        email: resultado.email,
        passwordTemporal: resultado.passwordTemporal,
      });
    } catch (err: any) {
      alert(err?.response?.data?.mensaje ?? 'No se pudo aprobar la solicitud.');
    } finally {
      setAccionando(null);
    }
  }

  function abrirRechazo(s: SolicitudAccesoResponseDto) {
    setMotivoRechazo('');
    setModalRechazo(s);
  }

  async function confirmarRechazo() {
    if (!modalRechazo) return;
    setAccionando(modalRechazo.id);
    try {
      await rechazarSolicitud(modalRechazo.id, { motivo: motivoRechazo || null });
      setSolicitudes((prev) => prev.filter((x) => x.id !== modalRechazo.id));
      setModalRechazo(null);
    } catch (err: any) {
      alert(err?.response?.data?.mensaje ?? 'No se pudo rechazar la solicitud.');
    } finally {
      setAccionando(null);
    }
  }

  return (
    <div className="flex min-h-screen bg-paper">
      <Sidebar active="usuarios" />

      <main className="flex-1 px-[38px] py-7 overflow-y-auto">
        <div className="mb-5">
          <Link
              to="/usuarios"
              className="inline-flex items-center gap-1.5 text-[12.5px] text-ink-600 font-medium hover:text-ink-900 mb-2.5"
            >
              <svg viewBox="0 0 24 24" fill="none" strokeWidth="2" className="w-[13px] h-[13px] stroke-current">
                <path d="M19 12H5M11 18l-6-6 6-6" />
              </svg>
              Volver a Usuarios
          </Link>
          <h1 className="font-display text-[19px] font-semibold text-ink-900">
            Solicitudes de acceso pendientes
          </h1>
          <p className="text-ink-600 text-[12.5px] mt-[3px]">
            {solicitudes.length} registros esperando revisión — asigna proyecto y rol antes de aprobar
          </p>
        </div>

        {loading ? (
          <div className="text-center text-sm text-ink-400 py-10">Cargando solicitudes...</div>
        ) : solicitudes.length === 0 ? (
          <div className="bg-white border border-line rounded-2xl px-6 py-10 text-center">
            <p className="text-sm text-ink-600">No hay solicitudes pendientes por revisar.</p>
          </div>
        ) : (
          <div className="flex flex-col gap-3.5">
            {solicitudes.map((s) => (
              <div key={s.id} className="bg-white border border-line rounded-2xl p-5">
                <div className="flex items-start justify-between mb-3.5">
                  <div className="flex gap-3">
                    <div className="w-11 h-11 rounded-xl bg-blue-100 text-blue-600 flex items-center justify-center text-[15px] font-bold shrink-0">
                      {iniciales(s.nombreCompleto)}
                    </div>
                    <div>
                      <div className="text-[14.5px] font-semibold text-ink-900">{s.nombreCompleto}</div>
                      <div className="text-xs text-ink-600 mt-0.5">
                        {s.email} · CC {s.documentoIdentidad}
                      </div>
                      <div className="text-[11px] text-ink-400 mt-1">{tiempoRelativo(s.fechaSolicitud)}</div>
                    </div>
                  </div>
                </div>

                <div className="bg-paper rounded-[10px] px-4 py-3.5 mb-3.5">
                  <div className="flex gap-5 mb-2.5">
                    <div className="flex-1">
                      <div className="text-[10.5px] uppercase tracking-wide text-ink-400 mb-1">Teléfono</div>
                      <div className="text-[12.5px] font-semibold text-ink-900">
                        {s.telefono ?? 'No registrado'}
                      </div>
                    </div>
                    <div className="flex-1">
                      <div className="text-[10.5px] uppercase tracking-wide text-ink-400 mb-1">
                        Proyectos solicitados
                      </div>
                      <div className="flex gap-1 flex-wrap">
                        {s.proyectosSolicitados.map((p) => (
                          <span
                            key={p}
                            className="text-[10.5px] font-semibold text-blue-600 bg-blue-100 px-[9px] py-[3px] rounded-[10px]"
                          >
                            {p}
                          </span>
                        ))}
                      </div>
                    </div>
                  </div>
                  {s.motivo && (
                    <div className="text-xs text-ink-600 leading-relaxed mt-2.5 pt-2.5 border-t border-line">
                      "{s.motivo}"
                    </div>
                  )}
                </div>

                <div className="flex items-center gap-2.5">
                  <select
                    value={rolSeleccionado[s.id] ?? ''}
                    onChange={(e) =>
                      setRolSeleccionado((prev) => ({ ...prev, [s.id]: Number(e.target.value) }))
                    }
                    className="flex-1 py-[9px] px-3 border-[1.5px] border-line rounded-lg text-[12.5px] text-ink-900 outline-none"
                  >
                    {rolesOperador.map((r) => (
                      <option key={r.id} value={r.id}>{r.nombre}</option>
                    ))}
                  </select>
                  <button
                    onClick={() => abrirRechazo(s)}
                    disabled={accionando === s.id}
                    className="flex items-center gap-1.5 bg-white border-[1.5px] border-red-200 text-red-600 rounded-[9px] px-4 py-[9px] text-[12.5px] font-semibold disabled:opacity-60"
                  >
                    <svg viewBox="0 0 24 24" fill="none" strokeWidth="2" className="w-[13px] h-[13px] stroke-red-600">
                      <path d="M18 6L6 18M6 6l12 12" />
                    </svg>
                    Rechazar
                  </button>
                  <button
                    onClick={() => handleAprobar(s)}
                    disabled={accionando === s.id}
                    className="flex items-center gap-1.5 bg-[#0d9488] text-white rounded-[9px] px-4 py-[9px] text-[12.5px] font-semibold disabled:opacity-60"
                  >
                    <svg viewBox="0 0 24 24" fill="none" strokeWidth="2.5" className="w-[13px] h-[13px] stroke-white">
                      <path d="M5 12l4 4 10-10" />
                    </svg>
                    {accionando === s.id ? 'Procesando...' : 'Aprobar y asignar'}
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </main>

      {/* Modal de rechazo */}
      {modalRechazo && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-6">
          <div className="bg-white rounded-2xl p-7 w-full max-w-[380px]">
            <h2 className="font-display text-lg font-semibold text-ink-900 mb-1">Rechazar solicitud</h2>
            <p className="text-[12.5px] text-ink-600 mb-4">
              {modalRechazo.nombreCompleto} — {modalRechazo.email}
            </p>
            <label className="block text-xs font-semibold text-ink-900 mb-1.5">
              Motivo <span className="font-normal text-ink-400">(opcional)</span>
            </label>
            <textarea
              value={motivoRechazo}
              onChange={(e) => setMotivoRechazo(e.target.value)}
              placeholder="Explica brevemente por qué se rechaza..."
              className="w-full py-2.5 px-3 border-[1.5px] border-line rounded-[9px] text-[13px] outline-none resize-y min-h-[80px] focus:border-blue-500"
            />
            <div className="flex gap-2.5 mt-4">
              <button
                onClick={() => setModalRechazo(null)}
                className="flex-1 py-2.5 rounded-[9px] border border-line text-ink-600 text-sm font-medium"
              >
                Cancelar
              </button>
              <button
                onClick={confirmarRechazo}
                disabled={accionando === modalRechazo.id}
                className="flex-1 py-2.5 rounded-[9px] bg-red-600 text-white text-sm font-semibold disabled:opacity-60"
              >
                {accionando === modalRechazo.id ? 'Rechazando...' : 'Confirmar rechazo'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal de éxito — muestra la contraseña temporal UNA sola vez */}
      {resultadoAprobacion && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-6">
          <div className="bg-white rounded-2xl p-7 w-full max-w-[400px]">
            <div className="w-12 h-12 rounded-full bg-[#e3f7f4] flex items-center justify-center mb-4">
              <svg viewBox="0 0 24 24" fill="none" strokeWidth="2" className="w-6 h-6 stroke-[#0d9488]">
                <path d="M5 12l4 4 10-10" />
              </svg>
            </div>
            <h2 className="font-display text-lg font-semibold text-ink-900 mb-1">
              Usuario aprobado
            </h2>
            <p className="text-[13px] text-ink-600 mb-4">
              {resultadoAprobacion.nombre} ya tiene acceso a la plataforma. Comparte estas credenciales de forma segura — la contraseña no se podrá volver a consultar.
            </p>
            <div className="bg-paper border border-line rounded-[10px] px-4 py-3 mb-2">
              <div className="text-[10.5px] uppercase tracking-wide text-ink-400 mb-1">Correo</div>
              <div className="text-[13px] font-semibold text-ink-900">{resultadoAprobacion.email}</div>
            </div>
            <div className="bg-paper border border-line rounded-[10px] px-4 py-3 mb-5">
              <div className="text-[10.5px] uppercase tracking-wide text-ink-400 mb-1">Contraseña temporal</div>
              <div className="text-[13px] font-semibold text-ink-900 font-mono">
                {resultadoAprobacion.passwordTemporal}
              </div>
            </div>
            <button
              onClick={() => setResultadoAprobacion(null)}
              className="w-full py-2.5 rounded-[9px] bg-[#0d9488] text-white text-sm font-semibold"
            >
              Entendido
            </button>
          </div>
        </div>
      )}
    </div>
  );
}