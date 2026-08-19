import {
  MUNICIPIOS_SANTANDER,
  TIPOS_ENTIDAD_ESTAMPILLAS,
  REGIMENES_CONTRATISTA,
  TIPOS_CONTRATO_ESTAMPILLAS,
  FUENTES_RECURSOS_ESTAMPILLAS,
  type DatosContratoEstampillas,
} from '../../config/estampillasConfig';

const inputClase = 'w-full py-2.5 px-3 border-[1.5px] border-line rounded-[9px] text-[13px] outline-none focus:border-blue-500';
const labelClase = 'block text-xs font-semibold text-ink-900 mb-1.5';

interface Props {
  value: DatosContratoEstampillas;
  onChange: (siguiente: DatosContratoEstampillas) => void;
}

export default function FormularioDatosContrato({ value, onChange }: Props) {
  function set<K extends keyof DatosContratoEstampillas>(clave: K, v: DatosContratoEstampillas[K]) {
    onChange({ ...value, [clave]: v });
  }

  return (
    <div className="flex flex-col gap-3.5">
      <div>
        <label className={labelClase}>Objeto del contrato</label>
        <input
          value={value.objetoContrato}
          onChange={(e) => set('objetoContrato', e.target.value)}
          placeholder="Mejoramiento vía terciaria Girón–Lebrija"
          className={inputClase}
        />
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className={labelClase}>Valor total del contrato</label>
          <input
            type="number"
            value={value.valorContratoBruto}
            onChange={(e) => set('valorContratoBruto', e.target.value)}
            placeholder="$ 0"
            className={inputClase}
          />
        </div>
        <div>
          <label className={labelClase}>Fecha de suscripción</label>
          <input
            type="date"
            value={value.fechaSuscripcion}
            onChange={(e) => set('fechaSuscripcion', e.target.value)}
            className={inputClase}
          />
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4 items-end">
        <label className="flex items-center gap-2.5 border border-line rounded-[9px] px-3.5 py-2.5 cursor-pointer h-[42px]">
          <input
            type="checkbox"
            checked={value.incluyeIva}
            onChange={(e) => set('incluyeIva', e.target.checked)}
            className="accent-[var(--color-accento)] w-4 h-4"
          />
          <span className="text-[13px] text-ink-900">¿El valor incluye IVA?</span>
        </label>
        <div>
          <label className={labelClase}>Tarifa de IVA (%)</label>
          <input
            type="number"
            value={value.tarifaIva}
            onChange={(e) => set('tarifaIva', e.target.value)}
            disabled={!value.incluyeIva}
            placeholder="19"
            className={`${inputClase} disabled:bg-paper disabled:text-ink-400`}
          />
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className={labelClase}>Tipo de entidad</label>
          <select value={value.tipoEntidad} onChange={(e) => set('tipoEntidad', e.target.value)} className={inputClase}>
            {TIPOS_ENTIDAD_ESTAMPILLAS.map((t) => <option key={t.value} value={t.value}>{t.label}</option>)}
          </select>
        </div>
        <div>
          <label className={labelClase}>Régimen del contratista</label>
          <select value={value.regimenContratista} onChange={(e) => set('regimenContratista', e.target.value)} className={inputClase}>
            {REGIMENES_CONTRATISTA.map((r) => <option key={r.value} value={r.value}>{r.label}</option>)}
          </select>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className={labelClase}>Tipo de contrato</label>
          <select value={value.tipoContrato} onChange={(e) => set('tipoContrato', e.target.value)} className={inputClase}>
            {TIPOS_CONTRATO_ESTAMPILLAS.map((t) => <option key={t.value} value={t.value}>{t.label}</option>)}
          </select>
        </div>
        <div>
          <label className={labelClase}>Fuente de los recursos</label>
          <select value={value.fuenteRecursos} onChange={(e) => set('fuenteRecursos', e.target.value)} className={inputClase}>
            {FUENTES_RECURSOS_ESTAMPILLAS.map((f) => <option key={f.value} value={f.value}>{f.label}</option>)}
          </select>
        </div>
      </div>

      <div>
        <label className={labelClase}>Municipio</label>
        <select value={value.municipio} onChange={(e) => set('municipio', e.target.value)} className={inputClase}>
          {MUNICIPIOS_SANTANDER.map((m) => <option key={m} value={m}>{m}</option>)}
        </select>
        <p className="text-[11px] text-ink-400 mt-1.5">Departamento: <b className="text-ink-900">Santander</b> — único departamento habilitado en este piloto.</p>
      </div>
    </div>
  );
}
