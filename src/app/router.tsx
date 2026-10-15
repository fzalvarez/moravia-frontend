import { createBrowserRouter } from "react-router-dom";
import InicioPage from "@/features/inicio/pages/InicioPage";
import Error404 from "@/features/error-pages/pages/Error404";

export const router = createBrowserRouter([
  {
    path: "/",
    element: <InicioPage />,
    errorElement: <Error404 />,
  },
  {
    path: "*",
    element: <Error404 />,
  },
]);
