import { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import Sidebar from '../components/layout/Sidebar';
import {
  getSolicitudDetalle,
  descargarPreliquidacionPdf,
  obtenerPreliquidacionQrBlobUrl,
  type SolicitudDetalleResponseDto,
} from '../services/solicitudService';
import { getVehiculoDetalle, type VehiculoResponseDto } from '../services/vehiculoService';
import { getColorProyecto } from '../config/colorPorProyecto';

function formatearMoneda(valor: number) {
  return new Intl.NumberFormat('es-CO', { style: 'currency', currency: 'COP', maximumFractionDigits: 0 }).format(valor);
}

function formatearFecha(fecha: Date) {
  return fecha.toLocaleDateString('es-CO', { day: '2-digit', month: 'short', year: 'numeric' });
}

// El +10% de blindaje ya viene incluido en datos.baseGravable cuando aplica (lo calcula
// CalculadoraBaseGravableVehiculo.cs al radicar) — no se vuelve a aplicar aquí para no
// contarlo dos veces. El descuento de antiguo/clásico sí sigue aplicándose aquí porque el
// motor de base gravable no lo resuelve (tarifa/base fija todavía sin configurar).
function calcularImpuesto(avaluo: number, antiguoClasico: boolean) {
  let base = avaluo;
  if (antiguoClasico) base = base * 0.5;
  const tarifa = base <= 57_349_000 ? 0.015 : base <= 129_032_000 ? 0.025 : 0.035;
  const impuesto = Math.round(base * tarifa);
  return { base, tarifa, impuesto };
}

export default function PreliquidacionPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  const [solicitud, setSolicitud] = useState<SolicitudDetalleResponseDto | null>(null);
  const [vehiculo, setVehiculo] = useState<VehiculoResponseDto | null>(null);
  const [qrUrl, setQrUrl] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [exportando, setExportando] = useState(false);

  useEffect(() => {
    if (!id) return;
    setLoading(true);
    getSolicitudDetalle(Number(id))
      .then((s) => {
        setSolicitud(s);
        if (s.vehiculoId) return getVehiculoDetalle(s.vehiculoId).then(setVehiculo);
      })
      .finally(() => setLoading(false));
  }, [id]);

  useEffect(() => {
    if (!id) return;
    let url: string | null = null;
    obtenerPreliquidacionQrBlobUrl(Number(id)).then((u) => {
      url = u;
      setQrUrl(u);
    });
    return () => {
      if (url) window.URL.revokeObjectURL(url);
    };
  }, [id]);

  const color = getColorProyecto(solicitud?.proyectoNombre);

  if (loading || !solicitud) {
    return (
      <div className="flex min-h-screen bg-paper">
        <Sidebar active="solicitudes" />
        <main className="flex-1 flex items-center justify-center text-sm text-ink-400">Cargando preliquidación...</main>
      </div>
    );
  }

  let datos: Record<string, string> = {};
  try {
    datos = solicitud.datosAdicionales ? JSON.parse(solicitud.datosAdicionales) : {};
  } catch {
    datos = {};
  }

  const avaluo = Number(datos.baseGravable) || 0;
  const antiguoClasico = datos.antiguoClasico === 'Sí';
  const blindado = datos.blindado === 'Sí';
  const { base, tarifa, impuesto } = calcularImpuesto(avaluo, antiguoClasico);

  const fechaInicio = new Date(solicitud.fechaCreacion);
  const fechaLimiteOportuno = new Date(fechaInicio);
  fechaLimiteOportuno.setDate(fechaLimiteOportuno.getDate() + 15);
  const fechaLimiteExtraordinario = new Date(fechaInicio);
  fechaLimiteExtraordinario.setDate(fechaLimiteExtraordinario.getDate() + 30);
  const totalExtraordinario = Math.round(impuesto * 1.05);

  const propietarioNombre = solicitud.ciudadanoNombre ?? solicitud.empresaNombre ?? '—';
  const propietarioDocumento = solicitud.ciudadanoDocumento ?? solicitud.empresaNit ?? '—';

  async function handleExportar() {
    if (!solicitud) return;
    setExportando(true);
    try {
      await descargarPreliquidacionPdf(solicitud.id, `Preliquidacion_${solicitud.numero}.pdf`);
    } catch {
      alert('No se pudo generar el PDF de la preliquidación.');
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
          <Link to={`/solicitudes/${solicitud.id}`} className="hover:text-ink-600">#{solicitud.numero}</Link>
          <span>/</span>
          <span className="text-ink-900 font-semibold">Preliquidación</span>
        </div>

        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-6 max-w-[640px]">
          <div>
            <h1 className="font-display text-[19px] font-semibold text-ink-900">Liquidación de Impuesto Vehicular</h1>
            <p className="text-ink-600 text-[12.5px] mt-[2px]">Departamento de Santander · SGDS — Referencia {solicitud.numero}</p>
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

        <div className="max-w-[640px] flex flex-col gap-5">
          <div className="bg-white border border-line rounded-[14px] p-5">
            <h3 className="font-display text-[13.5px] font-semibold text-ink-900 mb-4">Datos del vehículo</h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-8 gap-y-3">
              {[
                ['Placa', vehiculo?.placa ?? solicitud.vehiculoPlaca ?? '—'],
                ['Marca / Línea', [vehiculo?.marca ?? solicitud.vehiculoMarca, vehiculo?.linea ?? solicitud.vehiculoLinea].filter(Boolean).join(' ') || '—'],
                ['Modelo', String(vehiculo?.modelo ?? solicitud.vehiculoModelo ?? '—')],
                ['Número de chasis', vehiculo?.numeroChasis ?? '—'],
                ['Tipo de vehículo', datos.tipoVehiculo ?? '—'],
                ['Subtipo', datos.subtipo ?? '—'],
                ['Cilindraje', datos.cilindraje ?? '—'],
                ['Municipio de matrícula', datos.municipioMatricula ?? '—'],
                ['Departamento de matrícula', datos.departamentoMatricula ?? '—'],
              ].map(([lbl, val]) => (
                <div key={lbl}>
                  <div className="text-[10.5px] uppercase tracking-wide text-ink-400 font-semibold mb-1">{lbl}</div>
                  <div className="text-[13.5px] font-semibold text-ink-900">{val}</div>
                </div>
              ))}
            </div>
          </div>

          <div className="bg-white border border-line rounded-[14px] p-5">
            <h3 className="font-display text-[13.5px] font-semibold text-ink-900 mb-4">Propietario</h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-8 gap-y-3">
              <div>
                <div className="text-[10.5px] uppercase tracking-wide text-ink-400 font-semibold mb-1">Nombre</div>
                <div className="text-[13.5px] font-semibold text-ink-900">{propietarioNombre}</div>
              </div>
              <div>
                <div className="text-[10.5px] uppercase tracking-wide text-ink-400 font-semibold mb-1">Documento</div>
                <div className="text-[13.5px] font-semibold text-ink-900">{propietarioDocumento}</div>
              </div>
            </div>
          </div>

          <div className="bg-white border border-line rounded-[14px] p-5">
            <h3 className="font-display text-[13.5px] font-semibold text-ink-900 mb-4">Base gravable</h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-8 gap-y-3">
              {[
                ['Base gravable (tabla Mintransporte o valor de compra)', formatearMoneda(avaluo)],
                ['¿Antiguo o clásico?', antiguoClasico ? 'Sí' : 'No'],
                ['¿Blindado?', blindado ? 'Sí (ya incluido arriba)' : 'No'],
                ['Base gravable ajustada', formatearMoneda(base)],
                ['Tarifa aplicada', `${(tarifa * 100).toFixed(1)}%`],
              ].map(([lbl, val]) => (
                <div key={lbl}>
                  <div className="text-[10.5px] uppercase tracking-wide text-ink-400 font-semibold mb-1">{lbl}</div>
                  <div className="text-[13.5px] font-semibold text-ink-900">{val}</div>
                </div>
              ))}
              <div>
                <div className="text-[10.5px] uppercase tracking-wide text-ink-400 font-semibold mb-1">Valor del impuesto</div>
                <div className="text-[15px] font-bold text-[var(--color-accento)]">{formatearMoneda(impuesto)}</div>
              </div>
            </div>
          </div>

          <div className="bg-white border border-line rounded-[14px] overflow-hidden">
            <div className="px-5 py-[14px] border-b border-line">
              <h3 className="font-display text-[13.5px] font-semibold text-ink-900">Fechas y valores de pago</h3>
            </div>
            <div className="overflow-x-auto">
            <table className="w-full border-collapse">
              <thead>
                <tr>
                  {['Concepto', 'Fecha límite', 'Valor a pagar'].map((h) => (
                    <th key={h} className="text-left text-[10.5px] uppercase tracking-wide text-ink-400 font-semibold px-5 py-[10px] border-b border-line">
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td className="px-5 py-3 text-[13px] border-b border-line">Pago oportuno</td>
                  <td className="px-5 py-3 text-[13px] border-b border-line">{formatearFecha(fechaLimiteOportuno)}</td>
                  <td className="px-5 py-3 text-[13px] font-semibold border-b border-line">{formatearMoneda(impuesto)}</td>
                </tr>
                <tr>
                  <td className="px-5 py-3 text-[13px]">Pago extraordinario (+5% recargo)</td>
                  <td className="px-5 py-3 text-[13px]">{formatearFecha(fechaLimiteExtraordinario)}</td>
                  <td className="px-5 py-3 text-[13px] font-semibold">{formatearMoneda(totalExtraordinario)}</td>
                </tr>
              </tbody>
            </table>
            </div>
          </div>

          <div className="bg-white border border-line rounded-[14px] p-6 text-center">
            {qrUrl ? (
              <img src={qrUrl} alt="Código QR de referencia de pago" className="w-[160px] h-[160px] mx-auto" />
            ) : (
              <div className="w-[160px] h-[160px] mx-auto bg-paper rounded-lg animate-pulse" />
            )}
            <p className="text-[11px] text-ink-400 mt-2 tracking-widest">{solicitud.numero}</p>
            <div className="mt-4 pt-4 border-t border-line text-[10.5px] text-ink-600 leading-relaxed">
              <p>Bancos: Davivienda, BBVA, Bancolombia, Banco de Bogotá</p>
              <p>PSE: tarjeta débito/crédito · cuentas de ahorro</p>
            </div>
          </div>

          <button
            onClick={() => navigate(`/solicitudes/${solicitud.id}`)}
            className="self-start text-[12.5px] text-ink-600 font-medium hover:underline"
          >
            ← Volver a la solicitud
          </button>
        </div>
      </main>
    </div>
  );
}
