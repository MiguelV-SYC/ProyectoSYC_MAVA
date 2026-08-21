interface Segmento {
  label: string;
  total: number;
  porcentaje: number;
  color: string;
}

interface Props {
  segmentos: Segmento[];
  totalCentro: number;
}

export default function Donut({ segmentos, totalCentro }: Props) {
  const circunferencia = 2 * Math.PI * 38;
  let acumulado = 0;

  return (
    <div className="flex items-center gap-5">
      <svg viewBox="0 0 100 100" width={100} height={100} className="shrink-0">
        {segmentos.map((s, i) => {
          const largo = (s.porcentaje / 100) * circunferencia;
          const offset = -((acumulado / 100) * circunferencia);
          acumulado += s.porcentaje;
          return (
            <circle
              key={i}
              cx={50} cy={50} r={38} fill="none"
              stroke={s.color} strokeWidth={14}
              strokeDasharray={`${largo} ${circunferencia}`}
              strokeDashoffset={offset}
              transform="rotate(-90 50 50)"
            />
          );
        })}
        <text x="50" y="47" textAnchor="middle" fontFamily="Space Grotesk" fontSize="15" fontWeight="700" fill="#0f1a2e">
          {totalCentro.toLocaleString('es-CO')}
        </text>
        <text x="50" y="60" textAnchor="middle" fontFamily="Inter" fontSize="7" fill="#94a3b8">Total</text>
      </svg>
      <div className="flex flex-col gap-3 flex-1">
        {segmentos.map((s, i) => (
          <div key={i} className="flex items-center gap-2 text-[12px]">
            <span className="w-[9px] h-[9px] rounded-full shrink-0" style={{ background: s.color }} />
            <span className="text-ink-600">{s.label}</span>
            <span className="ml-auto font-bold">{s.porcentaje}%</span>
          </div>
        ))}
      </div>
    </div>
  );
}
