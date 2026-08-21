import { useState, useEffect, useMemo } from 'react';
import { sedeSlug } from '../../config/libroTotalConfig';

// Cada sede tiene su propia carpeta de fotos: src/assets/librototal/galeria/{slug}/*.
// Agregar o quitar imágenes ahí no requiere tocar código — Vite las recoge automáticamente.
const modulos = import.meta.glob('../../assets/librototal/galeria/*/*.{jpg,jpeg,png,webp,JPG,JPEG,PNG,WEBP}', {
  eager: true,
  import: 'default',
}) as Record<string, string>;

const INTERVALO_MS = 5000;

interface Props {
  sedeNombre: string;
}

export default function GaleriaCultural({ sedeNombre }: Props) {
  const slug = sedeSlug(sedeNombre);

  const imagenes = useMemo(() => {
    return Object.entries(modulos)
      .filter(([ruta]) => ruta.includes(`/galeria/${slug}/`))
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([, url]) => url);
  }, [slug]);

  const [indice, setIndice] = useState(0);

  useEffect(() => {
    setIndice(0);
    if (imagenes.length <= 1) return;
    const timer = setInterval(() => {
      setIndice((i) => (i + 1) % imagenes.length);
    }, INTERVALO_MS);
    return () => clearInterval(timer);
  }, [imagenes.length, slug]);

  return (
    <div className="bg-white border border-line rounded-[14px] overflow-hidden sticky top-7 w-[500px]">
      <div className="px-5 py-4 border-b border-line">
        <div className="font-display text-[13.5px] font-semibold text-ink-900">Arte y cultura</div>
        <p className="text-[11.5px] text-ink-600 mt-0.5">Galería de la sede {sedeNombre}</p>
      </div>

      {imagenes.length === 0 ? (
        <div className="aspect-[3/4] flex flex-col items-center justify-center gap-2 px-6 text-center bg-paper">
          <svg viewBox="0 0 24 24" fill="none" strokeWidth="1.5" className="w-8 h-8 stroke-ink-400">
            <rect x="3" y="3" width="18" height="18" rx="2" /><circle cx="9" cy="9" r="2" /><path d="M21 15l-5-5L5 21" />
          </svg>
          <p className="text-[12px] text-ink-400">Aún no hay fotos cargadas para esta sede.</p>
          <p className="text-[10px] text-ink-400 font-mono break-all">src/assets/librototal/galeria/{slug}/</p>
        </div>
      ) : (
        <>
          <div className="relative aspect-[3/4] bg-paper overflow-hidden">
            {imagenes.map((src, i) => (
              <img
                key={src}
                src={src}
                alt={`Arte y cultura — sede ${sedeNombre}`}
                className={`absolute inset-0 w-full h-full object-cover object-center transition-opacity duration-700 ${i === indice ? 'opacity-100' : 'opacity-0'}`}
              />
            ))}
          </div>
          {imagenes.length > 1 && (
            <div className="flex items-center justify-center gap-1.5 py-3">
              {imagenes.map((_, i) => (
                <button
                  key={i}
                  type="button"
                  onClick={() => setIndice(i)}
                  aria-label={`Ver imagen ${i + 1}`}
                  className={`h-1.5 rounded-full transition-all ${i === indice ? 'w-5 bg-[var(--color-accento)]' : 'w-1.5 bg-line'}`}
                />
              ))}
            </div>
          )}
        </>
      )}
    </div>
  );
}
