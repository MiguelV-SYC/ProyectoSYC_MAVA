import { useEffect, useState } from 'react';
import { getProyectosActivos } from '../services/proyectoService';
import { getColorProyecto, COLOR_DEFAULT, type ColorProyecto } from '../config/colorPorProyecto';

const CLAVE_PROYECTO_ACTIVO = 'sgds_proyecto_activo';

export function useColorProyectoActivo(): ColorProyecto {
  const [color, setColor] = useState<ColorProyecto>(COLOR_DEFAULT);

  useEffect(() => {
    let cancelado = false;

    function resolver() {
      const proyectoId = localStorage.getItem(CLAVE_PROYECTO_ACTIVO);
      if (!proyectoId) {
        setColor(COLOR_DEFAULT);
        return;
      }
      getProyectosActivos().then((lista) => {
        if (cancelado) return;
        const proyecto = lista.find((p) => String(p.id) === proyectoId);
        setColor(getColorProyecto(proyecto?.nombre));
      });
    }

    resolver();
    window.addEventListener('storage', resolver);
    return () => {
      cancelado = true;
      window.removeEventListener('storage', resolver);
    };
  }, []);

  return color;
}
