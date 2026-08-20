import { PUNTOS_CONTROL_GOTRACE, type DatosLoteGoTrace } from '../../config/gotraceConfig';

const inputClase = 'w-full py-2.5 px-3 border-[1.5px] border-line rounded-[9px] text-[13px] outline-none focus:border-blue-500';
const labelClase = 'block text-xs font-semibold text-ink-900 mb-1.5';

interface Props {
  value: DatosLoteGoTrace;
  onChange: (siguiente: DatosLoteGoTrace) => void;
}

export default function FormularioLoteGoTrace({ value, onChange }: Props) {
  function set<K extends keyof DatosLoteGoTrace>(clave: K, v: DatosLoteGoTrace[K]) {
    onChange({ ...value, [clave]: v });
  }

  function toggleCheckpoint(nombre: string) {
    const activo = value.puntosControlHabilitados.includes(nombre);
    set(
      'puntosControlHabilitados',
      activo ? value.puntosControlHabilitados.filter((p) => p !== nombre) : [...value.puntosControlHabilitados, nombre]
    );
  }

  const uidFinal = value.cantidadUids && value.uidInicial
    ? Number(value.uidInicial) + Number(value.cantidadUids) - 1
    : null;

  return (
    <>
      <div className="bg-white border border-line rounded-[14px] p-5 mb-5">
        <h3 className="font-display text-[13.5px] font-semibold text-ink-900 mb-4">3. Datos del lote</h3>
        <div className="grid grid-cols-2 gap-4 mb-3.5">
          <div>
            <label className={labelClase}>Producto</label>
            <input value={value.producto} onChange={(e) => set('producto', e.target.value)} placeholder="Cerveza artesanal IPA" className={inputClase} />
          </div>
          <div>
            <label className={labelClase}>Número de lote</label>
            <input value={value.numeroLote} onChange={(e) => set('numeroLote', e.target.value)} placeholder="LT-2026-04521" className={inputClase} />
          </div>
        </div>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className={labelClase}>Fecha de producción</label>
            <input type="date" value={value.fechaProduccion} onChange={(e) => set('fechaProduccion', e.target.value)} className={inputClase} />
          </div>
          <div>
            <label className={labelClase}>Unidades del lote</label>
            <input type="number" value={value.unidadesLote} onChange={(e) => set('unidadesLote', e.target.value)} placeholder="12000" className={inputClase} />
          </div>
        </div>
      </div>

      <div className="bg-white border border-line rounded-[14px] p-5 mb-5">
        <h3 className="font-display text-[13.5px] font-semibold text-ink-900 mb-1">Rango de UIDs <span className="font-normal text-ink-400">(opcional)</span></h3>
        <p className="text-[11.5px] text-ink-400 mb-3.5">Códigos de identificación única impresos por láser/inyección de tinta en fábrica sobre cada botella.</p>
        <div className="grid grid-cols-3 gap-4">
          <div>
            <label className={labelClase}>Prefijo</label>
            <input value={value.prefijoUid} onChange={(e) => set('prefijoUid', e.target.value)} placeholder="GT26-LT04521" className={inputClase} />
          </div>
          <div>
            <label className={labelClase}>Cantidad</label>
            <input type="number" value={value.cantidadUids} onChange={(e) => set('cantidadUids', e.target.value)} placeholder="12000" className={inputClase} />
          </div>
          <div>
            <label className={labelClase}>UID inicial</label>
            <input type="number" value={value.uidInicial} onChange={(e) => set('uidInicial', e.target.value)} placeholder="1" className={inputClase} />
          </div>
        </div>
        {uidFinal != null && (
          <p className="text-[11px] text-ink-400 mt-2">UID final calculado: {value.prefijoUid}-{String(uidFinal).padStart(5, '0')}</p>
        )}
      </div>

      <div className="bg-white border border-line rounded-[14px] p-5 mb-5">
        <h3 className="font-display text-[13.5px] font-semibold text-ink-900 mb-4">4. Puntos de control a habilitar</h3>
        <div className="grid grid-cols-2 gap-2.5">
          {PUNTOS_CONTROL_GOTRACE.map((p) => (
            <label
              key={p}
              className={`flex items-center gap-2.5 border-[1.5px] rounded-xl px-3.5 py-2.5 cursor-pointer ${
                value.puntosControlHabilitados.includes(p) ? 'border-[var(--color-accento)] bg-[var(--color-accento-claro)]' : 'border-line'
              }`}
            >
              <input
                type="checkbox"
                checked={value.puntosControlHabilitados.includes(p)}
                onChange={() => toggleCheckpoint(p)}
                className="accent-[var(--color-accento)] w-4 h-4"
              />
              <span className="text-[13px] font-semibold text-ink-900">{p}</span>
            </label>
          ))}
        </div>
      </div>
    </>
  );
}
