import {
  BarChart3Icon,
  Building2Icon,
  CalendarRangeIcon,
  FileTextIcon,
  GavelIcon,
  KeyRoundIcon,
  LayersIcon,
  MegaphoneIcon,
  ReceiptIcon,
  ShieldCheckIcon,
  TruckIcon,
  UsersIcon,
} from "lucide-react";
import type { Puede } from "./hooks/usePermisos";

export type Seccion = {
  label: string;
  icon: typeof Building2Icon;
  to: string;
  descripcion: string;
  /** Visible según `/auth/me` (moravia-backend/frontend/PERMISSIONS.md §5). */
  visible: (p: Puede) => boolean;
};

export const SECCIONES: { label: string; items: Seccion[] }[] = [
  {
    label: "Condominio",
    items: [
      { label: "Estructura", icon: LayersIcon, to: "/estructura", descripcion: "Edificio o torres, pisos y ubicación", visible: (p) => p.puede("departamentos.ver") },
      { label: "Departamentos", icon: Building2Icon, to: "/departamentos", descripcion: "Unidades, anexos y ocupantes", visible: (p) => p.puede("departamentos.ver") },
      { label: "Personas", icon: UsersIcon, to: "/personas", descripcion: "Propietarios, residentes y sus vínculos", visible: (p) => p.puede("personas.ver") },
      { label: "Avisos", icon: MegaphoneIcon, to: "/avisos", descripcion: "Comunicados a los departamentos", visible: (p) => p.esAdministrador },
    ],
  },
  {
    label: "Finanzas",
    items: [
      { label: "Periodos y cuotas", icon: CalendarRangeIcon, to: "/periodos", descripcion: "Configuración financiera de cada mes", visible: (p) => p.puede("finanzas.ver") },
      { label: "Liquidaciones", icon: FileTextIcon, to: "/liquidaciones", descripcion: "Preparar, emitir y cerrar el periodo", visible: (p) => p.puede("finanzas.ver") },
      { label: "Gastos", icon: ReceiptIcon, to: "/gastos", descripcion: "Gastos, pagos y comprobantes", visible: (p) => p.puede("gastos.ver") },
      { label: "Proveedores", icon: TruckIcon, to: "/proveedores", descripcion: "Proveedores y categorías de gasto", visible: (p) => p.puede("gastos.ver") },
      { label: "Multas", icon: GavelIcon, to: "/multas", descripcion: "Política y generación de multas", visible: (p) => p.puede("finanzas.ver") },
    ],
  },
  {
    label: "Análisis y acceso",
    items: [
      { label: "Reportes", icon: BarChart3Icon, to: "/reportes", descripcion: "Morosidad, recaudación y resumen", visible: (p) => p.puede("finanzas.ver") },
      { label: "Cuentas de acceso", icon: KeyRoundIcon, to: "/cuentas", descripcion: "Usuarios y códigos de activación", visible: (p) => p.puede("cuentas.gestionar") },
      { label: "Roles y permisos", icon: ShieldCheckIcon, to: "/roles", descripcion: "Qué puede hacer cada rol", visible: (p) => p.puede("cuentas.gestionar") },
    ],
  },
];

export function seccionesVisibles(p: Puede) {
  return SECCIONES.map((g) => ({ ...g, items: g.items.filter((s) => s.visible(p)) })).filter((g) => g.items.length > 0);
}
