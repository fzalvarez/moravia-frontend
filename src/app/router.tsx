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
import DepartamentosPage from "@/features/departamentos/pages/DepartamentosPage";
import DepartamentoPage from "@/features/departamentos/pages/DepartamentoPage";
import PersonasPage from "@/features/personas/pages/PersonasPage";
import PersonaPage from "@/features/personas/pages/PersonaPage";
import PeriodosPage from "@/features/periodos/pages/PeriodosPage";
import PeriodoPage from "@/features/periodos/pages/PeriodoPage";
import GastosPage from "@/features/gastos/pages/GastosPage";
import GastoPage from "@/features/gastos/pages/GastoPage";
import ProveedoresPage from "@/features/gastos/pages/ProveedoresPage";
import LiquidacionesPage from "@/features/liquidaciones/pages/LiquidacionesPage";
import LiquidacionPage from "@/features/liquidaciones/pages/LiquidacionPage";
import MultasPage from "@/features/multas/pages/MultasPage";
import ReportesPage from "@/features/reportes/pages/ReportesPage";

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
          { path: "departamentos", element: <DepartamentosPage />, handle: { titulo: "Departamentos" } },
          { path: "departamentos/:id", element: <DepartamentoPage />, handle: { titulo: "Departamento" } },
          { path: "personas", element: <PersonasPage />, handle: { titulo: "Personas" } },
          { path: "personas/:id", element: <PersonaPage />, handle: { titulo: "Persona" } },
          { path: "periodos", element: <PeriodosPage />, handle: { titulo: "Periodos y cuotas" } },
          { path: "periodos/:id", element: <PeriodoPage />, handle: { titulo: "Periodo" } },
          { path: "gastos", element: <GastosPage />, handle: { titulo: "Gastos" } },
          { path: "gastos/:id", element: <GastoPage />, handle: { titulo: "Gasto" } },
          { path: "proveedores", element: <ProveedoresPage />, handle: { titulo: "Proveedores" } },
          { path: "liquidaciones", element: <LiquidacionesPage />, handle: { titulo: "Liquidaciones" } },
          { path: "liquidaciones/:id", element: <LiquidacionPage />, handle: { titulo: "Liquidación" } },
          { path: "multas", element: <MultasPage />, handle: { titulo: "Multas" } },
          { path: "reportes", element: <ReportesPage />, handle: { titulo: "Reportes" } },
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
