import { useRef, useState, type FormEvent } from 'react';
import { useAuth } from '../../context/AuthContext';
import IntelligenceMark from '../gerencial/IntelligenceMark';
import { preguntarAsistenteOperador, type MensajeChatDto } from '../../services/asistenteIaOperadorService';

interface Mensaje {
  rol: 'usuario' | 'asistente' | 'error';
  texto: string;
}

// Widget flotante de "SGDS Intelligence" para el rol Operador — a diferencia de
// GerencialAsistenteIaPage (una página dedicada, contexto fijo de 30 días), este vive montado
// una sola vez en App.tsx y aparece sobre cualquier página del operador (GoTrace, Infoconsumo,
// SycTrace...). El backend (AsistenteIaController) decide qué proyectos puede consultar el
// usuario según sus claims reales — este componente no filtra ni restringe nada, solo reenvía
// el historial visible para que el backend mantenga el hilo de la conversación entre preguntas.
export default function AsistenteIaOperador() {
  const { user } = useAuth();
  const [abierto, setAbierto] = useState(false);
  const [mensajes, setMensajes] = useState<Mensaje[]>([]);
  const [pregunta, setPregunta] = useState('');
  const [cargando, setCargando] = useState(false);
  const finRef = useRef<HTMLDivElement>(null);

  // Piloto acotado a Operador — Admin SYC y Gerencial ya tienen su propio asistente
  // (GerencialAsistenteIaPage) con contexto global de los 9 proyectos.
  if (!user || user.esAdminSyc || user.esGerencial) {
    return null;
  }

  async function enviarPregunta(texto: string) {
    const textoLimpio = texto.trim();
    if (!textoLimpio || cargando) return;

    const historialParaBackend: MensajeChatDto[] = mensajes
      .filter((m) => m.rol !== 'error')
      .slice(-6)
      .map((m) => ({ rol: m.rol as 'usuario' | 'asistente', texto: m.texto }));

    setMensajes((prev) => [...prev, { rol: 'usuario', texto: textoLimpio }]);
    setPregunta('');
    setCargando(true);

    try {
      const respuesta = await preguntarAsistenteOperador(textoLimpio, historialParaBackend);
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
    <>
      {abierto && (
        <div className="fixed bottom-24 right-6 z-[1200] w-[360px] max-w-[calc(100vw-2rem)] h-[70vh] max-h-[520px] bg-white border border-line rounded-[16px] shadow-[0_10px_40px_-10px_rgba(10,23,48,0.35)] flex flex-col overflow-hidden">
          <div className="flex items-center gap-2.5 px-4 py-3 border-b border-line shrink-0">
            <IntelligenceMark size={24} />
            <div className="flex-1 min-w-0">
              <p className="font-display text-[13.5px] font-semibold text-ink-900 leading-tight">Asistente IA</p>
              <p className="text-[10.5px] text-ink-400 leading-tight">SGDS Intelligence</p>
            </div>
            <button
              onClick={() => setAbierto(false)}
              aria-label="Cerrar asistente"
              className="w-7 h-7 rounded-full flex items-center justify-center text-ink-400 hover:bg-paper hover:text-ink-900 transition-colors"
            >
              ✕
            </button>
          </div>

          <div className="flex-1 overflow-y-auto px-3.5 py-3 flex flex-col gap-2.5">
            {mensajes.length === 0 ? (
              <div className="flex-1 flex flex-col items-center justify-center text-center px-2 gap-2">
                <IntelligenceMark size={44} />
                <p className="text-[12px] text-ink-600 leading-relaxed">
                  Pregúntame por un lote de GoTrace, una tornaguía de Infoconsumo o una estampilla de SycTrace — por
                  número de solicitud, número de lote/tornaguía, código, o empresa.
                </p>
              </div>
            ) : (
              mensajes.map((m, i) => (
                <div key={i} className={`flex flex-col ${m.rol === 'usuario' ? 'items-end' : 'items-start'}`}>
                  <div
                    className={`max-w-[88%] rounded-[10px] px-3 py-2 text-[12px] leading-relaxed whitespace-pre-line ${
                      m.rol === 'usuario'
                        ? 'bg-[linear-gradient(145deg,var(--color-blue-500),var(--color-blue-600))] text-white'
                        : m.rol === 'error'
                          ? 'bg-red-50 border border-red-200 text-red-600'
                          : 'bg-paper border border-line text-ink-900'
                    }`}
                  >
                    {m.texto}
                  </div>
                </div>
              ))
            )}
            {cargando && (
              <div className="flex items-start">
                <div className="bg-paper border border-line rounded-[10px] px-3 py-2 text-[12px] text-ink-400">
                  Buscando...
                </div>
              </div>
            )}
            <div ref={finRef} />
          </div>

          <form onSubmit={handleSubmit} className="border-t border-line p-2.5 shrink-0">
            <div className="flex items-center gap-2 bg-paper border border-line rounded-[10px] px-3 py-2 focus-within:border-blue-400 transition-colors">
              <input
                value={pregunta}
                onChange={(e) => setPregunta(e.target.value)}
                disabled={cargando}
                placeholder="Ej: dame información del lote GT-0001..."
                className="flex-1 outline-none bg-transparent text-[12px] text-ink-900 placeholder:text-ink-400 disabled:cursor-not-allowed"
              />
              <button
                type="submit"
                disabled={cargando || !pregunta.trim()}
                className="bg-[linear-gradient(145deg,var(--color-blue-500),var(--color-blue-600))] text-white rounded-[7px] px-3 py-1.5 text-[11.5px] font-semibold disabled:opacity-60 disabled:cursor-not-allowed"
              >
                Enviar
              </button>
            </div>
          </form>
        </div>
      )}

      <button
        onClick={() => setAbierto((v) => !v)}
        aria-label={abierto ? 'Cerrar asistente IA' : 'Abrir asistente IA'}
        className="fixed bottom-6 right-6 z-[1200] w-14 h-14 rounded-full flex items-center justify-center bg-gradient-to-br from-[#1e1b4b] to-[#312e81] shadow-[0_8px_24px_-6px_rgba(30,27,75,0.55)] hover:scale-105 transition-transform"
      >
        <IntelligenceMark size={28} className="!bg-transparent" />
      </button>
    </>
  );
}
