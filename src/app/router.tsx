import { createBrowserRouter, Navigate } from "react-router-dom";
import { ProtectedLayout } from "./layouts/ProtectedLayout";
import AdminLayout from "./layouts/AdminLayout";
import AuthLayout from "./layouts/AuthLayout";
import DepartamentosPage from "@/features/departamentos/pages/DepartamentosPage";
import SignInPage from "@/features/auth/pages/SignInPage";
import InicioPage from "@/features/inicio/pages/InicioPage";
import Error404 from "@/features/error-pages/pages/Error404";
import EnConstruccion from "@/shared/components/EnConstruccion";

export const router = createBrowserRouter([
  {
    path: "/",
    element: <ProtectedLayout />,
    errorElement: <Error404 />,
    children: [
      {
        element: <AdminLayout />,
        children: [
          {
            index: true,
            element: <Navigate to="/departamentos" replace />,
          },
          {
            path: "departamentos",
            element: <DepartamentosPage />,
            handle: { titulo: "Departamentos" },
          },
          {
            // Secciones del menú aún sin pantalla.
            path: ":seccion",
            element: <EnConstruccion />,
          },
        ],
      },
    ],
  },
  {
    element: <AuthLayout />,
    children: [
      {
        path: "/login",
        element: <SignInPage />,
      },
    ],
  },
  {
    path: "/estado",
    element: <InicioPage />,
  },
  {
    path: "*",
    element: <Error404 />,
  },
]);
