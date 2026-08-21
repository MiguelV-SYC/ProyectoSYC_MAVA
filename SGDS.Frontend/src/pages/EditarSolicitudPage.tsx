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
import { DATOS_TORNAGUIA_VACIOS, validarCoherenciaOrigenDestino, type DatosTornaguia } from '../config/infoconsumoConfig';
import FormularioTornaguia from '../components/infoconsumo/FormularioTornaguia';
import SelectorTipoTransporte from '../components/infoconsumo/SelectorTipoTransporte';
import CamposOrigenDestino from '../components/infoconsumo/CamposOrigenDestino';
import { getTornaguia, actualizarSolicitudInfoconsumo } from '../services/infoconsumoService';
import { DATOS_ESTAMPILLA_VACIOS, CATEGORIA_SIN_ESTAMPILLA_FISICA, type DatosEstampilla } from '../config/syctraceConfig';
import FormularioEstampilla from '../components/syctrace/FormularioEstampilla';
import { getEstampilla, actualizarSolicitudSycTrace } from '../services/syctraceService';
import { DATOS_LOTE_GOTRACE_VACIOS, type DatosLoteGoTrace } from '../config/gotraceConfig';
import FormularioLoteGoTrace from '../components/gotrace/FormularioLoteGoTrace';
import { getCertificado, actualizarSolicitudGoTrace } from '../services/gotraceService';
import { DATOS_INSTRUMENTO_PASIVO_VACIOS, TIPO_CONSULTA_EXPEDIENTE, totalMeses, aniosYMeses, type DatosInstrumentoPasivo } from '../config/pasivosLaboralesConfig';
import FormularioInstrumentoPasivo from '../components/pasivosLaborales/FormularioInstrumentoPasivo';
import { getInstrumento, actualizarSolicitudPasivosLaborales } from '../services/pasivosLaboralesService';

export default function EditarSolicitudPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  const [solicitud, setSolicitud] = useState<SolicitudDetalleResponseDto | null>(null);
  const [tipos, setTipos] = useState<TipoSolicitudDto[]>([]);
  const [tipoSolicitudId, setTipoSolicitudId] = useState<number | null>(null);
  const [datosContrato, setDatosContrato] = useState<DatosContratoEstampillas>(DATOS_CONTRATO_VACIOS);
  const [datosTornaguia, setDatosTornaguia] = useState<DatosTornaguia>(DATOS_TORNAGUIA_VACIOS);
  const [estadoTornaguia, setEstadoTornaguia] = useState<string | null>(null);
  const [datosEstampilla, setDatosEstampilla] = useState<DatosEstampilla>(DATOS_ESTAMPILLA_VACIOS);
  const [estadoEstampilla, setEstadoEstampilla] = useState<string | null>(null);
  const [datosLoteGoTrace, setDatosLoteGoTrace] = useState<DatosLoteGoTrace>(DATOS_LOTE_GOTRACE_VACIOS);
  const [empresaGoTrace, setEmpresaGoTrace] = useState<{ nombre: string; nit: string } | null>(null);
  const [datosInstrumentoPasivo, setDatosInstrumentoPasivo] = useState<DatosInstrumentoPasivo>(DATOS_INSTRUMENTO_PASIVO_VACIOS);
  const [empresaPasivosLaborales, setEmpresaPasivosLaborales] = useState<{ nombre: string; nit: string } | null>(null);

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
        if (s.proyectoId) {
          getTiposSolicitudPorProyecto(s.proyectoId).then(setTipos);
        }

        if (s.proyectoNombre === 'Infoconsumo') {
          getTornaguia(s.id).then((t) => {
            setEstadoTornaguia(t.estado);
            setDatosTornaguia({
              tipoTransporte: t.tipoTransporte,
              categoriaProducto: t.categoriaProducto,
              gradosAlcoholimetricos: t.gradosAlcoholimetricos != null ? String(t.gradosAlcoholimetricos) : '',
              unidadesFisicas: String(t.unidadesFisicas),
              pvpCertificado: String(t.pvpCertificado),
              departamentoOrigen: t.departamentoOrigen,
              municipioOrigen: t.municipioOrigen,
              departamentoDestino: t.departamentoDestino,
              municipioDestino: t.municipioDestino,
              empresaTransportadora: t.empresaTransportadora,
              nitTransportador: t.nitTransportador ?? '',
              placaVehiculo: t.placaVehiculo,
              conductor: t.conductor ?? '',
              cedulaConductor: t.cedulaConductor ?? '',
              tipoVehiculo: t.tipoVehiculo ?? '',
              observaciones: t.observaciones ?? '',
              loteGoTraceSolicitudId: t.loteGoTraceSolicitudId ?? null,
              loteGoTraceNumero: t.loteGoTraceNumero ?? '',
              loteGoTraceEmpresaNombre: '',
              loteGoTraceEmpresaNit: '',
              loteGoTraceProducto: t.loteGoTraceProducto ?? '',
              loteGoTraceNumeroLote: '',
            });
          });
        } else if (s.proyectoNombre === 'SYCTrace') {
          getEstampilla(s.id).then((e) => {
            setEstadoEstampilla(e.estado);
            setDatosEstampilla({
              solicitudInfoconsumoId: e.solicitudInfoconsumoId,
              solicitudInfoconsumoNumero: e.solicitudInfoconsumoNumero,
              empresaNombre: e.empresaRazonSocial,
              empresaNit: e.empresaNit,
              categoriaProducto: e.categoriaProducto,
              nombreProducto: e.nombreProducto,
              marca: e.marca ?? '',
              gradoAlcoholimetrico: e.gradoAlcoholimetrico != null ? String(e.gradoAlcoholimetrico) : '',
              contenidoNetoCc: e.contenidoNetoCc != null ? String(e.contenidoNetoCc) : '',
              unidadesPorCajetilla: e.unidadesPorCajetilla != null ? String(e.unidadesPorCajetilla) : '',
              registroInvima: e.registroInvima,
              loteProduccion: e.loteProduccion,
              origenProducto: e.origenProducto,
              numeroTornaguia: e.numeroTornaguia ?? '',
              numeroDeclaracionImportacion: e.numeroDeclaracionImportacion ?? '',
              registroIntroduccion: e.registroIntroduccion ?? '',
              prefijo: e.prefijo,
              cantidadEstampillas: String(e.cantidadEstampillas),
              codigoInicial: String(e.codigoInicial),
            });
          });
        } else if (s.proyectoNombre === 'Gotrace') {
          getCertificado(s.id).then((c) => {
            setEmpresaGoTrace({ nombre: c.empresaRazonSocial, nit: c.empresaNit });
            setDatosLoteGoTrace({
              producto: c.producto,
              numeroLote: c.numeroLote,
              fechaProduccion: c.fechaProduccion.slice(0, 10),
              unidadesLote: String(c.unidadesLote),
              prefijoUid: c.prefijoUid ?? '',
              cantidadUids: c.cantidadUids != null ? String(c.cantidadUids) : '',
              uidInicial: c.uidInicial != null ? String(c.uidInicial) : '',
              puntosControlHabilitados: c.puntosControl.filter((p) => p.habilitado).map((p) => p.nombre),
            });
          });
        } else if (s.proyectoNombre === 'Pasivos Laborales') {
          getInstrumento(s.id).then((i) => {
            setEmpresaPasivosLaborales({ nombre: i.empresaRazonSocial, nit: i.empresaNit });
            const tl = aniosYMeses(i.tiempoLaboradoMeses);
            const ta = aniosYMeses(i.tiempoTotalAportesMeses);
            setDatosInstrumentoPasivo({
              instrumento: i.instrumento ?? '',
              servidorNombre: i.servidorNombre ?? '',
              servidorDocumento: i.servidorDocumento ?? '',
              regimenPensional: i.regimenPensional ?? DATOS_INSTRUMENTO_PASIVO_VACIOS.regimenPensional,
              tiempoLaboradoAnios: tl.anios,
              tiempoLaboradoMesesAdicionales: tl.meses,
              tiempoTotalAportesAnios: ta.anios,
              tiempoTotalAportesMesesAdicionales: ta.meses,
              valorMesadaPensional: i.valorMesadaPensional != null ? String(i.valorMesadaPensional) : '',
              observaciones: i.observaciones ?? '',
              solicitudColpensionesId: i.solicitudColpensionesId ?? null,
              solicitudColpensionesNumero: i.solicitudColpensionesNumero ?? '',
            });
          });
        } else {
          let datos: Record<string, string> = {};
          try {
            datos = s.datosAdicionales ? JSON.parse(s.datosAdicionales) : {};
          } catch {
            datos = {};
          }
          setDatosContrato(leerDatosContratoEstampillas(datos));
        }
      })
      .finally(() => setLoading(false));
  }, [id]);

  const color = getColorProyecto(solicitud?.proyectoNombre);
  const esEstampillas = solicitud?.proyectoNombre === 'Estampillas';
  const esInfoconsumo = solicitud?.proyectoNombre === 'Infoconsumo';
  const esSycTrace = solicitud?.proyectoNombre === 'SYCTrace';
  const esGoTrace = solicitud?.proyectoNombre === 'Gotrace';
  const esPasivosLaborales = solicitud?.proyectoNombre === 'Pasivos Laborales';
  const tipoTramiteSeleccionado = tipos.find((t) => t.id === tipoSolicitudId)?.nombre ?? '';
  const errorCoherencia = esInfoconsumo
    ? validarCoherenciaOrigenDestino(tipoTramiteSeleccionado, datosTornaguia.departamentoOrigen, datosTornaguia.departamentoDestino)
    : null;

  async function handleGuardar() {
    if (!solicitud) return;
    setGuardando(true);
    setError(null);
    try {
      if (esInfoconsumo) {
        if (errorCoherencia) {
          setError(errorCoherencia);
          return;
        }
        await actualizarSolicitudInfoconsumo(solicitud.id, {
          tipoSolicitudId: tipoSolicitudId ?? undefined,
          tipoTransporte: datosTornaguia.tipoTransporte,
          categoriaProducto: datosTornaguia.categoriaProducto,
          gradosAlcoholimetricos: datosTornaguia.gradosAlcoholimetricos ? Number(datosTornaguia.gradosAlcoholimetricos) : undefined,
          unidadesFisicas: Number(datosTornaguia.unidadesFisicas) || 0,
          pvpCertificado: Number(datosTornaguia.pvpCertificado) || 0,
          departamentoOrigen: datosTornaguia.departamentoOrigen,
          municipioOrigen: datosTornaguia.municipioOrigen,
          departamentoDestino: datosTornaguia.departamentoDestino,
          municipioDestino: datosTornaguia.municipioDestino,
          empresaTransportadora: datosTornaguia.empresaTransportadora,
          nitTransportador: datosTornaguia.nitTransportador || undefined,
          placaVehiculo: datosTornaguia.placaVehiculo,
          conductor: datosTornaguia.conductor || undefined,
          cedulaConductor: datosTornaguia.cedulaConductor || undefined,
          tipoVehiculo: datosTornaguia.tipoVehiculo || undefined,
          observaciones: datosTornaguia.observaciones || undefined,
        });
      } else if (esSycTrace) {
        if (datosEstampilla.categoriaProducto === CATEGORIA_SIN_ESTAMPILLA_FISICA) {
          setError('Cervezas, sifones y refajos no están sujetos a estampilla de señalización física en este flujo.');
          return;
        }
        await actualizarSolicitudSycTrace(solicitud.id, {
          categoriaProducto: datosEstampilla.categoriaProducto,
          nombreProducto: datosEstampilla.nombreProducto,
          marca: datosEstampilla.marca || undefined,
          gradoAlcoholimetrico: datosEstampilla.gradoAlcoholimetrico ? Number(datosEstampilla.gradoAlcoholimetrico) : undefined,
          contenidoNetoCc: datosEstampilla.contenidoNetoCc ? Number(datosEstampilla.contenidoNetoCc) : undefined,
          unidadesPorCajetilla: datosEstampilla.unidadesPorCajetilla ? Number(datosEstampilla.unidadesPorCajetilla) : undefined,
          registroInvima: datosEstampilla.registroInvima,
          loteProduccion: datosEstampilla.loteProduccion,
          origenProducto: datosEstampilla.origenProducto,
          numeroTornaguia: datosEstampilla.numeroTornaguia || undefined,
          numeroDeclaracionImportacion: datosEstampilla.numeroDeclaracionImportacion || undefined,
          registroIntroduccion: datosEstampilla.registroIntroduccion || undefined,
          prefijo: datosEstampilla.prefijo,
          cantidadEstampillas: Number(datosEstampilla.cantidadEstampillas) || 0,
          codigoInicial: Number(datosEstampilla.codigoInicial) || 0,
        });
      } else if (esGoTrace) {
        await actualizarSolicitudGoTrace(solicitud.id, {
          producto: datosLoteGoTrace.producto,
          numeroLote: datosLoteGoTrace.numeroLote,
          fechaProduccion: datosLoteGoTrace.fechaProduccion,
          unidadesLote: Number(datosLoteGoTrace.unidadesLote) || 0,
          prefijoUid: datosLoteGoTrace.prefijoUid || undefined,
          cantidadUids: datosLoteGoTrace.cantidadUids ? Number(datosLoteGoTrace.cantidadUids) : undefined,
          uidInicial: datosLoteGoTrace.uidInicial ? Number(datosLoteGoTrace.uidInicial) : undefined,
          puntosControlHabilitados: datosLoteGoTrace.puntosControlHabilitados,
        });
      } else if (esPasivosLaborales) {
        await actualizarSolicitudPasivosLaborales(solicitud.id, {
          instrumento: datosInstrumentoPasivo.instrumento || undefined,
          servidorNombre: datosInstrumentoPasivo.servidorNombre || undefined,
          servidorDocumento: datosInstrumentoPasivo.servidorDocumento || undefined,
          regimenPensional: datosInstrumentoPasivo.regimenPensional || undefined,
          tiempoLaboradoMeses: totalMeses(datosInstrumentoPasivo.tiempoLaboradoAnios, datosInstrumentoPasivo.tiempoLaboradoMesesAdicionales),
          tiempoTotalAportesMeses: totalMeses(datosInstrumentoPasivo.tiempoTotalAportesAnios, datosInstrumentoPasivo.tiempoTotalAportesMesesAdicionales),
          valorMesadaPensional: datosInstrumentoPasivo.valorMesadaPensional ? Number(datosInstrumentoPasivo.valorMesadaPensional) : undefined,
          observaciones: datosInstrumentoPasivo.observaciones || undefined,
        });
      } else {
        const tipoBase = tipos.find((t) => t.id === tipoSolicitudId)?.nombre ?? solicitud.tipoSolicitudNombre ?? '';
        const datosAdicionales = JSON.stringify(construirDatosAdicionalesEstampillas(datosContrato, tipoBase));
        await actualizarSolicitud(solicitud.id, {
          tipoSolicitudId: tipoSolicitudId ?? undefined,
          datosAdicionales,
        });
      }
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

        {!esEstampillas && !esInfoconsumo && !esSycTrace && !esGoTrace && !esPasivosLaborales ? (
          <div className="bg-white border border-line rounded-[14px] p-5 text-[13px] text-ink-600">
            La edición todavía solo está disponible para solicitudes de Estampillas, Infoconsumo, SYCTrace, Gotrace y Pasivos Laborales.
          </div>
        ) : esSycTrace && estadoEstampilla !== 'Generada' ? (
          <div className="bg-white border border-line rounded-[14px] p-5 text-[13px] text-ink-600">
            Esta expedición ya está en estado <b>{estadoEstampilla}</b> — solo se puede editar mientras esté Generada.
          </div>
        ) : (
          <>
            <div className="bg-white border border-line rounded-[14px] p-5 mb-5">
              <h3 className="font-display text-[13.5px] font-semibold text-ink-900 mb-4">Tipo de solicitud</h3>
              {esInfoconsumo && (
                <>
                  <SelectorTipoTransporte
                    value={datosTornaguia.tipoTransporte}
                    onChange={(tipoTransporte) => setDatosTornaguia((d) => ({ ...d, tipoTransporte }))}
                  />
                  <CamposOrigenDestino
                    value={datosTornaguia}
                    onChange={setDatosTornaguia}
                    errorCoherencia={errorCoherencia}
                  />
                  {datosTornaguia.loteGoTraceSolicitudId && (
                    <div className="flex items-center gap-3 bg-paper border border-line rounded-xl px-3.5 py-3 mt-3.5">
                      <div className="w-8 h-8 rounded-lg bg-[var(--color-accento-claro)] flex items-center justify-center shrink-0">
                        <svg viewBox="0 0 24 24" fill="none" strokeWidth="1.8" className="w-4 h-4 stroke-[var(--color-accento)]">
                          <circle cx="12" cy="8" r="4" /><path d="M4 21c0-4 4-6 8-6s8 2 8 6" />
                        </svg>
                      </div>
                      <div className="flex-1">
                        <div className="text-[13px] font-semibold text-ink-900">Lote de GoTrace {datosTornaguia.loteGoTraceNumero}</div>
                        <div className="text-[11px] text-ink-600">{datosTornaguia.loteGoTraceProducto} (no editable)</div>
                      </div>
                    </div>
                  )}
                </>
              )}
              {esSycTrace && (
                <div className="flex items-center gap-3 bg-paper border border-line rounded-xl px-3.5 py-3">
                  <div className="w-8 h-8 rounded-lg bg-[var(--color-accento-claro)] flex items-center justify-center shrink-0">
                    <svg viewBox="0 0 24 24" fill="none" strokeWidth="1.8" className="w-4 h-4 stroke-[var(--color-accento)]">
                      <rect x="4" y="4" width="16" height="16" rx="2" /><path d="M8 12l2.5 2.5L16 9" />
                    </svg>
                  </div>
                  <div className="flex-1">
                    <div className="text-[13px] font-semibold text-ink-900">{datosEstampilla.empresaNombre}</div>
                    <div className="text-[11px] text-ink-600">
                      NIT {datosEstampilla.empresaNit} · Tornaguía Infoconsumo #{datosEstampilla.solicitudInfoconsumoNumero} (no editable)
                    </div>
                  </div>
                </div>
              )}
              {esGoTrace && empresaGoTrace && (
                <div className="flex items-center gap-3 bg-paper border border-line rounded-xl px-3.5 py-3">
                  <div className="w-8 h-8 rounded-lg bg-[var(--color-accento-claro)] flex items-center justify-center shrink-0">
                    <svg viewBox="0 0 24 24" fill="none" strokeWidth="1.8" className="w-4 h-4 stroke-[var(--color-accento)]">
                      <circle cx="12" cy="8" r="4" /><path d="M4 21c0-4 4-6 8-6s8 2 8 6" />
                    </svg>
                  </div>
                  <div className="flex-1">
                    <div className="text-[13px] font-semibold text-ink-900">{empresaGoTrace.nombre}</div>
                    <div className="text-[11px] text-ink-600">NIT {empresaGoTrace.nit} (no editable)</div>
                  </div>
                </div>
              )}
              {esPasivosLaborales && empresaPasivosLaborales && (
                <div className="flex items-center gap-3 bg-paper border border-line rounded-xl px-3.5 py-3">
                  <div className="w-8 h-8 rounded-lg bg-[var(--color-accento-claro)] flex items-center justify-center shrink-0">
                    <svg viewBox="0 0 24 24" fill="none" strokeWidth="1.8" className="w-4 h-4 stroke-[var(--color-accento)]">
                      <path d="M4 21V7l8-4 8 4v14" /><path d="M9 21v-6h6v6" />
                    </svg>
                  </div>
                  <div className="flex-1">
                    <div className="text-[13px] font-semibold text-ink-900">{empresaPasivosLaborales.nombre}</div>
                    <div className="text-[11px] text-ink-600">NIT {empresaPasivosLaborales.nit} (no editable)</div>
                  </div>
                </div>
              )}
              {!esSycTrace && !esGoTrace && (
                <select
                  value={tipoSolicitudId ?? ''}
                  onChange={(e) => setTipoSolicitudId(e.target.value ? Number(e.target.value) : null)}
                  className="w-full py-2.5 px-3 border-[1.5px] border-line rounded-[9px] text-[13px] outline-none focus:border-blue-500 mt-3.5"
                >
                  {tipos.map((t) => <option key={t.id} value={t.id}>{t.nombre}</option>)}
                </select>
              )}
              {esInfoconsumo && estadoTornaguia && estadoTornaguia !== 'Elaborada' && (
                <p className="text-[11px] text-amber-700 bg-amber-50 border border-amber-200 rounded-lg px-3 py-2 mt-3">
                  Esta tornaguía ya está en estado <b>{estadoTornaguia}</b> — edítala con cuidado, los cambios no revierten lo ya expedido/legalizado.
                </p>
              )}
            </div>

            {esInfoconsumo ? (
              <FormularioTornaguia value={datosTornaguia} onChange={setDatosTornaguia} />
            ) : esSycTrace ? (
              <FormularioEstampilla value={datosEstampilla} onChange={setDatosEstampilla} />
            ) : esGoTrace ? (
              <FormularioLoteGoTrace value={datosLoteGoTrace} onChange={setDatosLoteGoTrace} />
            ) : esPasivosLaborales ? (
              <FormularioInstrumentoPasivo
                value={datosInstrumentoPasivo}
                onChange={setDatosInstrumentoPasivo}
                tipoTramiteNombre={tipoTramiteSeleccionado || TIPO_CONSULTA_EXPEDIENTE}
              />
            ) : (
              <div className="bg-white border border-line rounded-[14px] p-5 mb-5">
                <h3 className="font-display text-[13.5px] font-semibold text-ink-900 mb-4">Datos del contrato</h3>
                <FormularioDatosContrato value={datosContrato} onChange={setDatosContrato} />
              </div>
            )}

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
