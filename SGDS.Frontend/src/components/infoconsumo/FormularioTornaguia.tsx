import { CATEGORIAS_PRODUCTO_INFOCONSUMO, type DatosTornaguia } from '../../config/infoconsumoConfig';
import { DEPARTAMENTOS_COLOMBIA } from '../../config/geografiaColombia';

const inputClase = 'w-full py-2.5 px-3 border-[1.5px] border-line rounded-[9px] text-[13px] outline-none focus:border-blue-500';
const labelClase = 'block text-xs font-semibold text-ink-900 mb-1.5';

interface Props {
  value: DatosTornaguia;
  onChange: (siguiente: DatosTornaguia) => void;
  errorCoherencia?: string | null;
}

export default function FormularioTornaguia({ value, onChange, errorCoherencia }: Props) {
  function set<K extends keyof DatosTornaguia>(clave: K, v: DatosTornaguia[K]) {
    onChange({ ...value, [clave]: v });
  }

  return (
    <>
      <div className="bg-white border border-line rounded-[14px] p-5 mb-5">
        <h3 className="font-display text-[13.5px] font-semibold text-ink-900 mb-4">3. Producto gravado</h3>
        <div className="grid grid-cols-2 gap-4 mb-3.5">
          <div>
            <label className={labelClase}>Categoría del producto</label>
            <select value={value.categoriaProducto} onChange={(e) => set('categoriaProducto', e.target.value)} className={inputClase}>
              {CATEGORIAS_PRODUCTO_INFOCONSUMO.map((c) => <option key={c.value} value={c.value}>{c.label}</option>)}
            </select>
          </div>
          <div>
            <label className={labelClase}>
              Grados alcoholimétricos <span className="font-normal text-ink-400">(si aplica)</span>
            </label>
            <input
              type="number"
              value={value.gradosAlcoholimetricos}
              onChange={(e) => set('gradosAlcoholimetricos', e.target.value)}
              placeholder="35"
              className={inputClase}
            />
          </div>
        </div>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className={labelClase}>Unidades físicas (botellas)</label>
            <input
              type="number"
              value={value.unidadesFisicas}
              onChange={(e) => set('unidadesFisicas', e.target.value)}
              placeholder="5760"
              className={inputClase}
            />
            <p className="text-[11px] text-ink-400 mt-1.5">
              Volumen total (a envase estándar de 750 cc): {value.unidadesFisicas ? (Number(value.unidadesFisicas) * 750).toLocaleString('es-CO') : '0'} cc
            </p>
          </div>
          <div>
            <label className={labelClase}>PVP certificado DANE (por unidad)</label>
            <input
              type="number"
              value={value.pvpCertificado}
              onChange={(e) => set('pvpCertificado', e.target.value)}
              placeholder="$ 0"
              className={inputClase}
            />
          </div>
        </div>
      </div>

      <div className="bg-white border border-line rounded-[14px] p-5 mb-5">
        <h3 className="font-display text-[13.5px] font-semibold text-ink-900 mb-4">4. Movilización</h3>
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
        <div className="grid grid-cols-2 gap-4 mb-3.5">
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
          <div className="text-[12px] text-red-600 bg-red-50 border border-red-200 rounded-lg px-3 py-2 mb-3.5">{errorCoherencia}</div>
        )}

        <div className="grid grid-cols-2 gap-4 mb-3.5">
          <div>
            <label className={labelClase}>Empresa transportadora</label>
            <input value={value.empresaTransportadora} onChange={(e) => set('empresaTransportadora', e.target.value)} placeholder="Transportes La Frontera S.A.S" className={inputClase} />
          </div>
          <div>
            <label className={labelClase}>NIT de la transportadora</label>
            <input value={value.nitTransportador} onChange={(e) => set('nitTransportador', e.target.value)} placeholder="900123456" className={inputClase} />
          </div>
        </div>
        <div className="grid grid-cols-2 gap-4 mb-3.5">
          <div>
            <label className={labelClase}>Placa del vehículo</label>
            <input value={value.placaVehiculo} onChange={(e) => set('placaVehiculo', e.target.value.toUpperCase())} placeholder="SLK-204" className={inputClase} />
          </div>
          <div>
            <label className={labelClase}>Tipo de vehículo</label>
            <input value={value.tipoVehiculo} onChange={(e) => set('tipoVehiculo', e.target.value)} placeholder="Camión furgón — 2 ejes" className={inputClase} />
          </div>
        </div>
        <div className="grid grid-cols-2 gap-4 mb-3.5">
          <div>
            <label className={labelClase}>Conductor</label>
            <input value={value.conductor} onChange={(e) => set('conductor', e.target.value)} placeholder="Hernán Duarte Silva" className={inputClase} />
          </div>
          <div>
            <label className={labelClase}>Cédula del conductor</label>
            <input value={value.cedulaConductor} onChange={(e) => set('cedulaConductor', e.target.value)} placeholder="13487902" className={inputClase} />
          </div>
        </div>
        <div>
          <label className={labelClase}>Observaciones <span className="font-normal text-ink-400">(opcional)</span></label>
          <textarea
            value={value.observaciones}
            onChange={(e) => set('observaciones', e.target.value)}
            rows={3}
            placeholder="Información adicional relevante para el trámite"
            className={`${inputClase} resize-none`}
          />
        </div>
      </div>
    </>
  );
}
