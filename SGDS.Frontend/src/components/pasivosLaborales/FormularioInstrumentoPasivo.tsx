import {
  TIPO_CONSULTA_EXPEDIENTE,
  REGIMENES_PENSIONALES,
  instrumentosPorTipo,
  type DatosInstrumentoPasivo,
} from '../../config/pasivosLaboralesConfig';
import BuscadorSolicitudColpensiones from './BuscadorSolicitudColpensiones';

const inputClase = 'w-full py-2.5 px-3 border-[1.5px] border-line rounded-[9px] text-[13px] outline-none focus:border-blue-500';
const labelClase = 'block text-xs font-semibold text-ink-900 mb-1.5';

interface Props {
  value: DatosInstrumentoPasivo;
  onChange: (siguiente: DatosInstrumentoPasivo) => void;
  tipoTramiteNombre: string;
}

export default function FormularioInstrumentoPasivo({ value, onChange, tipoTramiteNombre }: Props) {
  function set<K extends keyof DatosInstrumentoPasivo>(clave: K, v: DatosInstrumentoPasivo[K]) {
    onChange({ ...value, [clave]: v });
  }

  const esConsultaExpediente = tipoTramiteNombre === TIPO_CONSULTA_EXPEDIENTE;
  const instrumentos = instrumentosPorTipo(tipoTramiteNombre);
  const esCuotaParte = value.instrumento === 'CuotaParte';

  if (esConsultaExpediente) {
    return (
      <div className="bg-white border border-line rounded-[14px] p-5 mb-5">
        <h3 className="font-display text-[13.5px] font-semibold text-ink-900 mb-4">3. Consulta de expediente digital</h3>
        <p className="text-[12.5px] text-ink-600 bg-paper rounded-lg px-3.5 py-3 mb-3.5">
          Este trámite es de solo lectura y auditoría — no genera cálculos ni afecta pasivos. Consulta el histórico de
          documentos escaneados del afiliado en el expediente digital.
        </p>
        <div>
          <label className={labelClase}>Observaciones <span className="font-normal text-ink-400">(opcional)</span></label>
          <textarea
            value={value.observaciones}
            onChange={(e) => set('observaciones', e.target.value)}
            rows={3}
            placeholder="Motivo de la consulta"
            className={`${inputClase} resize-none`}
          />
        </div>
      </div>
    );
  }

  return (
    <>
      <div className="bg-white border border-line rounded-[14px] p-5 mb-5">
        <h3 className="font-display text-[13.5px] font-semibold text-ink-900 mb-4">3. Servidor o pensionado</h3>

        <BuscadorSolicitudColpensiones value={value} onChange={onChange} />

        <div className="grid grid-cols-2 gap-4 mb-3.5">
          <div>
            <label className={labelClase}>Nombre completo</label>
            <input value={value.servidorNombre} onChange={(e) => set('servidorNombre', e.target.value)} placeholder="Hernán Ortiz Cala" className={inputClase} />
          </div>
          <div>
            <label className={labelClase}>Documento</label>
            <input value={value.servidorDocumento} onChange={(e) => set('servidorDocumento', e.target.value)} placeholder="CC 13.456.789" className={inputClase} />
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className={labelClase}>Régimen pensional</label>
            <select value={value.regimenPensional} onChange={(e) => set('regimenPensional', e.target.value)} className={inputClase}>
              {REGIMENES_PENSIONALES.map((r) => <option key={r} value={r}>{r}</option>)}
            </select>
          </div>
          <div>
            <label className={labelClase}>Instrumento</label>
            <select value={value.instrumento} onChange={(e) => set('instrumento', e.target.value)} className={inputClase}>
              <option value="">Selecciona un instrumento</option>
              {instrumentos.map((i) => <option key={i.value} value={i.value}>{i.label}</option>)}
            </select>
          </div>
        </div>
      </div>

      <div className="bg-white border border-line rounded-[14px] p-5 mb-5">
        <h3 className="font-display text-[13.5px] font-semibold text-ink-900 mb-4">4. Tiempo laborado y liquidación</h3>

        <label className={labelClase}>Tiempo laborado en la entidad</label>
        <div className="grid grid-cols-2 gap-4 mb-3.5">
          <input
            type="number" min={0}
            value={value.tiempoLaboradoAnios}
            onChange={(e) => set('tiempoLaboradoAnios', e.target.value)}
            placeholder="Años"
            className={inputClase}
          />
          <input
            type="number" min={0} max={11}
            value={value.tiempoLaboradoMesesAdicionales}
            onChange={(e) => set('tiempoLaboradoMesesAdicionales', e.target.value)}
            placeholder="Meses"
            className={inputClase}
          />
        </div>

        {esCuotaParte && (
          <>
            <label className={labelClase}>
              Tiempo total de aportes del servidor <span className="font-normal text-ink-400">(toda su carrera — necesario para el % de concurrencia)</span>
            </label>
            <div className="grid grid-cols-2 gap-4 mb-3.5">
              <input
                type="number" min={0}
                value={value.tiempoTotalAportesAnios}
                onChange={(e) => set('tiempoTotalAportesAnios', e.target.value)}
                placeholder="Años"
                className={inputClase}
              />
              <input
                type="number" min={0} max={11}
                value={value.tiempoTotalAportesMesesAdicionales}
                onChange={(e) => set('tiempoTotalAportesMesesAdicionales', e.target.value)}
                placeholder="Meses"
                className={inputClase}
              />
            </div>
          </>
        )}

        <div className="mb-3.5">
          <label className={labelClase}>Valor de la mesada pensional</label>
          <input
            type="number" min={0}
            value={value.valorMesadaPensional}
            onChange={(e) => set('valorMesadaPensional', e.target.value)}
            placeholder="$ 0"
            className={inputClase}
          />
        </div>

        <div>
          <label className={labelClase}>Observaciones <span className="font-normal text-ink-400">(opcional)</span></label>
          <textarea
            value={value.observaciones}
            onChange={(e) => set('observaciones', e.target.value)}
            rows={2}
            placeholder="Información adicional relevante para el trámite"
            className={`${inputClase} resize-none`}
          />
        </div>
      </div>
    </>
  );
}
