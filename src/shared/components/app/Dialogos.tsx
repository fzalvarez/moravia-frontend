import { useState, type FormEvent, type ReactNode } from "react";
import { CheckIcon, CopyIcon, KeyRoundIcon } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogTitle } from "@/components/ui/dialog";
import { cn } from "@/lib/utils";
import { getApiErrorDetails, getApiErrorMessage } from "@/shared/lib/http-error";
import { Campo, ErrorFormulario, Textarea } from "./Formulario";

type ModalProps = {
  abierto: boolean;
  onCerrar: () => void;
  titulo: ReactNode;
  descripcion?: ReactNode;
  children: ReactNode;
  pie?: ReactNode;
  ancho?: "sm" | "md" | "lg";
  onSubmit?: (e: FormEvent<HTMLFormElement>) => void;
};

const ANCHOS = { sm: "max-w-md", md: "max-w-xl", lg: "max-w-3xl" };

/** Diálogo con cuerpo desplazable; con `onSubmit` el contenido es un formulario. */
export function Modal({ abierto, onCerrar, titulo, descripcion, children, pie, ancho = "md", onSubmit }: ModalProps) {
  const cuerpo = (
    <>
      <div className="px-6 pt-6 pb-2 pr-14">
        <DialogTitle className="text-lg font-bold text-gray-900">{titulo}</DialogTitle>
        {descripcion ? (
          <DialogDescription className="text-sm text-gray-500 mt-1">{descripcion}</DialogDescription>
        ) : (
          <DialogDescription className="sr-only">{typeof titulo === "string" ? titulo : "Diálogo"}</DialogDescription>
        )}
      </div>
      <div className="px-6 py-4 overflow-y-auto space-y-4">{children}</div>
      {pie && <div className="px-6 py-4 border-t border-gray-100 flex flex-wrap justify-end gap-2">{pie}</div>}
    </>
  );
  return (
    <Dialog open={abierto} onOpenChange={(o) => !o && onCerrar()}>
      <DialogContent className={ANCHOS[ancho]}>
        {onSubmit ? (
          <form onSubmit={onSubmit} noValidate className="flex flex-col min-h-0">
            {cuerpo}
          </form>
        ) : (
          cuerpo
        )}
      </DialogContent>
    </Dialog>
  );
}

type ConfirmarProps = {
  abierto: boolean;
  onCerrar: () => void;
  titulo: ReactNode;
  descripcion?: ReactNode;
  children?: ReactNode;
  confirmar: string;
  peligro?: boolean;
  /** Si lanza, se muestra el mensaje del backend y el diálogo sigue abierto. */
  onConfirmar: () => Promise<unknown>;
  deshabilitado?: boolean;
};

/** Confirmación previa de operaciones financieras o destructivas (F-005). */
export function Confirmar({ abierto, onCerrar, titulo, descripcion, children, confirmar, peligro, onConfirmar, deshabilitado }: ConfirmarProps) {
  const [enCurso, setEnCurso] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [detalles, setDetalles] = useState<Record<string, string>>({});

  const ejecutar = async () => {
    setEnCurso(true);
    setError(null);
    setDetalles({});
    try {
      await onConfirmar();
      onCerrar();
    } catch (e) {
      setError(getApiErrorMessage(e, "No se pudo completar la operación."));
      setDetalles(getApiErrorDetails(e));
    } finally {
      setEnCurso(false);
    }
  };

  return (
    <Modal
      abierto={abierto}
      onCerrar={() => {
        if (!enCurso) {
          setError(null);
          onCerrar();
        }
      }}
      titulo={titulo}
      descripcion={descripcion}
      ancho="sm"
      pie={
        <>
          <Button variant="outline" onClick={onCerrar} disabled={enCurso}>
            Cancelar
          </Button>
          <Button variant={peligro ? "destructive" : "default"} onClick={ejecutar} loading={enCurso} disabled={deshabilitado}>
            {confirmar}
          </Button>
        </>
      }
    >
      {children}
      <ErrorFormulario mensaje={error} />
      {Object.keys(detalles).length > 0 && (
        <ul className="text-[13px] text-error-700 list-disc pl-5 space-y-0.5">
          {Object.entries(detalles).map(([campo, mensaje]) => (
            <li key={campo}>
              <strong>{campo}:</strong> {mensaje}
            </li>
          ))}
        </ul>
      )}
    </Modal>
  );
}

/** Código de activación: se muestra una sola vez (F-007). */
export function CodigoActivacion({ codigo, expira, usuario, className }: { codigo: string; expira: string; usuario?: string; className?: string }) {
  const [copiado, setCopiado] = useState(false);
  const copiar = async () => {
    try {
      await navigator.clipboard.writeText(codigo);
      setCopiado(true);
      setTimeout(() => setCopiado(false), 2000);
    } catch {
      toast.error("No se pudo copiar; selecciónelo manualmente.");
    }
  };
  return (
    <div className={cn("rounded-2xl border-2 border-warning-300 bg-warning-50 p-4 space-y-2", className)}>
      <div className="flex items-center gap-2 text-sm font-bold text-warning-900">
        <KeyRoundIcon className="size-4" />
        Código de activación{usuario && <> de «{usuario}»</>}
      </div>
      <div className="flex items-center gap-2">
        <code className="flex-1 min-w-0 break-all rounded-lg bg-white border border-warning-200 px-3 py-2 font-mono text-sm text-gray-900 select-all">
          {codigo}
        </code>
        <Button type="button" variant="outline" size="icon" onClick={copiar} aria-label="Copiar código">
          {copiado ? <CheckIcon className="size-4" /> : <CopyIcon className="size-4" />}
        </Button>
      </div>
      <p className="text-[12px] text-warning-900">
        Vence el {new Date(expira).toLocaleString("es-PE", { timeZone: "America/Lima" })}. Se muestra una sola vez; entréguelo por un medio seguro.
        Se usa en la pantalla «Activar cuenta».
      </p>
    </div>
  );
}

/** Confirmación con motivo obligatorio (anulaciones). */
export function ConMotivo({ titulo, descripcion, onCerrar, onConfirmar }: { titulo: string; descripcion: string; onCerrar: () => void; onConfirmar: (motivo: string) => Promise<void> }) {
  const [motivo, setMotivo] = useState("");
  return (
    <Confirmar abierto onCerrar={onCerrar} titulo={titulo} descripcion={descripcion} confirmar="Anular" peligro deshabilitado={!motivo.trim()} onConfirmar={() => onConfirmar(motivo.trim())}>
      <Campo id="motivo" label="Motivo">
        <Textarea id="motivo" value={motivo} onChange={(e) => setMotivo(e.target.value)} autoFocus />
      </Campo>
    </Confirmar>
  );
}
