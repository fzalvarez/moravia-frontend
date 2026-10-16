import { useEffect } from "react";
import { Navigate, Outlet, useLocation } from "react-router-dom";
import { useAuthStore } from "@/features/auth/store/auth.store";
import { refrescarToken } from "@/features/auth/services/refrescarToken.service";
import SplashScreen from "@/shared/components/SplashScreen";

export function ProtectedLayout() {
  const estado = useAuthStore((s) => s.estado);
  const renovarEn = useAuthStore((s) => s.renovarEn);
  const clearStore = useAuthStore((s) => s.clearStore);
  const location = useLocation();

  // Renueva el token antes de que venza; si la cookie ya no sirve, sale.
  useEffect(() => {
    if (estado !== "autenticado" || renovarEn === null) return;
    const t = setTimeout(async () => {
      if (!(await refrescarToken())) clearStore();
    }, Math.max(renovarEn - Date.now(), 0));
    return () => clearTimeout(t);
  }, [estado, renovarEn, clearStore]);

  if (estado === "verificando") return <SplashScreen />;
  if (estado === "anonimo") return <Navigate to="/login" replace state={{ from: location.pathname }} />;
  return <Outlet />;
}
