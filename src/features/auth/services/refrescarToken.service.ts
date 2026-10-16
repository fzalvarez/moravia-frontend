import { authApi } from "@/shared/lib/auth-api";
import { useAuthStore } from "../store/auth.store";
import type { TokenApi } from "../types";

let renovacionEnCurso: Promise<TokenApi | null> | null = null;

/**
 * Renueva el access token con la cookie. La cookie es de un solo uso y
 * reusarla revoca todas las sesiones de la cuenta, así que las llamadas
 * simultáneas comparten una sola petición.
 */
export const refrescarToken = (): Promise<TokenApi | null> => {
  renovacionEnCurso ??= authApi
    .post<TokenApi>("/refresh")
    .then(({ data }) => {
      useAuthStore.getState().setToken(data.access_token, data.expires_in);
      return data;
    })
    .catch(() => null)
    .finally(() => {
      renovacionEnCurso = null;
    });
  return renovacionEnCurso;
};
