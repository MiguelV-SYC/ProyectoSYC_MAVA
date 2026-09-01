import { useEffect, useRef, useState } from 'react';
import { getMunicipios, type MunicipioColombiaDto } from '../../services/geografiaService';

const inputClase = 'w-full py-2.5 px-3 border-[1.5px] border-line rounded-[9px] text-[13px] outline-none focus:border-blue-500 flex items-center justify-between gap-2 bg-white text-left';

interface Props {
  departamento: string;
  value: string;
  onChange: (municipio: string) => void;
  onCoordenada?: (coords: { lat: number; lng: number } | null) => void;
  placeholder?: string;
}

// Selector tipo acordeón: al abrirlo muestra TODOS los municipios del departamento elegido
// (dataset DIVIPOLA-DANE, hasta 125 en Antioquia) en una lista con scroll — no exige escribir
// primero. El campo de filtro de arriba sigue disponible para saltar directo en departamentos
// grandes. También reporta la coordenada del municipio activo (selección o valor precargado)
// para que el formulario pueda mostrar el mapa/distancia en vivo.
export default function BuscadorMunicipio({ departamento, value, onChange, onCoordenada, placeholder }: Props) {
  const [opciones, setOpciones] = useState<MunicipioColombiaDto[]>([]);
  const [abierto, setAbierto] = useState(false);
  const [filtro, setFiltro] = useState('');
  const contenedorRef = useRef<HTMLDivElement>(null);
  const filtroInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!departamento) { setOpciones([]); return; }
    let cancelado = false;
    getMunicipios(departamento).then((lista) => { if (!cancelado) setOpciones(lista); }).catch(() => { if (!cancelado) setOpciones([]); });
    return () => { cancelado = true; };
  }, [departamento]);

  // Reporta la coordenada del municipio activo cada vez que cambia el valor o llega la lista
  // del departamento — cubre tanto la selección manual como el precargado al editar.
  useEffect(() => {
    if (!onCoordenada) return;
    const match = opciones.find((m) => m.municipio.toLowerCase() === value.trim().toLowerCase());
    onCoordenada(match ? { lat: match.lat, lng: match.lng } : null);
  }, [opciones, value]);

  useEffect(() => {
    function alClicFuera(e: MouseEvent) {
      if (contenedorRef.current && !contenedorRef.current.contains(e.target as Node)) setAbierto(false);
    }
    document.addEventListener('mousedown', alClicFuera);
    return () => document.removeEventListener('mousedown', alClicFuera);
  }, []);

  useEffect(() => {
    if (abierto) {
      setFiltro('');
      setTimeout(() => filtroInputRef.current?.focus(), 0);
    }
  }, [abierto]);

  const filtradas = filtro.trim()
    ? opciones.filter((m) => m.municipio.toLowerCase().includes(filtro.trim().toLowerCase()))
    : opciones;

  function seleccionar(m: MunicipioColombiaDto) {
    onChange(m.municipio);
    onCoordenada?.({ lat: m.lat, lng: m.lng });
    setAbierto(false);
  }

  return (
    <div className="relative" ref={contenedorRef}>
      <button type="button" onClick={() => setAbierto((a) => !a)} className={inputClase}>
        <span className={value ? 'text-ink-900' : 'text-ink-400'}>
          {value || placeholder || 'Selecciona un municipio'}
        </span>
        <svg viewBox="0 0 24 24" fill="none" strokeWidth="2" className={`w-3.5 h-3.5 stroke-ink-400 shrink-0 transition-transform ${abierto ? 'rotate-180' : ''}`}>
          <path d="M6 9l6 6 6-6" />
        </svg>
      </button>

      {abierto && (
        <div className="absolute z-20 mt-1 w-full min-w-[260px] bg-white border border-line rounded-[9px] shadow-lg overflow-hidden">
          <div className="p-2 border-b border-line">
            <input
              ref={filtroInputRef}
              value={filtro}
              onChange={(e) => setFiltro(e.target.value)}
              placeholder="Filtrar municipios..."
              className="w-full py-2 px-2.5 border border-line rounded-lg text-[12.5px] outline-none focus:border-blue-500"
            />
          </div>
          <ul className="max-h-72 overflow-y-auto text-[13px]">
            {opciones.length === 0 && (
              <li className="px-3 py-3 text-ink-400 text-[12.5px]">Cargando municipios…</li>
            )}
            {opciones.length > 0 && filtradas.length === 0 && (
              <li className="px-3 py-3 text-ink-400 text-[12.5px]">Sin coincidencias.</li>
            )}
            {filtradas.map((m) => (
              <li key={m.municipio}>
                <button
                  type="button"
                  onClick={() => seleccionar(m)}
                  className={`w-full text-left px-3 py-2 hover:bg-blue-50 ${m.municipio === value ? 'bg-blue-50 text-blue-700 font-semibold' : 'text-ink-900'}`}
                >
                  {m.municipio}
                </button>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}
