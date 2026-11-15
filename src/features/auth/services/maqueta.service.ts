import { useAuthStore } from "../store/auth.store";
import type { MeApi } from "../types";

// Acceso sin backend para revisar las maquetas. Solo existe con `pnpm dev`:
// en el build de producción import.meta.env.DEV es false y se elimina.
export const MAQUETA_DISPONIBLE = import.meta.env.DEV;

const CLAVE = "moravia-maqueta";

const USUARIO_MAQUETA: MeApi = {
  id: "maqueta",
  nombre_usuario: "maqueta",
  tipo: "personal",
  persona_id: null,
  departamento_id: null,
  roles: ["administrador"],
  permisos: [],
};

export const entrarEnMaqueta = () => {
  if (!MAQUETA_DISPONIBLE) return;
  sessionStorage.setItem(CLAVE, "1");
  useAuthStore.getState().setUsuario(USUARIO_MAQUETA);
};

/** Tras recargar la página, vuelve a entrar si la pestaña estaba en maqueta. */
export const restaurarMaqueta = (): boolean => {
  if (!MAQUETA_DISPONIBLE || sessionStorage.getItem(CLAVE) !== "1") return false;
  useAuthStore.getState().setUsuario(USUARIO_MAQUETA);
  return true;
};

export const salirDeMaqueta = () => sessionStorage.removeItem(CLAVE);
