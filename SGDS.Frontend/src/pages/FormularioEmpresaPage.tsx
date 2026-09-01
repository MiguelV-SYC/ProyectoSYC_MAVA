import { useState, useEffect, type FormEvent } from 'react';
import { useParams, useNavigate, useSearchParams } from 'react-router-dom';
import Sidebar from '../components/layout/Sidebar';
import {
  getEmpresaDetalle,
  buscarPorNit,
  crearEmpresa,
  actualizarEmpresa,
  subirLogoEmpresa,
  obtenerLogoEmpresaBlobUrl,
  type BusquedaNitResponse,
} from '../services/empresaService';
import { useColorProyectoActivo } from '../hooks/useColorProyectoActivo';

export default function FormularioEmpresaPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const volverA = searchParams.get('volverA');
  const esEdicion = Boolean(id);

  const [nit, setNit] = useState('');
  const [razonSocial, setRazonSocial] = useState('');
  const [representanteLegal, setRepresentanteLegal] = useState('');
  const [telefono, setTelefono] = useState('');
  const [correo, setCorreo] = useState('');
  const [ciudad, setCiudad] = useState('');
  const [direccion, setDireccion] = useState('');

  const [duplicado, setDuplicado] = useState<BusquedaNitResponse | null>(null);
  const [verificando, setVerificando] = useState(false);
  const [guardando, setGuardando] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [cargandoInicial, setCargandoInicial] = useState(esEdicion);
  const color = useColorProyectoActivo();

  const [logoUrl, setLogoUrl] = useState<string | null>(null);
  const [archivoLogo, setArchivoLogo] = useState<File | null>(null);
  const [subiendoLogo, setSubiendoLogo] = useState(false);
  const [errorLogo, setErrorLogo] = useState<string | null>(null);

  // Carga los datos existentes si estamos editando
  useEffect(() => {
    if (!esEdicion || !id) return;
    getEmpresaDetalle(Number(id))
      .then((e) => {
        setNit(`${e.nit}-${e.digitoVerificacion}`);
        setRazonSocial(e.razonSocial);
        setRepresentanteLegal(e.representanteLegal ?? '');
        setTelefono(e.telefono ?? '');
        setCorreo(e.correo ?? '');
        setCiudad(e.ciudad ?? '');
        setDireccion(e.direccion ?? '');
        if (e.tieneLogo) {
          obtenerLogoEmpresaBlobUrl(Number(id)).then(setLogoUrl).catch(() => {});
        }
      })
      .finally(() => setCargandoInicial(false));
  }, [esEdicion, id]);

  function handleSeleccionarLogo(archivo: File | null) {
    setArchivoLogo(archivo);
    setErrorLogo(null);
    if (archivo) {
      setLogoUrl(URL.createObjectURL(archivo));
    }
  }

  async function handleSubirLogo() {
    if (!archivoLogo || !id) return;
    setSubiendoLogo(true);
    setErrorLogo(null);
    try {
      await subirLogoEmpresa(Number(id), archivoLogo);
      setArchivoLogo(null);
    } catch {
      setErrorLogo('No se pudo subir el logo. Intenta de nuevo.');
    } finally {
      setSubiendoLogo(false);
    }
  }

  // Verificación de duplicados en tiempo real (solo al crear, con debounce)
  useEffect(() => {
    if (esEdicion || nit.trim().length < 6) {
      setDuplicado(null);
      return;
    }
    setVerificando(true);
    const timeout = setTimeout(() => {
      buscarPorNit(nit.trim())
        .then(setDuplicado)
        .finally(() => setVerificando(false));
    }, 500);
    return () => clearTimeout(timeout);
  }, [nit, esEdicion]);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);

    if (duplicado?.existe) {
      setError('Ya existe una empresa con ese NIT — no se puede crear un duplicado.');
      return;
    }

    setGuardando(true);
    try {
      if (esEdicion && id) {
        await actualizarEmpresa(Number(id), {
          razonSocial,
          representanteLegal,
          telefono,
          correo,
          ciudad,
          direccion,
        });
        navigate(`/empresas/${id}`);
      } else {
        const creada = await crearEmpresa({
          nit,
          razonSocial,
          representanteLegal,
          telefono,
          correo,
          ciudad,
          direccion,
        });
        const nuevoId = (creada as any).id;
        if (volverA) {
          const separador = volverA.includes('?') ? '&' : '?';
          navigate(`${volverA}${separador}empresaId=${nuevoId}`);
        } else {
          navigate(`/empresas/${nuevoId}`);
        }
      }
    } catch (err: any) {
      if (err?.response?.status === 409) {
        setError(err.response.data?.mensaje ?? 'Ya existe una empresa con ese NIT.');
      } else {
        setError(err?.response?.data?.mensaje ?? 'No se pudo guardar. Intenta de nuevo.');
      }
    } finally {
      setGuardando(false);
    }
  }

  if (cargandoInicial) {
    return (
      <div className="flex min-h-screen bg-paper">
        <Sidebar active="empresas" />
        <main className="flex-1 flex items-center justify-center text-sm text-ink-400">
          Cargando empresa...
        </main>
      </div>
    );
  }

  return (
    <div
      className="flex min-h-screen bg-paper"
      style={{ '--color-accento': color.primario, '--color-accento-claro': color.primarioClaro } as React.CSSProperties}
    >
      <Sidebar active="empresas" />

      <main className="flex-1 px-4 md:px-[38px] py-7 pt-16 md:pt-7 overflow-y-auto max-w-[900px]">
        <div className="flex items-center gap-1.5 text-xs text-ink-400 mb-3.5">
          <button onClick={() => navigate('/empresas')} className="hover:underline">
            Empresas
          </button>
          <span>/</span>
          <span className="text-ink-900 font-semibold">{esEdicion ? 'Editar empresa' : 'Nueva empresa'}</span>
        </div>

        <h1 className="font-display text-[22px] font-semibold text-ink-900 mb-1.5">
          {esEdicion ? 'Editar empresa' : 'Nueva empresa'}
        </h1>
        {!esEdicion && (
          <p className="text-ink-600 text-[12.5px] mb-5">
            Verifica primero que no exista ya en el sistema — es una entidad global compartida entre proyectos.
          </p>
        )}

        {!esEdicion && (
          <div className="flex items-start gap-2.5 bg-[#fdf3e7] border border-[#f4dfb8] rounded-xl px-4 py-3 mb-5">
            <svg viewBox="0 0 24 24" fill="none" strokeWidth="1.8" className="w-[18px] h-[18px] stroke-[#96631a] shrink-0 mt-0.5">
              <circle cx="12" cy="12" r="9" /><path d="M12 7v5l3 3" />
            </svg>
            <p className="text-[12.5px] text-[#7a5111]">
              Esta empresa puede ya existir por su actividad en otro proyecto SYC. Al ingresar el NIT, el sistema
              verificará automáticamente antes de crear un registro duplicado.
            </p>
          </div>
        )}

        <form onSubmit={handleSubmit} className="flex flex-col gap-5">
          <div className="bg-white border border-line rounded-[14px] p-5">
            <h3 className="font-display text-[13.5px] font-semibold text-ink-900 mb-4">Identificación</h3>
            <div>
              <label className="block text-xs font-semibold text-ink-900 mb-1.5">NIT</label>
              <input
                value={nit}
                onChange={(e) => setNit(e.target.value)}
                disabled={esEdicion}
                required
                placeholder="900123456"
                className="w-full py-2.5 px-3 border-[1.5px] border-line rounded-[9px] text-[13px] outline-none focus:border-blue-500 disabled:bg-paper disabled:text-ink-400"
              />
              {esEdicion && (
                <p className="text-[11px] text-ink-400 mt-1.5">El NIT no se puede modificar una vez creada la empresa.</p>
              )}
              {!esEdicion && verificando && (
                <p className="text-[11px] text-ink-400 mt-1.5">Verificando...</p>
              )}
              {!esEdicion && duplicado?.existe && (
                <p className="text-[11px] text-[#dc2626] mt-1.5 font-medium">
                  Ya existe: {duplicado.empresa?.razonSocial}
                </p>
              )}
            </div>
          </div>

          <div className="bg-white border border-line rounded-[14px] p-5">
            <h3 className="font-display text-[13.5px] font-semibold text-ink-900 mb-4">Datos de la empresa</h3>
            <div className="flex flex-col gap-3.5">
              <div>
                <label className="block text-xs font-semibold text-ink-900 mb-1.5">Razón social</label>
                <input
                  value={razonSocial}
                  onChange={(e) => setRazonSocial(e.target.value)}
                  required
                  placeholder="Nombre de la empresa"
                  className="w-full py-2.5 px-3 border-[1.5px] border-line rounded-[9px] text-[13px] outline-none focus:border-blue-500"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-ink-900 mb-1.5">Representante legal</label>
                <input
                  value={representanteLegal}
                  onChange={(e) => setRepresentanteLegal(e.target.value)}
                  placeholder="Nombre completo"
                  className="w-full py-2.5 px-3 border-[1.5px] border-line rounded-[9px] text-[13px] outline-none focus:border-blue-500"
                />
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
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
                    value={correo}
                    onChange={(e) => setCorreo(e.target.value)}
                    type="email"
                    placeholder="contacto@empresa.com"
                    className="w-full py-2.5 px-3 border-[1.5px] border-line rounded-[9px] text-[13px] outline-none focus:border-blue-500"
                  />
                </div>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
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
          </div>

          {esEdicion && id && (
            <div className="bg-white border border-line rounded-[14px] p-5">
              <h3 className="font-display text-[13.5px] font-semibold text-ink-900 mb-1">Logo</h3>
              <p className="text-[11.5px] text-ink-400 mb-4">
                Se usa en los documentos generados para esta empresa (ej. tornaguías) — PNG, JPG o SVG.
              </p>
              <div className="flex items-center gap-4">
                <div className="w-20 h-20 rounded-[10px] border border-line bg-paper flex items-center justify-center overflow-hidden shrink-0">
                  {logoUrl ? (
                    <img src={logoUrl} alt="Logo de la empresa" className="w-full h-full object-contain" />
                  ) : (
                    <svg viewBox="0 0 24 24" fill="none" strokeWidth="1.6" className="w-7 h-7 stroke-ink-400">
                      <rect x="3" y="3" width="18" height="18" rx="2" /><circle cx="9" cy="9" r="2" /><path d="M21 15l-5-5L5 21" />
                    </svg>
                  )}
                </div>
                <div className="flex-1 flex flex-col gap-2">
                  <input
                    type="file"
                    accept="image/png,image/jpeg,image/svg+xml,image/webp"
                    onChange={(e) => handleSeleccionarLogo(e.target.files?.[0] ?? null)}
                    className="text-[12.5px] text-ink-600"
                  />
                  {archivoLogo && (
                    <button
                      type="button"
                      onClick={handleSubirLogo}
                      disabled={subiendoLogo}
                      className="self-start py-1.5 px-3.5 rounded-[8px] bg-[var(--color-accento)] text-white text-[12px] font-semibold disabled:opacity-60"
                    >
                      {subiendoLogo ? 'Subiendo...' : 'Guardar logo'}
                    </button>
                  )}
                  {errorLogo && <p className="text-[11px] text-red-600">{errorLogo}</p>}
                </div>
              </div>
            </div>
          )}

          {error && (
            <div className="text-xs text-red-600 bg-red-50 border border-red-200 rounded-lg px-3 py-2">
              {error}
            </div>
          )}

          <div className="flex justify-end gap-2.5">
            <button
              type="button"
              onClick={() => navigate(esEdicion ? `/empresas/${id}` : '/empresas')}
              className="py-2.5 px-5 rounded-[9px] border border-line text-ink-600 text-sm font-medium"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={guardando || (!esEdicion && duplicado?.existe)}
              className="py-2.5 px-5 rounded-[9px] bg-[var(--color-accento)] text-white text-sm font-semibold disabled:opacity-60"
            >
              {guardando ? 'Guardando...' : 'Guardar empresa'}
            </button>
          </div>
        </form>
      </main>
    </div>
  );
}