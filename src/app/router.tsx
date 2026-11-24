import { createBrowserRouter } from "react-router-dom";
import { ProtectedLayout } from "./layouts/ProtectedLayout";
import AdminLayout from "./layouts/AdminLayout";
import AuthLayout from "./layouts/AuthLayout";
import SignInPage from "@/features/auth/pages/SignInPage";
import ActivarPage from "@/features/auth/pages/ActivarPage";
import InicioPage from "@/features/inicio/pages/InicioPage";
import EstadoPage from "@/features/inicio/pages/EstadoPage";
import Error404 from "@/features/error-pages/pages/Error404";
import EnConstruccion from "@/shared/components/EnConstruccion";
import CuentasPage from "@/features/cuentas/pages/CuentasPage";
import CuentaDetallePage from "@/features/cuentas/pages/CuentaDetallePage";
import RolesPage from "@/features/cuentas/pages/RolesPage";

export const router = createBrowserRouter([
  {
    path: "/",
    element: <ProtectedLayout />,
    errorElement: <Error404 />,
    children: [
      {
        element: <AdminLayout />,
        children: [
          { index: true, element: <InicioPage />, handle: { titulo: "Inicio" } },
          { path: "cuentas", element: <CuentasPage />, handle: { titulo: "Cuentas de acceso" } },
          { path: "cuentas/:id", element: <CuentaDetallePage />, handle: { titulo: "Cuenta" } },
          { path: "roles", element: <RolesPage />, handle: { titulo: "Roles y permisos" } },
          // Secciones del menú aún sin pantalla (specs/001-consumo-api).
          { path: ":seccion", element: <EnConstruccion /> },
        ],
      },
    ],
  },
  {
    element: <AuthLayout />,
    children: [
      { path: "/login", element: <SignInPage /> },
      { path: "/activar", element: <ActivarPage /> },
    ],
  },
  { path: "/estado", element: <EstadoPage /> },
  { path: "*", element: <Error404 /> },
]);
