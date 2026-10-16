import { useEffect } from "react";
import { RouterProvider } from "react-router-dom";
import { restaurarSesion } from "@/features/auth/services/restaurarSesion.service";
import { router } from "../router";

export function AppLayout() {
  // Una vez al cargar: la sesión se recupera con la cookie de refresco.
  useEffect(() => {
    restaurarSesion();
  }, []);

  return <RouterProvider router={router} />;
}
