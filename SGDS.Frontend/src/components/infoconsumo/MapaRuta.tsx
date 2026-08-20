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

async function obtenerRutaTerrestre(
  latOrigen: number, lngOrigen: number, latDestino: number, lngDestino: number
): Promise<[number, number][] | null> {
  try {
    const url = `${OSRM_DEMO_URL}/${lngOrigen},${latOrigen};${lngDestino},${latDestino}?overview=full&geometries=geojson`;
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 6000);
    const res = await fetch(url, { signal: controller.signal });
    clearTimeout(timeout);
    if (!res.ok) return null;
    const data = await res.json();
    const coords: [number, number][] | undefined = data?.routes?.[0]?.geometry?.coordinates;
    if (!coords || coords.length === 0) return null;
    // GeoJSON viene como [lng, lat] — Leaflet espera [lat, lng]
    return coords.map(([lng, lat]) => [lat, lng]);
  } catch {
    return null;
  }
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
}

export default function MapaRuta({
  latOrigen, lngOrigen, latDestino, lngDestino, labelOrigen, labelDestino,
  tipoTransporte = 'Terrestre', color = '#2f6fed', alturaPx = 320,
}: Props) {
  const [rutaCarretera, setRutaCarretera] = useState<[number, number][] | null>(null);
  const [buscandoRuta, setBuscandoRuta] = useState(tipoTransporte === 'Terrestre');

  // Tránsito local (origen y destino en el mismo departamento) resuelve ambos puntos a la
  // misma capital, porque el mapa solo geocodifica a nivel de departamento, no de municipio
  // (ver GeografiaColombia). Con coordenadas idénticas, bounds queda degenerado y OSRM no
  // tiene nada que enrutar, así que se trata como caso aparte en vez de intentar dibujar ruta.
  const mismoPunto = latOrigen === latDestino && lngOrigen === lngDestino;

  useEffect(() => {
    setRutaCarretera(null);
    if (tipoTransporte !== 'Terrestre' || mismoPunto) {
      setBuscandoRuta(false);
      return;
    }
    setBuscandoRuta(true);
    let cancelado = false;
    obtenerRutaTerrestre(latOrigen, lngOrigen, latDestino, lngDestino).then((ruta) => {
      if (cancelado) return;
      setRutaCarretera(ruta);
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
          Origen y destino están en el mismo departamento — el mapa solo ubica a nivel de capital departamental y no distingue municipios dentro del mismo departamento.
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
