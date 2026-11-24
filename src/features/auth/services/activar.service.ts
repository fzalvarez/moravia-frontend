import { authApi } from "@/shared/lib/auth-api";

/** Fija la contraseña con el código de activación. Lanza el error de axios. */
export const activarCuenta = async (nombreUsuario: string, codigo: string, password: string): Promise<void> => {
  await authApi.post("/activar", { nombre_usuario: nombreUsuario, codigo, password });
};
