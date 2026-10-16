import { InboxIcon, LoaderIcon } from "lucide-react";
import { cn } from "@/lib/utils";

type TableStateVariant = "loading" | "empty";

type TableStateProps = {
  variant: TableStateVariant;
  message?: string;
  className?: string;
};

const DEFAULT_MESSAGE: Record<TableStateVariant, string> = {
  loading: "Cargando...",
  empty: "No hay datos para mostrar.",
};

function TableStateContent({ variant, message, className }: TableStateProps) {
  const text = message ?? DEFAULT_MESSAGE[variant];

  return (
    <div className={cn("flex flex-col items-center justify-center gap-2 py-16 text-center", className)}>
      {variant === "loading" ? (
        <LoaderIcon className="size-6 animate-spin text-brand-500" />
      ) : (
        <InboxIcon className="size-6 text-gray-300" />
      )}
      <p
        className={cn(
          "text-sm",
          variant === "loading"
            ? "text-gray-500"
            : "text-gray-400 italic"
        )}
      >
        {text}
      </p>
    </div>
  );
}

/** Fila `<tr>` con estado de carga/vacío para tablas `<table>/<tbody>`. */
export function TableStateRow({
  colSpan,
  ...props
}: TableStateProps & { colSpan: number }) {
  return (
    <tr>
      <td colSpan={colSpan}>
        <TableStateContent {...props} />
      </td>
    </tr>
  );
}

/** Bloque `<div>` con estado de carga/vacío para layouts sin `<table>`. */
export function TableStateBlock(props: TableStateProps) {
  return <TableStateContent {...props} />;
}
