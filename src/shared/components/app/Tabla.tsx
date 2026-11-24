import type { ReactNode } from "react";
import { ChevronLeftIcon, ChevronRightIcon } from "lucide-react";
import { cn } from "@/lib/utils";
import { TableStateRow } from "@/shared/components/TableState";
import { mensajeDeError } from "@/shared/lib/http-error";

export type Columna<T> = {
  titulo: ReactNode;
  celda: (fila: T) => ReactNode;
  className?: string;
};

type TablaProps<T> = {
  columnas: Columna<T>[];
  filas: T[] | undefined;
  clave: (fila: T) => string;
  cargando?: boolean;
  error?: unknown;
  vacio?: string;
  onFila?: (fila: T) => void;
  pie?: ReactNode;
};

/** Tabla con estados de carga, error y vacío (SCREENS §0). */
export function Tabla<T>({ columnas, filas, clave, cargando, error, vacio, onFila, pie }: TablaProps<T>) {
  const n = columnas.length;
  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-gray-100 text-left">
            {columnas.map((c, i) => (
              <th key={i} className={cn("px-4 py-3 text-[11px] font-bold uppercase tracking-wider text-gray-400 whitespace-nowrap", c.className)}>
                {c.titulo}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {cargando ? (
            <TableStateRow colSpan={n} variant="loading" />
          ) : error ? (
            <tr>
              <td colSpan={n} className="px-4 py-10 text-center text-sm text-error-700">
                {mensajeDeError(error)}
              </td>
            </tr>
          ) : !filas || filas.length === 0 ? (
            <TableStateRow colSpan={n} variant="empty" message={vacio} />
          ) : (
            filas.map((f) => (
              <tr
                key={clave(f)}
                onClick={onFila ? () => onFila(f) : undefined}
                className={cn("border-b border-gray-50 last:border-0", onFila && "cursor-pointer hover:bg-gray-50")}
              >
                {columnas.map((c, i) => (
                  <td key={i} className={cn("px-4 py-3 text-gray-700 align-middle", c.className)}>
                    {c.celda(f)}
                  </td>
                ))}
              </tr>
            ))
          )}
        </tbody>
      </table>
      {pie}
    </div>
  );
}

type PaginadorProps = { total: number; limit: number; offset: number; onOffset: (offset: number) => void };

/** Paginador de los listados `{items,total,limit,offset}`. */
export function Paginador({ total, limit, offset, onOffset }: PaginadorProps) {
  if (total <= limit) return null;
  const desde = offset + 1;
  const hasta = Math.min(offset + limit, total);
  const boton = "p-1.5 rounded-lg border border-gray-200 text-gray-600 hover:bg-gray-50 disabled:opacity-40 disabled:hover:bg-transparent";
  return (
    <div className="flex items-center justify-between gap-3 px-4 py-3 border-t border-gray-100 text-xs text-gray-500">
      <span>
        {desde}–{hasta} de {total}
      </span>
      <div className="flex gap-1.5">
        <button type="button" className={boton} disabled={offset === 0} onClick={() => onOffset(Math.max(offset - limit, 0))} aria-label="Anterior">
          <ChevronLeftIcon className="size-4" />
        </button>
        <button type="button" className={boton} disabled={hasta >= total} onClick={() => onOffset(offset + limit)} aria-label="Siguiente">
          <ChevronRightIcon className="size-4" />
        </button>
      </div>
    </div>
  );
}

/** Bloque de error de una consulta (403, 404 o el mensaje del backend). */
export function ErrorConsulta({ error }: { error: unknown }) {
  return (
    <div className="p-6 rounded-2xl border border-error-200 bg-error-50 text-sm text-error-700">{mensajeDeError(error)}</div>
  );
}
