import { useAuthStore } from "@/features/auth/store/auth.store";

/** Permisos de `/auth/me`, solo para mostrar u ocultar (F-003): el backend autoriza. */
export function usePermisos() {
  const usuario = useAuthStore((s) => s.usuario);
  const permisos = usuario?.permisos ?? [];
  return {
    puede: (permiso: string) => permisos.includes(permiso),
    esAdministrador: usuario?.roles.includes("administrador") ?? false,
  };
}

export type Puede = ReturnType<typeof usePermisos>;
