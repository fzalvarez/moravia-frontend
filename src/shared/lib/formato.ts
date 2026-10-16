// Formatos de presentación (moravia-backend/frontend/DATA_MAPPING.md §1).
// Los importes llegan como texto decimal y se formatean sin pasar por `number`.

const MESES = [
  "Enero", "Febrero", "Marzo", "Abril", "Mayo", "Junio",
  "Julio", "Agosto", "Septiembre", "Octubre", "Noviembre", "Diciembre",
];

/** "1234.5" → "S/ 1,234.50"; "-15.00" → "-S/ 15.00". */
export function formatImporte(valor: string): string {
  const negativo = valor.startsWith("-");
  const [entero, decimales = ""] = valor.replace(/^[-+]/, "").split(".");
  const conMiles = entero.replace(/\B(?=(\d{3})+(?!\d))/g, ",");
  return `${negativo ? "-" : ""}S/ ${conMiles}.${decimales.padEnd(2, "0").slice(0, 2)}`;
}

export function esImporteCero(valor: string): boolean {
  return /^[-+]?0*(\.0*)?$/.test(valor);
}

export function esImporteNegativo(valor: string): boolean {
  return valor.startsWith("-") && !esImporteCero(valor);
}

/** "2026-10-20" → "20/10/2026". */
export function formatFecha(fecha: string): string {
  const [anio, mes, dia] = fecha.split("-");
  return `${dia}/${mes}/${anio}`;
}

/** (2026, 10) → "Octubre 2026". */
export function nombrePeriodo(anio: number, mes: number): string {
  return `${MESES[mes - 1]} ${anio}`;
}

export function iniciales(nombres: string, apellidos: string): string {
  return `${nombres.charAt(0)}${apellidos.charAt(0)}`.toUpperCase();
}
