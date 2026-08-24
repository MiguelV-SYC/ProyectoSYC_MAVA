interface Props {
  icono: React.ReactNode;
  colorFondo: string;
  colorIcono: string;
  valor: string;
  label: string;
  delta?: number;
}

export default function KpiCard({ icono, colorFondo, colorIcono, valor, label, delta }: Props) {
  const esPositivo = (delta ?? 0) >= 0;
  return (
    <div className="bg-white border border-line rounded-[13px] p-4">
      <div className="flex items-center gap-2.5 mb-2.5">
        <div className="w-[34px] h-[34px] rounded-[9px] flex items-center justify-center shrink-0 [&_svg]:w-4 [&_svg]:h-4 [&_svg]:stroke-current" style={{ background: colorFondo }}>
          <span style={{ color: colorIcono }}>{icono}</span>
        </div>
        <div>
          <div className="font-display text-[20px] font-bold text-ink-900 leading-none">{valor}</div>
          <div className="text-[11px] text-ink-600 mt-0.5">{label}</div>
        </div>
      </div>
      {delta != null && (
        <div className={`flex items-center gap-1 text-[10.5px] font-bold ${esPositivo ? 'text-[#0d9488]' : 'text-[#dc2626]'}`}>
          <svg viewBox="0 0 24 24" fill="none" strokeWidth={3} className="w-2.5 h-2.5">
            {esPositivo ? <path d="M12 19V5M5 12l7-7 7 7" /> : <path d="M12 5v14M5 12l7 7 7-7" />}
          </svg>
          {Math.abs(delta).toLocaleString('es-CO', { maximumFractionDigits: 1 })}% vs. anterior
        </div>
      )}
    </div>
  );
}
