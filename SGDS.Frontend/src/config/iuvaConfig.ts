// IUVA (impuesto de vehículos, Ley 488/1998) — Reglas_de_negocio_IUVA.md. El catálogo de Tipo/
// Subtipo de vehículo NO vive aquí: se pide en vivo a GET /api/Vehiculos/catalogo-tipos (ver
// vehiculoService.ts), alimentado desde la tabla de bases gravables ya importada — hardcodearlo
// en el frontend es justo el bug de catálogo-desincronizado que ya se corrigió hoy varias veces
// en GoTrace/Infoconsumo/SycTrace.

// La tabla del Ministerio de Transporte está en miles de pesos (ver BaseGravableVehiculo.cs) —
// se muestra en esa misma unidad, sin convertir, para poder verificar a mano contra el xlsx.
export function formatMilesDePesos(valor: number | null | undefined): string {
  if (valor == null) return '—';
  return `$ ${valor.toLocaleString('es-CO')} mil`;
}
