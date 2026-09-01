import { useEffect, useRef, useState } from 'react';
import { buscarDirecciones, type CandidatoDireccionDto } from '../../services/geografiaService';

const inputClase = 'w-full py-2.5 px-3 border-[1.5px] border-line rounded-[9px] text-[13px] outline-none focus:border-blue-500';

interface Props {
  direccion: string;
  onSeleccionar: (candidato: CandidatoDireccionDto | null) => void;
  // Centro del municipio ya elegido — sesga la búsqueda hacia esa zona (ver
  // NominatimServicioGeocodificacion). Sin esto, direcciones cortas tipo "Carrera 29 # 33-48"
  // casi siempre resuelven contra Bogotá en vez del municipio real.
  sesgo?: { lat: number; lng: number } | null;
}

const DEBOUNCE_MS = 450;
const MIN_CARACTERES = 4;

// Búsqueda en vivo de direcciones (Nominatim/OSM, vía GeografiaController) — precisión
// opcional por encima del centroide del municipio. Al escribir se debounce y consulta el
// backend; al elegir una sugerencia se fija lat/lng exactos, que tienen prioridad sobre el
// municipio en el cálculo de distancia y el mapa (ver InfoconsumoController.ResolverCoordenada).
export default function BuscadorDireccionLive({ direccion, onSeleccionar, sesgo }: Props) {
  const [texto, setTexto] = useState(direccion);
  const [sugerencias, setSugerencias] = useState<CandidatoDireccionDto[]>([]);
  const [buscando, setBuscando] = useState(false);
  const [abierto, setAbierto] = useState(false);
  const contenedorRef = useRef<HTMLDivElement>(null);
  const abortRef = useRef<AbortController | null>(null);

  useEffect(() => setTexto(direccion), [direccion]);

  useEffect(() => {
    if (texto.trim().length < MIN_CARACTERES) {
      setSugerencias([]);
      return;
    }
    const timer = setTimeout(() => {
      abortRef.current?.abort();
      const controlador = new AbortController();
      abortRef.current = controlador;
      setBuscando(true);
      buscarDirecciones(texto.trim(), sesgo, controlador.signal)
        .then((res) => { setSugerencias(res); setAbierto(true); })
        .catch(() => {})
        .finally(() => setBuscando(false));
    }, DEBOUNCE_MS);
    return () => clearTimeout(timer);
  }, [texto, sesgo?.lat, sesgo?.lng]);

  useEffect(() => {
    function alClicFuera(e: MouseEvent) {
      if (contenedorRef.current && !contenedorRef.current.contains(e.target as Node)) setAbierto(false);
    }
    document.addEventListener('mousedown', alClicFuera);
    return () => document.removeEventListener('mousedown', alClicFuera);
  }, []);

  return (
    <div className="relative" ref={contenedorRef}>
      <input
        value={texto}
        onChange={(e) => {
          setTexto(e.target.value);
          if (e.target.value.trim() === '') onSeleccionar(null);
        }}
        onFocus={() => sugerencias.length > 0 && setAbierto(true)}
        placeholder="Ej: Calle 45 #12-34, Bucaramanga"
        className={inputClase}
        autoComplete="off"
      />
      {buscando && (
        <span className="absolute right-3 top-1/2 -translate-y-1/2 text-[11px] text-ink-400">buscando…</span>
      )}
      {abierto && sugerencias.length > 0 && (
        <ul className="absolute z-20 mt-1 w-full max-h-56 overflow-y-auto bg-white border border-line rounded-[9px] shadow-lg text-[13px]">
          {sugerencias.map((s, i) => (
            <li key={i}>
              <button
                type="button"
                onClick={() => {
                  setTexto(s.direccionCompleta);
                  setAbierto(false);
                  onSeleccionar(s);
                }}
                className="w-full text-left px-3 py-2 hover:bg-blue-50 text-ink-900"
              >
                {s.direccionCompleta}
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
