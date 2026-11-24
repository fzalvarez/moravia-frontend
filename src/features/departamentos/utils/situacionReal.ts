import type { Esquema } from "@/api";
import type { Tono } from "@/shared/components/app/Pagina";
import { esImporteCero } from "@/shared/lib/formato";

export type Situacion = "al_dia" | "pendiente" | "mora" | "desactivado";

/** Se lee del reporte de morosidad del backend; no se calcula deuda en el front. */
export function situacion(fila: Esquema<"MorosidadFila"> | undefined, activo: boolean): Situacion {
  if (!activo) return "desactivado";
  if (!fila || esImporteCero(fila.saldo)) return "al_dia";
  return esImporteCero(fila.deuda_vencida) ? "pendiente" : "mora";
}

export const ETIQUETA_SITUACION: Record<Situacion, string> = {
  al_dia: "Al día",
  pendiente: "Por vencer",
  mora: "Con mora",
  desactivado: "Desactivado",
};

export const TONO_SITUACION: Record<Situacion, Tono> = { al_dia: "verde", pendiente: "ambar", mora: "rojo", desactivado: "gris" };
