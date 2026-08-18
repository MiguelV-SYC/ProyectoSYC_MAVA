import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import Sidebar from '../components/layout/Sidebar';
import { getEmpresaDetalle, type EmpresaDetalleResponseDto } from '../services/empresaService';
import { getSolicitudesPorEmpresa, type SolicitudResumenDto } from '../services/solicitudDetalleService';
import { useColorProyectoActivo } from '../hooks/useColorProyectoActivo';

const ESTADO_STYLE: Record<string, string> = {
  Radicada: 'bg-[#f1f5f9] text-[#64748b]',
  'En revisión': 'bg-blue-100 text-blue-600',
  Pendiente: 'bg-[#fdf3e7] text-[#d97706]',
  'Requiere información': 'bg-[#f2ecff] text-[#7c3aed]',
  Aprobada: 'bg-[var(--color-accento-claro)] text-[var(--color-accento)]',
  Rechazada: 'bg-[#fdeaea] text-[#dc2626]',
};

function formatearFecha(iso?: string) {
  if (!iso) return 'Sin fecha';
  const fecha = new Date(iso);
  if (isNaN(fecha.getTime())) return 'Sin fecha';
  return fecha.toLocaleDateString('es-CO', { day: '2-digit', month: 'short', year: 'numeric' });
}

export default function FichaEmpresaPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  const [empresa, setEmpresa] = useState<EmpresaDetalleResponseDto | null>(null);
  const [solicitudes, setSolicitudes] = useState<SolicitudResumenDto[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!id) return;
    const empresaId = Number(id);
    setLoading(true);
    Promise.all([
      getEmpresaDetalle(empresaId),
      getSolicitudesPorEmpresa(empresaId),
    ])
      .then(([e, s]) => {
        setEmpresa(e);
        setSolicitudes(s);
      })
      .finally(() => setLoading(false));
  }, [id]);

  const iniciales = empresa?.razonSocial
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map((p) => p[0])
    .join('')
    .toUpperCase();

  const color = useColorProyectoActivo();

  return (
    <div
      className="flex min-h-screen bg-paper"
      style={{ '--color-accento': color.primario, '--color-accento-claro': color.primarioClaro } as React.CSSProperties}
    >
      <Sidebar active="empresas" />

      <main className="flex-1 px-[38px] py-7 overflow-y-auto">
        {loading || !empresa ? (
          <div className="text-center text-sm text-ink-400 py-10">Cargando empresa...</div>
        ) : (
          <>
            <div className="flex items-center gap-1.5 text-xs text-ink-400 mb-3.5">
              <button onClick={() => navigate('/empresas')} className="hover:underline">
                Empresas
              </button>
              <span>/</span>
              <span className="text-ink-900 font-semibold">{empresa.razonSocial}</span>
            </div>

            <div className="flex items-center gap-4 mb-6">
              <div className="w-[60px] h-[60px] rounded-2xl bg-blue-100 text-blue-600 flex items-center justify-center text-lg font-bold shrink-0">
                {iniciales}
              </div>
              <div className="flex-1">
                <div className="font-display text-xl font-semibold text-ink-900 flex items-center">
                  {empresa.razonSocial}
                  <span className="inline-flex items-center gap-1 text-[10px] font-semibold text-blue-600 bg-blue-100 px-2 py-[3px] rounded-[10px] ml-2">
                    <svg viewBox="0 0 24 24" fill="none" strokeWidth="2" className="w-2.5 h-2.5 stroke-blue-600">
                      <circle cx="12" cy="12" r="9" />
                    </svg>
                    Entidad global
                  </span>
                </div>
                <div className="text-[12.5px] text-ink-600 mt-[3px]">
                  NIT {empresa.nit}-{empresa.digitoVerificacion} · Registrada desde el {formatearFecha(empresa.fechaRegistro)}
                </div>
              </div>
              <div className="flex gap-2.5">
                <button
                  onClick={() => navigate(`/empresas/${empresa.id}/editar`)}
                  className="flex items-center gap-1.5 bg-white border border-line text-ink-900 rounded-[9px] px-3.5 py-2 text-[12.5px] font-semibold"
                >
                  <svg viewBox="0 0 24 24" fill="none" strokeWidth="1.8" className="w-[13px] h-[13px] stroke-ink-600">
                    <path d="M12 20h9M16.5 3.5a2.1 2.1 0 013 3L7 19l-4 1 1-4L16.5 3.5z" />
                  </svg>
                  Editar
                </button>
                <button
                  onClick={() => navigate(`/solicitudes/nueva?empresaId=${empresa.id}`)}
                  className="flex items-center gap-1.5 bg-[var(--color-accento)] text-white rounded-[9px] px-4 py-2 text-[12.5px] font-semibold"
                >
                  <svg viewBox="0 0 24 24" fill="none" strokeWidth="2.2" className="w-[13px] h-[13px] stroke-white">
                    <path d="M12 5v14M5 12h14" />
                  </svg>
                  Nueva solicitud
                </button>
              </div>
            </div>

            <div className="grid grid-cols-[280px_1fr] gap-5 items-start">
              <div>
                <div className="bg-white border border-line rounded-[14px] overflow-hidden mb-4">
                  <div className="px-5 py-[14px] border-b border-line">
                    <h3 className="font-display text-[13.5px] font-semibold text-ink-900">Datos de contacto</h3>
                  </div>
                  <div className="px-5 py-4 flex flex-col">
                    {[
                      ['Representante legal', empresa.representanteLegal],
                      ['Teléfono', empresa.telefono],
                      ['Correo', empresa.correo],
                      ['Ciudad', empresa.ciudad],
                    ].map(([label, valor]) => (
                      <div key={label} className="flex justify-between py-[9px] border-b border-paper last:border-none text-[12.5px]">
                        <span className="text-ink-600">{label}</span>
                        <span className="font-semibold text-ink-900">{valor || '—'}</span>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="bg-white border border-line rounded-[14px] overflow-hidden">
                  <div className="px-5 py-[14px] border-b border-line">
                    <h3 className="font-display text-[13.5px] font-semibold text-ink-900">Proyectos con actividad</h3>
                  </div>
                  <div className="px-2 py-2">
                    {empresa.proyectosConActividad.length === 0 && (
                      <p className="text-xs text-ink-400 px-3 py-3">Sin actividad registrada todavía.</p>
                    )}
                    {empresa.proyectosConActividad.map((p) => (
                      <div key={p.proyectoId} className="flex items-center gap-3 px-3 py-2.5">
                        <div className="w-8 h-8 rounded-[9px] bg-paper flex items-center justify-center shrink-0">
                          <svg viewBox="0 0 24 24" fill="none" strokeWidth="1.8" className="w-4 h-4 stroke-ink-600">
                            <path d="M3 11l9-8 9 8" /><path d="M5 10v10h14V10" />
                          </svg>
                        </div>
                        <div className="flex-1">
                          <div className="text-[13px] font-semibold text-ink-900">{p.proyectoNombre}</div>
                          <div className="text-[11px] text-ink-400">
                            Vinculada desde {formatearFecha(p.primeraActividad)}
                          </div>
                        </div>
                        <div className="text-[13px] font-semibold text-ink-600">{p.totalSolicitudes}</div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              <div className="bg-white border border-line rounded-[14px] overflow-hidden">
                <div className="px-5 py-[14px] border-b border-line">
                  <h3 className="font-display text-[13.5px] font-semibold text-ink-900">Solicitudes</h3>
                </div>
                <table className="w-full border-collapse">
                  <thead>
                    <tr>
                      {['ID', 'Tipo', 'Estado', 'Fecha'].map((h) => (
                        <th
                          key={h}
                          className="text-left text-[10.5px] uppercase tracking-wide text-ink-400 font-semibold px-5 py-[10px] border-b border-line"
                        >
                          {h}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {solicitudes.map((s) => (
                      <tr key={s.id} className="hover:bg-paper transition-colors cursor-pointer">
                        <td className="px-5 py-[13px] text-[12px] border-b border-line text-ink-400 font-semibold">
                          #{s.numero}
                        </td>
                        <td className="px-5 py-[13px] text-[13px] border-b border-line">{s.tipoSolicitudNombre}</td>
                        <td className="px-5 py-[13px] text-[13px] border-b border-line">
                          <span className={`inline-flex items-center gap-1.5 text-[11px] font-semibold px-[10px] py-[5px] rounded-full ${ESTADO_STYLE[s.estado] ?? 'bg-paper text-ink-600'}`}>
                            <span className="w-1.5 h-1.5 rounded-full bg-current" />
                            {s.estado}
                          </span>
                        </td>
                        <td className="px-5 py-[13px] text-[13px] border-b border-line">{formatearFecha(s.fecha)}</td>
                      </tr>
                    ))}
                    {solicitudes.length === 0 && (
                      <tr>
                        <td colSpan={4} className="px-5 py-10 text-center text-sm text-ink-400">
                          Esta empresa no tiene solicitudes registradas todavía.
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