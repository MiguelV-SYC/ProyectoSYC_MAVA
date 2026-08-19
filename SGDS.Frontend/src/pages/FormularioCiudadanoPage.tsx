import { useState, useEffect, type FormEvent } from 'react';
import { useParams, useNavigate, useSearchParams, Link } from 'react-router-dom';
import Sidebar from '../components/layout/Sidebar';
import {
  buscarPorDocumento,
  crearCiudadano,
  actualizarCiudadano,
  getCiudadanoDetalle,
  type BusquedaDocumentoResponse,
} from '../services/ciudadanoService';
import { useColorProyectoActivo } from '../hooks/useColorProyectoActivo';

const TIPOS_DOCUMENTO = [
  { value: 'CC', label: 'Cédula de ciudadanía' },
  { value: 'CE', label: 'Cédula de extranjería' },
  { value: 'TI', label: 'Tarjeta de identidad' },
  { value: 'PAS', label: 'Pasaporte' },
];

export default function FormularioCiudadanoPage() {
  const { id } = useParams<{ id?: string }>();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const volverA = searchParams.get('volverA');
  const esEdicion = Boolean(id);

  const [tipoDocumento, setTipoDocumento] = useState('CC');
  const [numeroDocumento, setNumeroDocumento] = useState('');
  const [nombreCompleto, setNombreCompleto] = useState('');
  const [telefono, setTelefono] = useState('');
  const [email, setEmail] = useState('');
  const [ciudad, setCiudad] = useState('');
  const [direccion, setDireccion] = useState('');

  const [duplicado, setDuplicado] = useState<BusquedaDocumentoResponse | null>(null);
  const [verificando, setVerificando] = useState(false);
  const [guardando, setGuardando] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [cargandoInicial, setCargandoInicial] = useState(esEdicion);

  // Carga los datos existentes si estamos editando
  useEffect(() => {
    if (!esEdicion || !id) return;
    getCiudadanoDetalle(Number(id))
      .then((c) => {
        setTipoDocumento(c.tipoDocumento);
        setNumeroDocumento(c.numeroDocumento);
        setNombreCompleto(c.nombreCompleto);
        setTelefono(c.telefono ?? '');
        setEmail(c.email ?? '');
        setCiudad(c.ciudad ?? '');
        setDireccion(c.direccion ?? '');
      })
      .finally(() => setCargandoInicial(false));
  }, [esEdicion, id]);

  // Verificación de duplicados en tiempo real (solo al crear, con debounce)
  useEffect(() => {
    if (esEdicion || numeroDocumento.trim().length < 5) {
      setDuplicado(null);
      return;
    }
    setVerificando(true);
    const timeout = setTimeout(() => {
      buscarPorDocumento(numeroDocumento.trim())
        .then(setDuplicado)
        .finally(() => setVerificando(false));
    }, 500);
    return () => clearTimeout(timeout);
  }, [numeroDocumento, esEdicion]);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);

    if (duplicado?.existe) {
      setError('Ya existe un ciudadano con ese número de documento — no se puede crear un duplicado.');
      return;
    }

    setGuardando(true);
    try {
      if (esEdicion && id) {
        await actualizarCiudadano(Number(id), { nombreCompleto, telefono, email, ciudad, direccion });
        navigate(`/ciudadanos/${id}`);
      } else {
        const creado = await crearCiudadano({
          tipoDocumento,
          numeroDocumento,
          nombreCompleto,
          telefono,
          email,
          ciudad,
          direccion,
        });
        const nuevoId = (creado as any).id;
        if (volverA) {
          const separador = volverA.includes('?') ? '&' : '?';
          navigate(`${volverA}${separador}ciudadanoId=${nuevoId}`);
        } else {
          navigate(`/ciudadanos/${nuevoId}`);
        }
      }
    } catch (err: any) {
      if (err?.response?.status === 409) {
        setError(err.response.data?.mensaje ?? 'Ya existe un ciudadano con ese documento.');
      } else {
        setError(err?.response?.data?.mensaje ?? 'No se pudo guardar. Intenta de nuevo.');
      }
    } finally {
      setGuardando(false);
    }
  }

  const color = useColorProyectoActivo();

  return (
    <div
      className="flex min-h-screen bg-paper"
      style={{ '--color-accento': color.primario, '--color-accento-claro': color.primarioClaro } as React.CSSProperties}
    >
      <Sidebar active="ciudadanos" />

      <main className="flex-1 px-[38px] py-7 overflow-y-auto max-w-[820px]">
        <div className="flex items-center gap-1.5 text-xs text-ink-400 mb-3.5">
          <Link to="/ciudadanos" className="hover:text-ink-600">Ciudadanos</Link>
          <span>/</span>
          <span className="text-ink-900 font-semibold">{esEdicion ? 'Editar ciudadano' : 'Nuevo ciudadano'}</span>
        </div>

        <h1 className="font-display text-xl font-semibold text-ink-900 mb-1.5">
          {esEdicion ? 'Editar ciudadano' : 'Nuevo ciudadano'}
        </h1>
        <p className="text-ink-600 text-[13px] mb-5">
          {esEdicion
            ? 'Actualiza los datos de contacto de este ciudadano.'
            : 'Verifica primero que no exista ya en el sistema — es una entidad global compartida entre proyectos.'}
        </p>

        {cargandoInicial ? (
          <div className="text-center text-sm text-ink-400 py-10">Cargando...</div>
        ) : (
          <>
            {!esEdicion && (
              <div className="flex gap-3 bg-[#fdf3e7] border border-[#f4dfb8] rounded-xl px-5 py-4 mb-5">
                <svg viewBox="0 0 24 24" fill="none" strokeWidth="1.8" className="w-[18px] h-[18px] stroke-[#96631a] shrink-0 mt-0.5">
                  <circle cx="12" cy="12" r="9" /><path d="M12 8v5M12 16h.01" />
                </svg>
                <p className="text-[12.5px] text-[#7a5111] leading-relaxed">
                  Este ciudadano puede ya existir por su actividad en otro proyecto SYC. Al ingresar el documento, el sistema verificará automáticamente antes de crear un registro duplicado.
                </p>
              </div>
            )}

            {duplicado?.existe && (
              <div className="flex items-center justify-between gap-3 bg-red-50 border border-red-200 rounded-xl px-5 py-4 mb-5">
                <p className="text-[12.5px] text-red-700">
                  Ya existe un ciudadano con este documento: <b>{duplicado.ciudadano?.nombreCompleto}</b>.
                </p>
                <button
                  type="button"
                  onClick={() => navigate(`/ciudadanos/${duplicado.ciudadano?.id}`)}
                  className="text-[12px] font-semibold text-red-700 underline shrink-0"
                >
                  Ver ficha existente
                </button>
              </div>
            )}

            <form onSubmit={handleSubmit}>
              <div className="bg-white border border-line rounded-[14px] p-6 mb-5">
                <h3 className="font-display text-[15px] font-semibold text-ink-900 mb-4">Identificación</h3>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-semibold text-ink-900 mb-1.5">Tipo de documento</label>
                    <select
                      value={tipoDocumento}
                      onChange={(e) => setTipoDocumento(e.target.value)}
                      disabled={esEdicion}
                      className="w-full py-2.5 px-3 border-[1.5px] border-line rounded-[9px] text-[13px] outline-none disabled:bg-paper disabled:text-ink-400"
                    >
                      {TIPOS_DOCUMENTO.map((t) => (
                        <option key={t.value} value={t.value}>{t.label}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-ink-900 mb-1.5">Número de documento</label>
                    <div className="relative">
                      <input
                        value={numeroDocumento}
                        onChange={(e) => setNumeroDocumento(e.target.value)}
                        disabled={esEdicion}
                        required
                        placeholder="1098765432"
                        className="w-full py-2.5 px-3 border-[1.5px] border-line rounded-[9px] text-[13px] outline-none disabled:bg-paper disabled:text-ink-400"
                      />
                      {verificando && (
                        <span className="absolute right-3 top-1/2 -translate-y-1/2 text-[11px] text-ink-400">
                          Verificando...
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              </div>

              <div className="bg-white border border-line rounded-[14px] p-6 mb-5">
                <h3 className="font-display text-[15px] font-semibold text-ink-900 mb-4">Datos personales</h3>
                <div className="mb-4">
                  <label className="block text-xs font-semibold text-ink-900 mb-1.5">Nombre completo</label>
                  <input
                    value={nombreCompleto}
                    onChange={(e) => setNombreCompleto(e.target.value)}
                    required
                    placeholder="Nombre y apellidos"
                    className="w-full py-2.5 px-3 border-[1.5px] border-line rounded-[9px] text-[13px] outline-none focus:border-blue-500"
                  />
                </div>
                <div className="grid grid-cols-2 gap-4 mb-4">
                  <div>
                    <label className="block text-xs font-semibold text-ink-900 mb-1.5">Teléfono</label>
                    <input
                      value={telefono}
                      onChange={(e) => setTelefono(e.target.value)}
                      placeholder="300 000 0000"
                      className="w-full py-2.5 px-3 border-[1.5px] border-line rounded-[9px] text-[13px] outline-none focus:border-blue-500"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-ink-900 mb-1.5">Correo electrónico</label>
                    <input
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="correo@ejemplo.com"
                      className="w-full py-2.5 px-3 border-[1.5px] border-line rounded-[9px] text-[13px] outline-none focus:border-blue-500"
                    />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-semibold text-ink-900 mb-1.5">Ciudad</label>
                    <input
                      value={ciudad}
                      onChange={(e) => setCiudad(e.target.value)}
                      placeholder="Bucaramanga"
                      className="w-full py-2.5 px-3 border-[1.5px] border-line rounded-[9px] text-[13px] outline-none focus:border-blue-500"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-ink-900 mb-1.5">Dirección</label>
                    <input
                      value={direccion}
                      onChange={(e) => setDireccion(e.target.value)}
                      placeholder="Cra 27 #45-12"
                      className="w-full py-2.5 px-3 border-[1.5px] border-line rounded-[9px] text-[13px] outline-none focus:border-blue-500"
                    />
                  </div>
                </div>
              </div>

              {error && (
                <div className="mb-5 text-[12.5px] text-red-600 bg-red-50 border border-red-200 rounded-lg px-4 py-3">
                  {error}
                </div>
              )}

              <div className="flex justify-end gap-2.5">
                <button
                  type="button"
                  onClick={() => navigate(-1)}
                  className="px-5 py-2.5 rounded-[9px] border border-line text-ink-600 text-sm font-medium"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={guardando || (duplicado?.existe ?? false)}
                  className="flex items-center gap-2 px-5 py-2.5 rounded-[9px] bg-[var(--color-accento)] text-white text-sm font-semibold disabled:opacity-60"
                >
                  {guardando ? 'Guardando...' : 'Guardar ciudadano'}
                  {!guardando && (
                    <svg viewBox="0 0 24 24" fill="none" strokeWidth="2.5" className="w-[13px] h-[13px] stroke-white">
                      <path d="M5 12l4 4 10-10" />
                    </svg>
                  )}
                </button>
              </div>
            </form>
          </>
        )}
      </main>
    </div>
  );
}