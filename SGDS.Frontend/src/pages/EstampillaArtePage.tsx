import { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import Sidebar from '../components/layout/Sidebar';
import {
  getEstampilla,
  obtenerEstampillaQrBlobUrl,
  obtenerEstampillaBarcodeBlobUrl,
  descargarEstampillaArtePdf,
  type EstampillaResponseDto,
} from '../services/syctraceService';
import { getColorProyecto } from '../config/colorPorProyecto';

export default function EstampillaArtePage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  const [estampilla, setEstampilla] = useState<EstampillaResponseDto | null>(null);
  const [qrUrl, setQrUrl] = useState<string | null>(null);
  const [barcodeUrl, setBarcodeUrl] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [exportando, setExportando] = useState(false);

  const color = getColorProyecto('SYCTrace');

  useEffect(() => {
    if (!id) return;
    setLoading(true);
    setError(null);
    getEstampilla(Number(id))
      .then(setEstampilla)
      .catch((err) => setError(err?.response?.data?.mensaje ?? 'No se pudo cargar la estampilla.'))
      .finally(() => setLoading(false));
  }, [id]);

  useEffect(() => {
    if (!id) return;
    let qr: string | null = null;
    let barcode: string | null = null;
    Promise.all([obtenerEstampillaQrBlobUrl(Number(id)), obtenerEstampillaBarcodeBlobUrl(Number(id))])
      .then(([q, b]) => { qr = q; barcode = b; setQrUrl(q); setBarcodeUrl(b); })
      .catch(() => {});
    return () => {
      if (qr) window.URL.revokeObjectURL(qr);
      if (barcode) window.URL.revokeObjectURL(barcode);
    };
  }, [id]);

  async function handleExportar() {
    if (!id || !estampilla) return;
    setExportando(true);
    try {
      await descargarEstampillaArtePdf(Number(id), `Estampilla_Arte_${estampilla.numero}.pdf`);
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
          <Link to={id ? `/solicitudes/${id}/estampilla` : '/solicitudes'} className="hover:text-ink-600">
            {estampilla ? `#${estampilla.numero}` : 'Estampilla'}
          </Link>
          <span>/</span>
          <span className="text-ink-900 font-semibold">Arte de la estampilla</span>
        </div>

        {loading ? (
          <div className="text-center text-sm text-ink-400 py-10">Cargando...</div>
        ) : error || !estampilla ? (
          <div className="max-w-[680px] bg-white border border-line rounded-[14px] p-5">
            <p className="text-[13px] text-red-600 mb-3">{error ?? 'No se pudo cargar la estampilla.'}</p>
            <button onClick={() => navigate(`/solicitudes/${id}/estampilla`)} className="text-[12.5px] text-blue-600 font-medium">
              ← Volver a la estampilla
            </button>
          </div>
        ) : (
          <>
            <div className="flex items-center justify-between mb-6 max-w-[900px]">
              <div>
                <h1 className="font-display text-[19px] font-semibold text-ink-900">Arte de la estampilla — {estampilla.empresaRazonSocial}</h1>
                <p className="text-ink-600 text-[12.5px] mt-[2px]">
                  Modelo para impresión sobre papel de seguridad — se adhiere entre la tapa y el cuello de la botella
                </p>
              </div>
              <button
                onClick={handleExportar}
                disabled={exportando}
                className="flex items-center gap-1.5 bg-[var(--color-accento)] text-white rounded-[9px] px-4 py-2 text-[12.5px] font-semibold disabled:opacity-60 shrink-0"
              >
                <svg viewBox="0 0 24 24" fill="none" strokeWidth="2.2" className="w-[13px] h-[13px] stroke-white">
                  <path d="M12 3v13M6 10l6 6 6-6" /><path d="M5 21h14" />
                </svg>
                {exportando ? 'Generando...' : 'Descargar PDF'}
              </button>
            </div>

            <div className="flex gap-8 items-start flex-wrap">
              {/* Estampilla física — banda tricolor + sello + producto + barcode real + QR real */}
              <div className="w-[260px] shrink-0 bg-white rounded-[10px] shadow-[0_18px_40px_-16px_rgba(15,26,46,0.35)] overflow-hidden relative">
                {estampilla.origenProducto === 'Importado' && (
                  <span className="absolute top-2.5 left-2.5 z-10 bg-amber-100 text-amber-800 text-[9px] font-bold px-2.5 py-1 rounded-full tracking-wide">
                    IMPORTADO
                  </span>
                )}
                <div className="flex h-2">
                  <div className="flex-1 bg-[#fbbf24]" />
                  <div className="flex-1 bg-[#2563eb]" />
                  <div className="flex-1 bg-[#dc2626]" />
                </div>
                <div className="p-4 text-center relative">
                  <div
                    className="absolute top-2.5 right-2.5 w-8 h-8 rounded-full opacity-80"
                    style={{ background: 'conic-gradient(from 90deg, #c4b5fd, #93c5fd, #6ee7b7, #fde68a, #fca5a5, #c4b5fd)' }}
                  />
                  <div className="font-display font-bold text-[15px] text-ink-900 tracking-wide">SANTANDER</div>
                  <div className="text-[9px] text-ink-400 uppercase tracking-wider mt-0.5">
                    Control Rentas · {estampilla.origenProducto === 'Nacional' ? 'Nacional' : 'Extranjero'}
                  </div>
                  <div className="h-px my-3" style={{ background: 'repeating-linear-gradient(90deg,#cbd5e1 0 4px,transparent 4px 7px)' }} />
                  <div className="text-[13px] font-bold text-ink-900 leading-tight">{estampilla.nombreProducto}</div>
                  <div className="text-[10px] text-ink-600 mt-1 leading-relaxed">
                    {estampilla.gradoAlcoholimetrico != null && `${estampilla.gradoAlcoholimetrico}° · `}
                    {estampilla.contenidoNetoCc != null && `${estampilla.contenidoNetoCc} cc`}
                    {estampilla.unidadesPorCajetilla != null && `${estampilla.unidadesPorCajetilla} un./cajetilla`}
                    <br />{estampilla.empresaRazonSocial}
                  </div>
                  {barcodeUrl ? (
                    <img src={barcodeUrl} alt="Código de barras" className="w-full h-8 object-contain mt-2.5" />
                  ) : (
                    <div className="w-full h-8 bg-paper rounded mt-2.5 animate-pulse" />
                  )}
                  <div className="text-[9px] font-mono tracking-widest text-ink-900 mt-1">{estampilla.codigoCompleto}</div>
                  {qrUrl ? (
                    <img src={qrUrl} alt="Código QR" className="w-[54px] h-[54px] mx-auto mt-2.5" />
                  ) : (
                    <div className="w-[54px] h-[54px] mx-auto mt-2.5 bg-paper rounded animate-pulse" />
                  )}
                </div>
                <div className="bg-ink-900 text-white text-[9px] font-bold tracking-wide text-center py-1.5">
                  SYCTRACE CONTROL RENTAS
                </div>
              </div>

              <div className="flex-1 min-w-[280px] bg-white border border-line rounded-[14px] p-5">
                <h3 className="font-display text-[13.5px] font-semibold text-ink-900 mb-3.5">Elementos de seguridad incluidos</h3>
                {[
                  ['Código de barras real (Code128)', 'Generado con ZXing.Net — escaneable, codifica el número completo de la estampilla, no una banda decorativa.'],
                  ['Código QR real', 'Enlaza a la información del producto, empresa y departamento autorizado — verificable en SycTrace.'],
                  ['Banda tricolor', 'Referencia visual de seguridad departamental, igual a la del modelo aprobado.'],
                  ['Sello departamental', 'Distintivo de Control de Rentas — el holograma físico real lo aplica la imprenta de seguridad sobre el sustrato, no se puede reproducir en un PDF.'],
                  ['Nombre del departamento', 'Si el impreso no coincide con el departamento donde se comercializa, es indicio de contrabando.'],
                ].map(([titulo, desc]) => (
                  <div key={titulo} className="flex gap-2.5 mb-3 last:mb-0">
                    <svg viewBox="0 0 24 24" fill="none" strokeWidth="1.8" className="w-[15px] h-[15px] stroke-[var(--color-accento)] shrink-0 mt-0.5">
                      <circle cx="12" cy="12" r="9" /><path d="M9 12l2 2 4-4" />
                    </svg>
                    <p className="text-[12px] text-ink-600 leading-relaxed"><b className="text-ink-900">{titulo}</b> — {desc}</p>
                  </div>
                ))}
              </div>
            </div>
          </>
        )}
      </main>
    </div>
  );
}
