import { cn } from "@/lib/utils";
import { esImporteNegativo, formatImporte } from "@/shared/lib/formato";

/** Importe recibido como texto del backend, sin recalcular (F-002, F-105). */
export function Importe({ valor, className, resaltar }: { valor: string | null | undefined; className?: string; resaltar?: boolean }) {
  if (valor === null || valor === undefined) return <span className="text-gray-300">—</span>;
  return (
    <span className={cn("tabular-nums whitespace-nowrap", resaltar && esImporteNegativo(valor) && "text-success-700", className)}>
      {formatImporte(valor)}
    </span>
  );
}
