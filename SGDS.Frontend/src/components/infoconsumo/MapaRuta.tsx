import { useEffect, useState } from 'react';
import { MapContainer, TileLayer, Marker, Popup, Polyline } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import iconUrl from 'leaflet/dist/images/marker-icon.png';
import iconRetinaUrl from 'leaflet/dist/images/marker-icon-2x.png';
import shadowUrl from 'leaflet/dist/images/marker-shadow.png';

// Vite no resuelve las rutas de íconos por defecto de Leaflet automáticamente — se reconfiguran
// explícitamente con los assets importados, si no los marcadores aparecen rotos.
const iconoMarcador = L.icon({
  iconUrl,
  iconRetinaUrl,
  shadowUrl,
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41],
});

// OSRM solo enruta por vías terrestres — no hay motor de rutas fluvial/marítimo/aéreo
// disponible gratis, así que esos casos (y cualquier falla de red) caen a línea recta.
const OSRM_DEMO_URL = 'https://router.project-osrm.org/route/v1/driving';

interface RutaTerrestre {
  puntos: [number, number][];
  distanciaKm: number;
}

async function obtenerRutaTerrestre(
  latOrigen: number, lngOrigen: number, latDestino: number, lngDestino: number
): Promise<RutaTerrestre | null> {
  try {
    const url = `${OSRM_DEMO_URL}/${lngOrigen},${latOrigen};${lngDestino},${latDestino}?overview=full&geometries=geojson`;
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 6000);
    const res = await fetch(url, { signal: controller.signal });
    clearTimeout(timeout);
    if (!res.ok) return null;
    const data = await res.json();
    const ruta = data?.routes?.[0];
    const coords: [number, number][] | undefined = ruta?.geometry?.coordinates;
    if (!coords || coords.length === 0 || typeof ruta.distance !== 'number') return null;
    // GeoJSON viene como [lng, lat] — Leaflet espera [lat, lng]
    return { puntos: coords.map(([lng, lat]) => [lat, lng]), distanciaKm: ruta.distance / 1000 };
  } catch {
    return null;
  }
}

const RADIO_TIERRA_KM = 6371;
function distanciaLineaRectaKm(lat1: number, lng1: number, lat2: number, lng2: number): number {
  const aRad = (g: number) => (g * Math.PI) / 180;
  const dLat = aRad(lat2 - lat1);
  const dLng = aRad(lng2 - lng1);
  const a = Math.sin(dLat / 2) ** 2 + Math.cos(aRad(lat1)) * Math.cos(aRad(lat2)) * Math.sin(dLng / 2) ** 2;
  return RADIO_TIERRA_KM * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

interface Props {
  latOrigen: number;
  lngOrigen: number;
  latDestino: number;
  lngDestino: number;
  labelOrigen: string;
  labelDestino: string;
  tipoTransporte?: string;
  color?: string;
  alturaPx?: number;
  onDistancia?: (distanciaKm: number, esPorCarretera: boolean) => void;
}

export default function MapaRuta({
  latOrigen, lngOrigen, latDestino, lngDestino, labelOrigen, labelDestino,
  tipoTransporte = 'Terrestre', color = '#2f6fed', alturaPx = 320, onDistancia,
}: Props) {
  const [rutaCarretera, setRutaCarretera] = useState<[number, number][] | null>(null);
  const [buscandoRuta, setBuscandoRuta] = useState(tipoTransporte === 'Terrestre');

  // Con origen y destino resueltos al mismo punto exacto (mismo municipio, o misma dirección)
  // bounds queda degenerado y OSRM no tiene nada que enrutar, así que se trata como caso aparte.
  const mismoPunto = latOrigen === latDestino && lngOrigen === lngDestino;

  useEffect(() => {
    setRutaCarretera(null);
    if (mismoPunto) {
      setBuscandoRuta(false);
      onDistancia?.(0, false);
      return;
    }
    if (tipoTransporte !== 'Terrestre') {
      setBuscandoRuta(false);
      onDistancia?.(distanciaLineaRectaKm(latOrigen, lngOrigen, latDestino, lngDestino), false);
      return;
    }
    setBuscandoRuta(true);
    let cancelado = false;
    obtenerRutaTerrestre(latOrigen, lngOrigen, latDestino, lngDestino).then((ruta) => {
      if (cancelado) return;
      if (ruta) {
        setRutaCarretera(ruta.puntos);
        onDistancia?.(ruta.distanciaKm, true);
      } else {
        onDistancia?.(distanciaLineaRectaKm(latOrigen, lngOrigen, latDestino, lngDestino), false);
      }
      setBuscandoRuta(false);
    });
    return () => { cancelado = true; };
  }, [latOrigen, lngOrigen, latDestino, lngDestino, tipoTransporte, mismoPunto]);

  const bounds: [[number, number], [number, number]] = [
    [latOrigen, lngOrigen],
    [latDestino, lngDestino],
  ];

  const esLineaRecta = !rutaCarretera;
  const trazado: [number, number][] = rutaCarretera ?? [[latOrigen, lngOrigen], [latDestino, lngDestino]];

  return (
    <div>
      <div className="rounded-[14px] overflow-hidden border border-line" style={{ height: alturaPx }}>
        {mismoPunto ? (
          <MapContainer
            center={[latOrigen, lngOrigen]}
            zoom={12}
            style={{ height: '100%', width: '100%' }}
            scrollWheelZoom={false}
          >
            <TileLayer
              attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
              url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
            />
            <Marker position={[latOrigen, lngOrigen]} icon={iconoMarcador}>
              <Popup>Origen: {labelOrigen}<br />Destino: {labelDestino}</Popup>
            </Marker>
          </MapContainer>
        ) : (
          <MapContainer
            bounds={bounds}
            boundsOptions={{ padding: [40, 40] }}
            style={{ height: '100%', width: '100%' }}
            scrollWheelZoom={false}
          >
            <TileLayer
              attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
              url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
            />
            <Marker position={[latOrigen, lngOrigen]} icon={iconoMarcador}>
              <Popup>Origen: {labelOrigen}</Popup>
            </Marker>
            <Marker position={[latDestino, lngDestino]} icon={iconoMarcador}>
              <Popup>Destino: {labelDestino}</Popup>
            </Marker>
            <Polyline
              positions={trazado}
              pathOptions={esLineaRecta ? { color, weight: 3, dashArray: '6 6' } : { color, weight: 4 }}
            />
          </MapContainer>
        )}
      </div>
      {mismoPunto && (
        <p className="text-[10.5px] text-ink-400 mt-1.5">
          Origen y destino resuelven al mismo punto exacto — revisa que el municipio (o la dirección específica) sea distinto si esperabas una ruta.
        </p>
      )}
      {!mismoPunto && tipoTransporte === 'Terrestre' && (
        <p className="text-[10.5px] text-ink-400 mt-1.5">
          {buscandoRuta
            ? 'Calculando ruta por carretera...'
            : rutaCarretera
              ? 'Ruta por carretera (OSRM, demo pública — orientativa, no oficial).'
              : 'No se pudo calcular la ruta por carretera — se muestra línea recta aproximada.'}
        </p>
      )}
      {!mismoPunto && tipoTransporte !== 'Terrestre' && (
        <p className="text-[10.5px] text-ink-400 mt-1.5">
          Transporte {tipoTransporte.toLowerCase()}: no hay motor de rutas disponible — se muestra línea recta de referencia.
        </p>
      )}
    </div>
  );
}
