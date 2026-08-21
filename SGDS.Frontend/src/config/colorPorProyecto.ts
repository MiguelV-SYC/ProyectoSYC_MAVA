export interface ColorProyecto {
  primario: string;
  primarioClaro: string;
  primarioOscuro: string;
}

export const COLOR_POR_PROYECTO: Record<string, ColorProyecto> = {
  Colpensiones: { primario: '#1d4ed8', primarioClaro: '#dbeafe', primarioOscuro: '#1942b8' },
  IUVA: { primario: '#c2410c', primarioClaro: '#fed7aa', primarioOscuro: '#9a3412' },
  Estampillas: { primario: '#3f3f46', primarioClaro: '#f4f4f5', primarioOscuro: '#27272a' },
  Infoconsumo: { primario: '#a21caf', primarioClaro: '#fae8ff', primarioOscuro: '#86198f' },
  SYCTrace: { primario: '#ea580c', primarioClaro: '#ffedd5', primarioOscuro: '#c2410c' },
  Gotrace: { primario: '#d97706', primarioClaro: '#fef3c7', primarioOscuro: '#92400e' },
  'Pasivos Laborales': { primario: '#0891b2', primarioClaro: '#cffafe', primarioOscuro: '#155e75' },
  'Libro Total': { primario: '#854d0e', primarioClaro: '#fef9c3', primarioOscuro: '#5c3409' },
};

export const COLOR_DEFAULT: ColorProyecto = { primario: '#0d9488', primarioClaro: '#e3f7f4', primarioOscuro: '#0f766e' };

export function getColorProyecto(nombreProyecto?: string): ColorProyecto {
  return (nombreProyecto && COLOR_POR_PROYECTO[nombreProyecto]) || COLOR_DEFAULT;
}
