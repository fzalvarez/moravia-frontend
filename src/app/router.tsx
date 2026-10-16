import { createBrowserRouter, Navigate } from "react-router-dom";
import AdminLayout from "./layouts/AdminLayout";
import DepartamentosPage from "@/features/departamentos/pages/DepartamentosPage";
import InicioPage from "@/features/inicio/pages/InicioPage";
import Error404 from "@/features/error-pages/pages/Error404";
import EnConstruccion from "@/shared/components/EnConstruccion";

export const router = createBrowserRouter([
  {
    path: "/",
    element: <AdminLayout />,
    errorElement: <Error404 />,
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
  {
    path: "/estado",
    element: <InicioPage />,
  },
  {
    path: "*",
    element: <Error404 />,
  },
]);
