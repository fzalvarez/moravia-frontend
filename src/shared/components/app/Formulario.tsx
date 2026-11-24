import type { ComponentProps, ReactNode } from "react";
import { cn } from "@/lib/utils";
import { Label } from "@/components/ui/label";

/** Etiqueta, control y error de un campo. */
export function Campo({ id, label, error, ayuda, children, className }: { id?: string; label: ReactNode; error?: string; ayuda?: ReactNode; children: ReactNode; className?: string }) {
  return (
    <div className={cn("space-y-1.5", className)}>
      <Label htmlFor={id}>{label}</Label>
      {children}
      {ayuda && !error && <p className="text-[12px] text-gray-400">{ayuda}</p>}
      {error && <p className="text-[13px] text-error-600">{error}</p>}
    </div>
  );
}

const CONTROL =
  "w-full h-10 rounded-lg border border-gray-300 bg-white px-3 text-sm text-gray-900 outline-none focus:border-brand-500 focus:ring-3 focus:ring-brand-500/15 disabled:bg-gray-50 disabled:text-gray-500 aria-invalid:border-error-500";

export function Select({ className, ...props }: ComponentProps<"select">) {
  return <select className={cn(CONTROL, "pr-8", className)} {...props} />;
}

export function Textarea({ className, ...props }: ComponentProps<"textarea">) {
  return <textarea className={cn(CONTROL, "h-auto min-h-20 py-2", className)} {...props} />;
}

/** Mensaje general de error de un formulario. */
export function ErrorFormulario({ mensaje }: { mensaje: string | null }) {
  if (!mensaje) return null;
  return (
    <p role="alert" className="text-[13px] text-error-700 bg-error-50 border border-error-200 rounded-lg px-3 py-2">
      {mensaje}
    </p>
  );
}
