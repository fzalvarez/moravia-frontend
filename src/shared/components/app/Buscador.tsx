import { useEffect, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { CheckIcon, LoaderIcon, SearchIcon, XIcon } from "lucide-react";
import { cn } from "@/lib/utils";
import { Input } from "@/components/ui/input";

type BuscadorProps<T> = {
  id?: string;
  /** Clave de caché; se le añade el texto buscado. */
  clave: readonly unknown[];
  buscar: (q: string) => Promise<T[]>;
  idDe: (item: T) => string;
  etiqueta: (item: T) => string;
  detalle?: (item: T) => string | null;
  seleccionado: T | null;
  onSeleccionar: (item: T | null) => void;
  placeholder?: string;
  invalido?: boolean;
};

/** Busca en la API y elige un elemento (persona, departamento, proveedor…). */
export function Buscador<T>({ id, clave, buscar, idDe, etiqueta, detalle, seleccionado, onSeleccionar, placeholder, invalido }: BuscadorProps<T>) {
  const [texto, setTexto] = useState("");
  const [q, setQ] = useState("");
  useEffect(() => {
    const t = setTimeout(() => setQ(texto.trim()), 300);
    return () => clearTimeout(t);
  }, [texto]);

  const resultados = useQuery({ queryKey: [...clave, "buscar", q], queryFn: () => buscar(q), enabled: !seleccionado });

  if (seleccionado) {
    return (
      <div className="flex items-center gap-2 h-10 rounded-lg border border-brand-300 bg-brand-50 px-3 text-sm">
        <CheckIcon className="size-4 text-brand-600" />
        <span className="flex-1 truncate font-medium text-gray-900">{etiqueta(seleccionado)}</span>
        <button type="button" onClick={() => onSeleccionar(null)} className="text-gray-400 hover:text-gray-700" aria-label="Quitar selección">
          <XIcon className="size-4" />
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-1.5">
      <div className="relative">
        <SearchIcon className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-gray-400" />
        <Input id={id} value={texto} onChange={(e) => setTexto(e.target.value)} placeholder={placeholder ?? "Buscar…"} className="pl-9" aria-invalid={invalido} />
        {resultados.isFetching && <LoaderIcon className="absolute right-3 top-1/2 -translate-y-1/2 size-4 animate-spin text-brand-500" />}
      </div>
      <div className="max-h-48 overflow-y-auto rounded-lg border border-gray-200 divide-y divide-gray-50">
        {resultados.data?.length === 0 && <p className="px-3 py-2 text-[13px] text-gray-400">Sin resultados.</p>}
        {resultados.isError && <p className="px-3 py-2 text-[13px] text-error-600">No se pudo buscar.</p>}
        {resultados.data?.map((item) => (
          <button
            key={idDe(item)}
            type="button"
            onClick={() => onSeleccionar(item)}
            className={cn("w-full text-left px-3 py-2 text-sm hover:bg-brand-50")}
          >
            <span className="font-medium text-gray-900">{etiqueta(item)}</span>
            {detalle?.(item) && <span className="block text-[12px] text-gray-500">{detalle(item)}</span>}
          </button>
        ))}
      </div>
    </div>
  );
}
