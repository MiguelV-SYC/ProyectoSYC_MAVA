import { useEffect } from 'react';
import {
  CATEGORIAS_PRODUCTO_SYCTRACE, CATEGORIA_SIN_ESTAMPILLA_FISICA, ORIGENES_PRODUCTO_SYCTRACE,
  subcategoriasDe, usaPesoGramos, type DatosEstampilla,
} from '../../config/syctraceConfig';
import { getVistaPreviaCodigos } from '../../services/syctraceService';

const inputClase = 'w-full py-2.5 px-3 border-[1.5px] border-line rounded-[9px] text-[13px] outline-none focus:border-blue-500';
const inputSoloLecturaClase = 'w-full py-2.5 px-3 border-[1.5px] border-line rounded-[9px] text-[13px] outline-none bg-paper text-ink-600';
const labelClase = 'block text-xs font-semibold text-ink-900 mb-1.5';

interface Props {
  value: DatosEstampilla;
  onChange: (siguiente: DatosEstampilla) => void;
}

export default function FormularioEstampilla({ value, onChange }: Props) {
  function set<K extends keyof DatosEstampilla>(clave: K, v: DatosEstampilla[K]) {
    onChange({ ...value, [clave]: v });
  }

  const soloLectura = value.datosDesdeInfoconsumo;
  const claseCampo = soloLectura ? inputSoloLecturaClase : inputClase;

  // La tornaguía de Infoconsumo vinculada puede ser de antes de esta unificación de catálogo
  // (categoría en texto libre que ya no existe) — BuscadorTornaguiaInfoconsumo deja
  // categoriaProducto en blanco y clasificacionSinReconocer=true en ese caso. Bloquear igual que
  // el resto de campos heredados dejaría un select vacío y deshabilitado sin poder continuar.
  // clasificacionSinReconocer se fija una sola vez al vincular la tornaguía — a diferencia de
  // categoriaProducto, NO cambia cuando el usuario elige una categoría manualmente, así el
  // select no se vuelve a bloquear apenas se completa.
  const clasificacionSinHeredar = soloLectura && value.clasificacionSinReconocer;
  const claseCampoClasificacion = clasificacionSinHeredar ? inputClase : claseCampo;
  const bloquearClasificacion = soloLectura && !clasificacionSinHeredar;

  const subcategorias = subcategoriasDe(value.categoriaProducto);
  const esLicorVino = value.categoriaProducto === 'Licores, Vinos, Aperitivos y Similares';
  const esCigarrillos = value.categoriaProducto === 'Cigarrillos y Tabaco Elaborado';
  const codigoFinal = value.cantidadEstampillas && value.codigoInicial
    ? Number(value.codigoInicial) + Number(value.cantidadEstampillas) - 1
    : null;

  // Vista previa del RSI y del código de estampilla (Reglas_de_negocio_SYCTrace.md, "LOGICA
  // PARA CREACIÓN DE CODIGO AUTOMÁTICO...") — se recalcula apenas se conoce la categoría (al
  // vincular la tornaguía, o al completarla a mano si es de antes de esta unificación) y cada
  // vez que cambia el origen (Nacional/Importado también determina el prefijo). El valor real
  // se genera de forma independiente en el servidor al radicar — esto es solo una vista previa.
  useEffect(() => {
    if (!value.datosDesdeInfoconsumo || !value.categoriaProducto || value.codigosFijados) return;
    let cancelado = false;
    getVistaPreviaCodigos(value.categoriaProducto, value.origenProducto).then((r) => {
      if (cancelado) return;
      onChange({ ...value, registroInvima: r.registroInvima, prefijo: r.prefijo, codigoInicial: String(r.codigoInicial) });
    });
    return () => {
      cancelado = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [value.datosDesdeInfoconsumo, value.categoriaProducto, value.origenProducto]);

  function elegirCategoria(categoriaProducto: string) {
    onChange({
      ...value,
      categoriaProducto,
      subcategoriaProducto: '',
      gradoAlcoholimetrico: '',
      contenidoNetoCc: '',
      unidadesPorCajetilla: '',
      pesoGramos: '',
    });
  }

  return (
    <>
      <div className="bg-white border border-line rounded-[14px] p-5 mb-5">
        <h3 className="font-display text-[13.5px] font-semibold text-ink-900 mb-4">3. Producto</h3>

        {soloLectura && !clasificacionSinHeredar && (
          <div className="p-3 bg-[var(--color-accento-claro)] border border-[var(--color-accento)] rounded-lg text-[12.5px] font-medium mb-3.5" style={{ color: 'var(--color-accento)' }}>
            Datos heredados de la tornaguía de Infoconsumo vinculada.
          </div>
        )}
        {clasificacionSinHeredar && (
          <div className="p-3 bg-amber-50 border border-amber-200 rounded-lg text-amber-800 text-[12.5px] font-medium mb-3.5">
            El producto de esta tornaguía no tiene una categoría/subcategoría reconocida en el catálogo vigente —
            probablemente se radicó antes de esta actualización. Selecciónala manualmente aquí.
          </div>
        )}

        <div className="grid grid-cols-2 gap-4 mb-3.5">
          <div>
            <label className={labelClase}>Categoría del producto</label>
            <select
              value={value.categoriaProducto}
              onChange={(e) => elegirCategoria(e.target.value)}
              disabled={bloquearClasificacion}
              className={claseCampoClasificacion}
            >
              <option value="">Selecciona una categoría</option>
              {CATEGORIAS_PRODUCTO_SYCTRACE.map((c) => <option key={c.categoria} value={c.categoria}>{c.categoria}</option>)}
            </select>
          </div>
          <div>
            <label className={labelClase}>Subcategoría del producto</label>
            <select
              value={value.subcategoriaProducto}
              onChange={(e) => set('subcategoriaProducto', e.target.value)}
              disabled={bloquearClasificacion || !value.categoriaProducto}
              className={claseCampoClasificacion}
            >
              <option value="">{value.categoriaProducto ? 'Selecciona una subcategoría' : 'Elige primero la categoría'}</option>
              {subcategorias.map((s) => <option key={s} value={s}>{s}</option>)}
            </select>
          </div>
        </div>

        <div className="mb-3.5">
          <label className={labelClase}>Marca <span className="font-normal text-ink-400">(opcional)</span></label>
          <input value={value.marca} onChange={(e) => set('marca', e.target.value)} placeholder="Ej: Ron Añejo Reserva" className={inputClase} />
        </div>

        {value.categoriaProducto === CATEGORIA_SIN_ESTAMPILLA_FISICA && (
          <div className="p-3 bg-amber-50 border border-amber-200 rounded-lg text-amber-800 text-[12.5px] font-medium mb-3.5">
            ⚠️ Cervezas, sifones, refajos y mezclas no están sujetos a estampilla de señalización física en este flujo.
            <p className="text-[11px] text-amber-600 mt-1 font-normal">
              Solo requieren declaración remota de impuesto al consumo — esta solicitud no se puede radicar para esta categoría.
            </p>
          </div>
        )}

        <div className="mb-3.5">
          <label className={labelClase}>Nombre comercial del producto</label>
          <input
            value={value.nombreProducto}
            onChange={(e) => set('nombreProducto', e.target.value)}
            disabled={value.nombreHeredado}
            placeholder="Ej: Ron Añejo Reserva 8 años"
            className={value.nombreHeredado ? inputSoloLecturaClase : inputClase}
          />
        </div>

        {esLicorVino && (
          <div className="grid grid-cols-2 gap-4 mb-3.5">
            <div>
              <label className={labelClase}>Grado alcoholimétrico</label>
              <input
                type="number"
                value={value.gradoAlcoholimetrico}
                onChange={(e) => set('gradoAlcoholimetrico', e.target.value)}
                disabled={bloquearClasificacion}
                placeholder="35"
                className={claseCampoClasificacion}
              />
            </div>
            <div>
              <label className={labelClase}>Contenido neto (cc)</label>
              <input
                type="number"
                value={value.contenidoNetoCc}
                onChange={(e) => set('contenidoNetoCc', e.target.value)}
                disabled={bloquearClasificacion}
                placeholder="750"
                className={claseCampoClasificacion}
              />
            </div>
          </div>
        )}

        {esCigarrillos && (
          <div className="mb-3.5">
            {usaPesoGramos(value.subcategoriaProducto) ? (
              <>
                <label className={labelClase}>Peso total (gramos)</label>
                <input
                  type="number"
                  value={value.pesoGramos}
                  onChange={(e) => set('pesoGramos', e.target.value)}
                  disabled={bloquearClasificacion}
                  placeholder="5000"
                  className={claseCampoClasificacion}
                />
              </>
            ) : (
              <>
                <label className={labelClase}>Unidades por cajetilla</label>
                <input
                  type="number"
                  value={value.unidadesPorCajetilla}
                  onChange={(e) => set('unidadesPorCajetilla', e.target.value)}
                  disabled={bloquearClasificacion}
                  placeholder="20"
                  className={claseCampoClasificacion}
                />
              </>
            )}
          </div>
        )}

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className={labelClase}>Registro sanitario INVIMA <span className="font-normal text-ink-400">(generado)</span></label>
            <input
              value={value.registroInvima}
              disabled
              placeholder={soloLectura ? 'Generando…' : '—'}
              className={inputSoloLecturaClase}
            />
          </div>
          <div>
            <label className={labelClase}>Lote de producción</label>
            <input
              value={value.loteProduccion}
              onChange={(e) => set('loteProduccion', e.target.value)}
              disabled={value.loteHeredado}
              placeholder="L2026-0342"
              className={value.loteHeredado ? inputSoloLecturaClase : inputClase}
            />
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
              disabled={value.origenHeredado}
              className={`border-[1.5px] rounded-xl px-4 py-3 text-[13px] font-semibold text-left ${
                value.origenProducto === o.value ? 'border-[var(--color-accento)] bg-[var(--color-accento-claro)] text-[var(--color-accento)]' : 'border-line text-ink-900'
              } ${value.origenHeredado ? 'opacity-60' : ''}`}
            >
              {o.label}
            </button>
          ))}
        </div>
        {value.origenHeredado && (
          <p className="text-[11px] text-ink-400 -mt-2.5 mb-3.5">Heredado de la tornaguía de Infoconsumo vinculada.</p>
        )}

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
        <p className="text-[11.5px] text-ink-400 mb-3.5">
          Generado automáticamente a partir de la tornaguía vinculada y la lógica de codificación del documento de reglas de negocio.
        </p>
        <div className="grid grid-cols-2 gap-4 mb-3.5">
          <div>
            <label className={labelClase}>Cantidad a expedir <span className="font-normal text-ink-400">(unidades del lote)</span></label>
            <input value={value.cantidadEstampillas} disabled placeholder="—" className={inputSoloLecturaClase} />
          </div>
          <div>
            <label className={labelClase}>Prefijo del código <span className="font-normal text-ink-400">(generado)</span></label>
            <input value={value.prefijo} disabled placeholder={soloLectura ? 'Generando…' : '—'} className={inputSoloLecturaClase} />
          </div>
        </div>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className={labelClase}>Código inicial <span className="font-normal text-ink-400">(generado)</span></label>
            <input value={value.codigoInicial} disabled placeholder={soloLectura ? 'Generando…' : '—'} className={inputSoloLecturaClase} />
          </div>
          <div>
            <label className={labelClase}>Código final <span className="font-normal text-ink-400">(calculado)</span></label>
            <input value={codigoFinal ?? ''} disabled placeholder="—" className={inputSoloLecturaClase} />
          </div>
        </div>
      </div>
    </>
  );
}
