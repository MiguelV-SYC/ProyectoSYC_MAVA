import { useState, useEffect } from 'react';
import { useParams, useNavigate, useSearchParams, Link } from 'react-router-dom';
import Sidebar from '../components/layout/Sidebar';
import { getVehiculoDetalle, type VehiculoResponseDto } from '../services/vehiculoService';
import { getSolicitudesPorVehiculo, type SolicitudVehiculoResumenDto } from '../services/solicitudDetalleService';
import { useColorProyectoActivo } from '../hooks/useColorProyectoActivo';

const ESTADO_STYLE: Record<string, string> = {
  Radicada: 'bg-[#f1f5f9] text-[#64748b]',
  'En revisión': 'bg-blue-100 text-blue-600',
  Pendiente: 'bg-[#fdf3e7] text-[#d97706]',
  'Requiere información': 'bg-[#f2ecff] text-[#7c3aed]',
  Aprobada: 'bg-[var(--color-accento-claro)] text-[var(--color-accento)]',
  Rechazada: 'bg-[#fdeaea] text-[#dc2626]',
  Finalizada: 'bg-[var(--color-accento-claro)] text-[var(--color-accento)]',
};

function formatearFecha(iso?: string | null) {
  if (!iso) return 'Sin fecha';
  const fecha = new Date(iso);
  if (isNaN(fecha.getTime())) return 'Sin fecha';
  return fecha.toLocaleDateString('es-CO', { day: '2-digit', month: 'short', year: 'numeric' });
}

export default function FichaVehiculoPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const proyectoId = searchParams.get('proyectoId');

  const [vehiculo, setVehiculo] = useState<VehiculoResponseDto | null>(null);
  const [solicitudes, setSolicitudes] = useState<SolicitudVehiculoResumenDto[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!id) return;
    const vehiculoId = Number(id);
    setLoading(true);
    Promise.all([
      getVehiculoDetalle(vehiculoId),
      getSolicitudesPorVehiculo(vehiculoId),
    ])
      .then(([v, s]) => {
        setVehiculo(v);
        setSolicitudes(s);
      })
      .finally(() => setLoading(false));
  }, [id]);

  const color = useColorProyectoActivo();
  const propietarioNombre = vehiculo?.ciudadanoNombre ?? vehiculo?.empresaNombre ?? '—';
  const propietarioDocumento = vehiculo?.ciudadanoDocumento ?? vehiculo?.empresaNit ?? '—';

  return (
    <div
      className="flex min-h-screen bg-paper"
      style={{ '--color-accento': color.primario, '--color-accento-claro': color.primarioClaro } as React.CSSProperties}
    >
      <Sidebar active="solicitudes" />

      <main className="flex-1 px-[38px] py-7 overflow-y-auto">
        {loading || !vehiculo ? (
          <div className="text-center text-sm text-ink-400 py-10">Cargando vehículo...</div>
        ) : (
          <>
            <div className="flex items-center gap-1.5 text-xs text-ink-400 mb-3.5">
              <Link
                to={proyectoId ? `/vehiculos?proyectoId=${proyectoId}` : '/vehiculos'}
                className="hover:text-ink-600"
              >
                Vehículos
              </Link>
              <span>/</span>
              <span className="text-ink-900 font-semibold">{vehiculo.placa}</span>
            </div>

            <div className="flex items-center gap-4 mb-6">
              <div className="w-[60px] h-[60px] rounded-2xl bg-[var(--color-accento-claro)] flex items-center justify-center shrink-0">
                <svg viewBox="0 0 24 24" fill="none" strokeWidth="1.8" className="w-6 h-6 stroke-[var(--color-accento)]">
                  <rect x="3" y="10" width="16" height="7" rx="1.5" /><path d="M6 10l1.5-4h6L15 10" />
                  <circle cx="6.5" cy="17.5" r="1.6" /><circle cx="14.5" cy="17.5" r="1.6" />
                </svg>
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h1 className="font-display text-xl font-semibold text-ink-900">Placa {vehiculo.placa}</h1>
                </div>
                <div className="text-[12.5px] text-ink-600 mt-0.5">
                  {[vehiculo.marca, vehiculo.linea].filter(Boolean).join(' ') || 'Sin marca/línea registrada'}
                  {vehiculo.modelo ? ` · Modelo ${vehiculo.modelo}` : ''}
                </div>
              </div>
              <div className="ml-auto flex items-center gap-2.5">
                <button
                  onClick={() => navigate(`/vehiculos/${vehiculo.id}/editar${proyectoId ? `?proyectoId=${proyectoId}` : ''}`)}
                  className="flex items-center gap-1.5 border border-line rounded-[9px] px-4 py-2 text-[12.5px] font-semibold text-ink-600 hover:bg-paper"
                >
                  <svg viewBox="0 0 24 24" fill="none" strokeWidth="1.8" className="w-[13px] h-[13px] stroke-ink-600">
                    <path d="M12 20h9M16.5 3.5a2.1 2.1 0 013 3L7 19l-4 1 1-4L16.5 3.5z" />
                  </svg>
                  Editar
                </button>
                <button
                  onClick={() => navigate(`/vehiculos/nuevo${proyectoId ? `?proyectoId=${proyectoId}` : ''}`)}
                  className="flex items-center gap-1.5 border border-line rounded-[9px] px-4 py-2 text-[12.5px] font-semibold text-ink-600 hover:bg-paper"
                >
                  <svg viewBox="0 0 24 24" fill="none" strokeWidth="2.2" className="w-[13px] h-[13px] stroke-ink-600">
                    <path d="M12 5v14M5 12h14" />
                  </svg>
                  Nuevo vehículo
                </button>
                {proyectoId && (
                  <button
                    onClick={() => navigate(`/solicitudes/nueva?proyectoId=${proyectoId}&vehiculoId=${vehiculo.id}`)}
                    className="flex items-center gap-1.5 bg-[var(--color-accento)] text-white rounded-[9px] px-4 py-2 text-[12.5px] font-semibold"
                  >
                    <svg viewBox="0 0 24 24" fill="none" strokeWidth="2.2" className="w-[13px] h-[13px] stroke-white">
                      <path d="M12 5v14M5 12h14" />
                    </svg>
                    Nueva solicitud
                  </button>
                )}
              </div>
            </div>

            <div className="grid grid-cols-[380px_1fr] gap-5 items-start">
              <div className="flex flex-col gap-5">
                <div className="bg-white border border-line rounded-[14px] overflow-hidden">
                  <div className="px-5 py-[14px] border-b border-line">
                    <h3 className="font-display text-[14px] font-semibold text-ink-900">Datos del vehículo</h3>
                  </div>
                  <div className="px-5 py-2">
                    {[
                      ['Placa', vehiculo.placa],
                      ['Marca', vehiculo.marca ?? '—'],
                      ['Línea', vehiculo.linea ?? '—'],
                      ['Modelo', vehiculo.modelo ? String(vehiculo.modelo) : '—'],
                      ['Número de chasis', vehiculo.numeroChasis ?? '—'],
                    ].map(([lbl, val]) => (
                      <div key={lbl} className="flex items-center justify-between py-2.5 border-b border-paper last:border-0">
                        <span className="text-[12.5px] text-ink-600">{lbl}</span>
                        <span className="text-[12.5px] font-semibold text-ink-900">{val}</span>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="bg-white border border-line rounded-[14px] overflow-hidden">
                  <div className="px-5 py-[14px] border-b border-line">
                    <h3 className="font-display text-[14px] font-semibold text-ink-900">Propietario</h3>
                  </div>
                  <div className="px-5 py-2">
                    {[
                      ['Nombre', propietarioNombre],
                      ['Documento', propietarioDocumento],
                    ].map(([lbl, val]) => (
                      <div key={lbl} className="flex items-center justify-between py-2.5 border-b border-paper last:border-0">
                        <span className="text-[12.5px] text-ink-600">{lbl}</span>
                        <span className="text-[12.5px] font-semibold text-ink-900">{val}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              <div className="bg-white border border-line rounded-[14px] overflow-hidden">
                <div className="px-5 py-[14px] border-b border-line">
                  <h3 className="font-display text-[14px] font-semibold text-ink-900">Historial de causaciones</h3>
                </div>
                <table className="w-full border-collapse">
                  <thead>
                    <tr>
                      {['ID', 'Tipo', 'Estado', 'Fecha'].map((h) => (
                        <th key={h} className="text-left text-[10.5px] uppercase tracking-wide text-ink-400 font-semibold px-5 py-[10px] border-b border-line">
                          {h}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {solicitudes.map((s) => (
                      <tr
                        key={s.id}
                        onClick={() => navigate(`/solicitudes/${s.id}`)}
                        className="cursor-pointer hover:bg-paper transition-colors"
                      >
                        <td className="px-5 py-3 text-[12px] text-ink-400 font-semibold border-b border-line last:border-0">
                          #{s.numero}
                        </td>
                        <td className="px-5 py-3 text-[12.5px] border-b border-line last:border-0">{s.tipoSolicitudNombre ?? '—'}</td>
                        <td className="px-5 py-3 border-b border-line last:border-0">
                          <span className={`inline-flex items-center gap-1.5 text-[11px] font-semibold px-[10px] py-[4px] rounded-full ${ESTADO_STYLE[s.estado] ?? 'bg-paper text-ink-600'}`}>
                            <span className="w-1.5 h-1.5 rounded-full bg-current" />
                            {s.estado}
                          </span>
                        </td>
                        <td className="px-5 py-3 text-[12.5px] text-ink-600 border-b border-line last:border-0">
                          {formatearFecha(s.fechaCreacion)}
                        </td>
                      </tr>
                    ))}
                    {solicitudes.length === 0 && (
                      <tr>
                        <td colSpan={4} className="px-5 py-8 text-center text-sm text-ink-400">
                          Este vehículo no tiene causaciones registradas.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </>
        )}
      </main>
    </div>
  );
}
