import { useState, useEffect } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import Sidebar from '../components/layout/Sidebar';
import {
  crearSolicitud,
  getTiposSolicitudPorProyecto,
  type TipoSolicitudDto,
} from '../services/solicitudService';
import { getProyectosActivos, type ProyectoResponseDto } from '../services/proyectoService';
import { getCiudadanos, getCiudadanoDetalle, type CiudadanoResponseDto } from '../services/ciudadanoService';
import { getEmpresas, getEmpresaDetalle, type EmpresaResponseDto } from '../services/empresaService';
import { CAMPOS_POR_TIPO, CAMPO_FALLBACK } from '../config/camposPorTipoSolicitud';
import { getColorProyecto } from '../config/colorPorProyecto';

const ICONOS_TIPO: Record<string, React.ReactNode> = {
  'Subsidio de vivienda': <path d="M3 11l9-8 9 8M5 10v10h14V10" />,
  'Protección al cesante': <path d="M12 2l8 4v6c0 5-3.5 8-8 10-4.5-2-8-5-8-10V6l8-4z" />,
  'Subsidio de desempleo': <path d="M12 5v14M5 12h14" />,
  'Créditos': <><rect x="3" y="5" width="18" height="14" rx="2" /><path d="M3 10h18" /></>,
  'Carné virtual': <rect x="6" y="3" width="12" height="18" rx="2" />,
};

type TipoAfiliado = 'ciudadano' | 'empresa';

export default function NuevaSolicitudPage() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const proyectoId = Number(searchParams.get('proyectoId'));
  const ciudadanoIdUrl = searchParams.get('ciudadanoId');
  const empresaIdUrl = searchParams.get('empresaId');

  const [proyecto, setProyecto] = useState<ProyectoResponseDto | null>(null);
  const [tipos, setTipos] = useState<TipoSolicitudDto[]>([]);
  const [tipoSeleccionado, setTipoSeleccionado] = useState<TipoSolicitudDto | null>(null);

  const [tipoAfiliado, setTipoAfiliado] = useState<TipoAfiliado>('ciudadano');
  const [busquedaAfiliado, setBusquedaAfiliado] = useState('');
  const [resultadosCiudadanos, setResultadosCiudadanos] = useState<CiudadanoResponseDto[]>([]);
  const [resultadosEmpresas, setResultadosEmpresas] = useState<EmpresaResponseDto[]>([]);

  const [ciudadanoSeleccionado, setCiudadanoSeleccionado] = useState<CiudadanoResponseDto | null>(null);
  const [empresaSeleccionada, setEmpresaSeleccionada] = useState<EmpresaResponseDto | null>(null);

  const [datosTramite, setDatosTramite] = useState<Record<string, string>>({});
  const [observaciones, setObservaciones] = useState('');

  const [guardando, setGuardando] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!proyectoId) return;
    getProyectosActivos().then((lista) => setProyecto(lista.find((p) => p.id === proyectoId) ?? null));
    getTiposSolicitudPorProyecto(proyectoId).then((lista) => {
      setTipos(lista);
      if (lista.length > 0) setTipoSeleccionado(lista[0]);
    });
  }, [proyectoId]);

  // Afiliado que llega ya resuelto por la URL — ya sea del gancho de ficha,
  // o de volver de "crear nuevo ciudadano/empresa" a mitad del formulario
  useEffect(() => {
    if (ciudadanoIdUrl) {
      setTipoAfiliado('ciudadano');
      getCiudadanoDetalle(Number(ciudadanoIdUrl)).then((c) =>
        setCiudadanoSeleccionado({
          id: c.id,
          tipoDocumento: c.tipoDocumento,
          numeroDocumento: c.numeroDocumento,
          nombreCompleto: c.nombreCompleto,
          proyectosConActividad: [],
          totalSolicitudes: 0,
        })
      );
    } else if (empresaIdUrl) {
      setTipoAfiliado('empresa');
      getEmpresaDetalle(Number(empresaIdUrl)).then((e) =>
        setEmpresaSeleccionada({
          id: e.id,
          nit: e.nit,
          digitoVerificacion: e.digitoVerificacion,
          razonSocial: e.razonSocial,
          proyectosConActividad: [],
          totalSolicitudes: 0,
        })
      );
    }
  }, [ciudadanoIdUrl, empresaIdUrl]);

  // Búsqueda con debounce — solo si no hay ya un afiliado resuelto por la URL
  useEffect(() => {
    if (ciudadanoIdUrl || empresaIdUrl) return;
    if (busquedaAfiliado.trim().length < 3) {
      setResultadosCiudadanos([]);
      setResultadosEmpresas([]);
      return;
    }
    const timeout = setTimeout(() => {
      if (tipoAfiliado === 'ciudadano') {
        getCiudadanos({ buscar: busquedaAfiliado, pagina: 1, tamanoPagina: 5 }).then((res) =>
          setResultadosCiudadanos(res.datos)
        );
      } else {
        getEmpresas({ buscar: busquedaAfiliado, pagina: 1, tamanoPagina: 5 }).then((res) =>
          setResultadosEmpresas(res.datos)
        );
      }
    }, 400);
    return () => clearTimeout(timeout);
  }, [busquedaAfiliado, tipoAfiliado, ciudadanoIdUrl, empresaIdUrl]);

  const campos = tipoSeleccionado ? CAMPOS_POR_TIPO[tipoSeleccionado.nombre] : undefined;
  const afiliadoResueltoPorUrl = Boolean(ciudadanoIdUrl || empresaIdUrl);
  const volverAActual = `/solicitudes/nueva?proyectoId=${proyectoId}`;
  const color = getColorProyecto(proyecto?.nombre);

  async function handleSubmit() {
    setError(null);
    if (!tipoSeleccionado) {
      setError('Selecciona un tipo de solicitud.');
      return;
    }
    if (!ciudadanoSeleccionado && !empresaSeleccionada) {
      setError('Selecciona un afiliado para continuar.');
      return;
    }

    const datosAdicionales = campos ? JSON.stringify(datosTramite) : JSON.stringify({ observaciones });

    setGuardando(true);
    try {
      const creada = await crearSolicitud({
        proyectoId,
        tipoSolicitudId: tipoSeleccionado.id,
        ciudadanoId: ciudadanoSeleccionado?.id,
        empresaId: empresaSeleccionada?.id,
        datosAdicionales,
      });
      navigate(`/solicitudes/${creada.id}`);
    } catch (err: any) {
      setError(err?.response?.data?.mensaje ?? 'No se pudo radicar la solicitud. Intenta de nuevo.');
    } finally {
      setGuardando(false);
    }
  }

  return (
    <div
      className="flex min-h-screen bg-paper"
      style={{ '--color-accento': color.primario, '--color-accento-claro': color.primarioClaro } as React.CSSProperties}
    >
      <Sidebar active="solicitudes" />

      <main className="flex-1 px-[38px] py-7 overflow-y-auto max-w-[900px]">
        <div className="flex items-center gap-1.5 text-xs text-ink-400 mb-3.5">
          <button onClick={() => navigate(`/solicitudes?proyectoId=${proyectoId}`)} className="hover:underline">
            Solicitudes
          </button>
          <span>/</span>
          <span className="text-ink-900 font-semibold">Nueva solicitud</span>
        </div>

        <h1 className="font-display text-[22px] font-semibold text-ink-900 mb-1.5">
          Nueva solicitud — {proyecto?.nombre ?? '...'}
        </h1>
        <p className="text-ink-600 text-[12.5px] mb-5">
          Selecciona el tipo de trámite y vincula al afiliado correspondiente.
        </p>

        <div className="bg-white border border-line rounded-[14px] p-5 mb-5">
          <h3 className="font-display text-[13.5px] font-semibold text-ink-900 mb-4">1. Tipo de solicitud</h3>
          <div className="grid grid-cols-2 gap-3">
            {tipos.map((t) => (
              <button
                key={t.id}
                type="button"
                onClick={() => { setTipoSeleccionado(t); setDatosTramite({}); }}
                className={`flex items-center gap-2.5 border-[1.5px] rounded-xl px-4 py-3.5 text-[13px] font-semibold text-left ${
                  tipoSeleccionado?.id === t.id ? 'border-[var(--color-accento)] bg-[var(--color-accento-claro)] text-[var(--color-accento)]' : 'border-line text-ink-900'
                }`}
              >
                <svg viewBox="0 0 24 24" fill="none" strokeWidth="1.8" className="w-[18px] h-[18px] stroke-current shrink-0">
                  {ICONOS_TIPO[t.nombre] ?? <circle cx="12" cy="12" r="9" />}
                </svg>
                {t.nombre}
              </button>
            ))}
          </div>
        </div>

        <div className="bg-white border border-line rounded-[14px] p-5 mb-5">
          <h3 className="font-display text-[13.5px] font-semibold text-ink-900 mb-4">2. Afiliado</h3>

          {afiliadoResueltoPorUrl ? (
            <div className="flex items-center gap-3 bg-[var(--color-accento-claro)] border border-[var(--color-accento)] rounded-xl px-3.5 py-3">
              <div className="w-8 h-8 rounded-lg bg-[var(--color-accento)] text-white flex items-center justify-center text-xs font-bold shrink-0">
                {(ciudadanoSeleccionado?.nombreCompleto ?? empresaSeleccionada?.razonSocial ?? '')
                  .split(' ').slice(0, 2).map((p) => p[0]).join('').toUpperCase()}
              </div>
              <div className="flex-1">
                <div className="text-[13px] font-semibold text-ink-900">
                  {ciudadanoSeleccionado?.nombreCompleto ?? empresaSeleccionada?.razonSocial}
                </div>
                <div className="text-[11px] text-ink-600">
                  {ciudadanoSeleccionado
                    ? `CC ${ciudadanoSeleccionado.numeroDocumento}`
                    : `NIT ${empresaSeleccionada?.nit}-${empresaSeleccionada?.digitoVerificacion}`}
                  {' · Afiliado vinculado'}
                </div>
              </div>
            </div>
          ) : (
            <>
              <div className="flex gap-1.5 mb-3.5">
                {(['ciudadano', 'empresa'] as TipoAfiliado[]).map((t) => (
                  <button
                    key={t}
                    type="button"
                    onClick={() => { setTipoAfiliado(t); setBusquedaAfiliado(''); }}
                    className={`text-xs font-semibold px-3.5 py-2 rounded-full ${
                      tipoAfiliado === t ? 'bg-[#0f172a] text-white' : 'bg-paper border border-line text-ink-600'
                    }`}
                  >
                    {t === 'ciudadano' ? 'Persona natural' : 'Empresa'}
                  </button>
                ))}
              </div>

              <label className="block text-xs font-semibold text-ink-900 mb-1.5">
                Buscar por {tipoAfiliado === 'ciudadano' ? 'documento o nombre' : 'razón social o NIT'}
              </label>
              <div className="flex items-center gap-2 bg-paper border border-line rounded-[9px] px-3 py-2.5 mb-3">
                <svg viewBox="0 0 24 24" fill="none" strokeWidth="2" className="w-4 h-4 stroke-ink-400 shrink-0">
                  <circle cx="11" cy="11" r="7" /><path d="M21 21l-4-4" />
                </svg>
                <input
                  value={busquedaAfiliado}
                  onChange={(e) => {
                    setBusquedaAfiliado(e.target.value);
                    setCiudadanoSeleccionado(null);
                    setEmpresaSeleccionada(null);
                  }}
                  placeholder={tipoAfiliado === 'ciudadano' ? '1098765432' : 'TechSolutions S.A.S'}
                  className="border-none outline-none bg-transparent text-[13px] w-full font-body"
                />
              </div>

              {tipoAfiliado === 'ciudadano'
                ? resultadosCiudadanos.map((c) => (
                    <button
                      key={c.id}
                      type="button"
                      onClick={() => setCiudadanoSeleccionado(c)}
                      className={`w-full flex items-center gap-3 rounded-xl px-3.5 py-3 mb-1.5 text-left ${
                        ciudadanoSeleccionado?.id === c.id ? 'bg-[var(--color-accento-claro)] border border-[var(--color-accento)]' : 'bg-paper border border-line'
                      }`}
                    >
                      <div className="w-8 h-8 rounded-lg bg-blue-100 text-blue-600 flex items-center justify-center text-xs font-bold shrink-0">
                        {c.nombreCompleto.split(' ').slice(0, 2).map((p) => p[0]).join('').toUpperCase()}
                      </div>
                      <div className="flex-1">
                        <div className="text-[13px] font-semibold text-ink-900">{c.nombreCompleto}</div>
                        <div className="text-[11px] text-ink-400">CC {c.numeroDocumento}</div>
                      </div>
                      {ciudadanoSeleccionado?.id === c.id && (
                        <svg viewBox="0 0 24 24" fill="none" strokeWidth="2.5" className="w-4 h-4 stroke-[var(--color-accento)]">
                          <path d="M5 13l4 4L19 7" />
                        </svg>
                      )}
                    </button>
                  ))
                : resultadosEmpresas.map((e) => (
                    <button
                      key={e.id}
                      type="button"
                      onClick={() => setEmpresaSeleccionada(e)}
                      className={`w-full flex items-center gap-3 rounded-xl px-3.5 py-3 mb-1.5 text-left ${
                        empresaSeleccionada?.id === e.id ? 'bg-[var(--color-accento-claro)] border border-[var(--color-accento)]' : 'bg-paper border border-line'
                      }`}
                    >
                      <div className="w-8 h-8 rounded-lg bg-blue-100 text-blue-600 flex items-center justify-center text-xs font-bold shrink-0">
                        {e.razonSocial.split(' ').slice(0, 2).map((p) => p[0]).join('').toUpperCase()}
                      </div>
                      <div className="flex-1">
                        <div className="text-[13px] font-semibold text-ink-900">{e.razonSocial}</div>
                        <div className="text-[11px] text-ink-400">NIT {e.nit}-{e.digitoVerificacion}</div>
                      </div>
                      {empresaSeleccionada?.id === e.id && (
                        <svg viewBox="0 0 24 24" fill="none" strokeWidth="2.5" className="w-4 h-4 stroke-[var(--color-accento)]">
                          <path d="M5 13l4 4L19 7" />
                        </svg>
                      )}
                    </button>
                  ))}

              <button
                type="button"
                onClick={() =>
                  navigate(
                    tipoAfiliado === 'ciudadano'
                      ? `/ciudadanos/nuevo?volverA=${encodeURIComponent(volverAActual)}`
                      : `/empresas/nueva?volverA=${encodeURIComponent(volverAActual)}`
                  )
                }
                className="text-[12.5px] text-blue-600 font-medium mt-1"
              >
                {tipoAfiliado === 'ciudadano'
                  ? '+ No aparece en el sistema — crear nuevo ciudadano'
                  : '+ No aparece en el sistema — crear nueva empresa'}
              </button>
            </>
          )}
        </div>

        <div className="bg-white border border-line rounded-[14px] p-5 mb-5">
          <h3 className="font-display text-[13.5px] font-semibold text-ink-900 mb-4">3. Datos específicos del trámite</h3>
          {campos ? (
            <div className="flex flex-col gap-3.5">
              {campos.map((c) => (
                <div key={c.key}>
                  <label className="block text-xs font-semibold text-ink-900 mb-1.5">{c.label}</label>
                  {c.tipo === 'select' ? (
                    <select
                      value={datosTramite[c.key] ?? ''}
                      onChange={(e) => setDatosTramite((d) => ({ ...d, [c.key]: e.target.value }))}
                      className="w-full py-2.5 px-3 border-[1.5px] border-line rounded-[9px] text-[13px] outline-none focus:border-blue-500"
                    >
                      {c.opciones?.map((op) => <option key={op} value={op}>{op}</option>)}
                    </select>
                  ) : (
                    <input
                      type={c.tipo === 'numero' ? 'number' : c.tipo === 'fecha' ? 'date' : 'text'}
                      value={datosTramite[c.key] ?? ''}
                      onChange={(e) => setDatosTramite((d) => ({ ...d, [c.key]: e.target.value }))}
                      placeholder={c.placeholder}
                      className="w-full py-2.5 px-3 border-[1.5px] border-line rounded-[9px] text-[13px] outline-none focus:border-blue-500"
                    />
                  )}
                </div>
              ))}
            </div>
          ) : (
            <div>
              <label className="block text-xs font-semibold text-ink-900 mb-1.5">{CAMPO_FALLBACK.label} (opcional)</label>
              <textarea
                value={observaciones}
                onChange={(e) => setObservaciones(e.target.value)}
                rows={4}
                placeholder="Información adicional relevante para el trámite"
                className="w-full py-2.5 px-3 border-[1.5px] border-line rounded-[9px] text-[13px] outline-none focus:border-blue-500 resize-none"
              />
              <p className="text-[11px] text-ink-400 mt-1.5">
                Este tipo de solicitud todavía no tiene campos específicos configurados.
              </p>
            </div>
          )}
        </div>

        {error && (
          <div className="text-xs text-red-600 bg-red-50 border border-red-200 rounded-lg px-3 py-2 mb-4">{error}</div>
        )}

        <div className="flex justify-end gap-2.5">
          <button
            type="button"
            onClick={() => navigate(`/solicitudes?proyectoId=${proyectoId}`)}
            className="py-2.5 px-5 rounded-[9px] border border-line text-ink-600 text-sm font-medium"
          >
            Cancelar
          </button>
          <button
            type="button"
            onClick={handleSubmit}
            disabled={guardando}
            className="flex items-center gap-1.5 py-2.5 px-5 rounded-[9px] bg-[var(--color-accento)] text-white text-sm font-semibold disabled:opacity-60"
          >
            {guardando ? 'Radicando...' : 'Radicar solicitud'}
            {!guardando && (
              <svg viewBox="0 0 24 24" fill="none" strokeWidth="2.2" className="w-3.5 h-3.5 stroke-white">
                <path d="M5 12h14M13 5l7 7-7 7" />
              </svg>
            )}
          </button>
        </div>
      </main>
    </div>
  );
}