import { useCallback, useState } from "react";

/**
 * Clave de idempotencia de un formulario (F-106): se genera al abrirlo y se
 * reutiliza en los reintentos del mismo envío. Tras un éxito, `renovar()`.
 */
export function useIdempotencia() {
  const [clave, setClave] = useState(() => crypto.randomUUID());
  const renovar = useCallback(() => setClave(crypto.randomUUID()), []);
  return { clave, renovar };
}
