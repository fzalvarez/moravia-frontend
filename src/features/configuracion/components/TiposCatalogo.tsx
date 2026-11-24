import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { PlusIcon } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Modal } from "@/shared/components/app/Dialogos";
import { Campo, ErrorFormulario } from "@/shared/components/app/Formulario";
import { Tarjeta } from "@/shared/components/app/Pagina";
import { Tabla } from "@/shared/components/app/Tabla";
import { usePermisos } from "@/shared/hooks/usePermisos";
import { getApiErrorDetails, getApiErrorMessage } from "@/shared/lib/http-error";
import { actualizarTipo, clavesTipos, crearTipo, listarTipos, type TipoDepartamento } from "../services/tipos.service";

export function TiposCatalogo() {
  const gestionar = usePermisos().puede("finanzas.gestionar");
  const tipos = useQuery({ queryKey: clavesTipos.lista, queryFn: listarTipos });
  const [editar, setEditar] = useState<{ tipo: TipoDepartamento | null } | null>(null);

  return (
    <Tarjeta
      titulo="Tipos de departamento"
      acciones={
        gestionar && (
          <Button size="sm" onClick={() => setEditar({ tipo: null })}>
            <PlusIcon className="size-4" /> Nuevo tipo
          </Button>
        )
      }
    >
      <p className="px-5 pt-4 text-[13px] text-gray-500">Se usan en los conceptos con importe por tipo. El tipo se asigna en la ficha de cada departamento.</p>
      <Tabla
        columnas={[
          { titulo: "Código", celda: (t) => <span className="font-semibold text-gray-900">{t.codigo}</span> },
          { titulo: "Nombre", celda: (t) => t.nombre },
          ...(gestionar
            ? [
                {
                  titulo: "",
                  className: "text-right",
                  celda: (t: TipoDepartamento) => (
                    <Button size="sm" variant="ghost" onClick={() => setEditar({ tipo: t })}>
                      Editar
                    </Button>
                  ),
                },
              ]
            : []),
        ]}
        filas={tipos.data}
        clave={(t) => t.id}
        cargando={tipos.isPending}
        error={tipos.error}
        vacio="No hay tipos de departamento."
      />
      {editar && <FormularioTipo tipo={editar.tipo} onCerrar={() => setEditar(null)} />}
    </Tarjeta>
  );
}

function FormularioTipo({ tipo, onCerrar }: { tipo: TipoDepartamento | null; onCerrar: () => void }) {
  const qc = useQueryClient();
  const [codigo, setCodigo] = useState(tipo?.codigo ?? "");
  const [nombre, setNombre] = useState(tipo?.nombre ?? "");
  const [errores, setErrores] = useState<Record<string, string>>({});
  const [error, setError] = useState<string | null>(null);
  const guardar = useMutation({
    mutationFn: () => {
      const d = { codigo: codigo.trim(), nombre: nombre.trim() };
      return tipo ? actualizarTipo(tipo.id, d) : crearTipo(d);
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: clavesTipos.lista });
      toast.success("Tipo guardado.");
      onCerrar();
    },
    onError: (e) => {
      setErrores(getApiErrorDetails(e));
      setError(getApiErrorMessage(e, "No se pudo guardar el tipo."));
    },
  });
  return (
    <Modal
      abierto
      onCerrar={onCerrar}
      titulo={tipo ? "Editar tipo" : "Nuevo tipo"}
      ancho="sm"
      onSubmit={(e) => {
        e.preventDefault();
        const loc: Record<string, string> = {};
        if (!codigo.trim()) loc.codigo = "Requerido";
        if (!nombre.trim()) loc.nombre = "Requerido";
        setErrores(loc);
        if (Object.keys(loc).length) return;
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
      <Campo id="codigo" label="Código" error={errores.codigo}>
        <Input id="codigo" value={codigo} onChange={(e) => setCodigo(e.target.value)} autoFocus />
      </Campo>
      <Campo id="nombre" label="Nombre" error={errores.nombre}>
        <Input id="nombre" value={nombre} onChange={(e) => setNombre(e.target.value)} />
      </Campo>
      <ErrorFormulario mensaje={error} />
    </Modal>
  );
}
