import { Navigate, Outlet, useLocation } from "react-router-dom";
import { useAuthStore } from "@/features/auth/store/auth.store";
import SplashScreen from "@/shared/components/SplashScreen";

export default function AuthLayout() {
  const estado = useAuthStore((s) => s.estado);
  const location = useLocation();

  if (estado === "verificando") return <SplashScreen />;
  // Con sesión iniciada vuelve a la ruta que pidió el login (o al inicio).
  if (estado === "autenticado") {
    const destino = (location.state as { from?: string } | null)?.from ?? "/";
    return <Navigate to={destino} replace />;
  }

  return (
    <div className="min-h-screen bg-[#f8f9fe]">
      <Outlet />
    </div>
  );
}
