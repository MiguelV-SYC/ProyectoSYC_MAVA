// Lista de los 32 departamentos + Bogotá D.C. — debe coincidir exactamente (mismos nombres)
// con GeografiaColombia.CapitalesPorDepartamento en el backend, usada para ubicar el mapa.
export const DEPARTAMENTOS_COLOMBIA = [
  'Amazonas', 'Antioquia', 'Arauca', 'Atlántico', 'Bogotá D.C.', 'Bolívar', 'Boyacá', 'Caldas',
  'Caquetá', 'Casanare', 'Cauca', 'Cesar', 'Chocó', 'Córdoba', 'Cundinamarca', 'Guainía',
  'Guaviare', 'Huila', 'La Guajira', 'Magdalena', 'Meta', 'Nariño', 'Norte de Santander', 'Putumayo',
  'Quindío', 'Risaralda', 'San Andrés y Providencia', 'Santander', 'Sucre', 'Tolima', 'Valle del Cauca',
  'Vaupés', 'Vichada',
];

// Mismas coordenadas que GeografiaColombia.CapitalesPorDepartamento en el backend — se
// duplican aquí (igual que la lista de nombres de arriba) para previsualizar el mapa de
// ruta en el formulario sin ir y volver al servidor en cada cambio de departamento.
export const CAPITALES_COLOMBIA: Record<string, { lat: number; lng: number }> = {
  'Amazonas': { lat: -4.2153, lng: -69.9406 },
  'Antioquia': { lat: 6.2442, lng: -75.5812 },
  'Arauca': { lat: 7.0847, lng: -70.7591 },
  'Atlántico': { lat: 10.9639, lng: -74.7964 },
  'Bogotá D.C.': { lat: 4.7110, lng: -74.0721 },
  'Bolívar': { lat: 10.3910, lng: -75.4794 },
  'Boyacá': { lat: 5.5353, lng: -73.3678 },
  'Caldas': { lat: 5.0689, lng: -75.5174 },
  'Caquetá': { lat: 1.6144, lng: -75.6062 },
  'Casanare': { lat: 5.3378, lng: -72.3959 },
  'Cauca': { lat: 2.4448, lng: -76.6147 },
  'Cesar': { lat: 10.4631, lng: -73.2532 },
  'Chocó': { lat: 5.6947, lng: -76.6611 },
  'Córdoba': { lat: 8.7479, lng: -75.8814 },
  'Cundinamarca': { lat: 4.7110, lng: -74.0721 },
  'Guainía': { lat: 3.8653, lng: -67.9239 },
  'Guaviare': { lat: 2.5728, lng: -72.6406 },
  'Huila': { lat: 2.9273, lng: -75.2819 },
  'La Guajira': { lat: 11.5444, lng: -72.9072 },
  'Magdalena': { lat: 11.2408, lng: -74.1990 },
  'Meta': { lat: 4.1420, lng: -73.6266 },
  'Nariño': { lat: 1.2136, lng: -77.2811 },
  'Norte de Santander': { lat: 7.8891, lng: -72.4967 },
  'Putumayo': { lat: 1.1466, lng: -76.6486 },
  'Quindío': { lat: 4.5389, lng: -75.6722 },
  'Risaralda': { lat: 4.8087, lng: -75.6906 },
  'San Andrés y Providencia': { lat: 12.5847, lng: -81.7006 },
  'Santander': { lat: 7.1193, lng: -73.1227 },
  'Sucre': { lat: 9.3047, lng: -75.3978 },
  'Tolima': { lat: 4.4389, lng: -75.2322 },
  'Valle del Cauca': { lat: 3.4516, lng: -76.5320 },
  'Vaupés': { lat: 1.2537, lng: -70.2340 },
  'Vichada': { lat: 6.1891, lng: -67.4859 },
};
