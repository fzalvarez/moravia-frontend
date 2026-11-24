import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { PencilIcon, PlusIcon, Trash2Icon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Confirmar, Modal } from "@/shared/components/app/Dialogos";
import { Campo, ErrorFormulario, Select } from "@/shared/components/app/Formulario";
import { Tarjeta } from "@/shared/components/app/Pagina";
import { Tabla } from "@/shared/components/app/Tabla";
import { usePermisos } from "@/shared/hooks/usePermisos";
import { getApiErrorDetails, getApiErrorMessage } from "@/shared/lib/http-error";
import {
  actualizarAnexo,
  borrarAnexo,
  clavesDepartamentos,
  crearAnexo,
  listarAnexos,
  NOMBRE_ANEXO,
  type Anexo,
  type Departamento,
  type TipoAnexo,
} from "../services/departamentos.service";

export function AnexosDepartamento({ departamento: d }: { departamento: Departamento }) {
  const qc = useQueryClient();
  const gestionar = usePermisos().puede("departamentos.gestionar") && d.activo;
  const anexos = useQuery({ queryKey: clavesDepartamentos.anexos(d.id), queryFn: () => listarAnexos(d.id) });
  const [formulario, setFormulario] = useState<{ anexo: Anexo | null } | null>(null);
  const [borrar, setBorrar] = useState<Anexo | null>(null);
  const refrescar = () => qc.invalidateQueries({ queryKey: clavesDepartamentos.anexos(d.id) });

  return (
    <Tarjeta
      titulo="Estacionamientos y depósitos"
      acciones={
        gestionar && (
          <Button size="sm" onClick={() => setFormulario({ anexo: null })}>
            <PlusIcon className="size-4" /> Agregar anexo
          </Button>
        )
      }
    >
      <Tabla
        columnas={[
          { titulo: "Tipo", celda: (a) => NOMBRE_ANEXO[a.tipo] },
          { titulo: "Código", celda: (a) => <span className="font-semibold text-gray-900">{a.codigo}</span> },
          ...(gestionar
            ? [
                {
                  titulo: "",
                  className: "text-right",
                  celda: (a: Anexo) => (
                    <div className="flex justify-end gap-1">
                      <Button size="icon-sm" variant="ghost" onClick={() => setFormulario({ anexo: a })} aria-label="Editar">
                        <PencilIcon className="size-3.5" />
                      </Button>
                      <Button size="icon-sm" variant="ghost" onClick={() => setBorrar(a)} aria-label="Borrar">
                        <Trash2Icon className="size-3.5" />
                      </Button>
                    </div>
                  ),
                },
              ]
            : []),
        ]}
        filas={anexos.data}
        clave={(a) => a.id}
        cargando={anexos.isPending}
        error={anexos.error}
        vacio="Sin estacionamientos ni depósitos."
      />
      {formulario && <FormularioAnexo departamentoId={d.id} anexo={formulario.anexo} onCerrar={() => setFormulario(null)} onGuardado={refrescar} />}
      <Confirmar
        abierto={!!borrar}
        onCerrar={() => setBorrar(null)}
        titulo="Borrar anexo"
        descripcion={borrar && `${NOMBRE_ANEXO[borrar.tipo]} ${borrar.codigo} dejará de estar asociado a ${d.codigo}.`}
        confirmar="Borrar"
        peligro
        onConfirmar={async () => {
          await borrarAnexo(borrar!.id);
          refrescar();
          toast.success("Anexo borrado.");
        }}
      />
    </Tarjeta>
  );
}

function FormularioAnexo({ departamentoId, anexo, onCerrar, onGuardado }: { departamentoId: string; anexo: Anexo | null; onCerrar: () => void; onGuardado: () => void }) {
  const [tipo, setTipo] = useState<TipoAnexo>(anexo?.tipo ?? "estacionamiento");
  const [codigo, setCodigo] = useState(anexo?.codigo ?? "");
  const [errores, setErrores] = useState<Record<string, string>>({});
  const [error, setError] = useState<string | null>(null);
  const guardar = useMutation({
    mutationFn: () => (anexo ? actualizarAnexo(anexo.id, codigo.trim()) : crearAnexo(departamentoId, tipo, codigo.trim())),
    onSuccess: () => {
      onGuardado();
      toast.success(anexo ? "Anexo actualizado." : "Anexo agregado.");
      onCerrar();
    },
    onError: (e) => {
      setErrores(getApiErrorDetails(e));
      setError(getApiErrorMessage(e, "No se pudo guardar el anexo."));
    },
  });
  return (
    <Modal
      abierto
      onCerrar={onCerrar}
      titulo={anexo ? "Editar anexo" : "Agregar anexo"}
      descripcion="Máximo 3 estacionamientos por departamento."
      ancho="sm"
      onSubmit={(e) => {
        e.preventDefault();
        if (!codigo.trim()) return setErrores({ codigo: "Requerido" });
        setError(null);
        guardar.mutate();
      }}
      pie={
        <>
          <Button type="button" variant="outline" onClick={onCerrar} disabled={guardar.isPending}>
            Cancelar
          </Button>
          <Button type="submit" loading={guardar.isPending}>
            Guardar
          </Button>
        </>
      }
    >
      <Campo id="tipo" label="Tipo" error={errores.tipo}>
        <Select id="tipo" value={tipo} onChange={(e) => setTipo(e.target.value as TipoAnexo)} disabled={!!anexo}>
          <option value="estacionamiento">Estacionamiento</option>
          <option value="deposito">Depósito</option>
        </Select>
      </Campo>
      <Campo id="codigo" label="Código" error={errores.codigo}>
        <Input id="codigo" value={codigo} onChange={(e) => setCodigo(e.target.value)} autoFocus aria-invalid={!!errores.codigo} />
      </Campo>
      <ErrorFormulario mensaje={error} />
    </Modal>
  );
}
