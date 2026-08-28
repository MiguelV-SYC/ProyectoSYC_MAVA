import { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import Sidebar from '../components/layout/Sidebar';
import { useAuth } from '../context/AuthContext';
import {
  getDocumentosListado,
  subirDocumento,
  descargarDocumento,
  type DocumentoListadoDto,
  type ConteoTipoDto,
} from '../services/documentoService';
import { getSolicitudesListado, type SolicitudResponseDto } from '../services/solicitudService';
import { getProyectosActivos, getProyectosAdmin, type ProyectoResponseDto } from '../services/proyectoService';
import { useColorProyectoActivo } from '../hooks/useColorProyectoActivo';

const POR_PAGINA = 8;

function formatearTamano(bytes: number) {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(0)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

function formatearFecha(iso: string) {
  const fecha = new Date(iso);
  if (isNaN(fecha.getTime())) return '—';
  return fecha.toLocaleDateString('es-CO', { day: '2-digit', month: 'short', year: 'numeric' });
}

const ICONO_CATEGORIA: Record<string, React.ReactNode> = {
  Imágenes: <><rect x="3" y="3" width="18" height="18" rx="2" /><circle cx="8.5" cy="8.5" r="1.5" /><path d="M21 15l-5-5L5 21" /></>,
  PDF: <><rect x="5" y="3" width="14" height="18" rx="2" /><path d="M9 8h6M9 12h6M9 16h3" /></>,
  Otros: <><rect x="5" y="3" width="14" height="18" rx="2" /><path d="M9 8h6M9 12h6" /></>,
};

export default function DocumentosPage() {
  const [searchParams] = useSearchParams();
  const { user } = useAuth();
  const esAdmin = Boolean(user?.esAdminSyc);

  const proyectoIdUrl = searchParams.get('proyectoId');
  const [proyectoFiltro, setProyectoFiltro] = useState(proyectoIdUrl ?? '');
  const proyectoId = proyectoFiltro ? Number(proyectoFiltro) : undefined;
  const sinProyectoRequerido = !esAdmin && !proyectoId;

  const [proyecto, setProyecto] = useState<ProyectoResponseDto | null>(null);
  const [proyectosDisponibles, setProyectosDisponibles] = useState<ProyectoResponseDto[]>([]);
  const [documentos, setDocumentos] = useState<DocumentoListadoDto[]>([]);
  const [conteos, setConteos] = useState<ConteoTipoDto[]>([]);
  const [totalRegistros, setTotalRegistros] = useState(0);
  const [totalPaginas, setTotalPaginas] = useState(1);
  const [loading, setLoading] = useState(true);

  const [busqueda, setBusqueda] = useState('');
  const [tipoFiltro, setTipoFiltro] = useState('');
  const [pagina, setPagina] = useState(1);

  const [modalSubir, setModalSubir] = useState(false);
  const [busquedaSolicitud, setBusquedaSolicitud] = useState('');
  const [todasSolicitudes, setTodasSolicitudes] = useState<SolicitudResponseDto[]>([]);
  const [cargandoSolicitudes, setCargandoSolicitudes] = useState(false);
  const [solicitudElegida, setSolicitudElegida] = useState<SolicitudResponseDto | null>(null);
  const [archivo, setArchivo] = useState<File | null>(null);
  const [subiendo, setSubiendo] = useState(false);
  const [errorSubida, setErrorSubida] = useState<string | null>(null);
  const color = useColorProyectoActivo();

  useEffect(() => {
    const cargarProyectos = esAdmin ? getProyectosAdmin : getProyectosActivos;
    cargarProyectos().then(setProyectosDisponibles);
  }, [esAdmin]);

  useEffect(() => {
    if (!proyectoId) { setProyecto(null); return; }
    getProyectosActivos().then((lista) => setProyecto(lista.find((p) => p.id === proyectoId) ?? null));
  }, [proyectoId]);

  async function cargar() {
    if (sinProyectoRequerido) { setLoading(false); return; }
    setLoading(true);
    const res = await getDocumentosListado({
      proyectoId,
      buscar: busqueda || undefined,
      tipo: tipoFiltro || undefined,
      pagina,
      tamanoPagina: POR_PAGINA,
    });
    setDocumentos(res.pagina.datos);
    setTotalRegistros(res.pagina.totalRegistros);
    setTotalPaginas(res.pagina.totalPaginas);
    setConteos(res.conteosPorTipo);
    setLoading(false);
  }

  useEffect(() => {
    const timeout = setTimeout(cargar, 350);
    return () => clearTimeout(timeout);
  }, [proyectoId, busqueda, tipoFiltro, pagina, sinProyectoRequerido]);

  useEffect(() => {
    if (!modalSubir) return;
    setCargandoSolicitudes(true);
    getSolicitudesListado({ proyectoId, pagina: 1, tamanoPagina: 50 })
      .then((res) => setTodasSolicitudes(res.pagina.datos))
      .finally(() => setCargandoSolicitudes(false));
  }, [modalSubir, proyectoId]);

  const resultadosSolicitud = todasSolicitudes.filter((s) => {
    const q = busquedaSolicitud.trim().toLowerCase();
    if (!q) return true;
    return (
      s.numero.toLowerCase().includes(q) ||
      (s.tipoSolicitudNombre ?? '').toLowerCase().includes(q) ||
      (s.ciudadanoNombre ?? s.empresaNombre ?? '').toLowerCase().includes(q)
    );
  });

  function abrirModalSubir() {
    setModalSubir(true);
    setBusquedaSolicitud('');
    setSolicitudElegida(null);
    setArchivo(null);
    setErrorSubida(null);
  }

  async function handleSubir() {
    if (!solicitudElegida || !archivo) {
      setErrorSubida('Selecciona una solicitud y un archivo.');
      return;
    }
    setSubiendo(true);
    setErrorSubida(null);
    try {
      await subirDocumento(solicitudElegida.id, archivo);
      setModalSubir(false);
      setPagina(1);
      await cargar();
    } catch (err: any) {
      setErrorSubida(err?.response?.data?.mensaje ?? 'No se pudo subir el archivo.');
    } finally {
      setSubiendo(false);
    }
  }

  const totalTodos = conteos.reduce((sum, c) => sum + c.total, 0);
  const inicio = totalRegistros === 0 ? 0 : (pagina - 1) * POR_PAGINA + 1;
  const fin = Math.min(pagina * POR_PAGINA, totalRegistros);

  if (sinProyectoRequerido) {
    return (
      <div className="flex min-h-screen bg-paper">
        <Sidebar active="documentos" />
        <main className="flex-1 flex items-center justify-center text-sm text-ink-600">
          Selecciona un proyecto en "Mis proyectos" para ver sus documentos.
        </main>
      </div>
    );
  }

  return (
    <div
      className="flex min-h-screen bg-paper"
      style={{ '--color-accento': color.primario, '--color-accento-claro': color.primarioClaro } as React.CSSProperties}
    >
      <Sidebar active="documentos" />

      <main className="flex-1 px-4 md:px-[38px] py-7 pt-16 md:pt-7 overflow-y-auto">
        <div className="flex items-center justify-between mb-5">
          <div>
            <h1 className="font-display text-[19px] font-semibold text-ink-900">
              Documentos{proyecto ? ` — ${proyecto.nombre}` : esAdmin ? ' — Todos los proyectos' : ''}
            </h1>
            <p className="text-ink-600 text-[12.5px] mt-[3px]">
              Expediente digital: todos los archivos adjuntos {proyecto ? 'a las solicitudes de este proyecto' : 'de la plataforma'}
            </p>
          </div>
          {proyectoId && (
            <button
              onClick={abrirModalSubir}
              className="flex items-center gap-[7px] bg-[var(--color-accento)] text-white rounded-[10px] px-4 py-[10px] text-[13px] font-semibold shadow-[0_8px_18px_-6px_var(--color-accento)]"
            >
              <svg viewBox="0 0 24 24" fill="none" strokeWidth="2.2" className="w-[15px] h-[15px] stroke-white">
                <path d="M12 3v13M6 10l6 6 6-6" /><path d="M5 21h14" />
              </svg>
              Subir documento
            </button>
          )}
        </div>

        <div className="flex items-center gap-2.5 bg-white border border-line rounded-xl px-3.5 py-3 mb-4 flex-wrap">
          <div className="flex items-center gap-2 flex-1 min-w-[200px] bg-paper border border-line rounded-[9px] px-3 py-2">
            <svg viewBox="0 0 24 24" fill="none" strokeWidth="2" className="w-[15px] h-[15px] stroke-ink-400 shrink-0">
              <circle cx="11" cy="11" r="7" /><path d="M21 21l-4-4" />
            </svg>
            <input
              placeholder="Buscar por nombre de archivo o ID de solicitud..."
              value={busqueda}
              onChange={(e) => { setBusqueda(e.target.value); setPagina(1); }}
              className="border-none outline-none bg-transparent text-[12.5px] w-full font-body"
            />
          </div>
          {esAdmin && (
            <select
              value={proyectoFiltro}
              onChange={(e) => { setProyectoFiltro(e.target.value); setTipoFiltro(''); setPagina(1); }}
              className="bg-paper border border-line rounded-[9px] px-3 py-2 text-xs text-ink-600 font-medium outline-none"
            >
              <option value="">Todos los proyectos</option>
              {proyectosDisponibles.map((p) => (
                <option key={p.id} value={p.id}>{p.nombre}</option>
              ))}
            </select>
          )}
        </div>

        <div className="flex items-center gap-2 mb-4 flex-wrap">
          <button
            onClick={() => { setTipoFiltro(''); setPagina(1); }}
            className={`text-xs font-semibold px-3.5 py-2 rounded-full ${
              tipoFiltro === '' ? 'bg-[#0f172a] text-white' : 'bg-white border border-line text-ink-600'
            }`}
          >
            Todos · {totalTodos}
          </button>
          {conteos.map((c) => (
            <button
              key={c.tipo}
              onClick={() => { setTipoFiltro(c.tipo); setPagina(1); }}
              className={`text-xs font-semibold px-3.5 py-2 rounded-full ${
                tipoFiltro === c.tipo ? 'bg-[#0f172a] text-white' : 'bg-white border border-line text-ink-600'
              }`}
            >
              {c.tipo} · {c.total}
            </button>
          ))}
        </div>

        {loading ? (
          <div className="text-center text-sm text-ink-400 py-10">Cargando documentos...</div>
        ) : documentos.length === 0 ? (
          <div className="bg-white border border-line rounded-2xl text-center text-sm text-ink-400 py-10">
            No se encontraron documentos con estos filtros.
          </div>
        ) : (
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3.5">
            {documentos.map((d) => (
              <button
                key={d.id}
                onClick={() => descargarDocumento(d.id, d.nombreArchivo)}
                className="text-left bg-white border border-line rounded-2xl p-5 hover:border-[var(--color-accento)] transition-colors"
              >
                <div className="w-11 h-11 rounded-xl bg-[var(--color-accento-claro)] flex items-center justify-center mb-3.5 [&>svg]:w-[19px] [&>svg]:h-[19px] [&>svg]:stroke-[var(--color-accento)]">
                  <svg viewBox="0 0 24 24" fill="none" strokeWidth="1.8">
                    {ICONO_CATEGORIA[d.categoria] ?? ICONO_CATEGORIA.Otros}
                  </svg>
                </div>
                <div className="font-semibold text-[13.5px] text-ink-900 mb-1.5 truncate" title={d.nombreArchivo}>
                  {d.nombreArchivo}
                </div>
                <div className="text-[12px] text-blue-600 font-medium mb-0.5">#{d.solicitudNumero}</div>
                {!proyecto && d.proyectoNombre && (
                  <div className="text-[11px] text-ink-500 mb-1.5">{d.proyectoNombre}</div>
                )}
                <div className="text-[11px] text-ink-400">
                  {formatearTamano(d.tamanoBytes)} · {formatearFecha(d.fecha)}
                </div>
              </button>
            ))}
          </div>
        )}

        {totalPaginas > 1 && (
          <div className="flex items-center justify-between mt-5">
            <span className="text-xs text-ink-600">
              Mostrando <b className="text-ink-900">{inicio}–{fin}</b> de <b className="text-ink-900">{totalRegistros}</b>
            </span>
            <div className="flex gap-1.5">
              <button onClick={() => setPagina((p) => Math.max(1, p - 1))} disabled={pagina === 1}
                className="w-7 h-7 rounded-lg border border-line bg-white flex items-center justify-center text-xs text-ink-600 disabled:opacity-40">‹</button>
              {Array.from({ length: totalPaginas }, (_, i) => i + 1)
                .slice(Math.max(0, pagina - 3), Math.max(0, pagina - 3) + 5)
                .map((n) => (
                  <button key={n} onClick={() => setPagina(n)}
                    className={`w-7 h-7 rounded-lg border flex items-center justify-center text-xs ${
                      n === pagina ? 'bg-[var(--color-accento)] border-[var(--color-accento)] text-white font-semibold' : 'border-line bg-white text-ink-600'
                    }`}>{n}</button>
                ))}
              <button onClick={() => setPagina((p) => Math.min(totalPaginas, p + 1))} disabled={pagina === totalPaginas}
                className="w-7 h-7 rounded-lg border border-line bg-white flex items-center justify-center text-xs text-ink-600 disabled:opacity-40">›</button>
            </div>
          </div>
        )}
      </main>

      {modalSubir && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-6">
          <div className="bg-white rounded-2xl p-7 w-full max-w-[420px]">
            <h2 className="font-display text-lg font-semibold text-ink-900 mb-4">Subir documento</h2>

            <label className="block text-xs font-semibold text-ink-900 mb-1.5">Solicitud</label>
            {solicitudElegida ? (
              <div className="flex items-center justify-between bg-[var(--color-accento-claro)] border border-[var(--color-accento)] rounded-[9px] px-3.5 py-2.5 mb-4">
                <span className="text-[13px] font-semibold text-ink-900">#{solicitudElegida.numero} — {solicitudElegida.tipoSolicitudNombre}</span>
                <button onClick={() => setSolicitudElegida(null)} className="text-[11px] text-ink-400 font-medium">Cambiar</button>
              </div>
            ) : (
              <>
                <input
                  value={busquedaSolicitud}
                  onChange={(e) => setBusquedaSolicitud(e.target.value)}
                  placeholder="Buscar por número, tipo o afiliado (o elige de la lista)..."
                  className="w-full py-2.5 px-3 border-[1.5px] border-line rounded-[9px] text-[13px] outline-none focus:border-blue-500 mb-2"
                />
                <div className="max-h-[220px] overflow-y-auto flex flex-col gap-1.5 mb-4">
                  {cargandoSolicitudes ? (
                    <p className="text-xs text-ink-400 text-center py-4">Cargando solicitudes...</p>
                  ) : resultadosSolicitud.length === 0 ? (
                    <p className="text-xs text-ink-400 text-center py-4">No hay solicitudes que coincidan.</p>
                  ) : (
                    resultadosSolicitud.map((s) => (
                      <button
                        key={s.id}
                        type="button"
                        onClick={() => setSolicitudElegida(s)}
                        className="w-full text-left bg-paper border border-line rounded-[9px] px-3.5 py-2.5 shrink-0"
                      >
                        <div className="text-[13px] font-semibold text-ink-900">#{s.numero} — {s.tipoSolicitudNombre}</div>
                        <div className="text-[11px] text-ink-400">{s.ciudadanoNombre ?? s.empresaNombre}</div>
                      </button>
                    ))
                  )}
                </div>
              </>
            )}

            <label className="block text-xs font-semibold text-ink-900 mb-1.5">Archivo</label>
            <input
              type="file"
              onChange={(e) => setArchivo(e.target.files?.[0] ?? null)}
              className="w-full text-[13px] mb-4"
            />

            {errorSubida && (
              <div className="text-xs text-red-600 bg-red-50 border border-red-200 rounded-lg px-3 py-2 mb-4">
                {errorSubida}
              </div>
            )}

            <div className="flex gap-2.5">
              <button onClick={() => setModalSubir(false)} className="flex-1 py-2.5 rounded-[9px] border border-line text-ink-600 text-sm font-medium">
                Cancelar
              </button>
              <button
                onClick={handleSubir}
                disabled={subiendo}
                className="flex-1 py-2.5 rounded-[9px] bg-[var(--color-accento)] text-white text-sm font-semibold disabled:opacity-60"
              >
                {subiendo ? 'Subiendo...' : 'Subir'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}