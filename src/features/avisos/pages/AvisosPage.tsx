import { useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { PlusIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Confirmar } from "@/shared/components/app/Dialogos";
import { Campo, Textarea } from "@/shared/components/app/Formulario";
import { Encabezado, Etiqueta, Tarjeta } from "@/shared/components/app/Pagina";
import { ErrorConsulta } from "@/shared/components/app/Tabla";
import { TableStateBlock } from "@/shared/components/TableState";
import { useIdempotencia } from "@/shared/hooks/useIdempotencia";
import { formatFechaHora } from "@/shared/lib/formato";
import { listarTodosDepartamentos } from "@/features/departamentos/services/departamentos.service";
import { clavesAvisos, crearAviso, listarAvisos, retirarAviso, type Aviso } from "../services/avisos.service";

const DEPTOS_ACTIVOS = ["departamentos", "todos", true] as const;

export default function AvisosPage() {
  const [nuevo, setNuevo] = useState(false);
  const [retirar, setRetirar] = useState<Aviso | null>(null);
  const qc = useQueryClient();
  const avisos = useQuery({ queryKey: clavesAvisos.lista, queryFn: listarAvisos });
  const deptos = useQuery({ queryKey: DEPTOS_ACTIVOS, queryFn: () => listarTodosDepartamentos(true) });
  const codigos = (ids: string[]) => ids.map((id) => deptos.data?.find((d) => d.id === id)?.codigo ?? "…").join(", ");
  const orden = avisos.data && [...avisos.data].sort((a, b) => b.creado_en.localeCompare(a.creado_en));

  return (
    <>
      <Encabezado
        titulo="Avisos"
        descripcion="Comunicados que los departamentos ven en el portal. No se envían por correo ni WhatsApp."
        acciones={
          <Button onClick={() => setNuevo(true)}>
            <PlusIcon className="size-4" /> Nuevo aviso
          </Button>
        }
      />
      {avisos.isPending ? (
        <TableStateBlock variant="loading" />
      ) : avisos.isError ? (
        <ErrorConsulta error={avisos.error} />
      ) : orden!.length === 0 ? (
        <TableStateBlock variant="empty" message="Todavía no hay avisos." />
      ) : (
        <div className="space-y-3">
          {orden!.map((a) => (
            <Tarjeta key={a.id} className={a.retirado ? "opacity-60" : ""}>
              <div className="p-5 space-y-2">
                <div className="flex flex-wrap items-start justify-between gap-2">
                  <div>
                    <h2 className="font-bold text-gray-900">{a.titulo}</h2>
                    <p className="text-[12px] text-gray-500">
                      {formatFechaHora(a.creado_en)} · {a.para_todos ? "Todos los departamentos" : codigos(a.departamento_ids)}
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    {a.retirado ? <Etiqueta>Retirado</Etiqueta> : <Etiqueta tono="verde">Vigente</Etiqueta>}
                    <Etiqueta tono="azul">
                      {a.lecturas ?? 0} {a.lecturas === 1 ? "lectura" : "lecturas"}
                    </Etiqueta>
                    {!a.retirado && (
                      <Button size="sm" variant="ghost" onClick={() => setRetirar(a)}>
                        Retirar
                      </Button>
                    )}
                  </div>
                </div>
                <p className="text-sm text-gray-700 whitespace-pre-line">{a.cuerpo}</p>
              </div>
            </Tarjeta>
          ))}
        </div>
      )}
      {nuevo && <NuevoAviso onCerrar={() => setNuevo(false)} />}
      <Confirmar
        abierto={!!retirar}
        onCerrar={() => setRetirar(null)}
        titulo="Retirar aviso"
        descripcion="Deja de mostrarse en el portal. Se conserva en este historial."
        confirmar="Retirar"
        peligro
        onConfirmar={async () => {
          await retirarAviso(retirar!.id);
          qc.invalidateQueries({ queryKey: clavesAvisos.lista });
          toast.success("Aviso retirado.");
        }}
      />
    </>
  );
}

function NuevoAviso({ onCerrar }: { onCerrar: () => void }) {
  const qc = useQueryClient();
  const { clave } = useIdempotencia();
  const deptos = useQuery({ queryKey: DEPTOS_ACTIVOS, queryFn: () => listarTodosDepartamentos(true) });
  const [titulo, setTitulo] = useState("");
  const [cuerpo, setCuerpo] = useState("");
  const [todos, setTodos] = useState(true);
  const [ids, setIds] = useState<string[]>([]);

  return (
    <Confirmar
      abierto
      onCerrar={onCerrar}
      titulo="Nuevo aviso"
      descripcion="Lo verán las cuentas de departamento en el portal."
      confirmar="Publicar aviso"
      deshabilitado={!titulo.trim() || !cuerpo.trim() || (!todos && ids.length === 0)}
      onConfirmar={async () => {
        await crearAviso({ titulo: titulo.trim(), cuerpo: cuerpo.trim(), departamento_ids: todos ? null : ids, clave_idempotencia: clave });
        qc.invalidateQueries({ queryKey: clavesAvisos.lista });
        toast.success("Aviso publicado.");
      }}
    >
      <Campo id="titulo" label="Título" ayuda={`${titulo.length}/150`}>
        <Input id="titulo" maxLength={150} value={titulo} onChange={(e) => setTitulo(e.target.value)} autoFocus />
      </Campo>
      <Campo id="cuerpo" label="Mensaje" ayuda={`${cuerpo.length}/2000`}>
        <Textarea id="cuerpo" maxLength={2000} rows={6} value={cuerpo} onChange={(e) => setCuerpo(e.target.value)} />
      </Campo>
      <label className="flex items-center gap-2 text-sm text-gray-700">
        <Checkbox checked={todos} onCheckedChange={(v) => setTodos(!!v)} /> Para todos los departamentos
      </label>
      {!todos && (
        <div className="max-h-48 overflow-y-auto grid grid-cols-3 gap-2 rounded-lg border border-gray-200 p-3">
          {deptos.data?.map((d) => (
            <label key={d.id} className="flex items-center gap-2 text-sm text-gray-700">
              <Checkbox checked={ids.includes(d.id)} onCheckedChange={(v) => setIds((s) => (v ? [...s, d.id] : s.filter((x) => x !== d.id)))} />
              {d.codigo}
            </label>
          ))}
        </div>
      )}
    </Confirmar>
  );
}
