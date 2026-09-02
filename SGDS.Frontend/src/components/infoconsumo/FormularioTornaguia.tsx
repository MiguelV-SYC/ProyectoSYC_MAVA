import {
  CATEGORIAS_PRODUCTO_INFOCONSUMO, SUBCATEGORIAS_SIN_CALCULO, subcategoriasDe,
  usaGradoAlcohol, usaOrigenNacionalImportado, usaPesoGramos, usaDatosImportacion,
  type DatosTornaguia,
} from '../../config/infoconsumoConfig';
import SelectorTipoVehiculo from './SelectorTipoVehiculo';

const inputClase = 'w-full py-2.5 px-3 border-[1.5px] border-line rounded-[9px] text-[13px] outline-none focus:border-blue-500';
const inputSoloLecturaClase = 'w-full py-2.5 px-3 border-[1.5px] border-line rounded-[9px] text-[13px] outline-none bg-paper text-ink-600';
const labelClase = 'block text-xs font-semibold text-ink-900 mb-1.5';

interface Props {
  value: DatosTornaguia;
  onChange: (siguiente: DatosTornaguia) => void;
}

export default function FormularioTornaguia({ value, onChange }: Props) {
  function set<K extends keyof DatosTornaguia>(clave: K, v: DatosTornaguia[K]) {
    onChange({ ...value, [clave]: v });
  }

  const soloLectura = value.datosDesdeGoTrace;
  const claseCampo = soloLectura ? inputSoloLecturaClase : inputClase;
  const subcategorias = subcategoriasDe(value.categoriaProducto);
  const sinCalculo = SUBCATEGORIAS_SIN_CALCULO.includes(value.subcategoriaProducto);

  // El lote de GoTrace puede apuntar a un producto registrado antes de esta taxonomía (Tipo
  // en texto libre que no es ninguna de las 3 categorías de ley) — BuscadorLoteGoTrace deja
  // categoriaProducto en blanco y clasificacionSinReconocer=true en ese caso. Si se bloqueara
  // igual que el resto de campos heredados, el usuario quedaría con un select deshabilitado
  // sin poder elegir nada. clasificacionSinReconocer se fija una sola vez al vincular el lote,
  // no se recalcula sobre categoriaProducto, para no volver a bloquear el select en cuanto el
  // usuario elige una categoría manualmente.
  const clasificacionSinHeredar = soloLectura && value.clasificacionSinReconocer;
  const claseCampoClasificacion = clasificacionSinHeredar ? inputClase : claseCampo;

  function elegirCategoria(categoriaProducto: string) {
    onChange({
      ...value,
      categoriaProducto,
      subcategoriaProducto: '',
      origenProducto: '',
      pesoGramos: '',
      valorAduana: '',
      gravamenesArancelarios: '',
      gradosAlcoholimetricos: '',
    });
  }

  return (
    <>
      <div className="bg-white border border-line rounded-[14px] p-5 mb-5">
        <h3 className="font-display text-[13.5px] font-semibold text-ink-900 mb-4">3. Producto gravado</h3>

        {soloLectura && !clasificacionSinHeredar && (
          <div className="p-3 bg-[var(--color-accento-claro)] border border-[var(--color-accento)] rounded-lg text-[12.5px] font-medium mb-3.5" style={{ color: 'var(--color-accento)' }}>
            Datos heredados del lote de GoTrace vinculado — solo el PVP certificado queda para diligenciar a mano.
          </div>
        )}
        {clasificacionSinHeredar && (
          <div className="p-3 bg-amber-50 border border-amber-200 rounded-lg text-amber-800 text-[12.5px] font-medium mb-3.5">
            El producto de este lote de GoTrace no tiene una categoría/subcategoría reconocida en las 3 categorías vigentes
            del impuesto al consumo — probablemente se registró antes de esta actualización. Selecciónala manualmente aquí;
            el número de lote y las unidades sí quedaron heredados.
          </div>
        )}

        <div className="grid grid-cols-2 gap-4 mb-3.5">
          <div>
            <label className={labelClase}>Categoría del producto</label>
            <select
              value={value.categoriaProducto}
              onChange={(e) => elegirCategoria(e.target.value)}
              disabled={soloLectura && !clasificacionSinHeredar}
              className={claseCampoClasificacion}
            >
              <option value="">Selecciona una categoría</option>
              {CATEGORIAS_PRODUCTO_INFOCONSUMO.map((c) => <option key={c.categoria} value={c.categoria}>{c.categoria}</option>)}
            </select>
          </div>
          <div>
            <label className={labelClase}>Subcategoría del producto</label>
            <select
              value={value.subcategoriaProducto}
              onChange={(e) => set('subcategoriaProducto', e.target.value)}
              disabled={(soloLectura && !clasificacionSinHeredar) || !value.categoriaProducto}
              className={claseCampoClasificacion}
            >
              <option value="">{value.categoriaProducto ? 'Selecciona una subcategoría' : 'Elige primero la categoría'}</option>
              {subcategorias.map((s) => <option key={s} value={s}>{s}</option>)}
            </select>
          </div>
        </div>

        {sinCalculo && (
          <div className="p-3 bg-amber-50 border border-amber-200 rounded-lg text-amber-800 text-[12.5px] font-medium mb-3.5">
            ⚠️ Subcategoría no soportada por el motor de liquidación en esta fase.
            <p className="text-[11px] text-amber-600 mt-1 font-normal">
              Los sistemas electrónicos de vapeo están sujetos a verificación normativa (Sentencia C-079 de 2026) —
              la solicitud se puede radicar igual, pero la preliquidación mostrará "categoría no soportada".
            </p>
          </div>
        )}

        <div className="grid grid-cols-2 gap-4 mb-3.5">
          <div>
            <label className={labelClase}>Número de lote {!soloLectura && <span className="font-normal text-ink-400">(opcional)</span>}</label>
            <input
              value={value.numeroLote}
              onChange={(e) => set('numeroLote', e.target.value)}
              disabled={soloLectura}
              placeholder="GT-CERVEZ-20260902-001"
              className={claseCampo}
            />
          </div>
          {usaGradoAlcohol(value.subcategoriaProducto) && (
            <div>
              <label className={labelClase}>Grados alcoholimétricos</label>
              <input
                type="number"
                value={value.gradosAlcoholimetricos}
                onChange={(e) => set('gradosAlcoholimetricos', e.target.value)}
                disabled={soloLectura && !clasificacionSinHeredar}
                placeholder="35"
                className={claseCampoClasificacion}
              />
            </div>
          )}
          {usaOrigenNacionalImportado(value.subcategoriaProducto) && (
            <div>
              <label className={labelClase}>Origen</label>
              <select
                value={value.origenProducto}
                onChange={(e) => set('origenProducto', e.target.value)}
                disabled={soloLectura && !clasificacionSinHeredar}
                className={claseCampoClasificacion}
              >
                <option value="">Selecciona el origen</option>
                <option value="Nacional">Nacional</option>
                <option value="Importado">Importado</option>
              </select>
            </div>
          )}
        </div>

        <div className="grid grid-cols-2 gap-4 mb-3.5">
          {usaPesoGramos(value.subcategoriaProducto) ? (
            <div>
              <label className={labelClase}>Peso total (gramos)</label>
              <input
                type="number"
                value={value.pesoGramos}
                onChange={(e) => set('pesoGramos', e.target.value)}
                disabled={soloLectura && !clasificacionSinHeredar}
                placeholder="5000"
                className={claseCampoClasificacion}
              />
            </div>
          ) : (
            <div>
              <label className={labelClase}>Unidades físicas</label>
              <input
                type="number"
                value={value.unidadesFisicas}
                onChange={(e) => set('unidadesFisicas', e.target.value)}
                disabled={soloLectura}
                placeholder="5760"
                className={claseCampo}
              />
              {usaGradoAlcohol(value.subcategoriaProducto) && (
                <p className="text-[11px] text-ink-400 mt-1.5">
                  Volumen total (a envase estándar de 750 cc): {value.unidadesFisicas ? (Number(value.unidadesFisicas) * 750).toLocaleString('es-CO') : '0'} cc
                </p>
              )}
            </div>
          )}
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

        {usaDatosImportacion(value.subcategoriaProducto) && (
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className={labelClase}>Valor en aduana</label>
              <input
                type="number"
                value={value.valorAduana}
                onChange={(e) => set('valorAduana', e.target.value)}
                disabled={soloLectura && !clasificacionSinHeredar}
                placeholder="$ 0"
                className={claseCampoClasificacion}
              />
            </div>
            <div>
              <label className={labelClase}>Gravámenes arancelarios</label>
              <input
                type="number"
                value={value.gravamenesArancelarios}
                onChange={(e) => set('gravamenesArancelarios', e.target.value)}
                disabled={soloLectura && !clasificacionSinHeredar}
                placeholder="$ 0"
                className={claseCampoClasificacion}
              />
              <p className="text-[11px] text-ink-400 mt-1.5">Base = (valor en aduana + gravámenes) + 30% de margen comercial.</p>
            </div>
          </div>
        )}
      </div>

      <div className="bg-white border border-line rounded-[14px] p-5 mb-5">
        <h3 className="font-display text-[13.5px] font-semibold text-ink-900 mb-4">4. Movilización</h3>
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
            <label className={labelClase}>Tipo de vehículo</label>
            <SelectorTipoVehiculo value={value.tipoVehiculo} onChange={(tipoVehiculo) => set('tipoVehiculo', tipoVehiculo)} />
          </div>
          <div>
            <label className={labelClase}>Placa del vehículo</label>
            <input value={value.placaVehiculo} onChange={(e) => set('placaVehiculo', e.target.value.toUpperCase())} placeholder="SLK-204" className={inputClase} />
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
