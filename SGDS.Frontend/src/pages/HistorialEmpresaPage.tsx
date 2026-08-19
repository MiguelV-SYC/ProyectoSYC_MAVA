import { useState, useEffect } from 'react';
import { useParams, useNavigate, useSearchParams } from 'react-router-dom';
import Sidebar from '../components/layout/Sidebar';
import { getHistorialEmpresa, type SolicitudHistorialEmpresaDto } from '../services/infoconsumoService';
import { getEmpresaDetalle, type EmpresaDetalleResponseDto } from '../services/empresaService';
import { getColorProyecto } from '../config/colorPorProyecto';

const ESTADO_STYLE: Record<string, string> = {
  Elaborada: 'bg-[#f1f5f9] text-[#64748b]',
  Expedida: 'bg-blue-100 text-blue-600',
  Legalizada: 'bg-[var(--color-accento-claro)] text-[var(--color-accento)]',
  Vencida: 'bg-[#fdeaea] text-[#dc2626]',
};

function formatearFecha(iso?: string) {
  if (!iso) return '—';
  const fecha = new Date(iso);
  if (isNaN(fecha.getTime())) return '—';
  return fecha.toLocaleDateString('es-CO', { day: '2-digit', month: 'short', year: 'numeric' });
}

export default function HistorialEmpresaPage() {
  const { empresaId } = useParams<{ empresaId: string }>();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const volverA = searchParams.get('volverA');

  const [empresa, setEmpresa] = useState<EmpresaDetalleResponseDto | null>(null);
  const [historial, setHistorial] = useState<SolicitudHistorialEmpresaDto[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!empresaId) return;
    setLoading(true);
    Promise.all([
      getEmpresaDetalle(Number(empresaId)),
      getHistorialEmpresa(Number(empresaId)),
    ])
      .then(([e, h]) => {
        setEmpresa(e);
        setHistorial(h);
      })
      .finally(() => setLoading(false));
  }, [empresaId]);

  const color = getColorProyecto('Infoconsumo');

  return (
    <div
      className="flex min-h-screen bg-paper"
      style={{ '--color-accento': color.primario, '--color-accento-claro': color.primarioClaro } as React.CSSProperties}
    >
      <Sidebar active="solicitudes" />

      <main className="flex-1 px-[38px] py-7 overflow-y-auto">
        <button
          onClick={() => navigate(volverA ?? '/solicitudes')}
          className="flex items-center gap-1.5 text-[12.5px] text-ink-600 font-medium mb-4 hover:text-ink-900"
        >
          <svg viewBox="0 0 24 24" fill="none" strokeWidth="2" className="w-3.5 h-3.5 stroke-current">
            <path d="M19 12H5M12 19l-7-7 7-7" />
          </svg>
          Volver
        </button>

        <h1 className="font-display text-[19px] font-semibold text-ink-900">
          Historial de tornaguías — {loading ? 'Cargando...' : empresa?.razonSocial ?? 'Empresa'}
        </h1>
        <p className="text-ink-600 text-[12.5px] mt-[3px] mb-5">
          {empresa ? `NIT ${empresa.nit}` : ''} · Solo lectura — haz clic en una solicitud para previsualizarla
        </p>

        <div className="max-w-[820px] bg-white border border-line rounded-[14px] overflow-hidden">
          {loading ? (
            <div className="px-5 py-10 text-center text-sm text-ink-400">Cargando historial...</div>
          ) : (
            <table className="w-full border-collapse">
              <thead>
                <tr>
                  {['ID', 'Tipo de trámite', 'Estado', 'Fecha'].map((h) => (
                    <th key={h} className="text-left text-[10.5px] uppercase tracking-wide text-ink-400 font-semibold px-5 py-[10px] border-b border-line">
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {historial.map((s) => (
                  <tr
                    key={s.id}
                    onClick={() => navigate(`/solicitudes/${s.id}`)}
                    className="cursor-pointer hover:bg-paper transition-colors"
                  >
                    <td className="px-5 py-3 text-[12px] text-ink-400 font-semibold border-b border-line last:border-0">#{s.numero}</td>
                    <td className="px-5 py-3 text-[12.5px] border-b border-line last:border-0">{s.tipoSolicitudNombre ?? '—'}</td>
                    <td className="px-5 py-3 border-b border-line last:border-0">
                      <span className={`inline-flex items-center gap-1.5 text-[11px] font-semibold px-[10px] py-[4px] rounded-full ${ESTADO_STYLE[s.estado] ?? 'bg-paper text-ink-600'}`}>
                        <span className="w-1.5 h-1.5 rounded-full bg-current" />
                        {s.estado}
                      </span>
                    </td>
                    <td className="px-5 py-3 text-[12.5px] text-ink-600 border-b border-line last:border-0">{formatearFecha(s.fechaCreacion)}</td>
                  </tr>
                ))}
                {historial.length === 0 && (
                  <tr>
                    <td colSpan={4} className="px-5 py-8 text-center text-sm text-ink-400">
                      Esta empresa no tiene otras tornaguías registradas.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          )}
        </div>
      </main>
    </div>
  );
}
