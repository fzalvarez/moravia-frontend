import { esImporteCero } from "@/shared/lib/formato";
import type { DepartamentoFicha, SituacionPago } from "../types";

/**
 * Lee la situación de los campos de la morosidad (saldo y deuda_vencida que
 * calcula el backend). Solo compara contra cero; no recalcula importes.
 */
export function situacionDe({ departamento, morosidad }: DepartamentoFicha): SituacionPago {
  if (!departamento.activo) return "desactivado";
  if (!morosidad || esImporteCero(morosidad.saldo)) return "al_dia";
  if (!esImporteCero(morosidad.deuda_vencida)) return "vencido";
  return "por_vencer";
}

export const ETIQUETA_VINCULO = {
  propietario: "Propietario",
  residente: "Residente",
  inquilino: "Inquilino",
} as const;

export const ETIQUETA_ANEXO = {
  estacionamiento: "Estacionamiento",
  deposito: "Depósito",
} as const;
