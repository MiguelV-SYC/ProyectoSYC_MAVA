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

interface Props {
  latOrigen: number;
  lngOrigen: number;
  latDestino: number;
  lngDestino: number;
  labelOrigen: string;
  labelDestino: string;
  color?: string;
  alturaPx?: number;
}

export default function MapaRuta({ latOrigen, lngOrigen, latDestino, lngDestino, labelOrigen, labelDestino, color = '#2f6fed', alturaPx = 320 }: Props) {
  const bounds: [[number, number], [number, number]] = [
    [latOrigen, lngOrigen],
    [latDestino, lngDestino],
  ];

  return (
    <div className="rounded-[14px] overflow-hidden border border-line" style={{ height: alturaPx }}>
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
        <Polyline positions={[[latOrigen, lngOrigen], [latDestino, lngDestino]]} pathOptions={{ color, weight: 3, dashArray: '6 6' }} />
      </MapContainer>
    </div>
  );
}
