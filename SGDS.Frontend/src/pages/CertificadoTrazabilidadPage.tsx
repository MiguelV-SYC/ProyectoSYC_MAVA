import { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import Sidebar from '../components/layout/Sidebar';
import {
  getCertificado,
  confirmarPuntoControl,
  obtenerCertificadoQrBlobUrl,
  descargarCertificadoPdf,
  type CertificadoTrazabilidadResponseDto,
} from '../services/gotraceService';
import { getColorProyecto } from '../config/colorPorProyecto';

function formatearFecha(iso?: string) {
  if (!iso) return '—';
  const fecha = new Date(iso);
  if (isNaN(fecha.getTime())) return '—';
  return fecha.toLocaleDateString('es-CO', { day: '2-digit', month: 'short', year: 'numeric' });
}

function formatearFechaHora(iso?: string) {
  if (!iso) return '—';
  const fecha = new Date(iso);
  if (isNaN(fecha.getTime())) return '—';
  return fecha.toLocaleString('es-CO', { day: '2-digit', month: 'short', hour: 'numeric', minute: '2-digit' });
}

export default function CertificadoTrazabilidadPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  const [certificado, setCertificado] = useState<CertificadoTrazabilidadResponseDto | null>(null);
  const [qrUrl, setQrUrl] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [exportando, setExportando] = useState(false);
  const [confirmandoId, setConfirmandoId] = useState<number | null>(null);

  const color = getColorProyecto('Gotrace');

  function cargar() {
    if (!id) return;
    setLoading(true);
    setError(null);
    getCertificado(Number(id))
      .then(setCertificado)
      .catch((err) => setError(err?.response?.data?.mensaje ?? 'No se pudo cargar el certificado.'))
      .finally(() => setLoading(false));
  }

  useEffect(cargar, [id]);

  useEffect(() => {
    if (!id) return;
    let url: string | null = null;
    obtenerCertificadoQrBlobUrl(Number(id))
      .then((u) => { url = u; setQrUrl(u); })
      .catch(() => {});
    return () => {
      if (url) window.URL.revokeObjectURL(url);
    };
  }, [id, certificado?.totalPuntosConfirmados]);

  async function handleConfirmarPunto(puntoId: number) {
    if (!id) return;
    setConfirmandoId(puntoId);
    setError(null);
    try {
      await confirmarPuntoControl(Number(id), puntoId);
      cargar();
    } catch (err: any) {
      setError(err?.response?.data?.mensaje ?? 'No se pudo confirmar el punto de control.');
    } finally {
      setConfirmandoId(null);
    }
  }

  async function handleExportar() {
    if (!id || !certificado) return;
    setExportando(true);
    try {
      await descargarCertificadoPdf(Number(id), `Certificado_Trazabilidad_${certificado.numeroLote}.pdf`);
    } catch {
      alert('No se pudo generar el PDF del certificado.');
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
            {certificado ? `#${certificado.numero}` : 'Solicitud'}
          </Link>
          <span>/</span>
          <span className="text-ink-900 font-semibold">Certificado de trazabilidad</span>
        </div>

        {loading ? (
          <div className="text-center text-sm text-ink-400 py-10">Cargando certificado...</div>
        ) : error || !certificado ? (
          <div className="max-w-[680px] bg-white border border-line rounded-[14px] p-5">
            <p className="text-[13px] text-red-600 mb-3">{error ?? 'No se pudo cargar el certificado.'}</p>
            <button onClick={() => navigate(id ? `/solicitudes/${id}` : '/solicitudes')} className="text-[12.5px] text-blue-600 font-medium">
              ← Volver a la solicitud
            </button>
          </div>
        ) : (
          <>
            <div className="flex items-center justify-between mb-6 max-w-[780px]">
              <div>
                <h1 className="font-display text-[19px] font-semibold text-ink-900">Certificado de trazabilidad — Lote {certificado.numeroLote}</h1>
                <p className="text-ink-600 text-[12.5px] mt-[2px]">
                  {certificado.empresaRazonSocial} · Cadena de custodia fábrica → consumidor
                </p>
              </div>
              <button
                onClick={handleExportar}
                disabled={exportando}
                className="flex items-center gap-1.5 bg-[var(--color-accento)] text-white rounded-[9px] px-4 py-2 text-[12.5px] font-semibold disabled:opacity-60 shrink-0"
              >
                <svg viewBox="0 0 24 24" fill="none" strokeWidth="2.2" className="w-[13px] h-[13px] stroke-white">
                  <path d="M12 4v12M6 12l6 6 6-6" /><path d="M5 20h14" />
                </svg>
                {exportando ? 'Generando...' : 'Descargar PDF'}
              </button>
            </div>

            {error && (
              <div className="max-w-[780px] text-xs text-red-600 bg-red-50 border border-red-200 rounded-lg px-3 py-2 mb-4">{error}</div>
            )}

            <div className="max-w-[780px] bg-white rounded-2xl shadow-[0_12px_40px_-16px_rgba(15,26,46,0.18)] overflow-hidden">
              <div
                className="text-white px-8 py-6 flex items-center justify-between"
                style={{ background: `linear-gradient(120deg, ${color.primarioOscuro}, ${color.primario})` }}
              >
                <div className="flex items-center gap-3.5">
                  <div className="w-[46px] h-[46px] rounded-xl bg-white/15 flex items-center justify-center shrink-0">
                    <svg viewBox="0 0 24 24" fill="none" strokeWidth="1.8" className="w-[22px] h-[22px] stroke-white">
                      <circle cx="5" cy="12" r="2.2" /><circle cx="12" cy="6" r="2.2" /><circle cx="19" cy="12" r="2.2" /><circle cx="12" cy="18" r="2.2" />
                      <path d="M7 11l3-3M14 5l3 5M17 14l-3 3M10 17l-3-3" />
                    </svg>
                  </div>
                  <div>
                    <div className="text-[11px] text-white/80 uppercase tracking-wide">Gotrace — Trazabilidad Logística</div>
                    <div className="font-display font-bold text-[19px] mt-0.5">Certificado de Trazabilidad</div>
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-[10px] text-white/75 uppercase tracking-wide">Lote</div>
                  <div className="font-mono text-[18px] font-bold tracking-wide">{certificado.numeroLote}</div>
                </div>
              </div>

              <div className="p-8">
                <div className="mb-6">
                  <div className="text-[11px] font-bold uppercase tracking-wide pb-2 mb-3 border-b-2" style={{ color: color.primario, borderColor: color.primarioClaro }}>
                    Producto
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                    <div>
                      <div className="text-[10.5px] uppercase tracking-wide text-ink-400 mb-1">Producto</div>
                      <div className="text-[13.5px] font-semibold text-ink-900">{certificado.producto}</div>
                    </div>
                    <div>
                      <div className="text-[10.5px] uppercase tracking-wide text-ink-400 mb-1">Unidades del lote</div>
                      <div className="text-[13.5px] font-semibold text-ink-900">{certificado.unidadesLote.toLocaleString('es-CO')} botellas</div>
                    </div>
                    <div>
                      <div className="text-[10.5px] uppercase tracking-wide text-ink-400 mb-1">Fecha de producción</div>
                      <div className="text-[13.5px] font-semibold text-ink-900">{formatearFecha(certificado.fechaProduccion)}</div>
                    </div>
                  </div>
                  {certificado.rangoUidCompleto ? (
                    <div className="mt-3">
                      <div className="text-[10.5px] uppercase tracking-wide text-ink-400 mb-1">Rango de UIDs</div>
                      <div className="text-[13px] font-semibold text-ink-900 font-mono">{certificado.rangoUidCompleto}</div>
                    </div>
                  ) : certificado.modoGeneracionUid === 'Archivo' && (
                    <div className="mt-3">
                      <div className="text-[10.5px] uppercase tracking-wide text-ink-400 mb-1">Identificadores</div>
                      <div className="text-[13px] font-semibold text-ink-900">Cargados por archivo desde fábrica</div>
                    </div>
                  )}
                </div>

                <div className="mb-6">
                  <div className="text-[11px] font-bold uppercase tracking-wide pb-2 mb-3 border-b-2" style={{ color: color.primario, borderColor: color.primarioClaro }}>
                    Empresa productora
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <div className="text-[10.5px] uppercase tracking-wide text-ink-400 mb-1">Razón social</div>
                      <div className="text-[13.5px] font-semibold text-ink-900">{certificado.empresaRazonSocial}</div>
                    </div>
                    <div>
                      <div className="text-[10.5px] uppercase tracking-wide text-ink-400 mb-1">NIT</div>
                      <div className="text-[13.5px] font-semibold text-ink-900">{certificado.empresaNit}</div>
                    </div>
                  </div>
                </div>

                <div>
                  <div className="text-[11px] font-bold uppercase tracking-wide pb-2 mb-3 border-b-2" style={{ color: color.primario, borderColor: color.primarioClaro }}>
                    Cadena de custodia
                  </div>
                  <div className="flex items-start justify-between">
                    {certificado.puntosControl.filter((p) => p.habilitado).map((p, i) => (
                      <div key={p.id} className="flex-1 text-center relative">
                        {i > 0 && (
                          <div
                            className="absolute h-[2px] top-[19px]"
                            style={{ left: '-50%', width: '100%', background: p.confirmado ? color.primario : color.primarioClaro, zIndex: 0 }}
                          />
                        )}
                        <button
                          onClick={() => !p.confirmado && handleConfirmarPunto(p.id)}
                          disabled={p.confirmado || confirmandoId === p.id}
                          className="w-[38px] h-[38px] rounded-full flex items-center justify-center mx-auto mb-2 relative z-10 disabled:cursor-default"
                          style={{ background: p.confirmado ? color.primario : color.primarioClaro }}
                          title={p.confirmado ? undefined : 'Confirmar punto de control'}
                        >
                          {p.confirmado ? (
                            <svg viewBox="0 0 24 24" fill="none" strokeWidth="2.2" className="w-[17px] h-[17px] stroke-white">
                              <path d="M5 12l4 4 10-10" />
                            </svg>
                          ) : (
                            <svg viewBox="0 0 24 24" fill="none" strokeWidth="1.8" className="w-[17px] h-[17px]" style={{ stroke: color.primario }}>
                              <circle cx="12" cy="12" r="9" />
                            </svg>
                          )}
                        </button>
                        <div className="text-[11.5px] font-bold text-ink-900">{p.nombre}</div>
                        <div className="text-[10px] text-ink-400 mt-0.5">
                          {p.confirmado ? formatearFechaHora(p.fechaConfirmacion) : confirmandoId === p.id ? 'Confirmando...' : 'Pendiente'}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              <div className="bg-paper px-8 py-5 border-t border-dashed border-line flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-[38px] h-[38px] rounded-[10px] flex items-center justify-center shrink-0" style={{ background: color.primarioClaro }}>
                    <svg viewBox="0 0 24 24" fill="none" strokeWidth="1.8" className="w-[18px] h-[18px]" style={{ stroke: color.primario }}>
                      <circle cx="12" cy="12" r="9" /><path d="M12 7v5l3 3" />
                    </svg>
                  </div>
                  <div>
                    <div className="text-[12.5px] font-bold text-ink-900">
                      {certificado.totalPuntosConfirmados} de {certificado.totalPuntosHabilitados} puntos de control confirmados
                    </div>
                    <div className="text-[11px] text-ink-600">Actualizado {formatearFechaHora(certificado.ultimaActualizacion)}</div>
                  </div>
                </div>
                <div className="w-[74px] h-[74px] bg-white border-[1.5px] border-line rounded-[10px] flex items-center justify-center shrink-0">
                  {qrUrl ? (
                    <img src={qrUrl} alt="Código QR del certificado" className="w-full h-full object-contain p-1.5" />
                  ) : (
                    <div className="w-full h-full bg-paper rounded animate-pulse" />
                  )}
                </div>
              </div>
            </div>

            <div className="max-w-[780px] mt-4 flex gap-2 text-ink-400">
              <svg viewBox="0 0 24 24" fill="none" strokeWidth="1.8" className="w-[14px] h-[14px] stroke-ink-400 shrink-0 mt-0.5">
                <circle cx="12" cy="12" r="9" /><path d="M12 8v5M12 16h.01" />
              </svg>
              <p className="text-[11.5px]">
                Este certificado se actualiza conforme cada punto de control registra el paso del lote (clic sobre un punto pendiente para confirmarlo). Es una herramienta de la empresa productora, distinta de la estampilla oficial que expide SYCTrace para el control departamental del impuesto al consumo.
              </p>
            </div>

            <button
              onClick={() => navigate(`/solicitudes/${id}`)}
              className="mt-4 self-start text-[12.5px] text-ink-600 font-medium hover:underline block"
            >
              ← Volver a la solicitud
            </button>
          </>
        )}
      </main>
    </div>
  );
}
