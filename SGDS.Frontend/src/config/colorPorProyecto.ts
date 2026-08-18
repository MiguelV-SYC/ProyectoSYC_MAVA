export interface ColorProyecto {
  primario: string;
  primarioClaro: string;
}

export const COLOR_POR_PROYECTO: Record<string, ColorProyecto> = {
  Colpensiones: { primario: '#1d4ed8', primarioClaro: '#dbeafe' },
};

export const COLOR_DEFAULT: ColorProyecto = { primario: '#0d9488', primarioClaro: '#e3f7f4' };

export function getColorProyecto(nombreProyecto?: string): ColorProyecto {
  return (nombreProyecto && COLOR_POR_PROYECTO[nombreProyecto]) || COLOR_DEFAULT;
}
