import logoIntelligence from '../../assets/sgds-intelligence-logo.png';

interface Props {
  size?: number;
  className?: string;
}

// Marca visual compartida por las 3 vistas de SGDS Intelligence (Insights, Alertas
// Inteligentes, Asistente IA) y por su sección en el Sidebar — mismo logo, mismo halo, para
// que se reconozcan como un mismo apartado del producto.
export default function IntelligenceMark({ size = 30, className = '' }: Props) {
  const boxSize = size + 12;
  return (
    <div
      className={`rounded-[10px] bg-gradient-to-br from-[#1e1b4b] to-[#312e81] flex items-center justify-center shrink-0 ${className}`}
      style={{ width: boxSize, height: boxSize }}
    >
      <img src={logoIntelligence} alt="SGDS Intelligence" style={{ width: size, height: size }} />
    </div>
  );
}
