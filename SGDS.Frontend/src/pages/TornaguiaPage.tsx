import { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import Sidebar from '../components/layout/Sidebar';
import {
  getTornaguia,
  expedirTornaguia,
  legalizarTornaguia,
  descargarTornaguiaPdf,
  obtenerTornaguiaQrBlobUrl,
  type TornaguiaResponseDto,
} from '../services/infoconsumoService';
import MapaRuta from '../components/infoconsumo/MapaRuta';
import { getColorProyecto } from '../config/colorPorProyecto';

function formatearFecha(iso?: string) {
  if (!iso) return '—';
  const fecha = new Date(iso);
  if (isNaN(fecha.getTime())) return '—';
  return fecha.toLocaleDateString('es-CO', { day: '2-digit', month: 'short', year: 'numeric' });
}

const ESTADO_STYLE: Record<string, string> = {
  Elaborada: 'bg-[#f1f5f9] text-[#64748b]',
  Expedida: 'bg-blue-100 text-blue-600',
  Legalizada: 'bg-[var(--color-accento-claro)] text-[var(--color-accento)]',
  Vencida: 'bg-[#fdeaea] text-[#dc2626]',
};

export default function TornaguiaPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  const [tornaguia, setTornaguia] = useState<TornaguiaResponseDto | null>(null);
  const [qrUrl, setQrUrl] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [expidiendo, setExpidiendo] = useState(false);
  const [legalizando, setLegalizando] = useState(false);
  const [exportando, setExportando] = useState(false);

  function cargar() {
    if (!id) return;
    setLoading(true);
    setError(null);
    getTornaguia(Number(id))
      .then(setTornaguia)
      .catch((err) => setError(err?.response?.data?.mensaje ?? 'No se pudo cargar la tornaguía.'))
      .finally(() => setLoading(false));
  }

  useEffect(cargar, [id]);

  useEffect(() => {
    if (!id) return;
    let url: string | null = null;
    obtenerTornaguiaQrBlobUrl(Number(id))
      .then((u) => { url = u; setQrUrl(u); })
      .catch(() => {});
    return () => {
      if (url) window.URL.revokeObjectURL(url);
    };
  }, [id, tornaguia?.estado]);

  const color = getColorProyecto('Infoconsumo');

  async function handleExpedir() {
    if (!id) return;
    setExpidiendo(true);
    setError(null);
    try {
      await expedirTornaguia(Number(id));
      cargar();
    } catch (err: any) {
      setError(err?.response?.data?.mensaje ?? 'No se pudo expedir la tornaguía.');
    } finally {
      setExpidiendo(false);
    }
  }

  async function handleLegalizar() {
    if (!id) return;
    setLegalizando(true);
    setError(null);
    try {
      await legalizarTornaguia(Number(id));
      cargar();
    } catch (err: any) {
      setError(err?.response?.data?.mensaje ?? 'No se pudo legalizar la tornaguía.');
    } finally {
      setLegalizando(false);
    }
  }

  async function handleExportar() {
    if (!id || !tornaguia) return;
    setExportando(true);
    try {
      await descargarTornaguiaPdf(Number(id), `Tornaguia_${tornaguia.numero}.pdf`);
    } catch {
      alert('No se pudo generar el PDF de la tornaguía.');
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
            {tornaguia ? `#${tornaguia.numero}` : 'Solicitud'}
          </Link>
          <span>/</span>
          <span className="text-ink-900 font-semibold">Tornaguía</span>
        </div>

        {loading ? (
          <div className="text-center text-sm text-ink-400 py-10">Cargando tornaguía...</div>
        ) : error || !tornaguia ? (
          <div className="max-w-[680px] bg-white border border-line rounded-[14px] p-5">
            <p className="text-[13px] text-red-600 mb-3">{error ?? 'No se pudo cargar la tornaguía.'}</p>
            <button onClick={() => navigate(id ? `/solicitudes/${id}` : '/solicitudes')} className="text-[12.5px] text-blue-600 font-medium">
              ← Volver a la solicitud
            </button>
          </div>
        ) : (
          <div className="max-w-[680px] flex flex-col gap-5">
            <div className="flex items-center justify-between">
              <div>
                <h1 className="font-display text-[19px] font-semibold text-ink-900">Tornaguía de {tornaguia.tipoTramite}</h1>
                <p className="text-ink-600 text-[12.5px] mt-[2px]">
                  Secretaría de Hacienda Departamental — Unidad de Rentas · Número {tornaguia.numero}
                </p>
              </div>
              <div className="flex items-center gap-2.5">
                <button
                  onClick={() => navigate(`/infoconsumo/empresas/${tornaguia.empresaId}/historial?volverA=${encodeURIComponent(`/solicitudes/${id}/tornaguia`)}`)}
                  className="flex items-center gap-1.5 bg-white border border-line text-ink-600 rounded-[9px] px-4 py-2 text-[12.5px] font-semibold hover:bg-paper"
                >
                  <svg viewBox="0 0 24 24" fill="none" strokeWidth="1.8" className="w-[13px] h-[13px] stroke-ink-600">
                    <circle cx="6" cy="6" r="2.5" /><circle cx="18" cy="6" r="2.5" /><circle cx="6" cy="18" r="2.5" /><circle cx="18" cy="18" r="2.5" />
                    <path d="M9 6h6M6 9v6M18 9v6M9 18h6" />
                  </svg>
                  Ver historial
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
              <span className={`inline-flex items-center gap-1.5 text-[11.5px] font-semibold px-[10px] py-[5px] rounded-full ${ESTADO_STYLE[tornaguia.estado] ?? 'bg-paper text-ink-600'}`}>
                <span className="w-1.5 h-1.5 rounded-full bg-current" />
                {tornaguia.estado}
              </span>
              {tornaguia.estado === 'Elaborada' && (
                <span className="text-[12px] text-ink-600">Aún no se ha expedido — genera el código QR y la vigencia al expedirla.</span>
              )}
            </div>

            {error && (
              <div className="text-xs text-red-600 bg-red-50 border border-red-200 rounded-lg px-3 py-2">{error}</div>
            )}

            {tornaguia.estado === 'Elaborada' ? (
              <button
                onClick={handleExpedir}
                disabled={expidiendo}
                className="self-start flex items-center gap-1.5 bg-[var(--color-accento)] text-white rounded-[9px] px-5 py-2.5 text-[13px] font-semibold disabled:opacity-60"
              >
                {expidiendo ? 'Expidiendo...' : 'Expedir tornaguía'}
              </button>
            ) : (
              <>
                <div className="bg-white border border-line rounded-[14px] p-5">
                  <h3 className="font-display text-[13.5px] font-semibold text-ink-900 mb-4">Producto amparado</h3>
                  <div className="grid grid-cols-2 gap-x-8 gap-y-3">
                    {[
                      ['Categoría', tornaguia.categoriaProducto],
                      ['Unidades', `${tornaguia.unidadesFisicas.toLocaleString('es-CO')} (${tornaguia.volumenTotalCc.toLocaleString('es-CO')} cc)`],
                      ['Grados alcoholimétricos', tornaguia.gradosAlcoholimetricos ? `${tornaguia.gradosAlcoholimetricos}°` : '—'],
                    ].map(([lbl, val]) => (
                      <div key={lbl}>
                        <div className="text-[10.5px] uppercase tracking-wide text-ink-400 font-semibold mb-1">{lbl}</div>
                        <div className="text-[13.5px] font-semibold text-ink-900">{val}</div>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="bg-white border border-line rounded-[14px] p-5">
                  <h3 className="font-display text-[13.5px] font-semibold text-ink-900 mb-4">Empresa remitente</h3>
                  <div className="grid grid-cols-2 gap-x-8 gap-y-3">
                    <div>
                      <div className="text-[10.5px] uppercase tracking-wide text-ink-400 font-semibold mb-1">Razón social</div>
                      <div className="text-[13.5px] font-semibold text-ink-900">{tornaguia.empresaRazonSocial}</div>
                    </div>
                    <div>
                      <div className="text-[10.5px] uppercase tracking-wide text-ink-400 font-semibold mb-1">NIT</div>
                      <div className="text-[13.5px] font-semibold text-ink-900">{tornaguia.empresaNit}</div>
                    </div>
                  </div>
                </div>

                <div className="bg-white border border-line rounded-[14px] p-5">
                  <h3 className="font-display text-[13.5px] font-semibold text-ink-900 mb-4">Transportador</h3>
                  <div className="grid grid-cols-2 gap-x-8 gap-y-3">
                    {[
                      ['Empresa transportadora', tornaguia.empresaTransportadora],
                      ['Conductor', tornaguia.conductor ?? '—'],
                      ['Cédula del conductor', tornaguia.cedulaConductor ?? '—'],
                      ['Placa del vehículo', tornaguia.placaVehiculo],
                      ['Tipo de vehículo', tornaguia.tipoVehiculo ?? '—'],
                    ].map(([lbl, val]) => (
                      <div key={lbl}>
                        <div className="text-[10.5px] uppercase tracking-wide text-ink-400 font-semibold mb-1">{lbl}</div>
                        <div className="text-[13.5px] font-semibold text-ink-900">{val}</div>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="bg-white border border-line rounded-[14px] p-5">
                  <h3 className="font-display text-[13.5px] font-semibold text-ink-900 mb-4">Movilización autorizada</h3>
                  <div className="grid grid-cols-2 gap-x-8 gap-y-3 mb-4">
                    <div>
                      <div className="text-[10.5px] uppercase tracking-wide text-ink-400 font-semibold mb-1">Tipo de transporte</div>
                      <div className="text-[13.5px] font-semibold text-ink-900">{tornaguia.tipoTransporte}</div>
                    </div>
                    <div>
                      <div className="text-[10.5px] uppercase tracking-wide text-ink-400 font-semibold mb-1">Origen</div>
                      <div className="text-[13.5px] font-semibold text-ink-900">{tornaguia.municipioOrigen}, {tornaguia.departamentoOrigen}</div>
                    </div>
                    <div>
                      <div className="text-[10.5px] uppercase tracking-wide text-ink-400 font-semibold mb-1">Destino</div>
                      <div className="text-[13.5px] font-semibold text-ink-900">{tornaguia.municipioDestino}, {tornaguia.departamentoDestino}</div>
                    </div>
                  </div>
                  {tornaguia.latOrigen != null && tornaguia.lngOrigen != null && tornaguia.latDestino != null && tornaguia.lngDestino != null && (
                    <>
                      <MapaRuta
                        latOrigen={tornaguia.latOrigen}
                        lngOrigen={tornaguia.lngOrigen}
                        latDestino={tornaguia.latDestino}
                        lngDestino={tornaguia.lngDestino}
                        labelOrigen={`${tornaguia.municipioOrigen}, ${tornaguia.departamentoOrigen}`}
                        labelDestino={`${tornaguia.municipioDestino}, ${tornaguia.departamentoDestino}`}
                        tipoTransporte={tornaguia.tipoTransporte}
                        color={color.primario}
                      />
                      {tornaguia.distanciaAproximadaKm != null && (
                        <p className="text-[11px] text-ink-400 mt-2">
                          Distancia aproximada entre capitales de departamento (línea recta): {tornaguia.distanciaAproximadaKm.toFixed(0)} km — no es distancia vial real.
                        </p>
                      )}
                    </>
                  )}
                </div>

                <div className="bg-white border border-line rounded-[14px] p-6 text-center">
                  {tornaguia.fechaVigenciaLimite && (
                    <p className="text-[13px] font-semibold text-ink-900 mb-1">
                      Vigente hasta el {formatearFecha(tornaguia.fechaVigenciaLimite)}
                    </p>
                  )}
                  <p className="text-[11.5px] text-ink-600 mb-4">
                    {tornaguia.tipoTramite === 'Tránsito' ? '10 días calendario' : '15 días calendario'} para legalización (Decreto 3071 de 1997).
                  </p>
                  {tornaguia.estado === 'Expedida' && (
                    <button
                      onClick={handleLegalizar}
                      disabled={legalizando}
                      className="mb-4 flex items-center gap-1.5 bg-[var(--color-accento)] text-white rounded-[9px] px-5 py-2.5 text-[13px] font-semibold disabled:opacity-60 mx-auto"
                    >
                      {legalizando ? 'Legalizando...' : 'Legalizar tornaguía'}
                    </button>
                  )}
                  {qrUrl ? (
                    <img src={qrUrl} alt="Código QR de la tornaguía" className="w-[160px] h-[160px] mx-auto" />
                  ) : (
                    <div className="w-[160px] h-[160px] mx-auto bg-paper rounded-lg animate-pulse" />
                  )}
                  <p className="text-[11px] text-ink-400 mt-2 tracking-widest">{tornaguia.numero}</p>
                </div>
              </>
            )}

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
