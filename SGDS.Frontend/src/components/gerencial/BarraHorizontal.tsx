interface Props {
  label: string;
  valor: number;
  maximo: number;
  color: string;
  sufijo?: string;
}

export default function BarraHorizontal({ label, valor, maximo, color, sufijo }: Props) {
  const ancho = maximo > 0 ? Math.round((valor / maximo) * 100) : 0;
  return (
    <div className="flex items-center gap-2.5 mb-2.5 last:mb-0">
      <div className="w-[110px] text-[11.5px] font-semibold text-ink-900 shrink-0 truncate">{label}</div>
      <div className="flex-1 h-[9px] bg-paper rounded-full overflow-hidden">
        <div className="h-full rounded-full" style={{ width: `${ancho}%`, background: color }} />
      </div>
      <div className="w-[42px] text-right text-[11.5px] font-bold text-ink-600 shrink-0">
        {valor}{sufijo ?? ''}
      </div>
    </div>
  );
}
