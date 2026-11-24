import { useRef, useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { FileIcon, Trash2Icon, UploadIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Confirmar } from "@/shared/components/app/Dialogos";
import { formatFechaHora } from "@/shared/lib/formato";
import { getApiErrorMessage } from "@/shared/lib/http-error";
import { abrirAdjunto, borrarAdjunto, clavesGastos, listarAdjuntos, subirAdjunto, type Adjunto } from "../services/gastos.service";

const kb = (n: number) => (n < 1024 * 1024 ? `${Math.ceil(n / 1024)} KB` : `${(n / 1024 / 1024).toFixed(1)} MB`);

/** Comprobantes de un gasto o de un pago a proveedor: PDF, JPEG o PNG. */
export function Adjuntos({ duenio, editable }: { duenio: { tipo: "gasto" | "pago"; id: string }; editable: boolean }) {
  const qc = useQueryClient();
  const clave = duenio.tipo === "gasto" ? clavesGastos.adjuntos(duenio.id) : clavesGastos.adjuntosPago(duenio.id);
  const adjuntos = useQuery({ queryKey: clave, queryFn: () => listarAdjuntos(duenio) });
  const input = useRef<HTMLInputElement>(null);
  const [subiendo, setSubiendo] = useState(false);
  const [borrar, setBorrar] = useState<Adjunto | null>(null);

  const subir = async (archivo: File) => {
    setSubiendo(true);
    try {
      await subirAdjunto(duenio, archivo);
      qc.invalidateQueries({ queryKey: clave });
      toast.success("Comprobante subido.");
    } catch (e) {
      toast.error(getApiErrorMessage(e, "No se pudo subir el comprobante."));
    } finally {
      setSubiendo(false);
      if (input.current) input.current.value = "";
    }
  };

  const abrir = async (a: Adjunto) => {
    try {
      await abrirAdjunto(a);
    } catch (e) {
      toast.error(getApiErrorMessage(e, "No se pudo descargar el comprobante."));
    }
  };

  return (
    <div className="space-y-2">
      {adjuntos.data?.length === 0 && <p className="text-[13px] text-gray-400">Sin comprobantes.</p>}
      {adjuntos.data?.map((a) => (
        <div key={a.id} className="flex items-center gap-2 rounded-lg border border-gray-200 px-3 py-2 text-sm">
          <FileIcon className="size-4 text-gray-400 shrink-0" />
          <button type="button" onClick={() => abrir(a)} className="flex-1 min-w-0 truncate text-left font-medium text-brand-600 hover:underline">
            {a.nombre_archivo}
          </button>
          <span className="text-[12px] text-gray-400 whitespace-nowrap">
            {kb(a.tamano)} · {formatFechaHora(a.creado_en)}
          </span>
          {editable && (
            <Button size="icon-sm" variant="ghost" onClick={() => setBorrar(a)} aria-label="Borrar comprobante">
              <Trash2Icon className="size-3.5" />
            </Button>
          )}
        </div>
      ))}
      {editable && (
        <>
          <input ref={input} type="file" accept="application/pdf,image/jpeg,image/png" className="hidden" onChange={(e) => e.target.files?.[0] && subir(e.target.files[0])} />
          <Button size="sm" variant="outline" onClick={() => input.current?.click()} loading={subiendo}>
            <UploadIcon className="size-4" /> Subir comprobante
          </Button>
          <p className="text-[12px] text-gray-400">PDF, JPEG o PNG, hasta 10 MB.</p>
        </>
      )}
      <Confirmar
        abierto={!!borrar}
        onCerrar={() => setBorrar(null)}
        titulo="Borrar comprobante"
        descripcion={borrar?.nombre_archivo}
        confirmar="Borrar"
        peligro
        onConfirmar={async () => {
          await borrarAdjunto(borrar!.id);
          qc.invalidateQueries({ queryKey: clave });
          toast.success("Comprobante borrado.");
        }}
      />
    </div>
  );
}
