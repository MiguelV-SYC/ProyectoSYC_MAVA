import { useEffect, useState } from 'react';
import { getProyectosActivos, type ProyectoResponseDto } from '../services/proyectoService';
import { getColorProyecto, type ColorProyecto } from '../config/colorPorProyecto';

const CLAVE_PROYECTO_ACTIVO = 'sgds_proyecto_activo';
const CLAVE_NOMBRE_CACHE = 'sgds_proyecto_nombre_cache_';

// Nombres de proyecto ya resueltos en esta pestaña (vive mientras dure la sesión de SPA) —
// compartido entre useNombreProyectoActivo y useColorProyectoActivo para no repetir el fetch
// ni el parpadeo al color/nombre por defecto en cada cambio de página dentro del mismo proyecto.
const nombresResueltos = new Map<string, string>();
let proyectosPromise: Promise<ProyectoResponseDto[]> | null = null;

function nombreConocido(proyectoId: string | null): string | null {
  if (!proyectoId) return null;
  return nombresResueltos.get(proyectoId) ?? localStorage.getItem(CLAVE_NOMBRE_CACHE + proyectoId);
}

// Nombre del proyecto activo (el que el operador tiene seleccionado en el sidebar) — úsalo
// quien necesite adaptar su comportamiento al proyecto actual sin importar por qué URL se
// llegó a la página (ver FormularioEmpresaPage: "+ Nueva empresa" desde Gotrace debe verse
// distinto aunque no venga con ?contexto=gotrace en la URL).
export function useNombreProyectoActivo(): string | null {
  const [nombre, setNombre] = useState<string | null>(() => nombreConocido(localStorage.getItem(CLAVE_PROYECTO_ACTIVO)));

  useEffect(() => {
    let cancelado = false;

    function resolver() {
      const proyectoId = localStorage.getItem(CLAVE_PROYECTO_ACTIVO);
      if (!proyectoId) {
        setNombre(null);
        return;
      }

      setNombre(nombreConocido(proyectoId));

      if (!proyectosPromise) proyectosPromise = getProyectosActivos();
      proyectosPromise.then((lista) => {
        if (cancelado) return;
        const proyecto = lista.find((p) => String(p.id) === proyectoId);
        if (proyecto?.nombre) {
          nombresResueltos.set(proyectoId, proyecto.nombre);
          localStorage.setItem(CLAVE_NOMBRE_CACHE + proyectoId, proyecto.nombre);
          setNombre(proyecto.nombre);
        }
      });
    }

    resolver();
    window.addEventListener('storage', resolver);
    return () => {
      cancelado = true;
      window.removeEventListener('storage', resolver);
    };
  }, []);

  return nombre;
}

export function useColorProyectoActivo(): ColorProyecto {
  const nombre = useNombreProyectoActivo();
  return getColorProyecto(nombre ?? undefined);
}
