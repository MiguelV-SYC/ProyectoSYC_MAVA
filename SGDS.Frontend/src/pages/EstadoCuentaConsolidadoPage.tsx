import { useState, useEffect } from 'react';
import { useParams, useNavigate, useSearchParams, Link } from 'react-router-dom';
import Sidebar from '../components/layout/Sidebar';
import {
  getEstadoCuentaPorTurno,
  descargarEstadoCuentaPorTurno,
  obtenerEstadoCuentaQrPorTurnoBlobUrl,
  getConsultaConsolidada,
  descargarEstadoCuentaPorDocumento,
  obtenerEstadoCuentaQrPorDocumentoBlobUrl,
  type EstadoCuentaResponseDto,
} from '../services/libroTotalService';
import { getColorProyecto } from '../config/colorPorProyecto';

function aEstadoCuenta(c: Awaited<ReturnType<typeof getConsultaConsolidada>>): EstadoCuentaResponseDto {
  return {
    referencia: `EC-${new Date().getFullYear()}-${c.ciudadanoDocumento}`,
    ciudadanoId: c.ciudadanoId,
    ciudadanoNombre: c.ciudadanoNombre,
    ciudadanoDocumento: c.ciudadanoDocumento,
    totalTramitesActivos: c.totalTramitesActivos,
    totalProyectos: c.totalProyectos,
    proyectos: c.proyectos,
    fechaGeneracion: new Date().toISOString(),
  };
}

export default function EstadoCuentaConsolidadoPage() {
  const { id } = useParams<{ id: string }>();
  const [searchParams] = useSearchParams();
  const documento = searchParams.get('documento') ?? '';
  const navigate = useNavigate();

  const [estadoCuenta, setEstadoCuenta] = useState<EstadoCuentaResponseDto | null>(null);
  const [qrUrl, setQrUrl] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [exportando, setExportando] = useState(false);

  useEffect(() => {
    setLoading(true);
    setError(null);
    const promesa = id ? getEstadoCuentaPorTurno(Number(id)) : getConsultaConsolidada(documento).then(aEstadoCuenta);
    promesa
      .then(setEstadoCuenta)
      .catch((err) => setError(err?.response?.data?.mensaje ?? 'No se pudo generar el estado de cuenta.'))
      .finally(() => setLoading(false));
  }, [id, documento]);

  useEffect(() => {
    let url: string | null = null;
    const promesa = id ? obtenerEstadoCuentaQrPorTurnoBlobUrl(Number(id)) : obtenerEstadoCuentaQrPorDocumentoBlobUrl(documento);
    promesa.then((u) => { url = u; setQrUrl(u); }).catch(() => {});
    return () => { if (url) window.URL.revokeObjectURL(url); };
  }, [id, documento]);

  const color = getColorProyecto('Libro Total');

  async function handleExportar() {
    if (!estadoCuenta) return;
    setExportando(true);
    try {
      const nombreArchivo = `EstadoCuenta_${estadoCuenta.referencia}.pdf`;
      if (id) await descargarEstadoCuentaPorTurno(Number(id), nombreArchivo);
      else await descargarEstadoCuentaPorDocumento(documento, nombreArchivo);
    } catch {
      alert('No se pudo generar el PDF del estado de cuenta.');
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
          {id ? (
            <Link to={`/solicitudes/${id}`} className="hover:text-ink-600">Turno</Link>
          ) : (
            <button onClick={() => navigate(-1)} className="hover:text-ink-600">Consulta consolidada</button>
          )}
          <span>/</span>
          <span className="text-ink-900 font-semibold">Estado de cuenta</span>
        </div>

        {loading ? (
          <div className="text-center text-sm text-ink-400 py-10">Generando estado de cuenta...</div>
        ) : error || !estadoCuenta ? (
          <div className="max-w-[680px] bg-white border border-line rounded-[14px] p-5">
            <p className="text-[13px] text-red-600 mb-3">{error ?? 'No se pudo cargar el estado de cuenta.'}</p>
            <button onClick={() => navigate(-1)} className="text-[12.5px] text-blue-600 font-medium">← Volver</button>
          </div>
        ) : (
          <div className="max-w-[720px] flex flex-col gap-5">
            <div className="flex items-center justify-between">
              <div>
                <h1 className="font-display text-[19px] font-semibold text-ink-900">Estado de cuenta consolidado</h1>
                <p className="text-ink-600 text-[12.5px] mt-[2px]">
                  Consolida el estado de todos los trámites del ciudadano en los proyectos SYC donde tiene actividad.
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

            <div className="rounded-[16px] shadow-[0_12px_40px_-16px_rgba(15,26,46,0.18)] overflow-hidden bg-white">
              <div
                className="px-8 py-6 flex items-center justify-between text-white"
                style={{ background: `linear-gradient(120deg, #701a75, ${color.primario})` }}
              >
                <div>
                  <div className="text-[11px] text-white/80 uppercase tracking-wide">SYC — Libro Total</div>
                  <div className="font-display font-bold text-[19px] mt-0.5">Estado de Cuenta Consolidado</div>
                </div>
                <div className="text-right">
                  <div className="text-[10px] text-white/75 uppercase tracking-wide">Referencia</div>
                  <div className="font-mono text-[17px] font-bold tracking-wide">{estadoCuenta.referencia}</div>
                </div>
              </div>

              <div className="px-8 py-7 flex flex-col gap-5">
                <div>
                  <div className="text-[11px] font-bold uppercase tracking-wide text-[var(--color-accento)] pb-2 mb-3 border-b-2 border-[var(--color-accento-claro)]">Ciudadano</div>
                  <div className="grid grid-cols-2 gap-4">
                    <div><div className="text-[10.5px] uppercase text-ink-400 mb-0.5">Nombre</div><div className="text-[13.5px] font-semibold">{estadoCuenta.ciudadanoNombre}</div></div>
                    <div><div className="text-[10.5px] uppercase text-ink-400 mb-0.5">Documento</div><div className="text-[13.5px] font-semibold">{estadoCuenta.ciudadanoDocumento}</div></div>
                  </div>
                </div>

                <div>
                  <div className="text-[11px] font-bold uppercase tracking-wide text-[var(--color-accento)] pb-2 mb-3 border-b-2 border-[var(--color-accento-claro)]">Resumen por proyecto</div>
                  <table className="w-full border-collapse text-[12.5px]">
                    <thead>
                      <tr className="border-b-2 border-[var(--color-accento-claro)]">
                        <th className="text-left py-2 text-[10.5px] uppercase text-ink-400 font-semibold">Proyecto</th>
                        <th className="text-left py-2 text-[10.5px] uppercase text-ink-400 font-semibold">Trámite</th>
                        <th className="text-right py-2 text-[10.5px] uppercase text-ink-400 font-semibold">Estado</th>
                      </tr>
                    </thead>
                    <tbody>
                      {estadoCuenta.proyectos.flatMap((p) =>
                        p.solicitudes.length === 0
                          ? [(
                            <tr key={p.proyectoId} className="border-b border-line">
                              <td className="py-2.5 font-semibold">{p.proyectoNombre}</td>
                              <td className="py-2.5 text-ink-400 italic">Sin trámites registrados</td>
                              <td className="py-2.5 text-right text-ink-400">—</td>
                            </tr>
                          )]
                          : p.solicitudes.map((s) => (
                            <tr key={s.solicitudId} className="border-b border-line last:border-b-0">
                              <td className="py-2.5 font-semibold">{p.proyectoNombre}</td>
                              <td className="py-2.5 text-ink-600">#{s.numero} — {s.descripcion}</td>
                              <td className="py-2.5 text-right font-semibold">{s.estado}</td>
                            </tr>
                          ))
                      )}
                    </tbody>
                  </table>
                </div>
              </div>

              <div className="bg-paper px-8 py-5 border-t border-dashed border-line flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-[38px] h-[38px] rounded-[10px] bg-amber-100 flex items-center justify-center shrink-0">
                    <svg viewBox="0 0 24 24" fill="none" strokeWidth="1.8" className="w-[18px] h-[18px] stroke-amber-800"><circle cx="12" cy="12" r="9" /><path d="M12 7v5l3 3" /></svg>
                  </div>
                  <div>
                    <div className="text-[12.5px] font-bold text-ink-900">{estadoCuenta.totalTramitesActivos} trámites activos en {estadoCuenta.totalProyectos} proyectos</div>
                    <div className="text-[11px] text-ink-600">
                      Consultado el {new Date(estadoCuenta.fechaGeneracion).toLocaleDateString('es-CO', { day: '2-digit', month: 'short', year: 'numeric' })}
                      {estadoCuenta.sedeNombre ? ` en sede ${estadoCuenta.sedeNombre}` : ''}
                    </div>
                  </div>
                </div>
                {qrUrl ? (
                  <img src={qrUrl} alt="Código QR de verificación" className="w-[74px] h-[74px] shrink-0" />
                ) : (
                  <div className="w-[74px] h-[74px] bg-white border border-line rounded-[10px] animate-pulse shrink-0" />
                )}
              </div>

              {estadoCuenta.operadorNombre && (
                <div className="flex justify-between gap-6 px-8 pb-7">
                  <div className="flex-1 text-center pt-3.5 border-t border-ink-400">
                    <div className="text-[12.5px] font-bold">{estadoCuenta.operadorNombre}</div>
                    <div className="text-[10.5px] text-ink-600 mt-0.5">Operador · Libro Total — Genera</div>
                  </div>
                  <div className="flex-1 text-center pt-3.5 border-t border-ink-400">
                    <div className="text-[12.5px] font-bold">{estadoCuenta.sedeNombre}</div>
                    <div className="text-[10.5px] text-ink-600 mt-0.5">Punto de atención</div>
                  </div>
                </div>
              )}
            </div>

            <p className="text-[11.5px] text-ink-400 leading-relaxed max-w-[720px]">
              Este documento es una consulta de solo lectura: Libro Total no crea ni modifica solicitudes propias, únicamente
              consolida el estado de los trámites que ya existen en cada proyecto para que el ciudadano no tenga que
              consultarlos por separado.
            </p>
          </div>
        )}
      </main>
    </div>
  );
}
