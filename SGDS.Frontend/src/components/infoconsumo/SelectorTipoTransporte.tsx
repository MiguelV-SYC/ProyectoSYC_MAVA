import { TIPOS_TRANSPORTE_INFOCONSUMO } from '../../config/infoconsumoConfig';

const ICONOS: Record<string, React.ReactNode> = {
  Terrestre: <path d="M3 17h1a2 2 0 004 0h8a2 2 0 004 0h1v-5l-3-4H7L3 12v5z" />,
  Fluvial: <><path d="M2 18c2-2 4-2 6 0s4 2 6 0 4-2 6 0" /><path d="M4 14l1-6h14l1 6" /></>,
  'Marítimo': <><path d="M2 20c2-2 4-2 6 0s4 2 6 0 4-2 6 0" /><path d="M6 15l2-9h8l2 9" /><path d="M12 6V2" /></>,
  'Aéreo': <path d="M12 2l3 7 7 3-7 1-3 9-3-9-7-1 7-3z" />,
};

interface Props {
  value: string;
  onChange: (siguiente: string) => void;
}

export default function SelectorTipoTransporte({ value, onChange }: Props) {
  return (
    <div className="mb-4">
      <label className="block text-xs font-semibold text-ink-900 mb-1.5">Tipo de transporte</label>
      <div className="grid grid-cols-4 gap-2.5">
        {TIPOS_TRANSPORTE_INFOCONSUMO.map((t) => (
          <button
            key={t.value}
            type="button"
            onClick={() => onChange(t.value)}
            className={`flex flex-col items-center gap-1.5 border-[1.5px] rounded-xl px-3 py-3 text-[12.5px] font-semibold ${
              value === t.value ? 'border-[var(--color-accento)] bg-[var(--color-accento-claro)] text-[var(--color-accento)]' : 'border-line text-ink-900'
            }`}
          >
            <svg viewBox="0 0 24 24" fill="none" strokeWidth="1.8" className="w-[18px] h-[18px] stroke-current">
              {ICONOS[t.value]}
            </svg>
            {t.label}
          </button>
        ))}
      </div>
    </div>
  );
}
