import { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import Sidebar from '../components/layout/Sidebar';
import {
  getLiquidacionEstampillas,
  descargarPreliquidacionEstampillasPdf,
  obtenerPreliquidacionEstampillasQrBlobUrl,
  type LiquidacionEstampillasResponseDto,
} from '../services/solicitudService';
import { getColorProyecto } from '../config/colorPorProyecto';

function formatearMoneda(valor: number) {
  return new Intl.NumberFormat('es-CO', { style: 'currency', currency: 'COP', maximumFractionDigits: 0 }).format(valor);
}

function formatearFecha(iso?: string) {
  if (!iso) return '—';
  const fecha = new Date(iso);
  if (isNaN(fecha.getTime())) return iso;
  return fecha.toLocaleDateString('es-CO', { day: '2-digit', month: 'short', year: 'numeric' });
}

export default function PreliquidacionEstampillasPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  const [liquidacion, setLiquidacion] = useState<LiquidacionEstampillasResponseDto | null>(null);
  const [qrUrl, setQrUrl] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [exportando, setExportando] = useState(false);

  useEffect(() => {
    if (!id) return;
    setLoading(true);
    setError(null);
    getLiquidacionEstampillas(Number(id))
      .then(setLiquidacion)
      .catch((err) => setError(err?.response?.data?.mensaje ?? 'No se pudo calcular la liquidación de esta solicitud.'))
      .finally(() => setLoading(false));
  }, [id]);

  useEffect(() => {
    if (!id) return;
    let url: string | null = null;
    obtenerPreliquidacionEstampillasQrBlobUrl(Number(id))
      .then((u) => { url = u; setQrUrl(u); })
      .catch(() => {});
    return () => {
      if (url) window.URL.revokeObjectURL(url);
    };
  }, [id]);

  const color = getColorProyecto('Estampillas');

  async function handleExportar() {
    if (!id || !liquidacion) return;
    setExportando(true);
    try {
      await descargarPreliquidacionEstampillasPdf(Number(id), `Liquidacion_Estampillas_${liquidacion.numero}.pdf`);
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
          <span className="text-ink-900 font-semibold">Liquidación</span>
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
                <h1 className="font-display text-[19px] font-semibold text-ink-900">Liquidación de Estampillas Departamentales</h1>
                <p className="text-ink-600 text-[12.5px] mt-[2px]">
                  Secretaría de Hacienda Departamental — Unidad de Rentas · Referencia {liquidacion.numero}
                </p>
              </div>
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

            <div className="bg-white border border-line rounded-[14px] p-5">
              <h3 className="font-display text-[13.5px] font-semibold text-ink-900 mb-4">Contribuyente</h3>
              <div className="grid grid-cols-2 gap-x-8 gap-y-3">
                <div>
                  <div className="text-[10.5px] uppercase tracking-wide text-ink-400 font-semibold mb-1">Nombre / Razón social</div>
                  <div className="text-[13.5px] font-semibold text-ink-900">{liquidacion.contribuyenteNombre}</div>
                </div>
                <div>
                  <div className="text-[10.5px] uppercase tracking-wide text-ink-400 font-semibold mb-1">Documento / NIT</div>
                  <div className="text-[13.5px] font-semibold text-ink-900">{liquidacion.contribuyenteDocumento}</div>
                </div>
              </div>
            </div>

            <div className="bg-white border border-line rounded-[14px] p-5">
              <h3 className="font-display text-[13.5px] font-semibold text-ink-900 mb-4">Contrato</h3>
              <div className="grid grid-cols-2 gap-x-8 gap-y-3">
                {[
                  ['Hecho generador', liquidacion.hechoGenerador ?? '—'],
                  ['Objeto', liquidacion.objetoContrato ?? '—'],
                  ['Fecha de suscripción', formatearFecha(liquidacion.fechaSuscripcion)],
                  ['Valor del contrato', formatearMoneda(liquidacion.valorContrato)],
                  ['Base gravable', formatearMoneda(liquidacion.baseGravable)],
                ].map(([lbl, val]) => (
                  <div key={lbl}>
                    <div className="text-[10.5px] uppercase tracking-wide text-ink-400 font-semibold mb-1">{lbl}</div>
                    <div className="text-[13.5px] font-semibold text-ink-900">{val}</div>
                  </div>
                ))}
              </div>
            </div>

            <div className="bg-white border border-line rounded-[14px] overflow-hidden">
              <div className="px-5 py-[14px] border-b border-line">
                <h3 className="font-display text-[13.5px] font-semibold text-ink-900">Liquidación — Estampillas Departamentales (Santander)</h3>
              </div>
              <table className="w-full border-collapse">
                <thead>
                  <tr>
                    {['Estampilla', 'Tarifa', 'Base gravable', 'Valor'].map((h) => (
                      <th key={h} className={`text-[10.5px] uppercase tracking-wide text-ink-400 font-semibold px-5 py-[10px] border-b border-line ${h === 'Estampilla' || h === 'Tarifa' ? 'text-left' : 'text-right'}`}>
                        {h}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {liquidacion.items.filter((i) => i.aplica).map((item) => (
                    <tr key={item.nombre}>
                      <td className="px-5 py-3 text-[13px] font-semibold text-ink-900 border-b border-line">{item.nombre}</td>
                      <td className="px-5 py-3 text-[13px] text-ink-600 border-b border-line">{(item.tarifa * 100).toFixed(1)}%</td>
                      <td className="px-5 py-3 text-[13px] text-right border-b border-line">{formatearMoneda(item.baseGravable)}</td>
                      <td className="px-5 py-3 text-[13px] font-semibold text-right border-b border-line">{formatearMoneda(item.valor)}</td>
                    </tr>
                  ))}
                  {liquidacion.items.every((i) => !i.aplica) && (
                    <tr>
                      <td colSpan={4} className="px-5 py-8 text-center text-sm text-ink-400">
                        Ninguna estampilla aplica con los datos registrados para este contrato.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
              <div className="flex items-center justify-between px-5 py-4 border-t border-line bg-paper">
                <span className="text-[13px] font-semibold text-ink-900">Total a pagar</span>
                <span className="font-display text-[17px] font-bold text-[var(--color-accento)]">{formatearMoneda(liquidacion.total)}</span>
              </div>
            </div>

            {liquidacion.items.some((i) => !i.aplica) && (
              <details className="bg-white border border-line rounded-[14px] p-5">
                <summary className="text-[12.5px] font-semibold text-ink-600 cursor-pointer">
                  Estampillas que no aplican a este contrato ({liquidacion.items.filter((i) => !i.aplica).length})
                </summary>
                <ul className="mt-3 flex flex-col gap-2">
                  {liquidacion.items.filter((i) => !i.aplica).map((item) => (
                    <li key={item.nombre} className="text-[12px] text-ink-600">
                      <b className="text-ink-900">{item.nombre}:</b> {item.motivo}
                    </li>
                  ))}
                </ul>
              </details>
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
              Tarifas de referencia — deben validarse contra el Estatuto de Rentas del Departamento de Santander vigente.
              No se aplica ningún recargo adicional sobre el total (Ordenanza 012/2005 anulada judicialmente): el total
              es la suma lineal de las estampillas aplicables.
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
