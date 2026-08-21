interface Serie {
  color: string;
  valores: (number | null | undefined)[];
}

interface Props {
  series: Serie[];
  alturaPx?: number;
}

// Polyline SVG simple — suficiente para tendencias de KPIs, sin depender de una librería
// de gráficos para un puñado de líneas.
export default function GraficoLinea({ series, alturaPx = 200 }: Props) {
  const ancho = 560;
  const alto = alturaPx;
  const todosLosValores = series.flatMap((s) => s.valores).filter((v): v is number => v != null);
  const max = todosLosValores.length > 0 ? Math.max(...todosLosValores, 1) : 1;
  const min = todosLosValores.length > 0 ? Math.min(...todosLosValores, 0) : 0;
  const rango = max - min || 1;

  return (
    <div className="h-full" style={{ height: alto }}>
      <svg viewBox={`0 0 ${ancho} ${alto}`} preserveAspectRatio="none" className="w-full h-full">
        {series.map((serie, i) => {
          const n = serie.valores.length;
          if (n < 2) return null;
          const paso = ancho / (n - 1);
          const puntos = serie.valores
            .map((v, idx) => {
              if (v == null) return null;
              const x = idx * paso;
              const y = alto - ((v - min) / rango) * (alto - 16) - 8;
              return `${x},${y}`;
            })
            .filter((p): p is string => p != null)
            .join(' ');
          return <polyline key={i} points={puntos} fill="none" stroke={serie.color} strokeWidth={2.5} />;
        })}
      </svg>
    </div>
  );
}
