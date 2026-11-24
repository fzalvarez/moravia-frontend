import type { FieldValues, Path, UseFormSetError } from "react-hook-form";
import { getApiErrorDetails, getApiErrorMessage } from "./http-error";

/**
 * Lleva los `details[].campo` del backend a los campos del formulario (F-005) y
 * devuelve el mensaje general. Por defecto el campo se llama igual que en la API.
 */
export function aplicarErroresApi<T extends FieldValues>(
  error: unknown,
  setError: UseFormSetError<T>,
  campos?: Record<string, Path<T>>,
  respaldo = "No se pudo guardar."
): string {
  for (const [campo, mensaje] of Object.entries(getApiErrorDetails(error))) {
    const destino = campos?.[campo] ?? (campo as Path<T>);
    setError(destino, { message: mensaje });
  }
  return getApiErrorMessage(error, respaldo);
}

/** Texto vacío → null, para campos opcionales de la API. */
export const nulo = (v: string | null | undefined): string | null => (v && v.trim() ? v.trim() : null);
