export interface ColorProyecto {
  primario: string;
  primarioClaro: string;
  primarioOscuro: string;
}

export const COLOR_POR_PROYECTO: Record<string, ColorProyecto> = {
  Colpensiones: { primario: '#1d4ed8', primarioClaro: '#dbeafe', primarioOscuro: '#1942b8' },
  IUVA: { primario: '#c2410c', primarioClaro: '#fed7aa', primarioOscuro: '#9a3412' },
};

export const COLOR_DEFAULT: ColorProyecto = { primario: '#0d9488', primarioClaro: '#e3f7f4', primarioOscuro: '#0f766e' };

export function getColorProyecto(nombreProyecto?: string): ColorProyecto {
  return (nombreProyecto && COLOR_POR_PROYECTO[nombreProyecto]) || COLOR_DEFAULT;
}
