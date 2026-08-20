import { useEffect, useState } from 'react';
import { getLotesGoTraceDisponibles, type LoteGoTraceDisponibleDto } from '../../services/infoconsumoService';
import { getEmpresaDetalle, type EmpresaResponseDto } from '../../services/empresaService';
import type { DatosTornaguia } from '../../config/infoconsumoConfig';

interface Props {
  value: DatosTornaguia;
  onChange: (siguiente: DatosTornaguia) => void;
  onEmpresaResuelta: (empresa: EmpresaResponseDto) => void;
}

// Puente GoTrace -> Infoconsumo (opcional): si la empresa ya trazó el lote en GoTrace, se
// hereda la empresa y las unidades físicas en vez de volver a digitarlas.
export default function BuscadorLoteGoTrace({ value, onChange, onEmpresaResuelta }: Props) {
  const [expandido, setExpandido] = useState(false);
  const [busqueda, setBusqueda] = useState('');
  const [resultados, setResultados] = useState<LoteGoTraceDisponibleDto[]>([]);
  const [buscando, setBuscando] = useState(false);

  useEffect(() => {
    if (!expandido || value.loteGoTraceSolicitudId) return;
    setBuscando(true);
    const timeout = setTimeout(() => {
      getLotesGoTraceDisponibles(busqueda || undefined)
        .then(setResultados)
        .finally(() => setBuscando(false));
    }, 300);
    return () => clearTimeout(timeout);
  }, [expandido, busqueda, value.loteGoTraceSolicitudId]);

  async function elegir(l: LoteGoTraceDisponibleDto) {
    onChange({
      ...value,
      loteGoTraceSolicitudId: l.id,
      loteGoTraceNumero: l.numero,
      loteGoTraceEmpresaNombre: l.empresaNombre,
      loteGoTraceEmpresaNit: l.empresaNit,
      loteGoTraceProducto: l.producto,
      loteGoTraceNumeroLote: l.numeroLote,
      unidadesFisicas: value.unidadesFisicas || String(l.unidadesLote),
    });

    const detalle = await getEmpresaDetalle(l.empresaId);
    onEmpresaResuelta({
      id: detalle.id,
      nit: detalle.nit,
      digitoVerificacion: detalle.digitoVerificacion,
      razonSocial: detalle.razonSocial,
      proyectosConActividad: [],
      totalSolicitudes: 0,
    });
  }

  function limpiar() {
    onChange({
      ...value,
      loteGoTraceSolicitudId: null,
      loteGoTraceNumero: '',
      loteGoTraceEmpresaNombre: '',
      loteGoTraceEmpresaNit: '',
      loteGoTraceProducto: '',
      loteGoTraceNumeroLote: '',
    });
    setBusqueda('');
    setExpandido(false);
  }

  if (value.loteGoTraceSolicitudId) {
    return (
      <div className="mb-4">
        <label className="block text-xs font-semibold text-ink-900 mb-1.5">Lote de GoTrace vinculado</label>
        <div className="flex items-center gap-2.5 px-3.5 py-3 bg-[var(--color-accento-claro)] border border-[var(--color-accento)] rounded-xl">
          <div className="w-8 h-8 rounded-lg bg-[var(--color-accento)] text-white flex items-center justify-center text-xs font-bold shrink-0">
            GT
          </div>
          <div className="flex-1">
            <div className="text-[13px] font-semibold text-ink-900">{value.loteGoTraceEmpresaNombre}</div>
            <div className="text-[11px] text-ink-600">
              Lote {value.loteGoTraceNumeroLote} · {value.loteGoTraceProducto} · {value.loteGoTraceNumero}
            </div>
          </div>
          <button type="button" onClick={limpiar} className="text-[12px] font-semibold text-ink-600 shrink-0">
            Cambiar
          </button>
        </div>
      </div>
    );
  }

  if (!expandido) {
    return (
      <button
        type="button"
        onClick={() => setExpandido(true)}
        className="w-full flex items-center gap-2.5 px-3.5 py-3 mb-4 bg-paper border border-dashed border-line rounded-xl text-left hover:border-[var(--color-accento)]"
      >
        <svg viewBox="0 0 24 24" fill="none" strokeWidth="1.8" className="w-4 h-4 stroke-ink-400 shrink-0">
          <circle cx="12" cy="12" r="9" /><path d="M12 8v5M12 16h.01" />
        </svg>
        <span className="text-[12.5px] text-ink-600">¿Esta empresa ya traza sus lotes en GoTrace? Vincula uno para heredar sus datos.</span>
      </button>
    );
  }

  return (
    <div className="mb-4">
      <label className="block text-xs font-semibold text-ink-900 mb-1.5">Buscar lote de GoTrace (Aprobado)</label>
      <div className="flex items-center gap-2 bg-paper border border-line rounded-[9px] px-3 py-2.5 mb-3">
        <svg viewBox="0 0 24 24" fill="none" strokeWidth="2" className="w-4 h-4 stroke-ink-400 shrink-0">
          <circle cx="11" cy="11" r="7" /><path d="M21 21l-4-4" />
        </svg>
        <input
          value={busqueda}
          onChange={(e) => setBusqueda(e.target.value)}
          placeholder="Ej: GOTRACE-0012"
          autoFocus
          className="border-none outline-none bg-transparent text-[13px] w-full font-body"
        />
        <button type="button" onClick={() => setExpandido(false)} className="text-[11.5px] text-ink-400 shrink-0">
          Cancelar
        </button>
      </div>
      {buscando && <p className="text-[12px] text-ink-400">Buscando...</p>}
      {!buscando && resultados.length === 0 && (
        <p className="text-[12px] text-ink-400">No hay lotes de GoTrace Aprobados que coincidan.</p>
      )}
      {resultados.map((l) => (
        <button
          key={l.id}
          type="button"
          onClick={() => elegir(l)}
          className="w-full flex items-center gap-3 rounded-xl px-3.5 py-3 mb-1.5 text-left bg-paper border border-line hover:border-[var(--color-accento)]"
        >
          <div className="w-8 h-8 rounded-lg bg-blue-100 text-blue-600 flex items-center justify-center text-xs font-bold shrink-0">
            {l.empresaNombre.split(' ').slice(0, 2).map((p) => p[0]).join('').toUpperCase() || '—'}
          </div>
          <div className="flex-1">
            <div className="text-[13px] font-semibold text-ink-900">{l.empresaNombre || 'Sin empresa asociada'}</div>
            <div className="text-[11px] text-ink-400">Lote {l.numeroLote} · {l.producto} · {l.numero}</div>
          </div>
        </button>
      ))}
    </div>
  );
}
