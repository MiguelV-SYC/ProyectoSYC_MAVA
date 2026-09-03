import axios from 'axios';

const API_URL = 'http://localhost:5158/api';

export interface VehiculoResponseDto {
  id: number;
  ciudadanoId?: number;
  ciudadanoNombre?: string;
  ciudadanoDocumento?: string;
  empresaId?: number;
  empresaNombre?: string;
  empresaNit?: string;
  placa: string;
  marca?: string;
  linea?: string;
  modelo?: number;
  numeroChasis?: string;

  cilindraje?: string;
  tipoVehiculo?: string;
  subtipo?: string;
  municipioMatricula?: string;
  departamentoMatricula?: string;
  blindado: boolean;
  esClasicoAntiguo: boolean;
}

function authHeader() {
  const saved = localStorage.getItem('sgds_auth_user');
  const token = saved ? JSON.parse(saved).token : null;
  return { Authorization: `Bearer ${token}` };
}

export async function getVehiculos(params: { proyectoId?: number } = {}): Promise<VehiculoResponseDto[]> {
  const { data } = await axios.get<VehiculoResponseDto[]>(`${API_URL}/Vehiculos`, {
    params,
    headers: authHeader(),
  });
  return data;
}

export async function getVehiculoDetalle(id: number): Promise<VehiculoResponseDto> {
  const { data } = await axios.get<VehiculoResponseDto>(`${API_URL}/Vehiculos/${id}`, {
    headers: authHeader(),
  });
  return data;
}

export interface CrearVehiculoDto {
  ciudadanoId?: number;
  empresaId?: number;
  placa: string;
  marca?: string;
  linea?: string;
  modelo?: number;
  numeroChasis?: string;

  cilindraje?: string;
  tipoVehiculo?: string;
  subtipo?: string;
  municipioMatricula?: string;
  departamentoMatricula?: string;
  blindado: boolean;
  esClasicoAntiguo: boolean;
}

export async function crearVehiculo(dto: CrearVehiculoDto): Promise<VehiculoResponseDto> {
  const { data } = await axios.post<VehiculoResponseDto>(`${API_URL}/Vehiculos`, dto, {
    headers: authHeader(),
  });
  return data;
}

export async function actualizarVehiculo(id: number, dto: CrearVehiculoDto): Promise<void> {
  await axios.put(`${API_URL}/Vehiculos/${id}`, dto, { headers: authHeader() });
}

// Catálogo Tipo -> Subtipos de vehículo, alimentado en vivo desde la tabla de bases gravables
// (Reglas_de_negocio_IUVA.md) — no se hardcodea en el frontend. subtipoInformativo=true significa
// que la tabla oficial no distingue ese subtipo (es una categoría descriptiva del documento de
// reglas de negocio) — en ese caso NO se envía como filtro a catálogo-marcas/catálogo-lineas.
export interface TipoVehiculoCatalogoDto {
  tipo: string;
  subtipos: string[];
  subtipoInformativo: boolean;
}

export async function getCatalogoTiposVehiculo(): Promise<TipoVehiculoCatalogoDto[]> {
  const { data } = await axios.get<TipoVehiculoCatalogoDto[]>(`${API_URL}/Vehiculos/catalogo-tipos`, {
    headers: authHeader(),
  });
  return data;
}

export async function getCatalogoMarcasVehiculo(tipo: string, subtipo?: string): Promise<string[]> {
  const { data } = await axios.get<string[]>(`${API_URL}/Vehiculos/catalogo-marcas`, {
    params: { tipo, subtipo: subtipo || undefined },
    headers: authHeader(),
  });
  return data;
}

// Línea con los cilindrajes reales que trae la tabla para ese nombre comercial — casi siempre
// uno solo (se autocompleta), a veces varios (el formulario deja elegir entre esos, no a mano).
export interface LineaVehiculoCatalogoDto {
  linea: string;
  cilindrajes: string[];
}

export async function getCatalogoLineasVehiculo(tipo: string, marca: string, subtipo?: string): Promise<LineaVehiculoCatalogoDto[]> {
  const { data } = await axios.get<LineaVehiculoCatalogoDto[]>(`${API_URL}/Vehiculos/catalogo-lineas`, {
    params: { tipo, marca, subtipo: subtipo || undefined },
    headers: authHeader(),
  });
  return data;
}

// Base gravable IUVA (Ley 488/1998 Art. 143) — vista no editable en el paso "4. Base gravable"
// de la solicitud; se recalcula si cambia vehiculoNuevo/valorCompra.
export interface BaseGravableVehiculoDto {
  soportado: boolean;
  motivoNoSoportado?: string;
  valorTabla?: number;
  valorAjustado?: number;
  aplicaBlindaje: boolean;
  aplicaClasicoAntiguo: boolean;
  esValorCompra: boolean;
}

export async function getBaseGravableVehiculo(
  id: number,
  params: { vehiculoNuevo: boolean; valorCompra?: number }
): Promise<BaseGravableVehiculoDto> {
  const { data } = await axios.get<BaseGravableVehiculoDto>(`${API_URL}/Vehiculos/${id}/base-gravable`, {
    params,
    headers: authHeader(),
  });
  return data;
}
