import { useState } from 'react';
import { DEPARTAMENTOS_COLOMBIA } from '../../config/geografiaColombia';
import type { DatosTornaguia } from '../../config/infoconsumoConfig';
import BuscadorMunicipio from './BuscadorMunicipio';
import BuscadorDireccionLive from './BuscadorDireccionLive';
import MapaRuta from './MapaRuta';

const inputClase = 'w-full py-2.5 px-3 border-[1.5px] border-line rounded-[9px] text-[13px] outline-none focus:border-blue-500';
const labelClase = 'block text-xs font-semibold text-ink-900 mb-1.5';

type Coordenada = { lat: number; lng: number } | null;

interface Props {
  value: DatosTornaguia;
  onChange: (siguiente: DatosTornaguia) => void;
  errorCoherencia?: string | null;
}

export default function CamposOrigenDestino({ value, onChange, errorCoherencia }: Props) {
  function set<K extends keyof DatosTornaguia>(clave: K, v: DatosTornaguia[K]) {
    onChange({ ...value, [clave]: v });
  }

  // Coordenada del municipio activo (aunque no se haya elegido una dirección exacta) — la
  // reporta BuscadorMunicipio, tanto al seleccionar como al precargar un valor existente.
  const [municipioOrigen, setMunicipioOrigen] = useState<Coordenada>(null);
  const [municipioDestino, setMunicipioDestino] = useState<Coordenada>(null);
  const [distancia, setDistancia] = useState<{ km: number; esPorCarretera: boolean } | null>(null);

  // Cascada de precisión para la vista previa (igual que en el backend): dirección exacta,
  // si el usuario ya la eligió, o si no, el centroide del municipio.
  const efectivaOrigen: Coordenada = value.latOrigen != null && value.lngOrigen != null
    ? { lat: value.latOrigen, lng: value.lngOrigen }
    : municipioOrigen;
  const efectivaDestino: Coordenada = value.latDestino != null && value.lngDestino != null
    ? { lat: value.latDestino, lng: value.lngDestino }
    : municipioDestino;

  return (
    <div className="mb-4">
      <div className="grid grid-cols-2 gap-4 mb-3.5">
        <div>
          <label className={labelClase}>Departamento de origen</label>
          <select
            value={value.departamentoOrigen}
            onChange={(e) => { onChange({ ...value, departamentoOrigen: e.target.value, municipioOrigen: '' }); setMunicipioOrigen(null); }}
            className={inputClase}
          >
            {DEPARTAMENTOS_COLOMBIA.map((d) => <option key={d} value={d}>{d}</option>)}
          </select>
        </div>
        <div>
          <label className={labelClase}>Municipio de origen</label>
          <BuscadorMunicipio
            departamento={value.departamentoOrigen}
            value={value.municipioOrigen}
            onChange={(municipioOrigen) => set('municipioOrigen', municipioOrigen)}
            onCoordenada={setMunicipioOrigen}
            placeholder="Ej: Zipaquirá"
          />
        </div>
      </div>
      <div className="mb-3.5">
        <label className={labelClase}>
          Dirección exacta de origen <span className="font-normal text-ink-400">(opcional — búsqueda en vivo)</span>
        </label>
        <BuscadorDireccionLive
          direccion={value.direccionEspecificaOrigen}
          sesgo={municipioOrigen}
          onSeleccionar={(candidato) => onChange({
            ...value,
            direccionEspecificaOrigen: candidato?.direccionCompleta ?? '',
            latOrigen: candidato?.lat ?? null,
            lngOrigen: candidato?.lng ?? null,
          })}
        />
      </div>

      <div className="grid grid-cols-2 gap-4 mb-3.5">
        <div>
          <label className={labelClase}>Departamento de destino</label>
          <select
            value={value.departamentoDestino}
            onChange={(e) => { onChange({ ...value, departamentoDestino: e.target.value, municipioDestino: '' }); setMunicipioDestino(null); }}
            className={inputClase}
          >
            {DEPARTAMENTOS_COLOMBIA.map((d) => <option key={d} value={d}>{d}</option>)}
          </select>
        </div>
        <div>
          <label className={labelClase}>Municipio de destino</label>
          <BuscadorMunicipio
            departamento={value.departamentoDestino}
            value={value.municipioDestino}
            onChange={(municipioDestino) => set('municipioDestino', municipioDestino)}
            onCoordenada={setMunicipioDestino}
            placeholder="Ej: Bucaramanga"
          />
        </div>
      </div>
      <div className="mb-3.5">
        <label className={labelClase}>
          Dirección exacta de destino <span className="font-normal text-ink-400">(opcional — búsqueda en vivo)</span>
        </label>
        <BuscadorDireccionLive
          direccion={value.direccionEspecificaDestino}
          sesgo={municipioDestino}
          onSeleccionar={(candidato) => onChange({
            ...value,
            direccionEspecificaDestino: candidato?.direccionCompleta ?? '',
            latDestino: candidato?.lat ?? null,
            lngDestino: candidato?.lng ?? null,
          })}
        />
      </div>

      {efectivaOrigen && efectivaDestino && (
        <div className="mb-3.5">
          <div className="flex items-center justify-between mb-1.5">
            <label className={`${labelClase} mb-0`}>Ruta estimada</label>
            {distancia && (
              <span className="text-[12.5px] font-semibold text-[var(--color-accento)]">
                {distancia.km.toFixed(0)} km {distancia.esPorCarretera ? '(por carretera)' : '(línea recta)'}
              </span>
            )}
          </div>
          <MapaRuta
            latOrigen={efectivaOrigen.lat}
            lngOrigen={efectivaOrigen.lng}
            latDestino={efectivaDestino.lat}
            lngDestino={efectivaDestino.lng}
            labelOrigen={value.direccionEspecificaOrigen || `${value.municipioOrigen}, ${value.departamentoOrigen}`}
            labelDestino={value.direccionEspecificaDestino || `${value.municipioDestino}, ${value.departamentoDestino}`}
            tipoTransporte={value.tipoTransporte}
            alturaPx={240}
            onDistancia={(km, esPorCarretera) => setDistancia({ km, esPorCarretera })}
          />
        </div>
      )}

      {errorCoherencia && (
        <div className="text-[12px] text-red-600 bg-red-50 border border-red-200 rounded-lg px-3 py-2 mt-3.5">{errorCoherencia}</div>
      )}
    </div>
  );
}
