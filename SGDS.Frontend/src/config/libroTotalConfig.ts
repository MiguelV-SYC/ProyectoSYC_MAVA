export const MOTIVO_CONSULTA_CONSOLIDADA = 'Consulta consolidada';

export interface DatosTurno {
  sedeId: number | null;
  motivo: string;
  fecha: string;
  hora: string;
}

export const DATOS_TURNO_VACIOS: DatosTurno = {
  sedeId: null,
  motivo: MOTIVO_CONSULTA_CONSOLIDADA,
  fecha: '',
  hora: '09:00',
};

export const FRANJAS_HORARIAS = [
  { value: '08:00', label: '8:00 a.m.' },
  { value: '09:00', label: '9:00 a.m.' },
  { value: '10:00', label: '10:00 a.m.' },
  { value: '11:00', label: '11:00 a.m.' },
  { value: '14:00', label: '2:00 p.m.' },
  { value: '15:00', label: '3:00 p.m.' },
  { value: '16:00', label: '4:00 p.m.' },
];

export function fechaHoraCitaISO(fecha: string, hora: string): string | null {
  if (!fecha || !hora) return null;
  const dt = new Date(`${fecha}T${hora}:00`);
  return isNaN(dt.getTime()) ? null : dt.toISOString();
}

// Nombre de carpeta de assets para la galería de arte y cultura de una sede
// (src/assets/librototal/galeria/{slug}/) — "San Gil" -> "san-gil".
const ACENTOS: Record<string, string> = { á: 'a', é: 'e', í: 'i', ó: 'o', ú: 'u', ñ: 'n' };

export function sedeSlug(nombre: string): string {
  return nombre
    .toLowerCase()
    .trim()
    .replace(/[áéíóúñ]/g, (c) => ACENTOS[c] ?? c)
    .replace(/\s+/g, '-');
}
