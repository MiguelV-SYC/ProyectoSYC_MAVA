import { useState, useEffect, type FormEvent } from 'react';
import { useParams, useNavigate, useSearchParams, Link } from 'react-router-dom';
import Sidebar from '../components/layout/Sidebar';
import {
  crearVehiculo,
  actualizarVehiculo,
  getVehiculoDetalle,
  getCatalogoTiposVehiculo,
  getCatalogoMarcasVehiculo,
  getCatalogoLineasVehiculo,
  type TipoVehiculoCatalogoDto,
  type LineaVehiculoCatalogoDto,
} from '../services/vehiculoService';
import { getCiudadanos, type CiudadanoResponseDto } from '../services/ciudadanoService';
import { getEmpresas, type EmpresaResponseDto } from '../services/empresaService';
import { useColorProyectoActivo } from '../hooks/useColorProyectoActivo';
import { DEPARTAMENTOS_COLOMBIA } from '../config/geografiaColombia';
import BuscadorMunicipio from '../components/infoconsumo/BuscadorMunicipio';

type TipoPropietario = 'ciudadano' | 'empresa';

export default function FormularioVehiculoPage() {
  const { id } = useParams<{ id?: string }>();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const volverA = searchParams.get('volverA');
  const proyectoId = searchParams.get('proyectoId');
  const esEdicion = Boolean(id);

  const [placa, setPlaca] = useState('');
  const [marca, setMarca] = useState('');
  const [linea, setLinea] = useState('');
  const [modelo, setModelo] = useState('');
  const [numeroChasis, setNumeroChasis] = useState('');

  // Características IUVA (Reglas_de_negocio_IUVA.md) — atributos fijos del vehículo: se marcan
  // una sola vez aquí y se heredan en cada solicitud de IUVA, no se repiten por radicación.
  const [cilindraje, setCilindraje] = useState('');
  const [tipoVehiculo, setTipoVehiculo] = useState('');
  const [subtipo, setSubtipo] = useState('');
  const [municipioMatricula, setMunicipioMatricula] = useState('');
  const [departamentoMatricula, setDepartamentoMatricula] = useState('');
  const [blindado, setBlindado] = useState(false);
  const [esClasicoAntiguo, setEsClasicoAntiguo] = useState(false);
  const [catalogoTipos, setCatalogoTipos] = useState<TipoVehiculoCatalogoDto[]>([]);
  const [catalogoMarcas, setCatalogoMarcas] = useState<string[]>([]);
  const [catalogoLineas, setCatalogoLineas] = useState<LineaVehiculoCatalogoDto[]>([]);

  useEffect(() => {
    getCatalogoTiposVehiculo().then(setCatalogoTipos).catch(() => setCatalogoTipos([]));
  }, []);

  const tipoInfo = catalogoTipos.find((t) => t.tipo === tipoVehiculo);
  const subtiposDisponibles = tipoInfo?.subtipos ?? [];
  const subtipoEsInformativo = tipoInfo?.subtipoInformativo ?? false;

  // Marca depende de Tipo (+Subtipo cuando la tabla oficial sí lo distingue) — Línea depende
  // además de Marca. Estos efectos solo TRAEN las opciones; el reseteo de los campos
  // dependientes ocurre en los onChange (elegirTipo/elegirSubtipo/elegirMarca), nunca aquí, para
  // no borrar los valores ya guardados al cargar un vehículo existente en modo edición.
  useEffect(() => {
    if (!tipoVehiculo) { setCatalogoMarcas([]); return; }
    getCatalogoMarcasVehiculo(tipoVehiculo, subtipo || undefined).then(setCatalogoMarcas).catch(() => setCatalogoMarcas([]));
  }, [tipoVehiculo, subtipo]);

  useEffect(() => {
    if (!tipoVehiculo || !marca) { setCatalogoLineas([]); return; }
    getCatalogoLineasVehiculo(tipoVehiculo, marca, subtipo || undefined).then(setCatalogoLineas).catch(() => setCatalogoLineas([]));
  }, [tipoVehiculo, subtipo, marca]);

  // Cilindrajes reales de la línea elegida: casi siempre uno solo (se autocompleta y se
  // bloquea), a veces varios (ej. "CLIO (LINEA BASE ESTANDAR)" en 1200/1400/1600cc — ahí el
  // campo se vuelve un select en vez de adivinar), o ninguno (queda libre para digitar).
  const cilindrajesDeLinea = catalogoLineas.find((l) => l.linea === linea)?.cilindrajes ?? [];

  function elegirTipo(nuevoTipo: string) {
    setTipoVehiculo(nuevoTipo);
    setSubtipo('');
    setMarca('');
    setLinea('');
    setCilindraje('');
  }

  function elegirSubtipo(nuevoSubtipo: string) {
    setSubtipo(nuevoSubtipo);
    setMarca('');
    setLinea('');
    setCilindraje('');
  }

  function elegirMarca(nuevaMarca: string) {
    setMarca(nuevaMarca);
    setLinea('');
    setCilindraje('');
  }

  function elegirLinea(nuevaLinea: string) {
    setLinea(nuevaLinea);
    const cilindrajes = catalogoLineas.find((l) => l.linea === nuevaLinea)?.cilindrajes ?? [];
    setCilindraje(cilindrajes.length === 1 ? cilindrajes[0] : '');
  }

  const [tipoPropietario, setTipoPropietario] = useState<TipoPropietario>('ciudadano');
  const [busquedaPropietario, setBusquedaPropietario] = useState('');
  const [resultadosCiudadanos, setResultadosCiudadanos] = useState<CiudadanoResponseDto[]>([]);
  const [resultadosEmpresas, setResultadosEmpresas] = useState<EmpresaResponseDto[]>([]);
  const [ciudadanoSeleccionado, setCiudadanoSeleccionado] = useState<CiudadanoResponseDto | null>(null);
  const [empresaSeleccionada, setEmpresaSeleccionada] = useState<EmpresaResponseDto | null>(null);

  const [guardando, setGuardando] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [cargandoInicial, setCargandoInicial] = useState(esEdicion);

  const volverAFicha = (vehiculoId: number) =>
    `/vehiculos/${vehiculoId}${proyectoId ? `?proyectoId=${proyectoId}` : ''}`;

  // Carga los datos existentes si estamos editando
  useEffect(() => {
    if (!esEdicion || !id) return;
    getVehiculoDetalle(Number(id))
      .then((v) => {
        setPlaca(v.placa);
        setMarca(v.marca ?? '');
        setLinea(v.linea ?? '');
        setModelo(v.modelo != null ? String(v.modelo) : '');
        setNumeroChasis(v.numeroChasis ?? '');
        setCilindraje(v.cilindraje ?? '');
        setTipoVehiculo(v.tipoVehiculo ?? '');
        setSubtipo(v.subtipo ?? '');
        setMunicipioMatricula(v.municipioMatricula ?? '');
        setDepartamentoMatricula(v.departamentoMatricula ?? '');
        setBlindado(v.blindado);
        setEsClasicoAntiguo(v.esClasicoAntiguo);
        if (v.ciudadanoId) {
          setTipoPropietario('ciudadano');
          setCiudadanoSeleccionado({
            id: v.ciudadanoId,
            tipoDocumento: '',
            numeroDocumento: v.ciudadanoDocumento?.split(' ').slice(1).join(' ') ?? '',
            nombreCompleto: v.ciudadanoNombre ?? '',
            proyectosConActividad: [],
            totalSolicitudes: 0,
          });
        } else if (v.empresaId) {
          setTipoPropietario('empresa');
          setEmpresaSeleccionada({
            id: v.empresaId,
            nit: v.empresaNit ?? '',
            digitoVerificacion: '',
            razonSocial: v.empresaNombre ?? '',
            proyectosConActividad: [],
            totalSolicitudes: 0,
            tieneLogo: false,
          });
        }
      })
      .finally(() => setCargandoInicial(false));
  }, [esEdicion, id]);

  // Búsqueda de propietario con debounce
  useEffect(() => {
    if (busquedaPropietario.trim().length < 3) {
      setResultadosCiudadanos([]);
      setResultadosEmpresas([]);
      return;
    }
    const timeout = setTimeout(() => {
      if (tipoPropietario === 'ciudadano') {
        getCiudadanos({ buscar: busquedaPropietario, pagina: 1, tamanoPagina: 5 }).then((res) =>
          setResultadosCiudadanos(res.datos)
        );
      } else {
        getEmpresas({ buscar: busquedaPropietario, pagina: 1, tamanoPagina: 5 }).then((res) =>
          setResultadosEmpresas(res.datos)
        );
      }
    }, 400);
    return () => clearTimeout(timeout);
  }, [busquedaPropietario, tipoPropietario]);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);

    if (!placa.trim()) {
      setError('La placa es obligatoria.');
      return;
    }

    const dto = {
      placa: placa.trim().toUpperCase(),
      marca: marca || undefined,
      linea: linea || undefined,
      modelo: modelo ? Number(modelo) : undefined,
      numeroChasis: numeroChasis || undefined,
      ciudadanoId: ciudadanoSeleccionado?.id,
      empresaId: empresaSeleccionada?.id,
      cilindraje: cilindraje || undefined,
      tipoVehiculo: tipoVehiculo || undefined,
      subtipo: subtipo || undefined,
      municipioMatricula: municipioMatricula || undefined,
      departamentoMatricula: departamentoMatricula || undefined,
      blindado,
      esClasicoAntiguo,
    };

    setGuardando(true);
    try {
      if (esEdicion && id) {
        await actualizarVehiculo(Number(id), dto);
        navigate(volverAFicha(Number(id)));
      } else {
        const creado = await crearVehiculo(dto);
        if (volverA) {
          const separador = volverA.includes('?') ? '&' : '?';
          navigate(`${volverA}${separador}vehiculoId=${creado.id}`);
        } else {
          navigate(volverAFicha(creado.id));
        }
      }
    } catch (err: any) {
      setError(err?.response?.data?.mensaje ?? 'No se pudo guardar el vehículo. Intenta de nuevo.');
    } finally {
      setGuardando(false);
    }
  }

  const color = useColorProyectoActivo();
  const propietarioSeleccionado = ciudadanoSeleccionado ?? empresaSeleccionada;

  return (
    <div
      className="flex min-h-screen bg-paper"
      style={{ '--color-accento': color.primario, '--color-accento-claro': color.primarioClaro } as React.CSSProperties}
    >
      <Sidebar active="solicitudes" />

      <main className="flex-1 px-4 md:px-[38px] py-7 pt-16 md:pt-7 overflow-y-auto max-w-[820px]">
        <div className="flex items-center gap-1.5 text-xs text-ink-400 mb-3.5">
          <Link to={proyectoId ? `/vehiculos?proyectoId=${proyectoId}` : '/vehiculos'} className="hover:text-ink-600">
            Vehículos
          </Link>
          <span>/</span>
          <span className="text-ink-900 font-semibold">{esEdicion ? 'Editar vehículo' : 'Nuevo vehículo'}</span>
        </div>

        <h1 className="font-display text-xl font-semibold text-ink-900 mb-1.5">
          {esEdicion ? 'Editar vehículo' : 'Nuevo vehículo'}
        </h1>
        <p className="text-ink-600 text-[13px] mb-5">
          {esEdicion
            ? 'Actualiza los datos del vehículo y, si aplica, su propietario.'
            : 'Registra un vehículo por placa y vincula opcionalmente a su propietario.'}
        </p>

        {cargandoInicial ? (
          <div className="text-center text-sm text-ink-400 py-10">Cargando...</div>
        ) : (
          <form onSubmit={handleSubmit}>
            <div className="bg-white border border-line rounded-[14px] p-6 mb-5">
              <h3 className="font-display text-[15px] font-semibold text-ink-900 mb-4">Datos del vehículo</h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-4">
                <div>
                  <label className="block text-xs font-semibold text-ink-900 mb-1.5">Placa</label>
                  <input
                    value={placa}
                    onChange={(e) => setPlaca(e.target.value)}
                    disabled={esEdicion}
                    required
                    placeholder="EBH342"
                    className="w-full py-2.5 px-3 border-[1.5px] border-line rounded-[9px] text-[13px] outline-none uppercase disabled:bg-paper disabled:text-ink-400"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-ink-900 mb-1.5">Número de chasis</label>
                  <input
                    value={numeroChasis}
                    onChange={(e) => setNumeroChasis(e.target.value)}
                    placeholder="9BWZZZ377VT004251"
                    className="w-full py-2.5 px-3 border-[1.5px] border-line rounded-[9px] text-[13px] outline-none focus:border-blue-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-4">
                <div>
                  <label className="block text-xs font-semibold text-ink-900 mb-1.5">Tipo de vehículo</label>
                  <select
                    value={tipoVehiculo}
                    onChange={(e) => elegirTipo(e.target.value)}
                    className="w-full py-2.5 px-3 border-[1.5px] border-line rounded-[9px] text-[13px] outline-none focus:border-blue-500"
                  >
                    <option value="">Selecciona un tipo</option>
                    {catalogoTipos.map((t) => <option key={t.tipo} value={t.tipo}>{t.tipo}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-ink-900 mb-1.5">
                    Subtipo {subtipoEsInformativo && <span className="font-normal text-ink-400">(informativo, no filtra la tabla oficial)</span>}
                  </label>
                  <select
                    value={subtipo}
                    onChange={(e) => elegirSubtipo(e.target.value)}
                    disabled={!tipoVehiculo}
                    className="w-full py-2.5 px-3 border-[1.5px] border-line rounded-[9px] text-[13px] outline-none focus:border-blue-500 disabled:bg-paper disabled:text-ink-400"
                  >
                    <option value="">{tipoVehiculo ? 'Selecciona un subtipo' : 'Elige primero el tipo'}</option>
                    {subtiposDisponibles.map((s) => <option key={s} value={s}>{s}</option>)}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-ink-900 mb-1.5">Marca</label>
                  <select
                    value={marca}
                    onChange={(e) => elegirMarca(e.target.value)}
                    disabled={!tipoVehiculo}
                    className="w-full py-2.5 px-3 border-[1.5px] border-line rounded-[9px] text-[13px] outline-none focus:border-blue-500 disabled:bg-paper disabled:text-ink-400"
                  >
                    <option value="">{tipoVehiculo ? 'Selecciona una marca' : 'Elige primero el tipo'}</option>
                    {catalogoMarcas.map((m) => <option key={m} value={m}>{m}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-ink-900 mb-1.5">Línea</label>
                  <select
                    value={linea}
                    onChange={(e) => elegirLinea(e.target.value)}
                    disabled={!marca}
                    className="w-full py-2.5 px-3 border-[1.5px] border-line rounded-[9px] text-[13px] outline-none focus:border-blue-500 disabled:bg-paper disabled:text-ink-400"
                  >
                    <option value="">{marca ? 'Selecciona una línea' : 'Elige primero la marca'}</option>
                    {catalogoLineas.map((l) => <option key={l.linea} value={l.linea}>{l.linea}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-ink-900 mb-1.5">Modelo (año)</label>
                  <input
                    type="number"
                    value={modelo}
                    onChange={(e) => setModelo(e.target.value)}
                    placeholder="2021"
                    className="w-full py-2.5 px-3 border-[1.5px] border-line rounded-[9px] text-[13px] outline-none focus:border-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-ink-900 mb-1.5">
                    Cilindraje {cilindrajesDeLinea.length === 1 && <span className="font-normal text-ink-400">(autocompletado)</span>}
                  </label>
                  {cilindrajesDeLinea.length > 1 ? (
                    <select
                      value={cilindraje}
                      onChange={(e) => setCilindraje(e.target.value)}
                      className="w-full py-2.5 px-3 border-[1.5px] border-line rounded-[9px] text-[13px] outline-none focus:border-blue-500"
                    >
                      <option value="">Esta línea tiene varias motorizaciones — elige una</option>
                      {cilindrajesDeLinea.map((c) => <option key={c} value={c}>{c}</option>)}
                    </select>
                  ) : (
                    <input
                      value={cilindraje}
                      onChange={(e) => setCilindraje(e.target.value)}
                      disabled={cilindrajesDeLinea.length === 1}
                      placeholder={linea ? '—' : 'Elige primero la línea'}
                      className="w-full py-2.5 px-3 border-[1.5px] border-line rounded-[9px] text-[13px] outline-none focus:border-blue-500 disabled:bg-paper disabled:text-ink-600 disabled:font-semibold"
                    />
                  )}
                </div>
              </div>
            </div>

            <div className="bg-white border border-line rounded-[14px] p-6 mb-5">
              <h3 className="font-display text-[15px] font-semibold text-ink-900 mb-1">Características IUVA</h3>
              <p className="text-[12px] text-ink-400 mb-4">
                Ajustan la base gravable calculada — blindaje suma un recargo, matrícula determina jurisdicción.
              </p>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-4">
                <div>
                  <label className="block text-xs font-semibold text-ink-900 mb-1.5">Departamento de matrícula</label>
                  <select
                    value={departamentoMatricula}
                    onChange={(e) => { setDepartamentoMatricula(e.target.value); setMunicipioMatricula(''); }}
                    className="w-full py-2.5 px-3 border-[1.5px] border-line rounded-[9px] text-[13px] outline-none focus:border-blue-500"
                  >
                    <option value="">Selecciona un departamento</option>
                    {DEPARTAMENTOS_COLOMBIA.map((d) => <option key={d} value={d}>{d}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-ink-900 mb-1.5">Municipio de matrícula</label>
                  <BuscadorMunicipio
                    departamento={departamentoMatricula}
                    value={municipioMatricula}
                    onChange={setMunicipioMatricula}
                    placeholder={departamentoMatricula ? 'Ej: Bucaramanga' : 'Elige primero el departamento'}
                  />
                </div>
              </div>
              <div className="flex gap-5">
                <label className="flex items-center gap-2 text-[13px] font-medium text-ink-900">
                  <input type="checkbox" checked={blindado} onChange={(e) => setBlindado(e.target.checked)} className="w-4 h-4" />
                  Es blindado
                </label>
                <label className="flex items-center gap-2 text-[13px] font-medium text-ink-900">
                  <input type="checkbox" checked={esClasicoAntiguo} onChange={(e) => setEsClasicoAntiguo(e.target.checked)} className="w-4 h-4" />
                  Es antiguo o clásico (placa azul/blanco)
                </label>
              </div>
            </div>

            <div className="bg-white border border-line rounded-[14px] p-6 mb-5">
              <h3 className="font-display text-[15px] font-semibold text-ink-900 mb-4">Propietario (opcional)</h3>

              {propietarioSeleccionado ? (
                <div className="flex items-center gap-3 bg-[var(--color-accento-claro)] border border-[var(--color-accento)] rounded-xl px-3.5 py-3">
                  <div className="w-8 h-8 rounded-lg bg-[var(--color-accento)] text-white flex items-center justify-center text-xs font-bold shrink-0">
                    {(ciudadanoSeleccionado?.nombreCompleto ?? empresaSeleccionada?.razonSocial ?? '')
                      .split(' ').slice(0, 2).map((p) => p[0]).join('').toUpperCase()}
                  </div>
                  <div className="flex-1">
                    <div className="text-[13px] font-semibold text-ink-900">
                      {ciudadanoSeleccionado?.nombreCompleto ?? empresaSeleccionada?.razonSocial}
                    </div>
                    <div className="text-[11px] text-ink-600">
                      {ciudadanoSeleccionado
                        ? `Documento ${ciudadanoSeleccionado.numeroDocumento}`
                        : `NIT ${empresaSeleccionada?.nit}`}
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => { setCiudadanoSeleccionado(null); setEmpresaSeleccionada(null); setBusquedaPropietario(''); }}
                    className="text-[12px] font-semibold text-ink-600"
                  >
                    Quitar
                  </button>
                </div>
              ) : (
                <>
                  <div className="flex gap-1.5 mb-3.5">
                    {(['ciudadano', 'empresa'] as TipoPropietario[]).map((t) => (
                      <button
                        key={t}
                        type="button"
                        onClick={() => { setTipoPropietario(t); setBusquedaPropietario(''); }}
                        className={`text-xs font-semibold px-3.5 py-2 rounded-full ${
                          tipoPropietario === t ? 'bg-[#0f172a] text-white' : 'bg-paper border border-line text-ink-600'
                        }`}
                      >
                        {t === 'ciudadano' ? 'Persona natural' : 'Empresa'}
                      </button>
                    ))}
                  </div>

                  <div className="flex items-center gap-2 bg-paper border border-line rounded-[9px] px-3 py-2.5 mb-3">
                    <svg viewBox="0 0 24 24" fill="none" strokeWidth="2" className="w-4 h-4 stroke-ink-400 shrink-0">
                      <circle cx="11" cy="11" r="7" /><path d="M21 21l-4-4" />
                    </svg>
                    <input
                      value={busquedaPropietario}
                      onChange={(e) => setBusquedaPropietario(e.target.value)}
                      placeholder={tipoPropietario === 'ciudadano' ? 'Buscar por documento o nombre' : 'Buscar por razón social o NIT'}
                      className="border-none outline-none bg-transparent text-[13px] w-full font-body"
                    />
                  </div>

                  {tipoPropietario === 'ciudadano'
                    ? resultadosCiudadanos.map((c) => (
                        <button
                          key={c.id}
                          type="button"
                          onClick={() => setCiudadanoSeleccionado(c)}
                          className="w-full flex items-center gap-3 rounded-xl px-3.5 py-3 mb-1.5 text-left bg-paper border border-line"
                        >
                          <div className="w-8 h-8 rounded-lg bg-blue-100 text-blue-600 flex items-center justify-center text-xs font-bold shrink-0">
                            {c.nombreCompleto.split(' ').slice(0, 2).map((p) => p[0]).join('').toUpperCase()}
                          </div>
                          <div className="flex-1">
                            <div className="text-[13px] font-semibold text-ink-900">{c.nombreCompleto}</div>
                            <div className="text-[11px] text-ink-400">{c.tipoDocumento} {c.numeroDocumento}</div>
                          </div>
                        </button>
                      ))
                    : resultadosEmpresas.map((emp) => (
                        <button
                          key={emp.id}
                          type="button"
                          onClick={() => setEmpresaSeleccionada(emp)}
                          className="w-full flex items-center gap-3 rounded-xl px-3.5 py-3 mb-1.5 text-left bg-paper border border-line"
                        >
                          <div className="w-8 h-8 rounded-lg bg-blue-100 text-blue-600 flex items-center justify-center text-xs font-bold shrink-0">
                            {emp.razonSocial.split(' ').slice(0, 2).map((p) => p[0]).join('').toUpperCase()}
                          </div>
                          <div className="flex-1">
                            <div className="text-[13px] font-semibold text-ink-900">{emp.razonSocial}</div>
                            <div className="text-[11px] text-ink-400">NIT {emp.nit}-{emp.digitoVerificacion}</div>
                          </div>
                        </button>
                      ))}
                </>
              )}
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
                disabled={guardando}
                className="flex items-center gap-2 px-5 py-2.5 rounded-[9px] bg-[var(--color-accento)] text-white text-sm font-semibold disabled:opacity-60"
              >
                {guardando ? 'Guardando...' : 'Guardar vehículo'}
                {!guardando && (
                  <svg viewBox="0 0 24 24" fill="none" strokeWidth="2.5" className="w-[13px] h-[13px] stroke-white">
                    <path d="M5 12l4 4 10-10" />
                  </svg>
                )}
              </button>
            </div>
          </form>
        )}
      </main>
    </div>
  );
}
