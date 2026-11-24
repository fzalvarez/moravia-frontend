import { authApi } from "@/shared/lib/auth-api";
import { useAuthStore } from "../store/auth.store";

/** Revoca la cookie en el backend y limpia la sesión local aunque falle. */
export const logout = async (): Promise<void> => {
  try {
    await authApi.post("/logout");
  } catch {
    // 204 incluso sin cookie; un fallo de red no impide salir localmente.
  } finally {
    useAuthStore.getState().clearStore();
  }
};
