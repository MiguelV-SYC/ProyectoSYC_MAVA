import { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import Sidebar from '../components/layout/Sidebar';
import {
  getEstampilla,
  confirmarPagoEstampilla,
  entregarEstampilla,
  anularEstampilla,
  descargarEstampillaPdf,
  obtenerEstampillaQrBlobUrl,
  type EstampillaResponseDto,
} from '../services/syctraceService';
import { getColorProyecto } from '../config/colorPorProyecto';

function formatearFecha(iso?: string) {
  if (!iso) return '—';
  const fecha = new Date(iso);
  if (isNaN(fecha.getTime())) return '—';
  return fecha.toLocaleDateString('es-CO', { day: '2-digit', month: 'short', year: 'numeric' });
}

const ESTADO_STYLE: Record<string, string> = {
  Generada: 'bg-[#f1f5f9] text-[#64748b]',
  Pagada: 'bg-blue-100 text-blue-600',
  Entregada: 'bg-[var(--color-accento-claro)] text-[var(--color-accento)]',
  Anulada: 'bg-[#fdeaea] text-[#dc2626]',
};

export default function EstampillaPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  const [estampilla, setEstampilla] = useState<EstampillaResponseDto | null>(null);
  const [qrUrl, setQrUrl] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [confirmando, setConfirmando] = useState(false);
  const [entregando, setEntregando] = useState(false);
  const [anulando, setAnulando] = useState(false);
  const [exportando, setExportando] = useState(false);
  const [mostrarAnular, setMostrarAnular] = useState(false);
  const [motivoAnulacion, setMotivoAnulacion] = useState('');

  function cargar() {
    if (!id) return;
    setLoading(true);
    setError(null);
    getEstampilla(Number(id))
      .then(setEstampilla)
      .catch((err) => setError(err?.response?.data?.mensaje ?? 'No se pudo cargar la estampilla.'))
      .finally(() => setLoading(false));
  }

  useEffect(cargar, [id]);

  useEffect(() => {
    if (!id) return;
    let url: string | null = null;
    obtenerEstampillaQrBlobUrl(Number(id))
      .then((u) => { url = u; setQrUrl(u); })
      .catch(() => {});
    return () => {
      if (url) window.URL.revokeObjectURL(url);
    };
  }, [id, estampilla?.estado]);

  const color = getColorProyecto('SYCTrace');

  async function handleConfirmarPago() {
    if (!id) return;
    setConfirmando(true);
    setError(null);
    try {
      await confirmarPagoEstampilla(Number(id));
      cargar();
    } catch (err: any) {
      setError(err?.response?.data?.mensaje ?? 'No se pudo confirmar el pago.');
    } finally {
      setConfirmando(false);
    }
  }

  async function handleEntregar() {
    if (!id) return;
    setEntregando(true);
    setError(null);
    try {
      await entregarEstampilla(Number(id));
      cargar();
    } catch (err: any) {
      setError(err?.response?.data?.mensaje ?? 'No se pudo marcar como entregada.');
    } finally {
      setEntregando(false);
    }
  }

  async function handleAnular() {
    if (!id || !motivoAnulacion.trim()) return;
    setAnulando(true);
    setError(null);
    try {
      await anularEstampilla(Number(id), motivoAnulacion.trim());
      setMostrarAnular(false);
      setMotivoAnulacion('');
      cargar();
    } catch (err: any) {
      setError(err?.response?.data?.mensaje ?? 'No se pudo anular la estampilla.');
    } finally {
      setAnulando(false);
    }
  }

  async function handleExportar() {
    if (!id || !estampilla) return;
    setExportando(true);
    try {
      await descargarEstampillaPdf(Number(id), `Estampilla_${estampilla.numero}.pdf`);
    } catch {
      alert('No se pudo generar el PDF de la estampilla.');
    } finally {
      setExportando(false);
    }
  }

  return (
    <div
      className="flex min-h-screen bg-paper"
      style={{ '--color-accento': color.primario, '--color-accento-claro': color.primarioClaro } as React.CSSProperties}
    >
      <Sidebar active="solicitudes" />

      <main className="flex-1 px-4 md:px-[38px] py-7 pt-16 md:pt-7 overflow-y-auto">
        <div className="flex items-center gap-1.5 text-xs text-ink-400 mb-3.5">
          <Link to={id ? `/solicitudes/${id}` : '/solicitudes'} className="hover:text-ink-600">
            {estampilla ? `#${estampilla.numero}` : 'Solicitud'}
          </Link>
          <span>/</span>
          <span className="text-ink-900 font-semibold">Estampilla</span>
        </div>

        {loading ? (
          <div className="text-center text-sm text-ink-400 py-10">Cargando estampilla...</div>
        ) : error || !estampilla ? (
          <div className="max-w-[680px] bg-white border border-line rounded-[14px] p-5">
            <p className="text-[13px] text-red-600 mb-3">{error ?? 'No se pudo cargar la estampilla.'}</p>
            <button onClick={() => navigate(id ? `/solicitudes/${id}` : '/solicitudes')} className="text-[12.5px] text-blue-600 font-medium">
              ← Volver a la solicitud
            </button>
          </div>
        ) : (
          <div className="max-w-[680px] flex flex-col gap-5">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
              <div>
                <h1 className="font-display text-[19px] font-semibold text-ink-900">Estampilla de control — {estampilla.empresaRazonSocial}</h1>
                <p className="text-ink-600 text-[12.5px] mt-[2px]">
                  Secretaría de Hacienda Departamental de Santander — Control de Rentas · Número {estampilla.numero}
                </p>
              </div>
              <div className="flex items-center flex-wrap gap-2.5">
                <button
                  onClick={() => navigate(`/solicitudes/${id}/estampilla/arte`)}
                  className="flex items-center gap-1.5 bg-white border border-line text-ink-600 rounded-[9px] px-4 py-2 text-[12.5px] font-semibold hover:bg-paper"
                >
                  <svg viewBox="0 0 24 24" fill="none" strokeWidth="1.8" className="w-[13px] h-[13px] stroke-ink-600">
                    <path d="M2 12s3.5-7 10-7 10 7 10 7-3.5 7-10 7-10-7-10-7z" /><circle cx="12" cy="12" r="3" />
                  </svg>
                  Visualizar estampilla
                </button>
                <button
                  onClick={handleExportar}
                  disabled={exportando}
                  className="flex items-center gap-1.5 bg-[var(--color-accento)] text-white rounded-[9px] px-4 py-2 text-[12.5px] font-semibold disabled:opacity-60"
                >
                  <svg viewBox="0 0 24 24" fill="none" strokeWidth="2.2" className="w-[13px] h-[13px] stroke-white">
                    <path d="M12 3v13M6 10l6 6 6-6" /><path d="M5 21h14" />
                  </svg>
                  {exportando ? 'Generando...' : 'Descargar PDF'}
                </button>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <span className={`inline-flex items-center gap-1.5 text-[11.5px] font-semibold px-[10px] py-[5px] rounded-full ${ESTADO_STYLE[estampilla.estado] ?? 'bg-paper text-ink-600'}`}>
                <span className="w-1.5 h-1.5 rounded-full bg-current" />
                {estampilla.estado}
              </span>
              {estampilla.origenProducto === 'Importado' && (
                <span className="text-[11px] font-bold text-amber-700 bg-amber-50 border border-amber-200 rounded-full px-[10px] py-[5px]">
                  IMPORTADO
                </span>
              )}
              {estampilla.estado === 'Anulada' && estampilla.motivoAnulacion && (
                <span className="text-[12px] text-ink-600">Motivo: {estampilla.motivoAnulacion}</span>
              )}
            </div>

            {error && (
              <div className="text-xs text-red-600 bg-red-50 border border-red-200 rounded-lg px-3 py-2">{error}</div>
            )}

            <div className="flex items-center gap-2.5">
              {estampilla.estado === 'Generada' && (
                <button
                  onClick={handleConfirmarPago}
                  disabled={confirmando}
                  className="flex items-center gap-1.5 bg-[var(--color-accento)] text-white rounded-[9px] px-5 py-2.5 text-[13px] font-semibold disabled:opacity-60"
                >
                  {confirmando ? 'Confirmando...' : 'Confirmar pago'}
                </button>
              )}
              {estampilla.estado === 'Pagada' && (
                <button
                  onClick={handleEntregar}
                  disabled={entregando}
                  className="flex items-center gap-1.5 bg-[var(--color-accento)] text-white rounded-[9px] px-5 py-2.5 text-[13px] font-semibold disabled:opacity-60"
                >
                  {entregando ? 'Marcando...' : 'Marcar entregada'}
                </button>
              )}
              {(estampilla.estado === 'Generada' || estampilla.estado === 'Pagada') && !mostrarAnular && (
                <button
                  onClick={() => setMostrarAnular(true)}
                  className="flex items-center gap-1.5 bg-white border border-line text-ink-600 rounded-[9px] px-4 py-2.5 text-[13px] font-semibold hover:bg-paper"
                >
                  Anular
                </button>
              )}
            </div>

            {mostrarAnular && (
              <div className="bg-white border border-line rounded-[14px] p-5">
                <label className="block text-xs font-semibold text-ink-900 mb-1.5">Motivo de anulación</label>
                <textarea
                  value={motivoAnulacion}
                  onChange={(e) => setMotivoAnulacion(e.target.value)}
                  rows={2}
                  placeholder="Ej: Error de impresión en el lote de estampillas"
                  className="w-full py-2.5 px-3 border-[1.5px] border-line rounded-[9px] text-[13px] outline-none focus:border-blue-500 resize-none mb-3"
                />
                <div className="flex gap-2">
                  <button
                    onClick={handleAnular}
                    disabled={anulando || !motivoAnulacion.trim()}
                    className="bg-red-600 text-white rounded-[9px] px-4 py-2 text-[12.5px] font-semibold disabled:opacity-60"
                  >
                    {anulando ? 'Anulando...' : 'Confirmar anulación'}
                  </button>
                  <button
                    onClick={() => { setMostrarAnular(false); setMotivoAnulacion(''); }}
                    className="bg-white border border-line text-ink-600 rounded-[9px] px-4 py-2 text-[12.5px] font-semibold"
                  >
                    Cancelar
                  </button>
                </div>
              </div>
            )}

            <div className="bg-white border border-line rounded-[14px] p-5">
              <h3 className="font-display text-[13.5px] font-semibold text-ink-900 mb-4">Producto</h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-8 gap-y-3">
                {[
                  ['Nombre comercial', estampilla.nombreProducto],
                  ['Marca', estampilla.marca || '—'],
                  ['Categoría', estampilla.categoriaProducto],
                  ['Grado / Contenido neto', `${estampilla.gradoAlcoholimetrico ? estampilla.gradoAlcoholimetrico + '°' : '—'} · ${estampilla.contenidoNetoCc ? estampilla.contenidoNetoCc + ' cc' : '—'}`],
                  ['Unidades por cajetilla', estampilla.unidadesPorCajetilla?.toString() ?? '—'],
                  ['Registro INVIMA', estampilla.registroInvima],
                  ['Lote de producción', estampilla.loteProduccion],
                ].map(([lbl, val]) => (
                  <div key={lbl}>
                    <div className="text-[10.5px] uppercase tracking-wide text-ink-400 font-semibold mb-1">{lbl}</div>
                    <div className="text-[13.5px] font-semibold text-ink-900">{val}</div>
                  </div>
                ))}
              </div>
            </div>

            <div className="bg-white border border-line rounded-[14px] p-5">
              <h3 className="font-display text-[13.5px] font-semibold text-ink-900 mb-4">Empresa y origen</h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-8 gap-y-3">
                <div>
                  <div className="text-[10.5px] uppercase tracking-wide text-ink-400 font-semibold mb-1">Razón social</div>
                  <div className="text-[13.5px] font-semibold text-ink-900">{estampilla.empresaRazonSocial}</div>
                </div>
                <div>
                  <div className="text-[10.5px] uppercase tracking-wide text-ink-400 font-semibold mb-1">NIT</div>
                  <div className="text-[13.5px] font-semibold text-ink-900">{estampilla.empresaNit}</div>
                </div>
                <div>
                  <div className="text-[10.5px] uppercase tracking-wide text-ink-400 font-semibold mb-1">Tornaguía de Infoconsumo</div>
                  <div className="text-[13.5px] font-semibold text-ink-900">#{estampilla.solicitudInfoconsumoNumero}</div>
                </div>
                <div>
                  <div className="text-[10.5px] uppercase tracking-wide text-ink-400 font-semibold mb-1">Fecha de generación</div>
                  <div className="text-[13.5px] font-semibold text-ink-900">{formatearFecha(estampilla.fechaCreacion)}</div>
                </div>
                <div>
                  <div className="text-[10.5px] uppercase tracking-wide text-ink-400 font-semibold mb-1">Origen</div>
                  <div className="text-[13.5px] font-semibold text-ink-900">
                    {estampilla.origenProducto === 'Nacional'
                      ? `Nacional — Tornaguía ${estampilla.numeroTornaguia ?? '—'}`
                      : `Importado — Declaración ${estampilla.numeroDeclaracionImportacion ?? '—'}`}
                  </div>
                </div>
              </div>
            </div>

            {estampilla.loteGoTraceNumero && (
              <div className="bg-white border border-line rounded-[14px] p-5">
                <h3 className="font-display text-[13.5px] font-semibold text-ink-900 mb-4">Trazabilidad GoTrace</h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-8 gap-y-3">
                  <div>
                    <div className="text-[10.5px] uppercase tracking-wide text-ink-400 font-semibold mb-1">Lote de origen</div>
                    <div className="text-[13.5px] font-semibold text-ink-900">{estampilla.loteGoTraceNumero}</div>
                  </div>
                  <div>
                    <div className="text-[10.5px] uppercase tracking-wide text-ink-400 font-semibold mb-1">UIDs trazados</div>
                    <div className="text-[13.5px] font-semibold text-ink-900">{estampilla.cantidadUidsGoTrace?.toLocaleString('es-CO') ?? '—'}</div>
                  </div>
                  {estampilla.rangoUidGoTrace && (
                    <div className="col-span-2">
                      <div className="text-[10.5px] uppercase tracking-wide text-ink-400 font-semibold mb-1">Rango de UIDs</div>
                      <div className="text-[13.5px] font-semibold text-ink-900 font-mono">{estampilla.rangoUidGoTrace}</div>
                    </div>
                  )}
                </div>
                {estampilla.alertaDesajusteUid && (
                  <p className="text-[11.5px] text-amber-700 bg-amber-50 border border-amber-200 rounded-lg px-3 py-2 mt-3.5">
                    ⚠ {estampilla.alertaDesajusteUid}
                  </p>
                )}
              </div>
            )}

            <div className="bg-white border border-line rounded-[14px] p-6 text-center">
              <p className="text-[13px] font-semibold text-ink-900 mb-1">Código {estampilla.codigoCompleto}</p>
              <p className="text-[11.5px] text-ink-600 mb-1">
                Rango: {estampilla.prefijo}-{String(estampilla.codigoInicial).padStart(5, '0')} a {estampilla.prefijo}-{String(estampilla.codigoFinal).padStart(5, '0')}
                {' '}({estampilla.cantidadEstampillas.toLocaleString('es-CO')} estampillas)
              </p>
              <p className="text-[11px] text-ink-400 mb-4">Para distribuir en el Departamento de Santander</p>
              {qrUrl ? (
                <img src={qrUrl} alt="Código QR de la estampilla" className="w-[160px] h-[160px] mx-auto" />
              ) : (
                <div className="w-[160px] h-[160px] mx-auto bg-paper rounded-lg animate-pulse" />
              )}
              <p className="text-[11px] text-ink-400 mt-2 tracking-widest">{estampilla.codigoCompleto}</p>
            </div>

            <button
              onClick={() => navigate(`/solicitudes/${id}`)}
              className="self-start text-[12.5px] text-ink-600 font-medium hover:underline"
            >
              ← Volver a la solicitud
            </button>
          </div>
        )}
      </main>
    </div>
  );
}
