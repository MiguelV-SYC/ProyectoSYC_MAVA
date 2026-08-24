import { useNavigate } from 'react-router-dom';
import Sidebar from '../components/layout/Sidebar';
import IntelligenceMark from '../components/gerencial/IntelligenceMark';

const SUGERENCIAS = [
  { texto: 'Compara el SLA de este mes con el anterior', ruta: '/gerencial/comparativos' },
  { texto: '¿Qué proyecto tiene más solicitudes críticas?', ruta: '/gerencial/proyectos' },
  { texto: '¿Cuál es el trámite con más rechazos?', ruta: '/gerencial/indicadores' },
  { texto: 'Muéstrame la tendencia de los últimos 90 días', ruta: '/gerencial/tendencias' },
];

// Cuando se integre el asistente de IA, este botón/input deja de estar deshabilitado y
// enviarPregunta(texto) pasa a llamar al modelo con acceso a los endpoints ya construidos
// (dashboard, indicadores, tendencias, comparativos) en vez de solo redirigir.
export default function GerencialAsistenteIaPage() {
  const navigate = useNavigate();

  return (
    <div className="flex min-h-screen bg-paper">
      <Sidebar active="asistente-ia" />

      <main className="flex-1 px-8 py-6 flex flex-col">
        <div className="flex items-center gap-3 mb-2">
          <IntelligenceMark />
          <div>
            <h1 className="font-display text-[22px] font-semibold text-ink-900">Asistente IA</h1>
            <p className="text-ink-600 text-[12.5px] mt-0.5">Preguntas en lenguaje natural sobre los datos de los 9 proyectos</p>
          </div>
        </div>

        <div className="flex-1 flex flex-col items-center justify-center">
          <div className="max-w-[460px] text-center flex flex-col items-center gap-4">
            <IntelligenceMark size={120} />
            <span className="text-[10px] font-bold uppercase tracking-wide bg-white border border-line rounded-full px-3 py-1 text-ink-600">
              SGDS Intelligence
            </span>
            <h2 className="font-display text-[16px] font-semibold text-ink-900">Aún no hay conversación</h2>
            <p className="text-[12.5px] text-ink-600 leading-relaxed">
              El asistente conversacional se conecta en una fase posterior al mismo modelo de datos que ya alimenta
              Indicadores, Tendencias y Comparativos. Mientras tanto, estos accesos directos te llevan a la vista
              correspondiente:
            </p>
          </div>

          <div className="grid grid-cols-2 gap-2.5 max-w-[560px] w-full mt-6">
            {SUGERENCIAS.map((s) => (
              <button
                key={s.ruta}
                onClick={() => navigate(s.ruta)}
                className="bg-white border border-line rounded-[10px] px-3.5 py-3 text-left text-[12px] text-ink-900 font-medium hover:border-blue-400 transition-colors"
              >
                {s.texto}
              </button>
            ))}
          </div>
        </div>

        <div className="border-t border-line pt-4 pb-1">
          <div className="flex items-center gap-2.5 bg-white border border-line rounded-[12px] px-4 py-3 opacity-60">
            <input
              disabled
              placeholder="Este asistente se activará cuando se integre el modelo de IA"
              className="flex-1 outline-none bg-transparent text-[12.5px] text-ink-400 cursor-not-allowed"
            />
            <button disabled className="bg-ink-900/10 text-ink-400 rounded-[8px] px-3.5 py-2 text-[12px] font-semibold cursor-not-allowed">
              Enviar
            </button>
          </div>
        </div>
      </main>
    </div>
  );
}
