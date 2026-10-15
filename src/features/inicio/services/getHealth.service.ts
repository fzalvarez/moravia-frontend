import type { ServiceResponse } from "@/shared/types/service.types";

interface HealthApi {
  status: string;
}

// Llamada provisional con fetch: se pasa al cliente HTTP común cuando se
// defina (FE-1).
export const getHealth = async (): Promise<ServiceResponse<string>> => {
  try {
    const res = await fetch("/health");
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const data: HealthApi = await res.json();
    return { success: true, data: data.status };
  } catch {
    return { success: false, error: "No se pudo conectar con el backend." };
  }
};
