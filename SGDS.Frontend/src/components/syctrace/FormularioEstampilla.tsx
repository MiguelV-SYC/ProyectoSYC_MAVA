import { CATEGORIAS_PRODUCTO_SYCTRACE, CATEGORIA_SIN_ESTAMPILLA_FISICA, ORIGENES_PRODUCTO_SYCTRACE, type DatosEstampilla } from '../../config/syctraceConfig';

const inputClase = 'w-full py-2.5 px-3 border-[1.5px] border-line rounded-[9px] text-[13px] outline-none focus:border-blue-500';
const labelClase = 'block text-xs font-semibold text-ink-900 mb-1.5';

interface Props {
  value: DatosEstampilla;
  onChange: (siguiente: DatosEstampilla) => void;
}

export default function FormularioEstampilla({ value, onChange }: Props) {
  function set<K extends keyof DatosEstampilla>(clave: K, v: DatosEstampilla[K]) {
    onChange({ ...value, [clave]: v });
  }

  const esLicorVino = value.categoriaProducto === 'Licores_Destilados' || value.categoriaProducto === 'Vinos_Fermentados';
  const esCigarrillos = value.categoriaProducto === 'Tabaco_Cigarrillos';
  const codigoFinal = value.cantidadEstampillas && value.codigoInicial
    ? Number(value.codigoInicial) + Number(value.cantidadEstampillas) - 1
    : null;

  return (
    <>
      <div className="bg-white border border-line rounded-[14px] p-5 mb-5">
        <h3 className="font-display text-[13.5px] font-semibold text-ink-900 mb-4">3. Producto</h3>
        <div className="grid grid-cols-2 gap-4 mb-3.5">
          <div>
            <label className={labelClase}>Categoría del producto</label>
            <select value={value.categoriaProducto} onChange={(e) => set('categoriaProducto', e.target.value)} className={inputClase}>
              {CATEGORIAS_PRODUCTO_SYCTRACE.map((c) => <option key={c.value} value={c.value}>{c.label}</option>)}
            </select>
          </div>
          <div>
            <label className={labelClase}>Marca <span className="font-normal text-ink-400">(opcional)</span></label>
            <input value={value.marca} onChange={(e) => set('marca', e.target.value)} placeholder="Ej: Ron Añejo Reserva" className={inputClase} />
          </div>
        </div>

        {value.categoriaProducto === CATEGORIA_SIN_ESTAMPILLA_FISICA && (
          <div className="p-3 bg-amber-50 border border-amber-200 rounded-lg text-amber-800 text-[12.5px] font-medium mb-3.5">
            ⚠️ Cervezas, sifones y refajos no están sujetos a estampilla de señalización física en este flujo.
            <p className="text-[11px] text-amber-600 mt-1 font-normal">
              Solo requieren declaración remota de impuesto al consumo — esta solicitud no se puede radicar para esta categoría.
            </p>
          </div>
        )}

        <div className="mb-3.5">
          <label className={labelClase}>Nombre comercial del producto</label>
          <input value={value.nombreProducto} onChange={(e) => set('nombreProducto', e.target.value)} placeholder="Ej: Ron Añejo Reserva 8 años" className={inputClase} />
        </div>

        {esLicorVino && (
          <div className="grid grid-cols-2 gap-4 mb-3.5">
            <div>
              <label className={labelClase}>Grado alcoholimétrico</label>
              <input type="number" value={value.gradoAlcoholimetrico} onChange={(e) => set('gradoAlcoholimetrico', e.target.value)} placeholder="35" className={inputClase} />
            </div>
            <div>
              <label className={labelClase}>Contenido neto (cc)</label>
              <input type="number" value={value.contenidoNetoCc} onChange={(e) => set('contenidoNetoCc', e.target.value)} placeholder="750" className={inputClase} />
            </div>
          </div>
        )}

        {esCigarrillos && (
          <div className="mb-3.5">
            <label className={labelClase}>Unidades por cajetilla</label>
            <input type="number" value={value.unidadesPorCajetilla} onChange={(e) => set('unidadesPorCajetilla', e.target.value)} placeholder="20" className={inputClase} />
          </div>
        )}

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className={labelClase}>Registro sanitario INVIMA</label>
            <input value={value.registroInvima} onChange={(e) => set('registroInvima', e.target.value)} placeholder="RSAB12345678" className={inputClase} />
          </div>
          <div>
            <label className={labelClase}>Lote de producción</label>
            <input value={value.loteProduccion} onChange={(e) => set('loteProduccion', e.target.value)} placeholder="L2026-0342" className={inputClase} />
          </div>
        </div>
      </div>

      <div className="bg-white border border-line rounded-[14px] p-5 mb-5">
        <h3 className="font-display text-[13.5px] font-semibold text-ink-900 mb-4">4. Origen del producto</h3>
        <div className="grid grid-cols-2 gap-2.5 mb-3.5">
          {ORIGENES_PRODUCTO_SYCTRACE.map((o) => (
            <button
              key={o.value}
              type="button"
              onClick={() => set('origenProducto', o.value)}
              className={`border-[1.5px] rounded-xl px-4 py-3 text-[13px] font-semibold text-left ${
                value.origenProducto === o.value ? 'border-[var(--color-accento)] bg-[var(--color-accento-claro)] text-[var(--color-accento)]' : 'border-line text-ink-900'
              }`}
            >
              {o.label}
            </button>
          ))}
        </div>

        {value.origenProducto === 'Nacional' ? (
          <div>
            <label className={labelClase}>Número de Tornaguía de Movilización</label>
            <input value={value.numeroTornaguia} onChange={(e) => set('numeroTornaguia', e.target.value)} placeholder="Expedida por el departamento de origen o la fábrica autorizada" className={inputClase} />
          </div>
        ) : (
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className={labelClase}>Número de Declaración de Importación</label>
              <input value={value.numeroDeclaracionImportacion} onChange={(e) => set('numeroDeclaracionImportacion', e.target.value)} placeholder="DI-2026-004521" className={inputClase} />
            </div>
            <div>
              <label className={labelClase}>Registro de introducción a Santander</label>
              <input value={value.registroIntroduccion} onChange={(e) => set('registroIntroduccion', e.target.value)} placeholder="RI-2026-0033" className={inputClase} />
            </div>
          </div>
        )}
      </div>

      <div className="bg-white border border-line rounded-[14px] p-5 mb-5">
        <h3 className="font-display text-[13.5px] font-semibold text-ink-900 mb-4">5. Rango de expedición</h3>
        <div className="grid grid-cols-2 gap-4 mb-3.5">
          <div>
            <label className={labelClase}>Cantidad a expedir</label>
            <input type="number" value={value.cantidadEstampillas} onChange={(e) => set('cantidadEstampillas', e.target.value)} placeholder="5760" className={inputClase} />
          </div>
          <div>
            <label className={labelClase}>Prefijo del código</label>
            <input value={value.prefijo} onChange={(e) => set('prefijo', e.target.value)} placeholder="ES26-890123" className={inputClase} />
          </div>
        </div>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className={labelClase}>Código inicial</label>
            <input type="number" value={value.codigoInicial} onChange={(e) => set('codigoInicial', e.target.value)} placeholder="350" className={inputClase} />
          </div>
          <div>
            <label className={labelClase}>Código final <span className="font-normal text-ink-400">(calculado)</span></label>
            <input value={codigoFinal ?? ''} disabled placeholder="—" className={`${inputClase} bg-paper text-ink-400`} />
          </div>
        </div>
      </div>
    </>
  );
}
