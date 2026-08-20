import { DEPARTAMENTOS_COLOMBIA } from '../../config/geografiaColombia';
import type { DatosTornaguia } from '../../config/infoconsumoConfig';

const inputClase = 'w-full py-2.5 px-3 border-[1.5px] border-line rounded-[9px] text-[13px] outline-none focus:border-blue-500';
const labelClase = 'block text-xs font-semibold text-ink-900 mb-1.5';

interface Props {
  value: DatosTornaguia;
  onChange: (siguiente: DatosTornaguia) => void;
  errorCoherencia?: string | null;
}

export default function CamposOrigenDestino({ value, onChange, errorCoherencia }: Props) {
  function set<K extends keyof DatosTornaguia>(clave: K, v: DatosTornaguia[K]) {
    onChange({ ...value, [clave]: v });
  }

  return (
    <div className="mb-4">
      <div className="grid grid-cols-2 gap-4 mb-3.5">
        <div>
          <label className={labelClase}>Departamento de origen</label>
          <select value={value.departamentoOrigen} onChange={(e) => set('departamentoOrigen', e.target.value)} className={inputClase}>
            {DEPARTAMENTOS_COLOMBIA.map((d) => <option key={d} value={d}>{d}</option>)}
          </select>
        </div>
        <div>
          <label className={labelClase}>Municipio de origen</label>
          <input value={value.municipioOrigen} onChange={(e) => set('municipioOrigen', e.target.value)} placeholder="Ej: Zipaquirá" className={inputClase} />
        </div>
      </div>
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className={labelClase}>Departamento de destino</label>
          <select value={value.departamentoDestino} onChange={(e) => set('departamentoDestino', e.target.value)} className={inputClase}>
            {DEPARTAMENTOS_COLOMBIA.map((d) => <option key={d} value={d}>{d}</option>)}
          </select>
        </div>
        <div>
          <label className={labelClase}>Municipio de destino</label>
          <input value={value.municipioDestino} onChange={(e) => set('municipioDestino', e.target.value)} placeholder="Ej: Bucaramanga" className={inputClase} />
        </div>
      </div>

      {errorCoherencia && (
        <div className="text-[12px] text-red-600 bg-red-50 border border-red-200 rounded-lg px-3 py-2 mt-3.5">{errorCoherencia}</div>
      )}
    </div>
  );
}
