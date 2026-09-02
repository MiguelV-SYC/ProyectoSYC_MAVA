import { useEffect } from 'react';
import { PUNTOS_CONTROL_GOTRACE, MODOS_GENERACION_UID, type DatosLoteGoTrace } from '../../config/gotraceConfig';
import { getSiguienteNumeroLote } from '../../services/gotraceService';
import type { ProductoDto } from '../../services/empresaService';

const inputClase = 'w-full py-2.5 px-3 border-[1.5px] border-line rounded-[9px] text-[13px] outline-none focus:border-blue-500';
const labelClase = 'block text-xs font-semibold text-ink-900 mb-1.5';

interface Props {
  value: DatosLoteGoTrace;
  onChange: (siguiente: DatosLoteGoTrace) => void;
  productos: ProductoDto[];
  // El número de lote se compone una sola vez al radicar y no se recalcula al editar (ver
  // GoTraceController.ActualizarSolicitud) — la vista previa en vivo solo aplica al crear.
  esNuevo: boolean;
}

export default function FormularioLoteGoTrace({ value, onChange, productos, esNuevo }: Props) {
  function set<K extends keyof DatosLoteGoTrace>(clave: K, v: DatosLoteGoTrace[K]) {
    onChange({ ...value, [clave]: v });
  }

  function elegirProducto(idTexto: string) {
    const id = idTexto ? Number(idTexto) : null;
    const p = productos.find((prod) => prod.id === id);
    onChange({
      ...value,
      productoId: id,
      productoNombre: p?.nombre ?? '',
      productoTipo: p?.tipo ?? '',
      productoPresentacion: p?.presentacion ?? '',
      productoContenido: p ? String(p.contenido) : '',
      productoUnidadMedida: p?.unidadMedida ?? '',
      productoRelacion: p?.relacion ?? '',
      numeroLote: '',
    });
  }

  // Número de lote: GT+Producto+fecha+consecutivo, compuesto server-side — se recalcula la
  // vista previa cada vez que cambian producto o fecha (Reglas_de_negocio_GoTrace.md).
  useEffect(() => {
    if (!esNuevo || !value.productoId || !value.fechaProduccion) return;
    let cancelado = false;
    getSiguienteNumeroLote(value.productoId, value.fechaProduccion)
      .then((numero) => { if (!cancelado) set('numeroLote', numero); })
      .catch(() => { if (!cancelado) set('numeroLote', ''); });
    return () => { cancelado = true; };
  }, [esNuevo, value.productoId, value.fechaProduccion]);

  return (
    <>
      <div className="bg-white border border-line rounded-[14px] p-5 mb-5">
        <h3 className="font-display text-[13.5px] font-semibold text-ink-900 mb-4">3. Datos de Producto</h3>
        <div className="grid grid-cols-2 gap-4 mb-3.5">
          <div>
            <label className={labelClase}>Producto</label>
            <select value={value.productoId ?? ''} onChange={(e) => elegirProducto(e.target.value)} className={inputClase}>
              <option value="">Selecciona un producto</option>
              {productos.map((p) => <option key={p.id} value={p.id}>{p.nombre}</option>)}
            </select>
            {productos.length === 0 && (
              <p className="text-[11px] text-amber-600 mt-1.5">Esta empresa no tiene productos registrados en su catálogo todavía.</p>
            )}
            {value.productoId && (
              <p className="text-[11px] text-ink-400 mt-1.5">
                {value.productoNombre} · {value.productoPresentacion} {value.productoContenido}{value.productoUnidadMedida} · {value.productoRelacion}
              </p>
            )}
          </div>
          <div>
            <label className={labelClase}>Número de lote</label>
            <input value={value.numeroLote} disabled placeholder="Se genera automáticamente" className={`${inputClase} bg-paper text-ink-600`} />
            <p className="text-[11px] text-ink-400 mt-1.5">Se compone automáticamente: GT + producto + fecha + consecutivo.</p>
          </div>
        </div>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className={labelClase}>Fecha de producción</label>
            <input type="date" value={value.fechaProduccion} onChange={(e) => set('fechaProduccion', e.target.value)} className={inputClase} />
          </div>
          <div>
            <label className={labelClase}>Unidades producidas</label>
            <input type="number" value={value.unidadesLote} onChange={(e) => set('unidadesLote', e.target.value)} placeholder="12000" className={inputClase} />
          </div>
        </div>
      </div>

      <div className="bg-white border border-line rounded-[14px] p-5 mb-5">
        <h3 className="font-display text-[13.5px] font-semibold text-ink-900 mb-4">4. Identificación de Unidades</h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 mb-3">
          {MODOS_GENERACION_UID.map((m) => {
            const seleccionado = value.modoGeneracionUid === m.value;
            return (
              <button
                key={m.value}
                type="button"
                onClick={() => set('modoGeneracionUid', m.value)}
                className={`flex items-center gap-2.5 border-[1.5px] rounded-xl px-3.5 py-2.5 text-left ${
                  seleccionado ? 'border-[var(--color-accento)] bg-[var(--color-accento-claro)]' : 'border-line'
                }`}
              >
                <span className={`w-3.5 h-3.5 rounded-full border-[1.5px] shrink-0 ${seleccionado ? 'border-[var(--color-accento)] bg-[var(--color-accento)]' : 'border-ink-400'}`} />
                <span className="text-[13px] font-semibold text-ink-900">{m.label}</span>
              </button>
            );
          })}
        </div>

        {Number(value.unidadesLote) > 0 && (
          <p className="text-[11.5px] text-ink-600 bg-paper border border-line rounded-lg px-3 py-2 mb-3">
            Se generarán {Number(value.unidadesLote).toLocaleString('es-CO')} identificadores únicos, correspondientes al número de unidades producidas en el lote.
          </p>
        )}

        {value.modoGeneracionUid === 'Archivo' && (
          <div>
            <label className={labelClase}>Archivo de UIDs</label>
            <input
              type="file"
              accept=".csv,.txt"
              onChange={(e) => set('archivoUidsNombre', e.target.files?.[0]?.name ?? '')}
              className="text-[12.5px] text-ink-600"
            />
            <p className="text-[11px] text-ink-400 mt-1.5">
              Los identificadores reales los asigna el equipo de fábrica (láser/inyección de tinta) — este piloto no valida su contenido, solo deja constancia de que el lote usa códigos precargados.
            </p>
          </div>
        )}
      </div>

      <div className="bg-white border border-line rounded-[14px] p-5 mb-5">
        <h3 className="font-display text-[13.5px] font-semibold text-ink-900 mb-4">5. Etapas de Trazabilidad</h3>
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
                onChange={() => {
                  const activo = value.puntosControlHabilitados.includes(p);
                  set('puntosControlHabilitados', activo
                    ? value.puntosControlHabilitados.filter((x) => x !== p)
                    : [...value.puntosControlHabilitados, p]);
                }}
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
