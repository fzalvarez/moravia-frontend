import { authApi } from "@/shared/lib/auth-api";
import { getApiErrorMessage } from "@/shared/lib/http-error";
import type { ServiceResponse } from "@/shared/types/service.types";
import type { TokenApi } from "../types";

export const login = async (
  nombreUsuario: string,
  password: string
): Promise<ServiceResponse<TokenApi>> => {
  try {
    const { data } = await authApi.post<TokenApi>("/login", { nombre_usuario: nombreUsuario, password });
    return { success: true, data };
  } catch (error) {
    // El backend responde lo mismo para usuario inexistente, contraseña
    // errónea, cuenta bloqueada, desactivada o sin activar (genérico a propósito).
    return { success: false, error: getApiErrorMessage(error, "No se pudo iniciar sesión.") };
  }
};
