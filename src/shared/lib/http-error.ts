import { AxiosError } from "axios";

/** Sobre de error del backend: {"error": {code, message, details}}. */
export interface ApiErrorBody {
  error: {
    code: string;
    message: string;
    details: { campo: string; mensaje: string }[] | null;
  };
}

function cuerpoError(error: unknown): ApiErrorBody["error"] | null {
  if (error instanceof AxiosError) {
    const data = error.response?.data as Partial<ApiErrorBody> | undefined;
    if (data?.error?.message) return data.error;
  }
  return null;
}

/** Mensaje legible: el `message` del backend (en español) o el de respaldo. */
export function getApiErrorMessage(error: unknown, fallback: string): string {
  const cuerpo = cuerpoError(error);
  if (cuerpo) return cuerpo.code === "INTERNAL_ERROR" ? fallback : cuerpo.message;
  if (error instanceof AxiosError && !error.response) {
    return "No se pudo conectar con el servidor.";
  }
  return fallback;
}

export function getApiErrorCode(error: unknown): string | null {
  return cuerpoError(error)?.code ?? null;
}
