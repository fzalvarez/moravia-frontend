import { cn } from "@/lib/utils";
import type { SituacionPago } from "../types";

const CONFIG: Record<SituacionPago, { label: string; className: string; dot: string }> = {
  al_dia: { label: "Al día", className: "bg-success-50 text-success-700 border-success-200", dot: "bg-success-500" },
  por_vencer: { label: "Por vencer", className: "bg-warning-50 text-warning-700 border-warning-200", dot: "bg-warning-500" },
  vencido: { label: "Deuda vencida", className: "bg-error-50 text-error-700 border-error-200", dot: "bg-error-500" },
  desactivado: { label: "Desactivado", className: "bg-gray-100 text-gray-500 border-gray-200", dot: "bg-gray-400" },
};

type SituacionBadgeProps = {
  situacion: SituacionPago;
  /** Días desde el vencimiento más antiguo (`antiguedad_dias`). */
  dias?: number;
  className?: string;
};

export function SituacionBadge({ situacion, dias, className }: SituacionBadgeProps) {
  const c = CONFIG[situacion];
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-bold border whitespace-nowrap",
        c.className,
        className
      )}
    >
      <span className={cn("w-1.5 h-1.5 rounded-full", c.dot)} />
      {c.label}
      {situacion === "vencido" && dias ? ` · ${dias} d` : ""}
    </span>
  );
}
