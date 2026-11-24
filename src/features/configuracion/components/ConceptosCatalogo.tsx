import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { PlusIcon } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Modal } from "@/shared/components/app/Dialogos";
import { Campo, ErrorFormulario } from "@/shared/components/app/Formulario";
import { Etiqueta, Tarjeta } from "@/shared/components/app/Pagina";
import { Tabla } from "@/shared/components/app/Tabla";
import { usePermisos } from "@/shared/hooks/usePermisos";
import { nulo } from "@/shared/lib/formularios";
import { getApiErrorDetails, getApiErrorMessage } from "@/shared/lib/http-error";
import {
  actualizarConcepto,
  clavesConceptos,
  crearConcepto,
  desactivarConcepto,
  listarConceptos,
  reactivarConcepto,
  type Concepto,
} from "../services/conceptos.service";

export function ConceptosCatalogo() {
  const qc = useQueryClient();
  const gestionar = usePermisos().puede("finanzas.gestionar");
  const conceptos = useQuery({ queryKey: clavesConceptos.lista, queryFn: () => listarConceptos() });
  const [editar, setEditar] = useState<{ concepto: Concepto | null } | null>(null);
  const estado = useMutation({
    mutationFn: (c: Concepto) => (c.activo ? desactivarConcepto(c.id) : reactivarConcepto(c.id)),
    onSuccess: (c) => {
      qc.invalidateQueries({ queryKey: clavesConceptos.lista });
      toast.success(c.activo ? "Concepto reactivado." : "Concepto desactivado.");
    },
    onError: (e) => toast.error(getApiErrorMessage(e, "No se pudo cambiar el estado.")),
  });

  return (
    <Tarjeta
      titulo="Conceptos de cobro"
      acciones={
        gestionar && (
          <Button size="sm" onClick={() => setEditar({ concepto: null })}>
            <PlusIcon className="size-4" /> Nuevo concepto
          </Button>
        )
      }
    >
      <Tabla
        columnas={[
          { titulo: "Código", celda: (c) => <span className="font-semibold text-gray-900">{c.codigo}</span> },
          { titulo: "Nombre", celda: (c) => c.nombre },
          { titulo: "Unidad de consumo", celda: (c) => c.unidad_consumo ?? "—" },
          { titulo: "Estado", celda: (c) => (c.activo ? <Etiqueta tono="verde">Activo</Etiqueta> : <Etiqueta>Desactivado</Etiqueta>) },
          ...(gestionar
            ? [
                {
                  titulo: "",
                  className: "text-right whitespace-nowrap",
                  celda: (c: Concepto) => (
                    <div className="flex justify-end gap-1">
                      <Button size="sm" variant="ghost" onClick={() => setEditar({ concepto: c })}>
                        Editar
                      </Button>
                      <Button size="sm" variant="ghost" onClick={() => estado.mutate(c)} disabled={estado.isPending}>
                        {c.activo ? "Desactivar" : "Reactivar"}
                      </Button>
                    </div>
                  ),
                },
              ]
            : []),
        ]}
        filas={conceptos.data}
        clave={(c) => c.id}
        cargando={conceptos.isPending}
        error={conceptos.error}
        vacio="No hay conceptos de cobro."
      />
      {editar && <FormularioConcepto concepto={editar.concepto} onCerrar={() => setEditar(null)} />}
    </Tarjeta>
  );
}

function FormularioConcepto({ concepto, onCerrar }: { concepto: Concepto | null; onCerrar: () => void }) {
  const qc = useQueryClient();
  const [codigo, setCodigo] = useState(concepto?.codigo ?? "");
  const [nombre, setNombre] = useState(concepto?.nombre ?? "");
  const [unidad, setUnidad] = useState(concepto?.unidad_consumo ?? "");
  const [errores, setErrores] = useState<Record<string, string>>({});
  const [error, setError] = useState<string | null>(null);
  const guardar = useMutation({
    mutationFn: () => {
      const d = { codigo: codigo.trim(), nombre: nombre.trim(), unidad_consumo: nulo(unidad) };
      return concepto ? actualizarConcepto(concepto.id, d) : crearConcepto(d);
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: clavesConceptos.lista });
      toast.success("Concepto guardado.");
      onCerrar();
    },
    onError: (e) => {
      setErrores(getApiErrorDetails(e));
      setError(getApiErrorMessage(e, "No se pudo guardar el concepto."));
    },
  });
  return (
    <Modal
      abierto
      onCerrar={onCerrar}
      titulo={concepto ? "Editar concepto" : "Nuevo concepto"}
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
      <Campo id="codigo" label="Código" error={errores.codigo} ayuda="Se guarda en mayúsculas.">
        <Input id="codigo" value={codigo} onChange={(e) => setCodigo(e.target.value)} autoFocus />
      </Campo>
      <Campo id="nombre" label="Nombre" error={errores.nombre}>
        <Input id="nombre" value={nombre} onChange={(e) => setNombre(e.target.value)} />
      </Campo>
      <Campo id="unidad_consumo" label="Unidad de consumo (opcional)" error={errores.unidad_consumo} ayuda="Por ejemplo m³ o kWh, para conceptos por consumo.">
        <Input id="unidad_consumo" value={unidad} onChange={(e) => setUnidad(e.target.value)} />
      </Campo>
      <ErrorFormulario mensaje={error} />
    </Modal>
  );
}
