import type { ServiceResponse } from "@/shared/types/service.types";
import { API_URL } from "@/shared/lib/api-url";

interface HealthApi {
  status: string;
}

export const getHealth = async (): Promise<ServiceResponse<string>> => {
  try {
    const res = await fetch(`${API_URL}/health`);
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const data: HealthApi = await res.json();
    return { success: true, data: data.status };
  } catch {
    return { success: false, error: "No se pudo conectar con el backend." };
  }
};
