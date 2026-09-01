import { useRef, useState, type FormEvent } from 'react';
import Sidebar from '../components/layout/Sidebar';
import IntelligenceMark from '../components/gerencial/IntelligenceMark';
import { preguntarAsistenteGerencial } from '../services/gerencialService';

// Formuladas para calzar exactamente con lo que ConstruirContextoAsistente le entrega a la
// IA (período fijo de 30 días, totales y SLA por proyecto, solicitudes críticas) — evitar
// preguntas sobre datos que el contexto no incluye (comparación con meses anteriores,
// tendencias históricas, motivos de rechazo), porque ahí el asistente solo puede responder
// que no tiene esa información.
const SUGERENCIAS = [
  'Dame un resumen ejecutivo del período',
  '¿Qué proyecto tiene más solicitudes en los últimos 30 días?',
  '¿Qué proyecto tiene el cumplimiento de SLA más bajo?',
  '¿Qué proyecto tiene el mejor cumplimiento de SLA?',
  '¿Qué proyecto tiene más solicitudes críticas por vencer?',
  '¿Cuáles son las solicitudes más urgentes por vencer ahora mismo?',
  '¿Cuántas solicitudes están pendientes de resolución?',
  'Compara el volumen de solicitudes entre los proyectos activos',
];

interface Mensaje {
  rol: 'usuario' | 'asistente' | 'error';
  texto: string;
}

export default function GerencialAsistenteIaPage() {
  const [mensajes, setMensajes] = useState<Mensaje[]>([]);
  const [pregunta, setPregunta] = useState('');
  const [cargando, setCargando] = useState(false);
  const finRef = useRef<HTMLDivElement>(null);

  async function enviarPregunta(texto: string) {
    const textoLimpio = texto.trim();
    if (!textoLimpio || cargando) return;

    setMensajes((prev) => [...prev, { rol: 'usuario', texto: textoLimpio }]);
    setPregunta('');
    setCargando(true);

    try {
      const respuesta = await preguntarAsistenteGerencial(textoLimpio);
      setMensajes((prev) => [...prev, { rol: 'asistente', texto: respuesta.texto }]);
    } catch {
      setMensajes((prev) => [
        ...prev,
        { rol: 'error', texto: 'El asistente no está disponible en este momento. Intenta de nuevo más tarde.' },
      ]);
    } finally {
      setCargando(false);
      setTimeout(() => finRef.current?.scrollIntoView({ behavior: 'smooth' }), 50);
    }
  }

  function handleSubmit(e: FormEvent) {
    e.preventDefault();
    enviarPregunta(pregunta);
  }

  return (
    <div className="flex min-h-screen bg-paper">
      <Sidebar active="asistente-ia" />

      <main className="flex-1 px-4 md:px-8 py-6 pt-16 md:pt-6 flex flex-col overflow-x-hidden">
        <div className="flex items-center gap-3 mb-2">
          <IntelligenceMark />
          <div>
            <h1 className="font-display text-[22px] font-semibold text-ink-900">Asistente IA</h1>
            <p className="text-ink-600 text-[12.5px] mt-0.5">Preguntas en lenguaje natural sobre los datos de los 9 proyectos</p>
          </div>
        </div>

        <div className="flex-1 flex flex-col overflow-y-auto py-4">
          {mensajes.length === 0 ? (
            <div className="flex-1 flex flex-col items-center justify-center">
              <div className="max-w-[460px] text-center flex flex-col items-center gap-4">
                <IntelligenceMark size={120} />
                <span className="text-[10px] font-bold uppercase tracking-wide bg-white border border-line rounded-full px-3 py-1 text-ink-600">
                  SGDS Intelligence
                </span>
                <h2 className="font-display text-[16px] font-semibold text-ink-900">Aún no hay conversación</h2>
                <p className="text-[12.5px] text-ink-600 leading-relaxed">
                  Pregunta en lenguaje natural sobre los indicadores del período reciente de los proyectos autorizados,
                  o elige uno de estos atajos:
                </p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 max-w-[560px] w-full mt-6">
                {SUGERENCIAS.map((s) => (
                  <button
                    key={s}
                    onClick={() => enviarPregunta(s)}
                    disabled={cargando}
                    className="bg-white border border-line rounded-[10px] px-3.5 py-3 text-left text-[12px] text-ink-900 font-medium hover:border-blue-400 transition-colors disabled:opacity-60 disabled:cursor-not-allowed"
                  >
                    {s}
                  </button>
                ))}
              </div>
            </div>
          ) : (
            <div className="flex flex-col gap-3 max-w-[720px] w-full mx-auto">
              {mensajes.map((m, i) => (
                <div key={i} className={`flex flex-col ${m.rol === 'usuario' ? 'items-end' : 'items-start'}`}>
                  <div
                    className={`max-w-[85%] rounded-[12px] px-4 py-2.5 text-[12.5px] leading-relaxed ${
                      m.rol === 'usuario'
                        ? 'bg-[linear-gradient(145deg,var(--color-blue-500),var(--color-blue-600))] text-white'
                        : m.rol === 'error'
                          ? 'bg-red-50 border border-red-200 text-red-600'
                          : 'bg-white border border-line text-ink-900'
                    }`}
                  >
                    {m.texto}
                  </div>
                  {m.rol === 'asistente' && (
                    <span className="mt-1 text-[10px] font-bold uppercase tracking-wide bg-[#ede9fe] text-[#6d28d9] rounded-full px-2 py-0.5">
                      Generado por IA
                    </span>
                  )}
                </div>
              ))}
              {cargando && (
                <div className="flex items-start">
                  <div className="bg-white border border-line rounded-[12px] px-4 py-2.5 text-[12.5px] text-ink-400">
                    Pensando...
                  </div>
                </div>
              )}
              <div ref={finRef} />
            </div>
          )}
        </div>

        <form onSubmit={handleSubmit} className="border-t border-line pt-4 pb-1">
          <div className="flex items-center gap-2.5 bg-white border border-line rounded-[12px] px-4 py-3 focus-within:border-blue-400 transition-colors">
            <input
              value={pregunta}
              onChange={(e) => setPregunta(e.target.value)}
              disabled={cargando}
              placeholder="Pregunta algo sobre los datos de los proyectos..."
              className="flex-1 outline-none bg-transparent text-[12.5px] text-ink-900 placeholder:text-ink-400 disabled:cursor-not-allowed"
            />
            <button
              type="submit"
              disabled={cargando || !pregunta.trim()}
              className="bg-[linear-gradient(145deg,var(--color-blue-500),var(--color-blue-600))] text-white rounded-[8px] px-3.5 py-2 text-[12px] font-semibold disabled:opacity-60 disabled:cursor-not-allowed"
            >
              Enviar
            </button>
          </div>
        </form>
      </main>
    </div>
  );
}
