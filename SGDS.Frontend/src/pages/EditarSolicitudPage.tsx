import { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import Sidebar from '../components/layout/Sidebar';
import {
  getSolicitudDetalle,
  actualizarSolicitud,
  getTiposSolicitudPorProyecto,
  type SolicitudDetalleResponseDto,
  type TipoSolicitudDto,
} from '../services/solicitudService';
import { getColorProyecto } from '../config/colorPorProyecto';
import {
  DATOS_CONTRATO_VACIOS,
  leerDatosContratoEstampillas,
  construirDatosAdicionalesEstampillas,
  type DatosContratoEstampillas,
} from '../config/estampillasConfig';
import FormularioDatosContrato from '../components/estampillas/FormularioDatosContrato';

export default function EditarSolicitudPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  const [solicitud, setSolicitud] = useState<SolicitudDetalleResponseDto | null>(null);
  const [tipos, setTipos] = useState<TipoSolicitudDto[]>([]);
  const [tipoSolicitudId, setTipoSolicitudId] = useState<number | null>(null);
  const [datosContrato, setDatosContrato] = useState<DatosContratoEstampillas>(DATOS_CONTRATO_VACIOS);

  const [loading, setLoading] = useState(true);
  const [guardando, setGuardando] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!id) return;
    setLoading(true);
    getSolicitudDetalle(Number(id))
      .then((s) => {
        setSolicitud(s);
        setTipoSolicitudId(s.tipoSolicitudId ?? null);
        let datos: Record<string, string> = {};
        try {
          datos = s.datosAdicionales ? JSON.parse(s.datosAdicionales) : {};
        } catch {
          datos = {};
        }
        setDatosContrato(leerDatosContratoEstampillas(datos));
        if (s.proyectoId) {
          getTiposSolicitudPorProyecto(s.proyectoId).then(setTipos);
        }
      })
      .finally(() => setLoading(false));
  }, [id]);

  const color = getColorProyecto(solicitud?.proyectoNombre);
  const esEstampillas = solicitud?.proyectoNombre === 'Estampillas';

  async function handleGuardar() {
    if (!solicitud) return;
    setGuardando(true);
    setError(null);
    try {
      const tipoBase = tipos.find((t) => t.id === tipoSolicitudId)?.nombre ?? solicitud.tipoSolicitudNombre ?? '';
      const datosAdicionales = JSON.stringify(construirDatosAdicionalesEstampillas(datosContrato, tipoBase));
      await actualizarSolicitud(solicitud.id, {
        tipoSolicitudId: tipoSolicitudId ?? undefined,
        datosAdicionales,
      });
      navigate(`/solicitudes/${solicitud.id}`);
    } catch (err: any) {
      setError(err?.response?.data?.mensaje ?? 'No se pudo guardar. Intenta de nuevo.');
    } finally {
      setGuardando(false);
    }
  }

  if (loading || !solicitud) {
    return (
      <div className="flex min-h-screen bg-paper">
        <Sidebar active="solicitudes" />
        <main className="flex-1 flex items-center justify-center text-sm text-ink-400">Cargando solicitud...</main>
      </div>
    );
  }

  return (
    <div
      className="flex min-h-screen bg-paper"
      style={{ '--color-accento': color.primario, '--color-accento-claro': color.primarioClaro } as React.CSSProperties}
    >
      <Sidebar active="solicitudes" />

      <main className="flex-1 px-[38px] py-7 overflow-y-auto max-w-[900px]">
        <div className="flex items-center gap-1.5 text-xs text-ink-400 mb-3.5">
          <Link to={`/solicitudes/${solicitud.id}`} className="hover:text-ink-600">#{solicitud.numero}</Link>
          <span>/</span>
          <span className="text-ink-900 font-semibold">Editar solicitud</span>
        </div>

        <h1 className="font-display text-[22px] font-semibold text-ink-900 mb-1.5">
          Editar solicitud — #{solicitud.numero}
        </h1>
        <p className="text-ink-600 text-[12.5px] mb-5">{solicitud.proyectoNombre}</p>

        {!esEstampillas ? (
          <div className="bg-white border border-line rounded-[14px] p-5 text-[13px] text-ink-600">
            La edición todavía solo está disponible para solicitudes de Estampillas.
          </div>
        ) : (
          <>
            <div className="bg-white border border-line rounded-[14px] p-5 mb-5">
              <h3 className="font-display text-[13.5px] font-semibold text-ink-900 mb-4">Tipo de solicitud</h3>
              <select
                value={tipoSolicitudId ?? ''}
                onChange={(e) => setTipoSolicitudId(e.target.value ? Number(e.target.value) : null)}
                className="w-full py-2.5 px-3 border-[1.5px] border-line rounded-[9px] text-[13px] outline-none focus:border-blue-500"
              >
                {tipos.map((t) => <option key={t.id} value={t.id}>{t.nombre}</option>)}
              </select>
            </div>

            <div className="bg-white border border-line rounded-[14px] p-5 mb-5">
              <h3 className="font-display text-[13.5px] font-semibold text-ink-900 mb-4">Datos del contrato</h3>
              <FormularioDatosContrato value={datosContrato} onChange={setDatosContrato} />
            </div>

            {error && (
              <div className="text-xs text-red-600 bg-red-50 border border-red-200 rounded-lg px-3 py-2 mb-4">{error}</div>
            )}

            <div className="flex justify-end gap-2.5">
              <button
                type="button"
                onClick={() => navigate(`/solicitudes/${solicitud.id}`)}
                className="py-2.5 px-5 rounded-[9px] border border-line text-ink-600 text-sm font-medium"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={handleGuardar}
                disabled={guardando}
                className="flex items-center gap-1.5 py-2.5 px-5 rounded-[9px] bg-[var(--color-accento)] text-white text-sm font-semibold disabled:opacity-60"
              >
                {guardando ? 'Guardando...' : 'Guardar cambios'}
              </button>
            </div>
          </>
        )}
      </main>
    </div>
  );
}
