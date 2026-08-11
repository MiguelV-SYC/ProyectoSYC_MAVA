import { useState, useEffect, type FormEvent } from 'react';
import Sidebar from '../components/layout/Sidebar';
import {
  getProyectosAdmin,
  crearProyecto,
  actualizarProyecto,
  type ProyectoResponseDto,
} from '../services/proyectoService';
import {
  getTiposSolicitudPorProyecto,
  crearTipoSolicitud,
  actualizarTipoSolicitud,
  eliminarTipoSolicitud,
  type TipoSolicitudResponseDto,
} from '../services/tipoSolicitudService';

const ICONOS: Record<string, JSX.Element> = {
  Comfenalco: <svg viewBox="0 0 24 24" fill="none" strokeWidth="1.8"><path d="M3 11l9-8 9 8" /><path d="M5 10v10h14V10" /></svg>,
  Colpensiones: <svg viewBox="0 0 24 24" fill="none" strokeWidth="1.8"><path d="M12 2l8 4v6c0 5-3.5 8.5-8 10-4.5-1.5-8-5-8-10V6l8-4z" /></svg>,
  'Pasivos Laborales': <svg viewBox="0 0 24 24" fill="none" strokeWidth="1.8"><path d="M4 21V8l8-5 8 5v13" /><path d="M9 21v-6h6v6" /></svg>,
  SYCTrace: <svg viewBox="0 0 24 24" fill="none" strokeWidth="1.8"><rect x="4" y="9" width="16" height="10" rx="1.5" /><path d="M8 9V6a4 4 0 018 0v3" /></svg>,
  Infoconsumo: <svg viewBox="0 0 24 24" fill="none" strokeWidth="1.8"><rect x="3" y="6" width="14" height="10" rx="1.5" /><path d="M17 9l4-2v10l-4-2" /></svg>,
  Gotrace: <svg viewBox="0 0 24 24" fill="none" strokeWidth="1.8" strokeDasharray="3 3"><path d="M4 18c4-8 12-8 16 0" /></svg>,
  Estampillas: <svg viewBox="0 0 24 24" fill="none" strokeWidth="1.8"><rect x="5" y="4" width="14" height="16" rx="2" /><circle cx="12" cy="12" r="3.2" /></svg>,
  IUVA: <svg viewBox="0 0 24 24" fill="none" strokeWidth="1.8"><rect x="3" y="10" width="14" height="7" rx="1.5" /><path d="M6 10l1.5-4h6L15 10" /><circle cx="6.5" cy="17.5" r="1.6" /><circle cx="14.5" cy="17.5" r="1.6" /></svg>,
  'Libro Total': <svg viewBox="0 0 24 24" fill="none" strokeWidth="1.8"><path d="M4 7l8-4 8 4-8 4-8-4z" /><path d="M4 12l8 4 8-4M4 17l8 4 8-4" /></svg>,
};

const ICONO_DEFAULT = (
  <svg viewBox="0 0 24 24" fill="none" strokeWidth="1.8"><rect x="3" y="4" width="18" height="16" rx="2" /><path d="M3 9h18" /></svg>
);

export default function GestionProyectosPage() {
  const [proyectos, setProyectos] = useState<ProyectoResponseDto[]>([]);
  const [loading, setLoading] = useState(true);

  const [modalProyecto, setModalProyecto] = useState<'crear' | 'editar' | null>(null);
  const [proyectoEditando, setProyectoEditando] = useState<ProyectoResponseDto | null>(null);
  const [formNombre, setFormNombre] = useState('');
  const [formCodigo, setFormCodigo] = useState('');
  const [formDescripcion, setFormDescripcion] = useState('');
  const [formActivo, setFormActivo] = useState(true);
  const [formEstadoPersonalizado, setFormEstadoPersonalizado] = useState('');
  const [guardando, setGuardando] = useState(false);
  const [errorModal, setErrorModal] = useState<string | null>(null);

  const [modalTipos, setModalTipos] = useState<ProyectoResponseDto | null>(null);
  const [tipos, setTipos] = useState<TipoSolicitudResponseDto[]>([]);
  const [tiposLoading, setTiposLoading] = useState(false);
  const [nuevoTipoNombre, setNuevoTipoNombre] = useState('');
  const [tipoEditandoId, setTipoEditandoId] = useState<number | null>(null);
  const [tipoEditandoNombre, setTipoEditandoNombre] = useState('');

  async function cargarProyectos() {
    setLoading(true);
    try {
      const p = await getProyectosAdmin();
      setProyectos(p);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    cargarProyectos();
  }, []);

  function abrirCrearProyecto() {
    setProyectoEditando(null);
    setFormNombre('');
    setFormCodigo('');
    setFormDescripcion('');
    setFormActivo(true);
    setFormEstadoPersonalizado('');
    setErrorModal(null);
    setModalProyecto('crear');
  }

  function abrirEditarProyecto(p: ProyectoResponseDto) {
    setProyectoEditando(p);
    setFormNombre(p.nombre);
    setFormCodigo(p.codigo);
    setFormDescripcion(p.descripcion);
    setFormActivo(p.activo);
    setFormEstadoPersonalizado(p.estadoPersonalizado ?? '');
    setErrorModal(null);
    setModalProyecto('editar');
  }

  async function handleSubmitProyecto(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setGuardando(true);
    setErrorModal(null);
    try {
      if (modalProyecto === 'crear') {
        await crearProyecto({ nombre: formNombre, codigo: formCodigo, descripcion: formDescripcion });
      } else if (modalProyecto === 'editar' && proyectoEditando) {
        await actualizarProyecto(proyectoEditando.id, {
          nombre: formNombre,
          descripcion: formDescripcion,
          activo: formActivo,
          estadoPersonalizado: formEstadoPersonalizado || null,
        });
      }
      setModalProyecto(null);
      await cargarProyectos();
    } catch (err: any) {
      setErrorModal(err?.response?.data?.mensaje ?? 'No se pudo guardar. Intenta de nuevo.');
    } finally {
      setGuardando(false);
    }
  }

  async function abrirTiposSolicitud(p: ProyectoResponseDto) {
    setModalTipos(p);
    setTiposLoading(true);
    setNuevoTipoNombre('');
    setTipoEditandoId(null);
    try {
      const t = await getTiposSolicitudPorProyecto(p.id);
      setTipos(t);
    } finally {
      setTiposLoading(false);
    }
  }

  async function handleAgregarTipo() {
    if (!modalTipos || !nuevoTipoNombre.trim()) return;
    const nuevo = await crearTipoSolicitud({ nombre: nuevoTipoNombre.trim(), proyectoId: modalTipos.id });
    setTipos((prev) => [...prev, nuevo]);
    setNuevoTipoNombre('');
  }

  function iniciarEdicionTipo(t: TipoSolicitudResponseDto) {
    setTipoEditandoId(t.id);
    setTipoEditandoNombre(t.nombre);
  }

  async function guardarEdicionTipo() {
    if (tipoEditandoId === null || !tipoEditandoNombre.trim()) return;
    await actualizarTipoSolicitud(tipoEditandoId, { nombre: tipoEditandoNombre.trim() });
    setTipos((prev) =>
      prev.map((t) => (t.id === tipoEditandoId ? { ...t, nombre: tipoEditandoNombre.trim() } : t))
    );
    setTipoEditandoId(null);
  }

  async function handleEliminarTipo(id: number) {
    if (!confirm('¿Eliminar este tipo de solicitud?')) return;
    await eliminarTipoSolicitud(id);
    setTipos((prev) => prev.filter((t) => t.id !== id));
  }

  function cerrarModalTipos() {
    setModalTipos(null);
    cargarProyectos(); // refresca los conteos en las tarjetas
  }

  return (
    <div className="flex min-h-screen bg-paper">
      <Sidebar active="proyectos" />

      <main className="flex-1 px-[38px] py-7 overflow-y-auto">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="font-display text-[19px] font-semibold text-ink-900">Proyectos</h1>
            <p className="text-ink-600 text-[12.5px] mt-[3px]">
              Administra los {proyectos.length} proyectos cliente y sus tipos de solicitud
            </p>
          </div>
          <button
            onClick={abrirCrearProyecto}
            className="flex items-center gap-[7px] bg-[#0d9488] text-white rounded-[10px] px-4 py-[10px] text-[13px] font-semibold shadow-[0_8px_18px_-6px_rgba(13,148,136,0.5)]"
          >
            <svg viewBox="0 0 24 24" fill="none" strokeWidth="2.2" className="w-[15px] h-[15px] stroke-white">
              <path d="M12 5v14M5 12h14" />
            </svg>
            Nuevo proyecto
          </button>
        </div>

        {loading ? (
          <div className="text-center text-sm text-ink-400 py-10">Cargando proyectos...</div>
        ) : (
          <div className="grid grid-cols-3 gap-[14px]">
            {proyectos.map((p) => (
              <div key={p.id} className="relative bg-white border border-line rounded-2xl p-5">
                <span
                  className={`absolute top-[18px] right-[18px] text-[10px] font-semibold px-[9px] py-[3px] rounded-full ${
                    p.estadoPersonalizado
                      ? 'bg-[#fdf3e7] text-[#96631a]'
                      : p.activo
                      ? 'bg-[#e3f7f4] text-[#0d9488]'
                      : 'bg-[#f1f5f9] text-ink-600'
                  }`}
                >
                  {p.estadoPersonalizado ?? (p.activo ? 'Activo' : 'Inactivo')}
                </span>

                <div className="w-[42px] h-[42px] rounded-xl bg-blue-100 flex items-center justify-center mb-3 [&>svg]:w-[19px] [&>svg]:h-[19px] [&>svg]:stroke-blue-600">
                  {ICONOS[p.nombre] ?? ICONO_DEFAULT}
                </div>
                <div className="font-display font-semibold text-[14.5px] text-ink-900 mb-1">{p.nombre}</div>
                <div className="text-[11.5px] text-ink-600 leading-relaxed min-h-[34px] mb-3.5">
                  {p.descripcion}
                </div>

                <div className="flex gap-3.5 pt-3 border-t border-line">
                  <div>
                    <div className="font-display text-[15px] font-bold text-ink-900">
                      {p.totalTiposSolicitud > 0 ? p.totalTiposSolicitud : '—'}
                    </div>
                    <div className="text-[10px] text-ink-400">
                      {p.totalTiposSolicitud > 0 ? 'Tipos de solicitud' : 'Por definir'}
                    </div>
                  </div>
                  <div>
                    <div className="font-display text-[15px] font-bold text-ink-900">{p.totalOperadores}</div>
                    <div className="text-[10px] text-ink-400">Operadores</div>
                  </div>
                </div>

                <div className="flex gap-3 mt-3">
                  <button
                    onClick={() => abrirTiposSolicitud(p)}
                    className="text-[11.5px] font-semibold text-blue-600"
                  >
                    {p.totalTiposSolicitud > 0 ? 'Editar' : 'Definir'} tipos de solicitud →
                  </button>
                  <button
                    onClick={() => abrirEditarProyecto(p)}
                    className="text-[11.5px] font-semibold text-ink-400 hover:text-ink-600"
                  >
                    Editar proyecto
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </main>

      {/* Modal: crear/editar proyecto */}
      {modalProyecto && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-6">
          <div className="bg-white rounded-2xl p-7 w-full max-w-[400px]">
            <h2 className="font-display text-lg font-semibold text-ink-900 mb-4">
              {modalProyecto === 'crear' ? 'Nuevo proyecto' : 'Editar proyecto'}
            </h2>
            <form onSubmit={handleSubmitProyecto} className="flex flex-col gap-3.5">
              <div>
                <label className="block text-xs font-semibold text-ink-900 mb-1.5">Nombre</label>
                <input
                  value={formNombre}
                  onChange={(e) => setFormNombre(e.target.value)}
                  required
                  className="w-full py-2.5 px-3 border-[1.5px] border-line rounded-[9px] text-[13px] outline-none focus:border-blue-500"
                />
              </div>

              {modalProyecto === 'crear' && (
                <div>
                  <label className="block text-xs font-semibold text-ink-900 mb-1.5">Código</label>
                  <input
                    value={formCodigo}
                    onChange={(e) => setFormCodigo(e.target.value)}
                    required
                    placeholder="ej. IUVA"
                    className="w-full py-2.5 px-3 border-[1.5px] border-line rounded-[9px] text-[13px] outline-none focus:border-blue-500"
                  />
                </div>
              )}

              <div>
                <label className="block text-xs font-semibold text-ink-900 mb-1.5">Descripción</label>
                <textarea
                  value={formDescripcion}
                  onChange={(e) => setFormDescripcion(e.target.value)}
                  required
                  className="w-full py-2.5 px-3 border-[1.5px] border-line rounded-[9px] text-[13px] outline-none resize-y min-h-[70px] focus:border-blue-500"
                />
              </div>

              {modalProyecto === 'editar' && (
                <>
                  <div>
                    <label className="block text-xs font-semibold text-ink-900 mb-1.5">Estado</label>
                    <div className="flex gap-2">
                      <button
                        type="button"
                        onClick={() => setFormActivo(true)}
                        className={`flex-1 py-2.5 rounded-[9px] text-sm font-semibold border-[1.5px] ${
                          formActivo ? 'bg-[#e3f7f4] border-[#0d9488] text-[#0d9488]' : 'border-line text-ink-400'
                        }`}
                      >
                        Activo
                      </button>
                      <button
                        type="button"
                        onClick={() => setFormActivo(false)}
                        className={`flex-1 py-2.5 rounded-[9px] text-sm font-semibold border-[1.5px] ${
                          !formActivo ? 'bg-red-50 border-red-400 text-red-600' : 'border-line text-ink-400'
                        }`}
                      >
                        Inactivo
                      </button>
                    </div>
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-ink-900 mb-1.5">
                      Estado personalizado <span className="font-normal text-ink-400">(opcional, ej. "En reingeniería")</span>
                    </label>
                    <input
                      value={formEstadoPersonalizado}
                      onChange={(e) => setFormEstadoPersonalizado(e.target.value)}
                      placeholder="Dejar vacío para usar el estado normal"
                      className="w-full py-2.5 px-3 border-[1.5px] border-line rounded-[9px] text-[13px] outline-none focus:border-blue-500"
                    />
                  </div>
                </>
              )}

              {errorModal && (
                <div className="text-xs text-red-600 bg-red-50 border border-red-200 rounded-lg px-3 py-2">
                  {errorModal}
                </div>
              )}

              <div className="flex gap-2.5 mt-2">
                <button
                  type="button"
                  onClick={() => setModalProyecto(null)}
                  className="flex-1 py-2.5 rounded-[9px] border border-line text-ink-600 text-sm font-medium"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={guardando}
                  className="flex-1 py-2.5 rounded-[9px] bg-[#0d9488] text-white text-sm font-semibold disabled:opacity-60"
                >
                  {guardando ? 'Guardando...' : 'Guardar'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal: tipos de solicitud del proyecto */}
      {modalTipos && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-6">
          <div className="bg-white rounded-2xl p-7 w-full max-w-[440px]">
            <h2 className="font-display text-lg font-semibold text-ink-900 mb-1">
              Tipos de solicitud — {modalTipos.nombre}
            </h2>
            <p className="text-[12.5px] text-ink-600 mb-4">
              Define los trámites disponibles para este proyecto.
            </p>

            <div className="flex gap-2 mb-4">
              <input
                value={nuevoTipoNombre}
                onChange={(e) => setNuevoTipoNombre(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleAgregarTipo()}
                placeholder="Nombre del nuevo tipo de solicitud"
                className="flex-1 py-2.5 px-3 border-[1.5px] border-line rounded-[9px] text-[13px] outline-none focus:border-blue-500"
              />
              <button
                onClick={handleAgregarTipo}
                className="bg-[#0d9488] text-white rounded-[9px] px-4 text-[13px] font-semibold"
              >
                Agregar
              </button>
            </div>

            {tiposLoading ? (
              <p className="text-sm text-ink-400 text-center py-6">Cargando...</p>
            ) : tipos.length === 0 ? (
              <p className="text-sm text-ink-400 text-center py-6">
                Este proyecto aún no tiene tipos de solicitud definidos.
              </p>
            ) : (
              <div className="flex flex-col gap-1.5 max-h-[280px] overflow-y-auto">
                {tipos.map((t) => (
                  <div
                    key={t.id}
                    className="flex items-center gap-2 bg-paper border border-line rounded-[9px] px-3 py-2"
                  >
                    {tipoEditandoId === t.id ? (
                      <input
                        value={tipoEditandoNombre}
                        onChange={(e) => setTipoEditandoNombre(e.target.value)}
                        onKeyDown={(e) => e.key === 'Enter' && guardarEdicionTipo()}
                        autoFocus
                        className="flex-1 py-1 px-2 border border-blue-400 rounded-md text-[13px] outline-none"
                      />
                    ) : (
                      <span className="flex-1 text-[13px] text-ink-900">{t.nombre}</span>
                    )}

                    {tipoEditandoId === t.id ? (
                      <button
                        onClick={guardarEdicionTipo}
                        className="text-[11.5px] font-semibold text-[#0d9488]"
                      >
                        Guardar
                      </button>
                    ) : (
                      <button
                        onClick={() => iniciarEdicionTipo(t)}
                        className="w-7 h-7 rounded-md bg-white border border-line flex items-center justify-center shrink-0"
                      >
                        <svg viewBox="0 0 24 24" fill="none" strokeWidth="1.8" className="w-[13px] h-[13px] stroke-ink-600">
                          <path d="M12 20h9M16.5 3.5a2.1 2.1 0 013 3L7 19l-4 1 1-4L16.5 3.5z" />
                        </svg>
                      </button>
                    )}
                    <button
                      onClick={() => handleEliminarTipo(t.id)}
                      className="w-7 h-7 rounded-md bg-white border border-red-200 flex items-center justify-center shrink-0"
                    >
                      <svg viewBox="0 0 24 24" fill="none" strokeWidth="1.8" className="w-[13px] h-[13px] stroke-red-500">
                        <path d="M18 6L6 18M6 6l12 12" />
                      </svg>
                    </button>
                  </div>
                ))}
              </div>
            )}

            <button
              onClick={cerrarModalTipos}
              className="w-full mt-5 py-2.5 rounded-[9px] border border-line text-ink-600 text-sm font-medium"
            >
              Cerrar
            </button>
          </div>
        </div>
      )}
    </div>
  );
}