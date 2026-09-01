import { useEffect, useRef, useState } from 'react';
import { CARROCERIAS_VEHICULO, TIPOS_VEHICULO_CARGA } from '../../config/infoconsumoConfig';

const SEPARADOR = ' — ';

interface Props {
  value: string;
  onChange: (siguiente: string) => void;
}

// Tipo de vehículo estructurado según la norma NTC 4788 (Ministerio de Transporte) — ver
// Reglas de Negocio.MD/Reglas_de_negocio_infoconsumo_v.2.md. Se guarda como un solo string
// compuesto "Tipo — Carrocería" en DatosTornaguia.tipoVehiculo, sin requerir cambios de
// esquema en el backend (el campo ya era texto libre).
export default function SelectorTipoVehiculo({ value, onChange }: Props) {
  const partes = value.split(SEPARADOR);
  const tipoActual = TIPOS_VEHICULO_CARGA.find((t) => t.value === partes[0])?.value ?? null;
  const carroceriaActual = partes[1] ?? null;

  const [abierto, setAbierto] = useState(false);
  const contenedorRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function alClicFuera(e: MouseEvent) {
      if (contenedorRef.current && !contenedorRef.current.contains(e.target as Node)) setAbierto(false);
    }
    document.addEventListener('mousedown', alClicFuera);
    return () => document.removeEventListener('mousedown', alClicFuera);
  }, []);

  const infoTipo = TIPOS_VEHICULO_CARGA.find((t) => t.value === tipoActual);

  function elegirTipo(tipoValue: string) {
    onChange(tipoValue);
    setAbierto(false);
  }

  function elegirCarroceria(carroceriaValue: string) {
    if (!tipoActual) return;
    onChange(`${tipoActual}${SEPARADOR}${carroceriaValue}`);
  }

  return (
    <div>
      <div className="relative" ref={contenedorRef}>
        <button
          type="button"
          onClick={() => setAbierto((a) => !a)}
          className="w-full py-2.5 px-3 border-[1.5px] border-line rounded-[9px] text-[13px] outline-none focus:border-blue-500 flex items-center justify-between gap-2 bg-white text-left"
        >
          <span className={tipoActual ? 'text-ink-900' : 'text-ink-400'}>
            {tipoActual || 'Selecciona un tipo de vehículo'}
          </span>
          <svg viewBox="0 0 24 24" fill="none" strokeWidth="2" className={`w-3.5 h-3.5 stroke-ink-400 shrink-0 transition-transform ${abierto ? 'rotate-180' : ''}`}>
            <path d="M6 9l6 6 6-6" />
          </svg>
        </button>

        {abierto && (
          <div className="absolute z-20 mt-1 w-full min-w-[280px] bg-white border border-line rounded-[9px] shadow-lg overflow-hidden">
            <ul className="max-h-72 overflow-y-auto text-[13px]">
              {TIPOS_VEHICULO_CARGA.map((t) => (
                <li key={t.value}>
                  <button
                    type="button"
                    onClick={() => elegirTipo(t.value)}
                    className={`w-full text-left px-3 py-2.5 hover:bg-blue-50 ${t.value === tipoActual ? 'bg-blue-50 text-blue-700' : 'text-ink-900'}`}
                  >
                    <div className="font-semibold">{t.label}</div>
                    <div className="text-[11px] text-ink-400 mt-0.5">{t.designacionRndc} · {t.capacidadAprox}</div>
                  </button>
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>

      {infoTipo && (
        <p className="text-[11px] text-ink-400 mt-1.5">Capacidad aprox. de carga: {infoTipo.capacidadAprox}</p>
      )}

      {tipoActual && (
        <div className="mt-2.5">
          <label className="block text-[11px] font-semibold text-ink-600 mb-1.5">Configuración de carrocería</label>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
            {CARROCERIAS_VEHICULO.map((c) => {
              const seleccionada = c.value === carroceriaActual;
              return (
                <button
                  key={c.value}
                  type="button"
                  onClick={() => elegirCarroceria(c.value)}
                  title={c.descripcion}
                  className={`flex items-start gap-2 border-[1.5px] rounded-lg px-2.5 py-2 text-left text-[11.5px] font-medium ${
                    seleccionada ? 'border-[var(--color-accento)] bg-[var(--color-accento-claro)] text-[var(--color-accento)]' : 'border-line text-ink-900'
                  }`}
                >
                  <span className={`mt-0.5 w-3 h-3 rounded-full border-[1.5px] shrink-0 ${seleccionada ? 'border-[var(--color-accento)] bg-[var(--color-accento)]' : 'border-ink-400'}`} />
                  {c.label}
                </button>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
