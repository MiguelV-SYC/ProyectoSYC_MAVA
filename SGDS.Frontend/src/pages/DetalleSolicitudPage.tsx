import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import Sidebar from '../components/layout/Sidebar';
import {
  getSolicitudDetalle,
  cambiarEstado,
  asignarUsuario,
  type SolicitudDetalleResponseDto,
} from '../services/solicitudService';
import { getOperadoresPorProyecto, type OperadorProyectoDto } from '../services/proyectoService';

const ESTADOS = ['Radicada', 'En revisión', 'Pendiente', 'Requiere información', 'Aprobada', 'Rechazada', 'Finalizada'];

const ESTADO_STYLE: Record<string, string> = {
  Radicada: 'bg-[#f1f5f9] text-[#64748b]',
  'En revisión': 'bg-blue-100 text-blue-600',
  Pendiente: 'bg-[#fdf3e7] text-[#d97706]',
  'Requiere información': 'bg-[#f2ecff] text-[#7c3aed]',
  Aprobada: 'bg-[#e3f7f4] text-[#0d9488]',
  Rechazada: 'bg-[#fdeaea] text-[#dc2626]',
  Finalizada: 'bg-[#e3f7f4] text-[#0d9488]',
};

function formatearFechaHora(iso?: string) {
  if (!iso) return '—';
  const fecha = new Date(iso);
  if (isNaN(fecha.getTime())) return '—';
  return fecha.toLocaleString('es-CO', { day: '2-digit', month: 'short', year: 'numeric', hour: 'numeric', minute: '2-digit' });
}

function diasDesde(iso: string) {
  const dias = Math.floor((Date.now() - new Date(iso).getTime()) / 86400000);
  return dias <= 0 ? 'Hoy' : `${dias} día${dias === 1 ? '' : 's'} desde radicación`;
}

export default function DetalleSolicitudPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  const [solicitud, setSolicitud] = useState<SolicitudDetalleResponseDto | null>(null);
  const [loading, setLoading] = useState(true);

  const [datosAdicionales, setDatosAdicionales] = useState<Record<string, string> | null>(null);

  const [modalEstado, setModalEstado] = useState(false);
  const [nuevoEstado, setNuevoEstado] = useState('');
  const [guardandoEstado, setGuardandoEstado] = useState(false);

  const [modalReasignar, setModalReasignar] = useState(false);
  const [operadores, setOperadores] = useState<OperadorProyectoDto[]>([]);
  const [operadorElegido, setOperadorElegido] = useState('');
  const [guardandoReasignar, setGuardandoReasignar] = useState(false);

  async function cargar() {
    if (!id) return;
    setLoading(true);
    const s = await getSolicitudDetalle(Number(id));
    setSolicitud(s);
    try {
      setDatosAdicionales(s.datosAdicionales ? JSON.parse(s.datosAdicionales) : null);
    } catch {
      setDatosAdicionales(null);
    }
    setLoading(false);
  }

  useEffect(() => {
    cargar();
  }, [id]);

  async function handleCambiarEstado() {
    if (!solicitud || !nuevoEstado) return;
    setGuardandoEstado(true);
    try {
      await cambiarEstado(solicitud.id, nuevoEstado);
      setModalEstado(false);
      await cargar();
    } catch (err: any) {
      alert(err?.response?.data?.mensaje ?? 'No se pudo cambiar el estado.');
    } finally {
      setGuardandoEstado(false);
    }
  }

  async function abrirReasignar() {
    if (!solicitud) return;
    setModalReasignar(true);
    setOperadorElegido('');
    const proyId = (solicitud as any).proyectoId ?? null;
    if (proyId) {
      const ops = await getOperadoresPorProyecto(proyId);
      setOperadores(ops);
    }
  }

  async function handleReasignar() {
    if (!solicitud || !operadorElegido) return;
    setGuardandoReasignar(true);
    try {
      await asignarUsuario(solicitud.id, Number(operadorElegido));
      setModalReasignar(false);
      await cargar();
    } catch (err: any) {
      alert(err?.response?.data?.mensaje ?? 'No se pudo reasignar.');
    } finally {
      setGuardandoReasignar(false);
    }
  }

  if (loading || !solicitud) {
    return (
      <div className="flex min-h-screen bg-paper">
        <Sidebar active="solicitudes" />
        <main className="flex-1 flex items-center justify-center text-sm text-ink-400">Cargando solicitud...</main>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen bg-paper">
      <Sidebar active="solicitudes" />

      <main className="flex-1 px-[38px] py-7 overflow-y-auto">
        <div className="flex items-center gap-1.5 text-xs text-ink-400 mb-3.5">
          <span className="text-ink-600">{solicitud.proyectoNombre}</span>
          <span>/</span>
          <button onClick={() => navigate(-1)} className="hover:underline">Solicitudes</button>
          <span>/</span>
          <span className="text-ink-900 font-semibold">#{solicitud.numero}</span>
        </div>

        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3.5">
            <div className="w-11 h-11 rounded-xl bg-[#e3f7f4] flex items-center justify-center shrink-0">
              <svg viewBox="0 0 24 24" fill="none" strokeWidth="1.8" className="w-5 h-5 stroke-[#0d9488]">
                <path d="M6 3h9l5 5v13H6z" /><path d="M14 3v5h5" />
              </svg>
            </div>
            <div>
              <h1 className="font-display text-[19px] font-semibold text-ink-900">
                #{solicitud.numero} · {solicitud.tipoSolicitudNombre}
              </h1>
              <p className="text-ink-600 text-[12.5px] mt-[2px]">
                Radicada el {formatearFechaHora(solicitud.fechaCreacion)} · {solicitud.proyectoNombre}
              </p>
            </div>
          </div>
          <div className="flex gap-2.5">
            <button
              disabled
              title="Disponible en el módulo de Documentos"
              className="flex items-center gap-1.5 bg-white border border-line text-ink-400 rounded-[9px] px-3.5 py-2 text-[12.5px] font-semibold opacity-60 cursor-not-allowed"
            >
              <svg viewBox="0 0 24 24" fill="none" strokeWidth="1.8" className="w-[13px] h-[13px] stroke-ink-400">
                <rect x="5" y="3" width="14" height="18" rx="2" /><path d="M9 8h6M9 12h6" />
              </svg>
              Adjuntar documento
            </button>
            <button
              onClick={() => { setNuevoEstado(solicitud.estado); setModalEstado(true); }}
              className="flex items-center gap-1.5 bg-[#0d9488] text-white rounded-[9px] px-4 py-2 text-[12.5px] font-semibold"
            >
              Cambiar estado
              <svg viewBox="0 0 24 24" fill="none" strokeWidth="2.2" className="w-3 h-3 stroke-white">
                <path d="M6 9l6 6 6-6" />
              </svg>
            </button>
          </div>
        </div>

        <div className="grid grid-cols-[1fr_280px] gap-5 items-start">
          <div className="flex flex-col gap-5">
            <div className="bg-white border border-line rounded-[14px] p-5">
              <h3 className="font-display text-[13.5px] font-semibold text-ink-900 mb-4">Información de la solicitud</h3>
              <div className="grid grid-cols-2 gap-x-8 gap-y-4">
                <div>
                  <div className="text-[10.5px] uppercase tracking-wide text-ink-400 font-semibold mb-1">Estado actual</div>
                  <span className={`inline-flex items-center gap-1.5 text-[11.5px] font-semibold px-[10px] py-[5px] rounded-full ${ESTADO_STYLE[solicitud.estado] ?? 'bg-paper text-ink-600'}`}>
                    <span className="w-1.5 h-1.5 rounded-full bg-current" />
                    {solicitud.estado}
                  </span>
                </div>
                <div>
                  <div className="text-[10.5px] uppercase tracking-wide text-ink-400 font-semibold mb-1">Tipo de solicitud</div>
                  <div className="text-[13.5px] font-semibold text-ink-900">{solicitud.tipoSolicitudNombre}</div>
                </div>
                <div>
                  <div className="text-[10.5px] uppercase tracking-wide text-ink-400 font-semibold mb-1">Afiliado</div>
                  <div className="text-[13.5px] font-semibold text-ink-900">{solicitud.ciudadanoNombre ?? solicitud.empresaNombre}</div>
                </div>
                <div>
                  <div className="text-[10.5px] uppercase tracking-wide text-ink-400 font-semibold mb-1">Documento</div>
                  <div className="text-[13.5px] font-semibold text-ink-900">{solicitud.ciudadanoDocumento ?? solicitud.empresaNit}</div>
                </div>
                <div>
                  <div className="text-[10.5px] uppercase tracking-wide text-ink-400 font-semibold mb-1">Fecha de radicación</div>
                  <div className="text-[13.5px] font-semibold text-ink-900">{formatearFechaHora(solicitud.fechaCreacion)}</div>
                </div>
                <div>
                  <div className="text-[10.5px] uppercase tracking-wide text-ink-400 font-semibold mb-1">Última actualización</div>
                  <div className="text-[13.5px] font-semibold text-ink-900">
                    {formatearFechaHora(solicitud.historialEstados[0]?.fechaCambio ?? solicitud.fechaCreacion)}
                  </div>
                </div>
              </div>

              {datosAdicionales && Object.keys(datosAdicionales).length > 0 && (
                <div className="mt-4 bg-paper rounded-[9px] px-4 py-3 text-[12.5px] text-ink-900 flex flex-wrap gap-x-5 gap-y-1.5">
                  {Object.entries(datosAdicionales).map(([k, v]) => (
                    <span key={k}><b className="capitalize">{k}:</b> {v || '—'}</span>
                  ))}
                </div>
              )}
            </div>

            <div className="bg-white border border-line rounded-[14px] p-5">
              <h3 className="font-display text-[13.5px] font-semibold text-ink-900 mb-4">Historial de estados</h3>
              <div className="flex flex-col">
                {solicitud.historialEstados.length === 0 && (
                  <p className="text-xs text-ink-400">Sin cambios de estado registrados todavía.</p>
                )}
                {solicitud.historialEstados.map((h, i) => (
                  <div key={i} className="flex gap-3 pb-4 last:pb-0">
                    <div className="flex flex-col items-center">
                      <div className={`w-3.5 h-3.5 rounded-full border-2 shrink-0 ${i === 0 ? 'border-[#0d9488] bg-[#e3f7f4]' : 'border-line bg-white'}`} />
                      {i < solicitud.historialEstados.length - 1 && <div className="w-px flex-1 bg-line" />}
                    </div>
                    <div className="pb-1">
                      <div className="text-[13.5px] font-semibold text-ink-900">{h.estadoNuevo}</div>
                      <div className="text-[11.5px] text-ink-400 mb-1">
                        {h.usuarioNombre ?? 'Sistema'} · {formatearFechaHora(h.fechaCambio)}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="bg-white border border-line rounded-[14px] p-5">
              <h3 className="font-display text-[13.5px] font-semibold text-ink-900 mb-4">Documentos adjuntos</h3>
              {solicitud.documentos.length === 0 ? (
                <p className="text-xs text-ink-400 mb-3">Esta solicitud no tiene documentos adjuntos todavía.</p>
              ) : (
                <div className="flex flex-col gap-1.5 mb-3">
                  {solicitud.documentos.map((d) => (
                    <div key={d.id} className="flex items-center gap-3 bg-paper border border-line rounded-[9px] px-3.5 py-2.5">
                      <svg viewBox="0 0 24 24" fill="none" strokeWidth="1.8" className="w-4 h-4 stroke-ink-600 shrink-0">
                        <rect x="5" y="3" width="14" height="18" rx="2" /><path d="M9 8h6M9 12h6" />
                      </svg>
                      <div className="flex-1">
                        <div className="text-[13px] font-semibold text-ink-900">{d.nombreArchivo}</div>
                        <div className="text-[11px] text-ink-400">Subido {formatearFechaHora(d.fecha)}</div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
              <div className="border border-dashed border-line rounded-xl px-4 py-6 text-center text-[12px] text-ink-400">
                Adjuntar documentos estará disponible en el módulo de Documentos.
              </div>
            </div>
          </div>

          <div className="flex flex-col gap-4">
            <div className="bg-white border border-line rounded-[14px] p-4">
              <div className="text-[10.5px] uppercase tracking-wide text-ink-400 font-semibold mb-2.5">Operador asignado</div>
              {solicitud.usuarioAsignadoNombre ? (
                <div className="flex items-center gap-2.5 mb-2">
                  <div className="w-8 h-8 rounded-lg bg-blue-100 text-blue-600 flex items-center justify-center text-xs font-bold shrink-0">
                    {solicitud.usuarioAsignadoNombre.split(' ').slice(0, 2).map((p) => p[0]).join('').toUpperCase()}
                  </div>
                  <div className="text-[13px] font-semibold text-ink-900">{solicitud.usuarioAsignadoNombre}</div>
                </div>
              ) : (
                <p className="text-xs text-ink-400 italic mb-2">Sin asignar</p>
              )}
              <button onClick={abrirReasignar} className="text-[12px] font-semibold text-blue-600">Reasignar</button>
            </div>

            <div className="bg-white border border-line rounded-[14px] p-4">
              <div className="text-[10.5px] uppercase tracking-wide text-ink-400 font-semibold mb-2">Ciudadano vinculado</div>
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-lg bg-blue-100 text-blue-600 flex items-center justify-center text-xs font-bold shrink-0">
                  {(solicitud.ciudadanoNombre ?? solicitud.empresaNombre ?? '').split(' ').slice(0, 2).map((p) => p[0]).join('').toUpperCase()}
                </div>
                <div>
                  <div className="text-[13px] font-semibold text-ink-900">{solicitud.ciudadanoNombre ?? solicitud.empresaNombre}</div>
                  <div className="text-[11px] text-ink-400">{solicitud.ciudadanoDocumento ?? solicitud.empresaNit}</div>
                </div>
              </div>
            </div>

            <div className="bg-white border border-line rounded-[14px] p-4">
              <div className="text-[10.5px] uppercase tracking-wide text-ink-400 font-semibold mb-1.5">Proyecto</div>
              <div className="text-[13px] font-semibold text-ink-900">{solicitud.proyectoNombre}</div>
            </div>

            <div className="bg-white border border-line rounded-[14px] p-4">
              <div className="text-[10.5px] uppercase tracking-wide text-ink-400 font-semibold mb-1.5">Días en curso</div>
              <div className="text-[13px] font-semibold text-ink-900">{diasDesde(solicitud.fechaCreacion)}</div>
            </div>
          </div>
        </div>
      </main>

      {modalEstado && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-6">
          <div className="bg-white rounded-2xl p-7 w-full max-w-[380px]">
            <h2 className="font-display text-lg font-semibold text-ink-900 mb-4">Cambiar estado</h2>
            <select
              value={nuevoEstado}
              onChange={(e) => setNuevoEstado(e.target.value)}
              className="w-full py-2.5 px-3 border-[1.5px] border-line rounded-[9px] text-[13px] outline-none mb-5"
            >
              {ESTADOS.map((e) => <option key={e} value={e}>{e}</option>)}
            </select>
            <div className="flex gap-2.5">
              <button onClick={() => setModalEstado(false)} className="flex-1 py-2.5 rounded-[9px] border border-line text-ink-600 text-sm font-medium">
                Cancelar
              </button>
              <button
                onClick={handleCambiarEstado}
                disabled={guardandoEstado}
                className="flex-1 py-2.5 rounded-[9px] bg-[#0d9488] text-white text-sm font-semibold disabled:opacity-60"
              >
                {guardandoEstado ? 'Guardando...' : 'Confirmar'}
              </button>
            </div>
          </div>
        </div>
      )}

      {modalReasignar && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-6">
          <div className="bg-white rounded-2xl p-7 w-full max-w-[380px]">
            <h2 className="font-display text-lg font-semibold text-ink-900 mb-4">Reasignar operador</h2>
            {operadores.length === 0 ? (
              <p className="text-xs text-ink-400 mb-5">No hay operadores disponibles para este proyecto.</p>
            ) : (
              <select
                value={operadorElegido}
                onChange={(e) => setOperadorElegido(e.target.value)}
                className="w-full py-2.5 px-3 border-[1.5px] border-line rounded-[9px] text-[13px] outline-none mb-5"
              >
                <option value="">Selecciona un operador</option>
                {operadores.map((o) => (
                  <option key={o.usuarioId} value={o.usuarioId}>{o.nombreCompleto} — {o.rolNombre}</option>
                ))}
              </select>
            )}
            <div className="flex gap-2.5">
              <button onClick={() => setModalReasignar(false)} className="flex-1 py-2.5 rounded-[9px] border border-line text-ink-600 text-sm font-medium">
                Cancelar
              </button>
              <button
                onClick={handleReasignar}
                disabled={guardandoReasignar || !operadorElegido}
                className="flex-1 py-2.5 rounded-[9px] bg-[#0d9488] text-white text-sm font-semibold disabled:opacity-60"
              >
                {guardandoReasignar ? 'Guardando...' : 'Confirmar'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}