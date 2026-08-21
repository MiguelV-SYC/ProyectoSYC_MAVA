import { useEffect, useState } from 'react';
import { getSedes, type SedeResponseDto } from '../../services/libroTotalService';
import { getProyectosActivos } from '../../services/proyectoService';
import { MOTIVO_CONSULTA_CONSOLIDADA, FRANJAS_HORARIAS, type DatosTurno } from '../../config/libroTotalConfig';

const inputClase = 'w-full py-2.5 px-3 border-[1.5px] border-line rounded-[9px] text-[13px] outline-none focus:border-blue-500';
const labelClase = 'block text-xs font-semibold text-ink-900 mb-1.5';

interface Props {
  value: DatosTurno;
  onChange: (siguiente: DatosTurno) => void;
}

export default function FormularioTurno({ value, onChange }: Props) {
  const [sedes, setSedes] = useState<SedeResponseDto[]>([]);
  const [motivos, setMotivos] = useState<string[]>([MOTIVO_CONSULTA_CONSOLIDADA]);

  useEffect(() => {
    getSedes().then(setSedes);
    getProyectosActivos().then((lista) => {
      const nombres = lista.map((p) => p.nombre).filter((n) => n !== 'Libro Total');
      setMotivos([MOTIVO_CONSULTA_CONSOLIDADA, ...nombres]);
    });
  }, []);

  function set<K extends keyof DatosTurno>(clave: K, v: DatosTurno[K]) {
    onChange({ ...value, [clave]: v });
  }

  return (
    <>
      <div className="bg-white border border-line rounded-[14px] p-5 mb-5">
        <h3 className="font-display text-[13.5px] font-semibold text-ink-900 mb-4">2. Sede</h3>
        <div className="grid grid-cols-3 gap-2">
          {sedes.map((s) => (
            <button
              key={s.id}
              type="button"
              onClick={() => set('sedeId', s.id)}
              className={`border-[1.5px] rounded-[9px] px-3 py-2.5 text-center text-[12.5px] font-semibold ${
                value.sedeId === s.id ? 'border-[var(--color-accento)] bg-[var(--color-accento-claro)] text-[var(--color-accento)]' : 'border-line text-ink-900'
              }`}
            >
              {s.nombre}
            </button>
          ))}
        </div>
      </div>

      <div className="bg-white border border-line rounded-[14px] p-5 mb-5">
        <h3 className="font-display text-[13.5px] font-semibold text-ink-900 mb-4">3. Trámite y horario</h3>
        <div className="grid grid-cols-2 gap-4 mb-3.5">
          <div>
            <label className={labelClase}>Proyecto a consultar</label>
            <select value={value.motivo} onChange={(e) => set('motivo', e.target.value)} className={inputClase}>
              {motivos.map((m) => <option key={m} value={m}>{m}</option>)}
            </select>
          </div>
          <div>
            <label className={labelClase}>Fecha</label>
            <input type="date" value={value.fecha} onChange={(e) => set('fecha', e.target.value)} className={inputClase} />
          </div>
        </div>
        <div>
          <label className={labelClase}>Hora</label>
          <select value={value.hora} onChange={(e) => set('hora', e.target.value)} className={inputClase}>
            {FRANJAS_HORARIAS.map((f) => <option key={f.value} value={f.value}>{f.label}</option>)}
          </select>
        </div>
      </div>
    </>
  );
}
