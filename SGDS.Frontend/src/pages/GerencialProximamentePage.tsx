import { useNavigate } from 'react-router-dom';
import Sidebar from '../components/layout/Sidebar';

export default function GerencialProximamentePage() {
  const navigate = useNavigate();

  return (
    <div className="flex min-h-screen bg-paper">
      <Sidebar active="insights" />

      <main className="flex-1 px-8 py-6 overflow-y-auto flex items-center justify-center">
        <div className="max-w-[460px] text-center flex flex-col items-center gap-4">
          <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-[#1e1b4b] to-[#312e81] flex items-center justify-center">
            <svg viewBox="0 0 24 24" width="28" height="28" fill="#fbbf24" stroke="#fbbf24" strokeWidth="1.8">
              <path d="M12 3l1.9 4.6L18 9l-4.1 1.9L12 15l-1.9-4.1L6 9l4.1-1.4z" />
            </svg>
          </div>
          <span className="text-[10px] font-bold uppercase tracking-wide bg-paper border border-line rounded-full px-3 py-1 text-ink-600">
            SGDS Intelligence
          </span>
          <h1 className="font-display text-[19px] font-semibold text-ink-900">Próximamente</h1>
          <p className="text-[13px] text-ink-600 leading-relaxed">
            Los Insights automáticos, las Alertas Inteligentes y el Asistente IA se construyen en una fase posterior del
            proyecto — este primer módulo Gerencial entrega los indicadores, tendencias y alertas por umbrales ya
            calculados con datos reales de los 9 proyectos. La capa de inteligencia artificial se documentará y
            desarrollará por separado.
          </p>
          <button
            onClick={() => navigate('/dashboard')}
            className="mt-2 flex items-center gap-1.5 bg-blue-600 text-white rounded-[9px] px-4 py-2.5 text-[13px] font-semibold"
          >
            ← Volver al Resumen Ejecutivo
          </button>
        </div>
      </main>
    </div>
  );
}
