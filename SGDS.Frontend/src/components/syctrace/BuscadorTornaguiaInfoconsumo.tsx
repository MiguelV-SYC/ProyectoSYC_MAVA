import { useEffect, useState } from 'react';
import { getTornaguiasDisponibles, type TornaguiaInfoconsumoDisponibleDto } from '../../services/syctraceService';
import { categoriaReconocida, subcategoriasDe, type DatosEstampilla } from '../../config/syctraceConfig';

interface Props {
  value: DatosEstampilla;
  onChange: (siguiente: DatosEstampilla) => void;
}

export default function BuscadorTornaguiaInfoconsumo({ value, onChange }: Props) {
  const [busqueda, setBusqueda] = useState('');
  const [resultados, setResultados] = useState<TornaguiaInfoconsumoDisponibleDto[]>([]);
  const [buscando, setBuscando] = useState(false);

  useEffect(() => {
    if (value.solicitudInfoconsumoId) return;
    setBuscando(true);
    const timeout = setTimeout(() => {
      getTornaguiasDisponibles(busqueda || undefined)
        .then(setResultados)
        .finally(() => setBuscando(false));
    }, 300);
    return () => clearTimeout(timeout);
  }, [busqueda, value.solicitudInfoconsumoId]);

  function elegir(t: TornaguiaInfoconsumoDisponibleDto) {
    // Infoconsumo ya capturó categoría/subcategoría/grado/contenido/origen/lote — se heredan
    // para no volver a digitarlos (RN-03, puente Infoconsumo -> SYCTrace). Si la tornaguía es de
    // antes de esta unificación de catálogo (categoría en texto libre que ya no existe), no se
    // hereda un valor inválido — queda en blanco para elegir a mano (ver FormularioEstampilla).
    const categoriaValida = t.categoriaProducto != null && categoriaReconocida(t.categoriaProducto);
    const categoriaFinal = categoriaValida ? t.categoriaProducto! : '';
    const subcategoriaFinal =
      categoriaFinal && t.subcategoriaProducto && subcategoriasDe(categoriaFinal).includes(t.subcategoriaProducto)
        ? t.subcategoriaProducto
        : '';

    onChange({
      ...value,
      solicitudInfoconsumoId: t.id,
      solicitudInfoconsumoNumero: t.numero,
      empresaNombre: t.empresaNombre,
      empresaNit: t.empresaNit,
      datosDesdeInfoconsumo: true,
      clasificacionSinReconocer: !categoriaValida,
      codigosFijados: false,
      categoriaProducto: categoriaFinal,
      subcategoriaProducto: subcategoriaFinal,
      gradoAlcoholimetrico: t.gradoAlcoholimetrico != null ? String(t.gradoAlcoholimetrico) : value.gradoAlcoholimetrico,
      contenidoNetoCc: t.contenidoNetoCc != null ? String(t.contenidoNetoCc) : value.contenidoNetoCc,
      pesoGramos: t.pesoGramos != null ? String(t.pesoGramos) : value.pesoGramos,
      // Sobrescribe siempre (no con fallback al valor anterior) — si no, al cambiar de
      // tornaguía sin recargar la página, un dato heredado de la selección previa queda
      // bloqueado mostrando información que ya no corresponde a la tornaguía actual.
      loteProduccion: t.numeroLote ?? '',
      loteHeredado: Boolean(t.numeroLote),
      nombreProducto: t.nombreProducto ?? '',
      nombreHeredado: Boolean(t.nombreProducto),
      // Cantidad a expedir = unidades físicas de la tornaguía (una estampilla por unidad del
      // lote) — siempre disponible, nunca se digita a mano.
      cantidadEstampillas: String(t.unidadesFisicas),
      origenProducto: t.origenProducto || value.origenProducto,
      origenHeredado: Boolean(t.origenProducto),
      numeroTornaguia: t.numero,
    });
  }

  function limpiar() {
    onChange({
      ...value,
      solicitudInfoconsumoId: null,
      solicitudInfoconsumoNumero: '',
      empresaNombre: '',
      empresaNit: '',
      datosDesdeInfoconsumo: false,
      clasificacionSinReconocer: false,
      origenHeredado: false,
      loteHeredado: false,
      nombreHeredado: false,
      codigosFijados: false,
    });
    setBusqueda('');
  }

  if (value.solicitudInfoconsumoId) {
    return (
      <div>
        <label className="block text-xs font-semibold text-ink-900 mb-1.5">Tornaguía de Infoconsumo (pago confirmado)</label>
        <div className="flex items-center gap-2.5 px-3.5 py-3 bg-[var(--color-accento-claro)] border border-[var(--color-accento)] rounded-xl">
          <div className="w-8 h-8 rounded-lg bg-[var(--color-accento)] text-white flex items-center justify-center text-xs font-bold shrink-0">
            {value.empresaNombre.split(' ').slice(0, 2).map((p) => p[0]).join('').toUpperCase()}
          </div>
          <div className="flex-1">
            <div className="text-[13px] font-semibold text-ink-900">{value.empresaNombre}</div>
            <div className="text-[11px] text-ink-600">NIT {value.empresaNit} · Tornaguía {value.solicitudInfoconsumoNumero}</div>
          </div>
          <svg viewBox="0 0 24 24" fill="none" strokeWidth="2.5" className="w-4 h-4 stroke-[var(--color-accento)] shrink-0">
            <path d="M5 13l4 4L19 7" />
          </svg>
          <button type="button" onClick={limpiar} className="text-[12px] font-semibold text-ink-600 shrink-0">
            Cambiar
          </button>
        </div>
      </div>
    );
  }

  return (
    <div>
      <label className="block text-xs font-semibold text-ink-900 mb-1.5">Buscar por número de tornaguía (Infoconsumo) o empresa</label>
      <div className="flex items-center gap-2 bg-paper border border-line rounded-[9px] px-3 py-2.5 mb-3">
        <svg viewBox="0 0 24 24" fill="none" strokeWidth="2" className="w-4 h-4 stroke-ink-400 shrink-0">
          <circle cx="11" cy="11" r="7" /><path d="M21 21l-4-4" />
        </svg>
        <input
          value={busqueda}
          onChange={(e) => setBusqueda(e.target.value)}
          placeholder="Ej: INFOCONSUMO-0089"
          className="border-none outline-none bg-transparent text-[13px] w-full font-body"
        />
      </div>
      <p className="text-[11.5px] text-amber-700 bg-amber-50 border border-amber-200 rounded-lg px-3 py-2 mb-2">
        ⚠ Solo aparecen tornaguías de Infoconsumo con el pago del impuesto ya confirmado.
      </p>
      {buscando && <p className="text-[12px] text-ink-400">Buscando...</p>}
      {!buscando && resultados.length === 0 && (
        <p className="text-[12px] text-ink-400">No hay tornaguías de Infoconsumo con pago confirmado que coincidan.</p>
      )}
      {resultados.map((t) => (
        <button
          key={t.id}
          type="button"
          onClick={() => elegir(t)}
          className="w-full flex items-center gap-3 rounded-xl px-3.5 py-3 mb-1.5 text-left bg-paper border border-line hover:border-[var(--color-accento)]"
        >
          <div className="w-8 h-8 rounded-lg bg-blue-100 text-blue-600 flex items-center justify-center text-xs font-bold shrink-0">
            {t.empresaNombre.split(' ').slice(0, 2).map((p) => p[0]).join('').toUpperCase() || '—'}
          </div>
          <div className="flex-1">
            <div className="text-[13px] font-semibold text-ink-900">{t.empresaNombre || 'Sin empresa asociada'}</div>
            <div className="text-[11px] text-ink-400">NIT {t.empresaNit || '—'} · Tornaguía {t.numero}</div>
            {t.loteGoTraceNumero && (
              <div className="text-[10.5px] text-emerald-700 mt-0.5">Trazado en GoTrace — Lote {t.loteGoTraceNumero}</div>
            )}
          </div>
        </button>
      ))}
    </div>
  );
}
