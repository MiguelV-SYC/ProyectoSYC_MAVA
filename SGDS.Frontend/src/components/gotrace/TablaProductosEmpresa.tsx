import { useEffect, useState } from 'react';
import {
  getProductosEmpresa, crearProducto, actualizarProducto, eliminarProducto,
  type ProductoDto, type GuardarProductoDto,
} from '../../services/empresaService';
import {
  datosProductoVacios, PRESENTACIONES_POR_CATEGORIA, UNIDADES_MEDIDA_POR_CATEGORIA,
  ORIGENES_PRODUCTO, relacionesDe, tiposDe, subtiposDe,
  type DatosProducto, type CategoriaNegocioGoTrace,
} from '../../config/gotraceConfig';

const inputClase = 'w-full py-2 px-2.5 border-[1.5px] border-line rounded-[8px] text-[12.5px] outline-none focus:border-blue-500';

// Fila unificada: id numérico real (empresa ya existe, CRUD contra la API) o índice dentro del
// arreglo en memoria (empresa todavía no se ha creado — se guarda en memoria y se sube recién
// al crear, ver FormularioEmpresaPage).
interface Fila extends GuardarProductoDto {
  id: number | string;
}

interface Props {
  // Alcohol o Cigarrillo (Empresa.TipoEmpresa) — determina qué columnas/opciones aplican:
  // Alcohol usa Grado de alcohol y 2 relaciones; Cigarrillo usa Origen y 3 relaciones.
  categoria: CategoriaNegocioGoTrace;
  // Modo conectado (edición): la empresa ya existe, cada cambio pega directo a la API.
  empresaId?: number;
  // Modo local (creación): la empresa no existe todavía — value/onChange controla el arreglo
  // en memoria, y el padre sube cada producto después de crear la empresa.
  value?: GuardarProductoDto[];
  onChange?: (siguiente: GuardarProductoDto[]) => void;
}

const esTabaco = (categoria: CategoriaNegocioGoTrace) => categoria === 'Cigarrillo';

// Catálogo de productos de la empresa (Reglas_de_negocio_GoTrace.md, "Nueva Empresa" ->
// "Productos que comercializa y/o produce") — exclusivo de empresas en contexto GoTrace.
export default function TablaProductosEmpresa({ categoria, empresaId, value, onChange }: Props) {
  const modoLocal = empresaId == null;

  const [productosApi, setProductosApi] = useState<ProductoDto[]>([]);
  const [cargando, setCargando] = useState(!modoLocal);
  const [error, setError] = useState<string | null>(null);
  const [formularioAbierto, setFormularioAbierto] = useState(false);
  const [editandoId, setEditandoId] = useState<number | string | null>(null);
  const [datos, setDatos] = useState<DatosProducto>(() => datosProductoVacios(categoria));
  const [guardando, setGuardando] = useState(false);

  const filas: Fila[] = modoLocal
    ? (value ?? []).map((p, i) => ({ ...p, id: i }))
    : productosApi.map((p) => ({ ...p, id: p.id }));

  function cargar() {
    if (modoLocal || !empresaId) return;
    setCargando(true);
    getProductosEmpresa(empresaId)
      .then(setProductosApi)
      .catch(() => setError('No se pudieron cargar los productos.'))
      .finally(() => setCargando(false));
  }

  useEffect(cargar, [empresaId, modoLocal]);

  function abrirNuevo() {
    setEditandoId(null);
    setDatos(datosProductoVacios(categoria));
    setFormularioAbierto(true);
  }

  function abrirEdicion(p: Fila) {
    setEditandoId(p.id);
    setDatos({
      nombre: p.nombre,
      tipo: p.tipo,
      subtipo: p.subtipo,
      presentacion: p.presentacion,
      contenido: String(p.contenido),
      unidadMedida: p.unidadMedida,
      gradoAlcoholimetrico: p.gradoAlcoholimetrico != null ? String(p.gradoAlcoholimetrico) : '',
      origen: p.origen ?? '',
      relacion: p.relacion,
    });
    setFormularioAbierto(true);
  }

  async function handleGuardar() {
    setError(null);
    if (!datos.nombre.trim() || !Number(datos.contenido)) {
      setError('Completa al menos el nombre y el contenido del producto.');
      return;
    }
    if (!datos.tipo || !datos.subtipo) {
      setError('Selecciona el tipo y el subtipo.');
      return;
    }
    if (!datos.relacion) {
      setError('Selecciona la relación con el producto.');
      return;
    }
    if (esTabaco(categoria) && !datos.origen) {
      setError('Selecciona el origen (nacional o importado).');
      return;
    }
    const dto: GuardarProductoDto = {
      nombre: datos.nombre,
      tipo: datos.tipo,
      subtipo: datos.subtipo,
      presentacion: datos.presentacion,
      contenido: Number(datos.contenido),
      unidadMedida: datos.unidadMedida,
      gradoAlcoholimetrico: !esTabaco(categoria) && datos.gradoAlcoholimetrico ? Number(datos.gradoAlcoholimetrico) : undefined,
      origen: esTabaco(categoria) ? datos.origen : undefined,
      relacion: datos.relacion,
    };

    if (modoLocal) {
      const actual = value ?? [];
      const siguiente = editandoId != null
        ? actual.map((p, i) => (i === editandoId ? dto : p))
        : [...actual, dto];
      onChange?.(siguiente);
      setFormularioAbierto(false);
      return;
    }

    setGuardando(true);
    try {
      if (editandoId && empresaId) {
        await actualizarProducto(empresaId, Number(editandoId), dto);
      } else if (empresaId) {
        await crearProducto(empresaId, dto);
      }
      setFormularioAbierto(false);
      cargar();
    } catch {
      setError('No se pudo guardar el producto. Intenta de nuevo.');
    } finally {
      setGuardando(false);
    }
  }

  async function handleEliminar(id: number | string) {
    if (!confirm('¿Eliminar este producto del catálogo?')) return;
    if (modoLocal) {
      onChange?.((value ?? []).filter((_, i) => i !== id));
      return;
    }
    if (empresaId) {
      await eliminarProducto(empresaId, Number(id));
      cargar();
    }
  }

  const opcionesTipo = tiposDe(categoria);
  const opcionesPresentacion = PRESENTACIONES_POR_CATEGORIA[categoria];
  const opcionesUnidad = UNIDADES_MEDIDA_POR_CATEGORIA[categoria];
  const opcionesRelacion = relacionesDe(categoria);

  return (
    <div className="bg-white border border-line rounded-[14px] p-5">
      <h3 className="font-display text-[13.5px] font-semibold text-ink-900 mb-1">Productos que comercializa y/o produce</h3>
      <p className="text-[11.5px] text-ink-400 mb-4">
        {modoLocal
          ? 'Se guardan al crear la empresa — puedes agregar varios antes de guardar.'
          : 'Catálogo usado por GoTrace para vincular cada lote a un producto concreto.'}
      </p>

      {cargando ? (
        <p className="text-[12.5px] text-ink-400">Cargando productos...</p>
      ) : filas.length === 0 && !formularioAbierto ? (
        <p className="text-[12.5px] text-ink-400 mb-3">Todavía no hay productos registrados.</p>
      ) : filas.length > 0 && (
        <div className="overflow-x-auto mb-3">
          <table className="w-full text-[12.5px]">
            <thead>
              <tr className="text-left text-ink-400 border-b border-line">
                <th className="py-2 pr-2 font-semibold">Nombre</th>
                <th className="py-2 pr-2 font-semibold">Tipo</th>
                <th className="py-2 pr-2 font-semibold">Subtipo</th>
                <th className="py-2 pr-2 font-semibold">Presentación</th>
                <th className="py-2 pr-2 font-semibold">Contenido</th>
                <th className="py-2 pr-2 font-semibold">Und. medida</th>
                <th className="py-2 pr-2 font-semibold">{esTabaco(categoria) ? 'Origen' : 'Grado de alcohol'}</th>
                <th className="py-2 pr-2 font-semibold">Relación</th>
                <th className="py-2"></th>
              </tr>
            </thead>
            <tbody>
              {filas.map((p) => (
                <tr key={p.id} className="border-b border-line last:border-0">
                  <td className="py-2 pr-2 font-medium text-ink-900">{p.nombre}</td>
                  <td className="py-2 pr-2 text-ink-600">{p.tipo || '—'}</td>
                  <td className="py-2 pr-2 text-ink-600">{p.subtipo || '—'}</td>
                  <td className="py-2 pr-2 text-ink-600">{p.presentacion}</td>
                  <td className="py-2 pr-2 text-ink-600">{p.contenido}</td>
                  <td className="py-2 pr-2 text-ink-600">{p.unidadMedida}</td>
                  <td className="py-2 pr-2 text-ink-600">
                    {esTabaco(categoria) ? (p.origen || '—') : (p.gradoAlcoholimetrico != null ? `${p.gradoAlcoholimetrico}°` : '—')}
                  </td>
                  <td className="py-2 pr-2 text-ink-600">{p.relacion}</td>
                  <td className="py-2 text-right whitespace-nowrap">
                    <button type="button" onClick={() => abrirEdicion(p)} className="text-ink-400 hover:text-[var(--color-accento)] p-1" title="Editar">
                      <svg viewBox="0 0 24 24" fill="none" strokeWidth="1.8" className="w-4 h-4 stroke-current">
                        <path d="M12 20h9" /><path d="M16.5 3.5a2.1 2.1 0 013 3L7 19l-4 1 1-4L16.5 3.5z" />
                      </svg>
                    </button>
                    <button type="button" onClick={() => handleEliminar(p.id)} className="text-ink-400 hover:text-red-600 p-1" title="Eliminar">
                      <svg viewBox="0 0 24 24" fill="none" strokeWidth="1.8" className="w-4 h-4 stroke-current">
                        <path d="M3 6h18" /><path d="M8 6V4a2 2 0 012-2h4a2 2 0 012 2v2m3 0-1 14a2 2 0 01-2 2H7a2 2 0 01-2-2L4 6" />
                      </svg>
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {formularioAbierto ? (
        <div className="bg-paper border border-line rounded-xl p-3.5">
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5 mb-2.5">
            <div className="col-span-2 sm:col-span-1">
              <label className="block text-[10.5px] font-semibold text-ink-600 mb-1">Nombre</label>
              <input value={datos.nombre} onChange={(e) => setDatos({ ...datos, nombre: e.target.value })} placeholder={esTabaco(categoria) ? 'Cigarrillos Marca X' : 'Cerveza artesanal IPA'} className={inputClase} />
            </div>
            <div>
              <label className="block text-[10.5px] font-semibold text-ink-600 mb-1">Tipo</label>
              <select
                value={datos.tipo}
                onChange={(e) => setDatos({ ...datos, tipo: e.target.value, subtipo: '' })}
                disabled={opcionesTipo.length === 1}
                className={`${inputClase} disabled:bg-white disabled:text-ink-600`}
              >
                {opcionesTipo.length !== 1 && <option value="">Selecciona un tipo</option>}
                {opcionesTipo.map((t) => <option key={t} value={t}>{t}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-[10.5px] font-semibold text-ink-600 mb-1">Subtipo</label>
              <select
                value={datos.subtipo}
                onChange={(e) => setDatos({ ...datos, subtipo: e.target.value })}
                disabled={!datos.tipo}
                className={`${inputClase} disabled:bg-white disabled:text-ink-400`}
              >
                <option value="">{datos.tipo ? 'Selecciona un subtipo' : 'Elige primero el tipo'}</option>
                {subtiposDe(datos.tipo).map((s) => <option key={s} value={s}>{s}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-[10.5px] font-semibold text-ink-600 mb-1">Presentación</label>
              <select value={datos.presentacion} onChange={(e) => setDatos({ ...datos, presentacion: e.target.value })} className={inputClase}>
                {opcionesPresentacion.map((p) => <option key={p} value={p}>{p}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-[10.5px] font-semibold text-ink-600 mb-1">Contenido</label>
              <input type="number" value={datos.contenido} onChange={(e) => setDatos({ ...datos, contenido: e.target.value })} placeholder={esTabaco(categoria) ? '20' : '330'} className={inputClase} />
            </div>
            <div>
              <label className="block text-[10.5px] font-semibold text-ink-600 mb-1">Und. de medida</label>
              <select value={datos.unidadMedida} onChange={(e) => setDatos({ ...datos, unidadMedida: e.target.value })} className={inputClase}>
                {opcionesUnidad.map((u) => <option key={u} value={u}>{u}</option>)}
              </select>
            </div>
            {esTabaco(categoria) ? (
              <div>
                <label className="block text-[10.5px] font-semibold text-ink-600 mb-1">Origen</label>
                <select value={datos.origen} onChange={(e) => setDatos({ ...datos, origen: e.target.value })} className={inputClase}>
                  <option value="">Selecciona el origen</option>
                  {ORIGENES_PRODUCTO.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
                </select>
              </div>
            ) : (
              <div>
                <label className="block text-[10.5px] font-semibold text-ink-600 mb-1">Grado de alcohol <span className="font-normal text-ink-400">(opcional)</span></label>
                <input type="number" value={datos.gradoAlcoholimetrico} onChange={(e) => setDatos({ ...datos, gradoAlcoholimetrico: e.target.value })} placeholder="35" className={inputClase} />
              </div>
            )}
            <div>
              <label className="block text-[10.5px] font-semibold text-ink-600 mb-1">Relación</label>
              <select value={datos.relacion} onChange={(e) => setDatos({ ...datos, relacion: e.target.value })} className={inputClase}>
                <option value="">Selecciona</option>
                {opcionesRelacion.map((r) => <option key={r.value} value={r.value}>{r.label}</option>)}
              </select>
            </div>
          </div>
          {error && <p className="text-[11px] text-red-600 mb-2">{error}</p>}
          <div className="flex justify-end gap-2">
            <button type="button" onClick={() => setFormularioAbierto(false)} className="py-1.5 px-3 rounded-[8px] border border-line text-ink-600 text-[12px] font-medium">
              Cancelar
            </button>
            <button
              type="button"
              onClick={handleGuardar}
              disabled={guardando}
              className="py-1.5 px-3.5 rounded-[8px] bg-[var(--color-accento)] text-white text-[12px] font-semibold disabled:opacity-60"
            >
              {guardando ? 'Guardando...' : editandoId ? 'Guardar cambios' : 'Agregar producto'}
            </button>
          </div>
        </div>
      ) : (
        <button type="button" onClick={abrirNuevo} className="text-[12.5px] text-blue-600 font-medium">
          + Agregar Producto
        </button>
      )}
    </div>
  );
}
