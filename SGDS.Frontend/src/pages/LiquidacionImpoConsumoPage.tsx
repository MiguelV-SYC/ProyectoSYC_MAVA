import { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import Sidebar from '../components/layout/Sidebar';
import {
  getLiquidacionImpoConsumo,
  descargarLiquidacionPdf,
  obtenerLiquidacionQrBlobUrl,
  getTornaguia,
  type LiquidacionImpoConsumoResponseDto,
} from '../services/infoconsumoService';
import { getColorProyecto } from '../config/colorPorProyecto';

function formatearMoneda(valor: number) {
  return new Intl.NumberFormat('es-CO', { style: 'currency', currency: 'COP', maximumFractionDigits: 0 }).format(valor);
}

export default function LiquidacionImpoConsumoPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  const [liquidacion, setLiquidacion] = useState<LiquidacionImpoConsumoResponseDto | null>(null);
  const [empresaId, setEmpresaId] = useState<number | null>(null);
  const [qrUrl, setQrUrl] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [exportando, setExportando] = useState(false);

  useEffect(() => {
    if (!id) return;
    setLoading(true);
    setError(null);
    Promise.all([getLiquidacionImpoConsumo(Number(id)), getTornaguia(Number(id))])
      .then(([liq, t]) => {
        setLiquidacion(liq);
        setEmpresaId(t.empresaId);
      })
      .catch((err) => setError(err?.response?.data?.mensaje ?? 'No se pudo calcular la liquidación de esta solicitud.'))
      .finally(() => setLoading(false));
  }, [id]);

  useEffect(() => {
    if (!id) return;
    let url: string | null = null;
    obtenerLiquidacionQrBlobUrl(Number(id))
      .then((u) => { url = u; setQrUrl(u); })
      .catch(() => {});
    return () => {
      if (url) window.URL.revokeObjectURL(url);
    };
  }, [id]);

  const color = getColorProyecto('Infoconsumo');

  async function handleExportar() {
    if (!id || !liquidacion) return;
    setExportando(true);
    try {
      await descargarLiquidacionPdf(Number(id), `Liquidacion_ICL_${liquidacion.numero}.pdf`);
    } catch {
      alert('No se pudo generar el PDF de la liquidación.');
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

      <main className="flex-1 px-[38px] py-7 overflow-y-auto">
        <div className="flex items-center gap-1.5 text-xs text-ink-400 mb-3.5">
          <Link to={id ? `/solicitudes/${id}` : '/solicitudes'} className="hover:text-ink-600">
            {liquidacion ? `#${liquidacion.numero}` : 'Solicitud'}
          </Link>
          <span>/</span>
          <span className="text-ink-900 font-semibold">Preliquidación</span>
        </div>

        {loading ? (
          <div className="text-center text-sm text-ink-400 py-10">Calculando liquidación...</div>
        ) : error || !liquidacion ? (
          <div className="max-w-[640px] bg-white border border-line rounded-[14px] p-5">
            <p className="text-[13px] text-red-600 mb-3">{error ?? 'No se pudo cargar la liquidación.'}</p>
            <button onClick={() => navigate(id ? `/solicitudes/${id}` : '/solicitudes')} className="text-[12.5px] text-blue-600 font-medium">
              ← Volver a la solicitud
            </button>
          </div>
        ) : (
          <div className="max-w-[640px] flex flex-col gap-5">
            <div className="flex items-center justify-between">
              <div>
                <h1 className="font-display text-[19px] font-semibold text-ink-900">Preliquidación Impuesto al Consumo</h1>
                <p className="text-ink-600 text-[12.5px] mt-[2px]">
                  Secretaría de Hacienda Departamental — Unidad de Rentas · Referencia {liquidacion.numero}
                </p>
              </div>
              <div className="flex items-center gap-2.5">
                {empresaId != null && (
                  <button
                    onClick={() => navigate(`/infoconsumo/empresas/${empresaId}/historial?volverA=${encodeURIComponent(`/solicitudes/${id}/liquidacion-impoconsumo`)}`)}
                    className="flex items-center gap-1.5 bg-white border border-line text-ink-600 rounded-[9px] px-4 py-2 text-[12.5px] font-semibold hover:bg-paper"
                  >
                    <svg viewBox="0 0 24 24" fill="none" strokeWidth="1.8" className="w-[13px] h-[13px] stroke-ink-600">
                      <circle cx="6" cy="6" r="2.5" /><circle cx="18" cy="6" r="2.5" /><circle cx="6" cy="18" r="2.5" /><circle cx="18" cy="18" r="2.5" />
                      <path d="M9 6h6M6 9v6M18 9v6M9 18h6" />
                    </svg>
                    Ver historial
                  </button>
                )}
                <button
                  onClick={handleExportar}
                  disabled={exportando}
                  className="flex items-center gap-1.5 bg-[var(--color-accento)] text-white rounded-[9px] px-4 py-2 text-[12.5px] font-semibold disabled:opacity-60"
                >
                  <svg viewBox="0 0 24 24" fill="none" strokeWidth="2.2" className="w-[13px] h-[13px] stroke-white">
                    <path d="M12 3v13M6 10l6 6 6-6" /><path d="M5 21h14" />
                  </svg>
                  {exportando ? 'Generando...' : 'Exportar PDF'}
                </button>
              </div>
            </div>

            <div className="bg-white border border-line rounded-[14px] p-5">
              <h3 className="font-display text-[13.5px] font-semibold text-ink-900 mb-4">Contribuyente</h3>
              <div className="grid grid-cols-2 gap-x-8 gap-y-3">
                <div>
                  <div className="text-[10.5px] uppercase tracking-wide text-ink-400 font-semibold mb-1">Razón social</div>
                  <div className="text-[13.5px] font-semibold text-ink-900">{liquidacion.contribuyenteNombre}</div>
                </div>
                <div>
                  <div className="text-[10.5px] uppercase tracking-wide text-ink-400 font-semibold mb-1">NIT</div>
                  <div className="text-[13.5px] font-semibold text-ink-900">{liquidacion.contribuyenteNit}</div>
                </div>
              </div>
            </div>

            <div className="bg-white border border-line rounded-[14px] p-5">
              <h3 className="font-display text-[13.5px] font-semibold text-ink-900 mb-4">Producto gravado</h3>
              <div className="grid grid-cols-2 gap-x-8 gap-y-3">
                {[
                  ['Categoría', liquidacion.categoriaProducto],
                  ['Unidades', `${liquidacion.unidadesFisicas.toLocaleString('es-CO')} (${liquidacion.volumenTotalCc.toLocaleString('es-CO')} cc)`],
                  ['Grados alcoholimétricos', liquidacion.gradosAlcoholimetricos ? `${liquidacion.gradosAlcoholimetricos}°` : '—'],
                  ['PVP certificado', formatearMoneda(liquidacion.pvpCertificado)],
                ].map(([lbl, val]) => (
                  <div key={lbl}>
                    <div className="text-[10.5px] uppercase tracking-wide text-ink-400 font-semibold mb-1">{lbl}</div>
                    <div className="text-[13.5px] font-semibold text-ink-900">{val}</div>
                  </div>
                ))}
              </div>
            </div>

            {!liquidacion.soportado ? (
              <div className="bg-white border border-line rounded-[14px] p-5 text-[13px] text-red-600">
                {liquidacion.motivoNoSoportado}
              </div>
            ) : (
              <div className="bg-white border border-line rounded-[14px] overflow-hidden">
                <div className="px-5 py-[14px] border-b border-line">
                  <h3 className="font-display text-[13.5px] font-semibold text-ink-900">
                    Liquidación — Impuesto al Consumo de Licores (ICL)
                    {liquidacion.aplicaExcepcionSanAndres && ' · tarifa San Andrés'}
                  </h3>
                </div>
                <table className="w-full border-collapse">
                  <thead>
                    <tr>
                      {['Concepto', 'Tarifa', 'Valor'].map((h) => (
                        <th key={h} className={`text-[10.5px] uppercase tracking-wide text-ink-400 font-semibold px-5 py-[10px] border-b border-line ${h === 'Valor' ? 'text-right' : 'text-left'}`}>
                          {h}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    <tr>
                      <td className="px-5 py-3 text-[13px] font-semibold text-ink-900 border-b border-line">Componente específico</td>
                      <td className="px-5 py-3 text-[13px] text-ink-600 border-b border-line">${liquidacion.tarifaEspecifica.toLocaleString('es-CO')} × grado</td>
                      <td className="px-5 py-3 text-[13px] font-semibold text-right border-b border-line">{formatearMoneda(liquidacion.componenteEspecifico)}</td>
                    </tr>
                    <tr>
                      <td className="px-5 py-3 text-[13px] font-semibold text-ink-900 border-b border-line">Componente ad valorem</td>
                      <td className="px-5 py-3 text-[13px] text-ink-600 border-b border-line">{(liquidacion.tarifaAdValorem * 100).toFixed(0)}% sobre PVP</td>
                      <td className="px-5 py-3 text-[13px] font-semibold text-right border-b border-line">{formatearMoneda(liquidacion.componenteAdValorem)}</td>
                    </tr>
                  </tbody>
                </table>
                <div className="flex flex-col gap-1 items-end px-5 py-4 border-t border-line bg-paper">
                  <span className="text-[12px] text-ink-600">ICL informativo: {formatearMoneda(liquidacion.iclInformativo)}</span>
                  <span className="text-[13px] font-semibold text-ink-900">
                    Total a pagar: <span className="font-display text-[17px] font-bold text-[var(--color-accento)]">{formatearMoneda(liquidacion.totalAPagar)}</span>
                  </span>
                </div>
                {liquidacion.esSoloInformativo && (
                  <p className="px-5 py-3 text-[11px] text-ink-600 border-t border-line">
                    El trámite es de {liquidacion.tipoTramite} — el impuesto no se causa en este departamento; el valor se muestra solo de forma informativa (el neto a pagar es $0).
                  </p>
                )}
              </div>
            )}

            <div className="bg-white border border-line rounded-[14px] p-6 text-center">
              {qrUrl ? (
                <img src={qrUrl} alt="Código QR de referencia de pago" className="w-[160px] h-[160px] mx-auto" />
              ) : (
                <div className="w-[160px] h-[160px] mx-auto bg-paper rounded-lg animate-pulse" />
              )}
              <p className="text-[11px] text-ink-400 mt-2 tracking-widest">{liquidacion.numero}</p>
              <div className="mt-4 pt-4 border-t border-line text-[10.5px] text-ink-600 leading-relaxed">
                <p>Bancos: Davivienda, BBVA, Bancolombia, Banco de Bogotá</p>
                <p>PSE: tarjeta débito/crédito · cuentas de ahorro</p>
              </div>
            </div>

            <p className="text-[11px] text-ink-400 leading-relaxed">
              Tarifas vigentes según Certificación 003 de MinHacienda (dic. 2025): $360/grado (licores) o $243/grado (vinos) en
              envase de 750 cc, más 30%/20% ad valorem respectivamente — $57/grado para destino Archipiélago de San Andrés,
              Providencia y Santa Catalina. Tarifas configurables sin cambios de código.
            </p>

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
