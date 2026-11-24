import type { ReactNode } from "react";
import { Link } from "react-router-dom";
import { ChevronLeftIcon } from "lucide-react";
import { cn } from "@/lib/utils";

type EncabezadoProps = {
  titulo: ReactNode;
  descripcion?: ReactNode;
  acciones?: ReactNode;
  volver?: { to: string; label: string };
};

/** Título de la pantalla con sus acciones principales. */
export function Encabezado({ titulo, descripcion, acciones, volver }: EncabezadoProps) {
  return (
    <div className="mb-6">
      {volver && (
        <Link to={volver.to} className="inline-flex items-center gap-1 mb-2 text-xs font-semibold text-gray-500 hover:text-brand-600">
          <ChevronLeftIcon className="size-3.5" />
          {volver.label}
        </Link>
      )}
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-gray-900">{titulo}</h1>
          {descripcion && <p className="text-sm text-gray-500 mt-1">{descripcion}</p>}
        </div>
        {acciones && <div className="flex flex-wrap items-center gap-2">{acciones}</div>}
      </div>
    </div>
  );
}

/** Contenedor blanco de las secciones. */
export function Tarjeta({ titulo, acciones, children, className }: { titulo?: ReactNode; acciones?: ReactNode; children: ReactNode; className?: string }) {
  return (
    <section className={cn("bg-white rounded-2xl shadow-theme-xs", className)}>
      {(titulo || acciones) && (
        <div className="flex flex-wrap items-center justify-between gap-2 px-5 py-4 border-b border-gray-50">
          {titulo && <h2 className="font-bold text-gray-900">{titulo}</h2>}
          {acciones && <div className="flex flex-wrap items-center gap-2">{acciones}</div>}
        </div>
      )}
      {children}
    </section>
  );
}

/** Pares etiqueta/valor de una ficha. */
export function Datos({ items }: { items: { label: string; valor: ReactNode }[] }) {
  return (
    <dl className="grid gap-x-6 gap-y-3 p-5 sm:grid-cols-2 lg:grid-cols-3">
      {items.map(({ label, valor }) => (
        <div key={label}>
          <dt className="text-[11px] font-bold uppercase tracking-wider text-gray-400">{label}</dt>
          <dd className="text-sm text-gray-900 mt-0.5 wrap-break-word">{valor ?? "—"}</dd>
        </div>
      ))}
    </dl>
  );
}

const TONOS = {
  gris: "bg-gray-100 text-gray-700 border-gray-200",
  verde: "bg-success-50 text-success-700 border-success-200",
  rojo: "bg-error-50 text-error-700 border-error-200",
  ambar: "bg-warning-50 text-warning-800 border-warning-200",
  azul: "bg-brand-50 text-brand-700 border-brand-100",
};

export type Tono = keyof typeof TONOS;

export function Etiqueta({ tono = "gris", children }: { tono?: Tono; children: ReactNode }) {
  return (
    <span className={cn("inline-flex items-center px-2 py-0.5 rounded-md text-[11px] font-semibold border whitespace-nowrap", TONOS[tono])}>
      {children}
    </span>
  );
}

/** Pestañas simples controladas. */
export function Pestanas<T extends string>({ valor, opciones, onChange }: { valor: T; opciones: { valor: T; label: string }[]; onChange: (v: T) => void }) {
  return (
    <div className="flex gap-1 overflow-x-auto no-scrollbar border-b border-gray-200 mb-5">
      {opciones.map((o) => (
        <button
          key={o.valor}
          type="button"
          onClick={() => onChange(o.valor)}
          className={cn(
            "px-3.5 py-2.5 text-sm font-semibold whitespace-nowrap border-b-2 -mb-px transition-colors",
            o.valor === valor ? "border-brand-500 text-brand-600" : "border-transparent text-gray-500 hover:text-gray-800"
          )}
        >
          {o.label}
        </button>
      ))}
    </div>
  );
}
