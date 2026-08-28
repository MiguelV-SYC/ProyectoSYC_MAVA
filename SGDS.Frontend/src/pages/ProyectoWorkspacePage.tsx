import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import Sidebar from '../components/layout/Sidebar';
import { getProyectosAdmin, getResumenProyecto, type ProyectoResponseDto, type ResumenProyectoDto } from '../services/proyectoService';
import { getSolicitudesListado, getTiposSolicitudPorProyecto, type SolicitudResponseDto, type TipoSolicitudDto } from '../services/solicitudService';
import { getColorProyecto } from '../config/colorPorProyecto';

const ESTADO_STYLE: Record<string, string> = {
  Radicada: 'bg-[#f1f5f9] text-[#64748b]',
  'En revisión': 'bg-blue-100 text-blue-600',
  Pendiente: 'bg-[#fdf3e7] text-[#d97706]',
  'Requiere información': 'bg-[#f2ecff] text-[#7c3aed]',
  Aprobada: 'bg-[var(--color-accento-claro)] text-[var(--color-accento)]',
  Rechazada: 'bg-[#fdeaea] text-[#dc2626]',
  Finalizada: 'bg-[var(--color-accento-claro)] text-[var(--color-accento)]',
  Generada: 'bg-[#f1f5f9] text-[#64748b]',
  Pagada: 'bg-blue-100 text-blue-600',
  Entregada: 'bg-[var(--color-accento-claro)] text-[var(--color-accento)]',
  Anulada: 'bg-[#fdeaea] text-[#dc2626]',
};

const ICONOS: Record<string, React.ReactNode> = {
  Comfenalco: <svg viewBox="0 0 24 24" fill="none" strokeWidth="1.8"><path d="M3 11l9-8 9 8" /><path d="M5 10v10h14V10" /><path d="M9 21v-6h6v6" /></svg>,
  Colpensiones: <svg viewBox="0 0 24 24" fill="none" strokeWidth="1.8"><path d="M12 2l8 4v6c0 5-3.5 8.5-8 10-4.5-1.5-8-5-8-10V6l8-4z" /><path d="M9 12l2 2 4-4" /></svg>,
  'Pasivos Laborales': <svg viewBox="0 0 24 24" fill="none" strokeWidth="1.8"><path d="M4 21V8l8-5 8 5v13" /><path d="M9 21v-6h6v6" /><path d="M9 12h6" /></svg>,
  SYCTrace: <svg viewBox="0 0 24 24" fill="none" strokeWidth="1.8"><rect x="4" y="9" width="16" height="10" rx="1.5" /><path d="M8 9V6a4 4 0 018 0v3" /><circle cx="12" cy="14" r="1.5" /></svg>,
  Infoconsumo: <svg viewBox="0 0 24 24" fill="none" strokeWidth="1.8"><rect x="3" y="6" width="14" height="10" rx="1.5" /><path d="M17 9l4-2v10l-4-2" /></svg>,
  Gotrace: (
    <svg viewBox="0 0 24 24" fill="none" strokeWidth="1.8" strokeDasharray="3 3">
      <path d="M4 18c4-8 12-8 16 0" />
      <circle cx="4" cy="18" r="1.6" strokeDasharray="0" />
      <circle cx="20" cy="18" r="1.6" strokeDasharray="0" />
    </svg>
  ),
  Estampillas: <svg viewBox="0 0 24 24" fill="none" strokeWidth="1.8"><rect x="5" y="4" width="14" height="16" rx="2" /><circle cx="12" cy="12" r="3.2" /></svg>,
  IUVA: <svg viewBox="0 0 24 24" fill="none" strokeWidth="1.8"><rect x="3" y="10" width="14" height="7" rx="1.5" /><path d="M6 10l1.5-4h6L15 10" /><circle cx="6.5" cy="17.5" r="1.6" /><circle cx="14.5" cy="17.5" r="1.6" /></svg>,
  'Libro Total': <svg viewBox="0 0 24 24" fill="none" strokeWidth="1.8"><path d="M4 7l8-4 8 4-8 4-8-4z" /><path d="M4 12l8 4 8-4M4 17l8 4 8-4" /></svg>,
};

const ICONO_DEFAULT = (
  <svg viewBox="0 0 24 24" fill="none" strokeWidth="1.8"><rect x="3" y="4" width="18" height="16" rx="2" /><path d="M3 9h18" /></svg>
);

function formatearFecha(iso?: string) {
  if (!iso) return '—';
  const fecha = new Date(iso);
  if (isNaN(fecha.getTime())) return '—';
  return fecha.toLocaleDateString('es-CO', { day: '2-digit', month: 'short', year: 'numeric' });
}

export default function ProyectoWorkspacePage() {
  const { proyectoId } = useParams<{ proyectoId: string }>();
  const navigate = useNavigate();
  const id = Number(proyectoId);

  const [proyecto, setProyecto] = useState<ProyectoResponseDto | null>(null);
  const [resumen, setResumen] = useState<ResumenProyectoDto | null>(null);
  const [pendientes, setPendientes] = useState(0);
  const [requierenInfo, setRequierenInfo] = useState(0);
  const [tipos, setTipos] = useState<TipoSolicitudDto[]>([]);
  const [tipoFiltro, setTipoFiltro] = useState('');
  const [recientes, setRecientes] = useState<SolicitudResponseDto[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!id) return;
    setLoading(true);
    Promise.all([
      getProyectosAdmin().then((lista) => lista.find((p) => p.id === id) ?? null),
      getResumenProyecto(id),
      getTiposSolicitudPorProyecto(id),
    ]).then(([p, r, t]) => {
      setProyecto(p);
      setResumen(r);
      setTipos(t);
    }).finally(() => setLoading(false));
  }, [id]);

  useEffect(() => {
    if (!id) return;
    getSolicitudesListado({ proyectoId: id, pagina: 1, tamanoPagina: 1 }).then((res) => {
      setPendientes(res.conteosPorEstado.find((c) => c.estado === 'Pendiente')?.total ?? 0);
      setRequierenInfo(res.conteosPorEstado.find((c) => c.estado === 'Requiere información')?.total ?? 0);
    });
  }, [id]);

  useEffect(() => {
    if (!id) return;
    getSolicitudesListado({
      proyectoId: id,
      tipoSolicitudId: tipoFiltro ? Number(tipoFiltro) : undefined,
      pagina: 1,
      tamanoPagina: 6,
    }).then((res) => setRecientes(res.pagina.datos));
  }, [id, tipoFiltro]);

  if (loading || !proyecto) {
    return (
      <div className="flex min-h-screen bg-paper">
        <Sidebar active="inicio" />
        <main className="flex-1 flex items-center justify-center text-sm text-ink-400">Cargando proyecto...</main>
      </div>
    );
  }

  const color = getColorProyecto(proyecto.nombre);

  return (
    <div
      className="flex min-h-screen bg-paper"
      style={{
        '--color-accento': color.primario,
        '--color-accento-claro': color.primarioClaro,
        '--color-accento-oscuro': color.primarioOscuro,
      } as React.CSSProperties}
    >
      <Sidebar active="inicio" />

      <main className="flex-1 px-4 md:px-[38px] py-7 pt-16 md:pt-7 overflow-y-auto">
        <button
          onClick={() => navigate('/dashboard')}
          className="flex items-center gap-1.5 text-[12.5px] text-ink-600 font-medium mb-4 hover:text-ink-900"
        >
          <svg viewBox="0 0 24 24" fill="none" strokeWidth="2" className="w-3.5 h-3.5 stroke-current">
            <path d="M19 12H5M12 19l-7-7 7-7" />
          </svg>
          Volver a mis proyectos
        </button>

        <div className="relative bg-gradient-to-r from-[var(--color-accento)] to-[var(--color-accento-oscuro)] rounded-2xl p-7 mb-7 overflow-hidden">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 relative z-10">
            <div className="flex items-center gap-4">
              <div className="w-[54px] h-[54px] rounded-2xl bg-white/15 flex items-center justify-center shrink-0 [&>svg]:w-6 [&>svg]:h-6 [&>svg]:stroke-white">
                {ICONOS[proyecto.nombre] ?? ICONO_DEFAULT}
              </div>
              <div>
                <h1 className="font-display text-[22px] font-bold text-white">{proyecto.nombre}</h1>
                <p className="text-white/85 text-[13px] mt-0.5 max-w-[520px]">
                  {proyecto.descripcion || 'Sin descripción configurada.'}
                </p>
              </div>
            </div>
            <div className="flex gap-8">
              <div className="text-center">
                <div className="font-display text-2xl font-bold text-white">{proyecto.totalSolicitudes}</div>
                <div className="text-[11px] text-white/75">Solicitudes</div>
              </div>
              <div className="text-center">
                <div className="font-display text-2xl font-bold text-white">
                  {resumen?.tiempoPromedioResolucion != null ? `${resumen.tiempoPromedioResolucion} días` : 'Sin datos'}
                </div>
                <div className="text-[11px] text-white/75">Tiempo prom.</div>
              </div>
            </div>
          </div>
        </div>

        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-4">
          <h2 className="font-display text-[16px] font-semibold text-ink-900">Resumen del proyecto</h2>
          <div className="flex items-center flex-wrap gap-2.5">
            {proyecto.nombre === 'IUVA' && (
              <button
                onClick={() => navigate(`/vehiculos?proyectoId=${id}`)}
                className="flex items-center gap-[7px] bg-white border border-line text-ink-600 rounded-[10px] px-4 py-[10px] text-[13px] font-semibold hover:bg-paper"
              >
                <svg viewBox="0 0 24 24" fill="none" strokeWidth="1.8" className="w-[15px] h-[15px] stroke-ink-600">
                  <rect x="3" y="10" width="16" height="7" rx="1.5" /><path d="M6 10l1.5-4h6L15 10" />
                  <circle cx="6.5" cy="17.5" r="1.6" /><circle cx="14.5" cy="17.5" r="1.6" />
                </svg>
                Vehículos
              </button>
            )}
            {proyecto.nombre === 'Libro Total' && (
              <>
                <button
                  onClick={() => navigate('/librototal/sedes')}
                  className="flex items-center gap-[7px] bg-white border border-line text-ink-600 rounded-[10px] px-4 py-[10px] text-[13px] font-semibold hover:bg-paper"
                >
                  <svg viewBox="0 0 24 24" fill="none" strokeWidth="1.8" className="w-[15px] h-[15px] stroke-ink-600">
                    <path d="M4 19.5A2.5 2.5 0 016.5 17H20" /><path d="M6.5 2H20v20H6.5A2.5 2.5 0 014 19.5v-15A2.5 2.5 0 016.5 2z" />
                  </svg>
                  Sedes
                </button>
                <button
                  onClick={() => navigate('/librototal/consulta-consolidada')}
                  className="flex items-center gap-[7px] bg-white border border-line text-ink-600 rounded-[10px] px-4 py-[10px] text-[13px] font-semibold hover:bg-paper"
                >
                  <svg viewBox="0 0 24 24" fill="none" strokeWidth="1.8" className="w-[15px] h-[15px] stroke-ink-600">
                    <circle cx="11" cy="11" r="7" /><path d="M21 21l-4-4" />
                  </svg>
                  Consulta consolidada
                </button>
              </>
            )}
            <button
              onClick={() => navigate(`/solicitudes/nueva?proyectoId=${id}`)}
              className="flex items-center gap-[7px] bg-[var(--color-accento)] text-white rounded-[10px] px-4 py-[10px] text-[13px] font-semibold shadow-[0_8px_18px_-6px_var(--color-accento)]"
            >
              <svg viewBox="0 0 24 24" fill="none" strokeWidth="2.2" className="w-[15px] h-[15px] stroke-white">
                <path d="M12 5v14M5 12h14" />
              </svg>
              Nueva solicitud
            </button>
          </div>
        </div>

        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3.5 mb-7">
          {[
            { label: 'Radicadas hoy', valor: resumen?.radicadasHoy ?? 0 },
            { label: 'Pendientes', valor: pendientes },
            { label: 'Aprobadas este mes', valor: resumen?.aprobadasEsteMes ?? 0, destacado: true },
            { label: 'Requieren información', valor: requierenInfo },
          ].map((c) => (
            <div key={c.label} className="bg-white border border-line rounded-xl p-5">
              <div className="text-[12px] text-ink-600 mb-1.5">{c.label}</div>
              <div className={`font-display text-2xl font-bold ${c.destacado ? 'text-[var(--color-accento)]' : 'text-ink-900'}`}>
                {c.valor}
              </div>
            </div>
          ))}
        </div>

        <div className="bg-white border border-line rounded-[14px] overflow-hidden">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2.5 px-5 py-4 border-b border-line">
            <h3 className="font-display text-[14px] font-semibold text-ink-900">Solicitudes recientes</h3>
            <div className="flex flex-wrap gap-1.5">
              <button
                onClick={() => setTipoFiltro('')}
                className={`text-xs font-semibold px-3 py-1.5 rounded-full ${
                  tipoFiltro === '' ? 'bg-[var(--color-accento)] text-white' : 'text-ink-600'
                }`}
              >
                Todas
              </button>
              {tipos.map((t) => (
                <button
                  key={t.id}
                  onClick={() => setTipoFiltro(String(t.id))}
                  className={`text-xs font-semibold px-3 py-1.5 rounded-full ${
                    tipoFiltro === String(t.id) ? 'bg-[var(--color-accento)] text-white' : 'text-ink-600'
                  }`}
                >
                  {t.nombre}
                </button>
              ))}
            </div>
          </div>

          <div className="overflow-x-auto">
          <table className="w-full border-collapse">
            <thead>
              <tr>
                {['ID', 'Tipo de solicitud', 'Afiliado', 'Estado', 'Fecha', 'Operador'].map((h, i) => (
                  <th key={h} className={`text-left text-[10.5px] uppercase tracking-wide text-ink-400 font-semibold px-5 py-[10px] border-b border-line whitespace-nowrap ${i === 0 ? 'sticky left-0 z-10 bg-white' : ''}`}>
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {recientes.map((s) => (
                <tr
                  key={s.id}
                  onClick={() => navigate(`/solicitudes/${s.id}`)}
                  className="group cursor-pointer hover:bg-paper transition-colors"
                >
                  <td className="sticky left-0 z-10 bg-white group-hover:bg-paper px-5 py-[13px] text-[12px] border-b border-line text-ink-400 font-semibold whitespace-nowrap">#{s.numero}</td>
                  <td className="px-5 py-[13px] text-[13px] border-b border-line">{s.tipoSolicitudNombre}</td>
                  <td className="px-5 py-[13px] text-[13px] border-b border-line">
                    <div className="font-semibold text-ink-900">{s.ciudadanoNombre ?? s.empresaNombre}</div>
                    <div className="text-[11px] text-ink-400">{s.ciudadanoDocumento ?? s.empresaNit ?? ''}</div>
                  </td>
                  <td className="px-5 py-[13px] text-[13px] border-b border-line">
                    <span className={`inline-flex items-center gap-1.5 text-[11px] font-semibold px-[10px] py-[5px] rounded-full ${ESTADO_STYLE[s.estado] ?? 'bg-paper text-ink-600'}`}>
                      <span className="w-1.5 h-1.5 rounded-full bg-current" />
                      {s.estado}
                    </span>
                  </td>
                  <td className="px-5 py-[13px] text-[13px] border-b border-line">{formatearFecha(s.fechaCreacion)}</td>
                  <td className="px-5 py-[13px] text-[13px] border-b border-line">
                    {s.usuarioAsignadoNombre ?? <span className="text-ink-400 italic">Sin asignar</span>}
                  </td>
                </tr>
              ))}
              {recientes.length === 0 && (
                <tr>
                  <td colSpan={6} className="px-5 py-10 text-center text-sm text-ink-400">
                    No hay solicitudes recientes con este filtro.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
          </div>

          <div className="px-5 py-3 border-t border-line">
            <button
              onClick={() => navigate(`/solicitudes?proyectoId=${id}`)}
              className="text-[12.5px] text-blue-600 font-medium"
            >
              Ver todas las solicitudes →
            </button>
          </div>
        </div>
      </main>
    </div>
  );
}