import { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import Sidebar from '../components/layout/Sidebar';
import { getCiudadanoDetalle, type CiudadanoDetalleResponseDto } from '../services/ciudadanoService';
import { getSolicitudesPorCiudadano, type SolicitudResumenDto } from '../services/solicitudDetalleService';
import { getDocumentosPorCiudadano, type DocumentoResumenDto } from '../services/documentoService';

const ESTADO_STYLE: Record<string, string> = {
  Radicada: 'bg-[#f1f5f9] text-[#64748b]',
  'En revisión': 'bg-blue-100 text-blue-600',
  Pendiente: 'bg-[#fdf3e7] text-[#d97706]',
  'Requiere información': 'bg-[#f2ecff] text-[#7c3aed]',
  Aprobada: 'bg-[#e3f7f4] text-[#0d9488]',
  Rechazada: 'bg-[#fdeaea] text-[#dc2626]',
};

function formatearFecha(iso?: string | null) {
  if (!iso) return 'Sin fecha';
  const fecha = new Date(iso);
  if (isNaN(fecha.getTime())) return 'Sin fecha';
  return fecha.toLocaleDateString('es-CO', { day: '2-digit', month: 'short', year: 'numeric' });
}

export default function FichaCiudadanoPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  const [ciudadano, setCiudadano] = useState<CiudadanoDetalleResponseDto | null>(null);
  const [solicitudes, setSolicitudes] = useState<SolicitudResumenDto[]>([]);
  const [documentos, setDocumentos] = useState<DocumentoResumenDto[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!id) return;
    const ciudadanoId = Number(id);
    setLoading(true);
    Promise.all([
      getCiudadanoDetalle(ciudadanoId),
      getSolicitudesPorCiudadano(ciudadanoId),
      getDocumentosPorCiudadano(ciudadanoId),
    ])
      .then(([c, s, d]) => {
        setCiudadano(c);
        setSolicitudes(s);
        setDocumentos(d);
      })
      .finally(() => setLoading(false));
  }, [id]);

  const iniciales = ciudadano?.nombreCompleto
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map((p) => p[0])
    .join('')
    .toUpperCase();

  return (
    <div className="flex min-h-screen bg-paper">
      <Sidebar active="ciudadanos" />

      <main className="flex-1 px-[38px] py-7 overflow-y-auto">
        {loading || !ciudadano ? (
          <div className="text-center text-sm text-ink-400 py-10">Cargando ciudadano...</div>
        ) : (
          <>
            <div className="flex items-center gap-1.5 text-xs text-ink-400 mb-3.5">
              <Link to="/ciudadanos" className="hover:text-ink-600">Ciudadanos</Link>
              <span>/</span>
              <span className="text-ink-900 font-semibold">{ciudadano.nombreCompleto}</span>
            </div>

            <div className="flex items-center gap-4 mb-6">
                            <div className="w-[60px] h-[60px] rounded-2xl bg-blue-100 text-blue-600 flex items-center justify-center font-display font-bold text-xl">
                {iniciales}
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h1 className="font-display text-xl font-semibold text-ink-900">{ciudadano.nombreCompleto}</h1>
                  <span className="inline-flex items-center gap-1 text-[10px] font-semibold text-blue-600 bg-blue-100 px-2 py-[3px] rounded-[10px]">
                    <svg viewBox="0 0 24 24" fill="none" strokeWidth="2" className="w-2.5 h-2.5 stroke-blue-600">
                      <circle cx="12" cy="12" r="9" />
                    </svg>
                    Entidad global
                  </span>
                </div>
                <div className="text-[12.5px] text-ink-600 mt-0.5">
                  {ciudadano.tipoDocumento} {ciudadano.numeroDocumento} · Registrada desde el {formatearFecha(ciudadano.fechaRegistro)}
                </div>
              </div>
              <button
                onClick={() => navigate(`/ciudadanos/${ciudadano.id}/editar`)}
                className="ml-auto flex items-center gap-1.5 border border-line rounded-[9px] px-4 py-2 text-[12.5px] font-semibold text-ink-600 hover:bg-paper">
                <svg viewBox="0 0 24 24" fill="none" strokeWidth="1.8" className="w-[13px] h-[13px] stroke-ink-600">
                  <path d="M12 20h9M16.5 3.5a2.1 2.1 0 013 3L7 19l-4 1 1-4L16.5 3.5z" />
                </svg>
                Editar
              </button>
              <button
                onClick={() => navigate(`/solicitudes/nueva?ciudadanoId=${ciudadano.id}`)}
                className="flex items-center gap-1.5 bg-[#0d9488] text-white rounded-[9px] px-4 py-2 text-[12.5px] font-semibold">
                <svg viewBox="0 0 24 24" fill="none" strokeWidth="2.2" className="w-[13px] h-[13px] stroke-white">
                  <path d="M12 5v14M5 12h14" />
                </svg>
                Nueva solicitud
              </button>


            </div>

            <div className="grid grid-cols-[380px_1fr] gap-5 items-start">
              <div className="flex flex-col gap-5">
                <div className="bg-white border border-line rounded-[14px] overflow-hidden">
                  <div className="px-5 py-[14px] border-b border-line">
                    <h3 className="font-display text-[14px] font-semibold text-ink-900">Datos de contacto</h3>
                  </div>
                  <div className="px-5 py-2">
                    {[
                      ['Teléfono', ciudadano.telefono ?? '—'],
                      ['Correo', ciudadano.email ?? '—'],
                      ['Ciudad', ciudadano.ciudad ?? '—'],
                      ['Dirección', ciudadano.direccion ?? '—'],
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
                    <h3 className="font-display text-[14px] font-semibold text-ink-900">Proyectos con actividad</h3>
                  </div>
                  {ciudadano.proyectosConActividad.map((p) => (
                    <div key={p.proyectoId} className="flex items-center gap-2.5 px-5 py-3 border-b border-paper last:border-0">
                      <div className="w-8 h-8 rounded-[9px] bg-[#e3f7f4] flex items-center justify-center shrink-0">
                        <svg viewBox="0 0 24 24" fill="none" strokeWidth="1.8" className="w-[15px] h-[15px] stroke-[#0d9488]">
                          <path d="M3 11l9-8 9 8" /><path d="M5 10v10h14V10" />
                        </svg>
                      </div>
                      <div>
                        <div className="text-[12.5px] font-semibold text-ink-900">{p.proyectoNombre}</div>
                        <div className="text-[11px] text-ink-600">
                          Afiliada desde {new Date(p.primeraActividad).getFullYear()}
                        </div>
                      </div>
                      <span className="ml-auto text-[11px] font-bold text-ink-600 bg-paper px-[9px] py-[3px] rounded-[10px]">
                        {p.totalSolicitudes}
                      </span>
                    </div>
                  ))}
                </div>
              </div>

              <div className="flex flex-col gap-5">
                <div className="bg-white border border-line rounded-[14px] overflow-hidden">
                  <div className="px-5 py-[14px] border-b border-line">
                    <h3 className="font-display text-[14px] font-semibold text-ink-900">
                      Solicitudes {ciudadano.proyectosConActividad.length === 1 ? `en ${ciudadano.proyectosConActividad[0].proyectoNombre}` : ''}
                    </h3>
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
                          <td className="px-5 py-3 text-[12.5px] border-b border-line last:border-0">{s.tipoSolicitudNombre}</td>
                          <td className="px-5 py-3 border-b border-line last:border-0">
                            <span className={`inline-flex items-center gap-1.5 text-[11px] font-semibold px-[10px] py-[4px] rounded-full ${ESTADO_STYLE[s.estado] ?? 'bg-paper text-ink-600'}`}>
                              <span className="w-1.5 h-1.5 rounded-full bg-current" />
                              {s.estado}
                            </span>
                          </td>
                          <td className="px-5 py-3 text-[12.5px] text-ink-600 border-b border-line last:border-0">
                            {formatearFecha(s.fecha)}
                          </td>
                        </tr>
                      ))}
                      {solicitudes.length === 0 && (
                        <tr>
                          <td colSpan={4} className="px-5 py-8 text-center text-sm text-ink-400">
                            Este ciudadano no tiene solicitudes visibles en tus proyectos.
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>

                <div className="bg-white border border-line rounded-[14px] overflow-hidden">
                  <div className="px-5 py-[14px] border-b border-line">
                    <h3 className="font-display text-[14px] font-semibold text-ink-900">Documentos en expediente</h3>
                  </div>
                  <table className="w-full border-collapse">
                    <thead>
                      <tr>
                        {['Documento', 'Solicitud', 'Fecha'].map((h) => (
                          <th key={h} className="text-left text-[10.5px] uppercase tracking-wide text-ink-400 font-semibold px-5 py-[10px] border-b border-line">
                            {h}
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {documentos.map((d) => (
                        <tr key={d.id} className="hover:bg-paper transition-colors">
                          <td className="px-5 py-3 text-[12.5px] border-b border-line last:border-0">{d.nombreArchivo}</td>
                          <td className="px-5 py-3 text-[12px] text-ink-400 font-semibold border-b border-line last:border-0">
                            #{d.solicitudNumero}
                          </td>
                          <td className="px-5 py-3 text-[12.5px] text-ink-600 border-b border-line last:border-0">
                            {formatearFecha(d.fecha)}
                          </td>
                        </tr>
                      ))}
                      {documentos.length === 0 && (
                        <tr>
                          <td colSpan={3} className="px-5 py-8 text-center text-sm text-ink-400">
                            No hay documentos en el expediente.
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          </>
        )}
      </main>
    </div>
  );
}