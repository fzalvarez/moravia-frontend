import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Confirmar, Modal } from "@/shared/components/app/Dialogos";
import { Campo, ErrorFormulario, Select } from "@/shared/components/app/Formulario";
import { Datos, Etiqueta, Tarjeta } from "@/shared/components/app/Pagina";
import { usePermisos } from "@/shared/hooks/usePermisos";
import { aplicarErroresApi } from "@/shared/lib/formularios";
import { formatFechaHora } from "@/shared/lib/formato";
import { getApiErrorMessage } from "@/shared/lib/http-error";
import { requerido } from "@/shared/lib/validacion";
import { clavesTipos, listarTipos } from "@/features/configuracion/services/tipos.service";
import {
  actualizarDepartamento,
  asignarTipoDepartamento,
  clavesDepartamentos,
  desactivarDepartamento,
  reactivarDepartamento,
  type Departamento,
} from "../services/departamentos.service";

export function DatosDepartamento({ departamento: d }: { departamento: Departamento }) {
  const qc = useQueryClient();
  const { puede } = usePermisos();
  const gestionar = puede("departamentos.gestionar");
  const [editar, setEditar] = useState(false);
  const [confirmar, setConfirmar] = useState<"desactivar" | "reactivar" | null>(null);
  const tipos = useQuery({ queryKey: clavesTipos.lista, queryFn: listarTipos, enabled: puede("finanzas.ver") });

  const guardado = (nuevo: Departamento) => {
    qc.setQueryData(clavesDepartamentos.uno(d.id), nuevo);
    qc.invalidateQueries({ queryKey: ["departamentos", "lista"] });
  };

  const tipo = useMutation({
    mutationFn: (tipoId: string | null) => asignarTipoDepartamento(d.id, tipoId),
    onSuccess: (n) => {
      guardado(n);
      toast.success("Tipo de departamento asignado.");
    },
    onError: (e) => toast.error(getApiErrorMessage(e, "No se pudo asignar el tipo.")),
  });

  const nombreTipo = d.tipo_departamento_id ? (tipos.data?.find((t) => t.id === d.tipo_departamento_id)?.nombre ?? "…") : "Sin tipo";

  return (
    <div className="space-y-5">
      <Tarjeta
        titulo="Datos del departamento"
        acciones={
          gestionar && (
            <>
              <Button size="sm" variant="outline" onClick={() => setEditar(true)} disabled={!d.activo}>
                Editar
              </Button>
              {d.activo ? (
                <Button size="sm" variant="destructive" onClick={() => setConfirmar("desactivar")}>
                  Desactivar
                </Button>
              ) : (
                <Button size="sm" onClick={() => setConfirmar("reactivar")}>
                  Reactivar
                </Button>
              )}
            </>
          )
        }
      >
        <Datos
          items={[
            { label: "Código", valor: d.codigo },
            { label: "Piso", valor: d.piso ?? "—" },
            { label: "Estado", valor: d.activo ? <Etiqueta tono="verde">Activo</Etiqueta> : <Etiqueta tono="rojo">Desactivado</Etiqueta> },
            ...(puede("finanzas.ver") ? [{ label: "Tipo (para cuotas por tipo)", valor: nombreTipo }] : []),
            { label: "Alta", valor: formatFechaHora(d.creado_en) },
          ]}
        />
        {puede("finanzas.gestionar") && tipos.data && (
          <div className="px-5 pb-5 max-w-sm">
            <Campo id="tipo" label="Asignar tipo">
              <Select
                id="tipo"
                value={d.tipo_departamento_id ?? ""}
                disabled={tipo.isPending}
                onChange={(e) => tipo.mutate(e.target.value || null)}
              >
                <option value="">Sin tipo</option>
                {tipos.data.map((t) => (
                  <option key={t.id} value={t.id}>
                    {t.nombre}
                  </option>
                ))}
              </Select>
            </Campo>
          </div>
        )}
      </Tarjeta>

      <EditarDepartamento departamento={d} abierto={editar} onCerrar={() => setEditar(false)} onGuardado={guardado} />
      <Confirmar
        abierto={confirmar === "desactivar"}
        onCerrar={() => setConfirmar(null)}
        titulo={`Desactivar ${d.codigo}`}
        descripcion="Se conserva el historial, pero se bloquean cambios, anexos y vínculos. También se desactiva la cuenta del departamento en el portal."
        confirmar="Desactivar"
        peligro
        onConfirmar={async () => {
          guardado(await desactivarDepartamento(d.id));
          toast.success("Departamento desactivado.");
        }}
      />
      <Confirmar
        abierto={confirmar === "reactivar"}
        onCerrar={() => setConfirmar(null)}
        titulo={`Reactivar ${d.codigo}`}
        descripcion="La cuenta del departamento no se reactiva sola: hágalo desde Cuentas de acceso si corresponde."
        confirmar="Reactivar"
        onConfirmar={async () => {
          guardado(await reactivarDepartamento(d.id));
          toast.success("Departamento reactivado.");
        }}
      />
    </div>
  );
}

const esquema = z.object({
  codigo: requerido(20),
  piso: z.string().trim().regex(/^-?\d*$/, "Número entero"),
});
type Valores = z.infer<typeof esquema>;

function EditarDepartamento({ departamento: d, abierto, onCerrar, onGuardado }: { departamento: Departamento; abierto: boolean; onCerrar: () => void; onGuardado: (d: Departamento) => void }) {
  const [error, setError] = useState<string | null>(null);
  const form = useForm<Valores>({ resolver: zodResolver(esquema), values: { codigo: d.codigo, piso: d.piso?.toString() ?? "" } });
  const guardar = useMutation({
    mutationFn: (v: Valores) => actualizarDepartamento(d.id, { codigo: v.codigo, piso: v.piso === "" ? null : Number(v.piso) }),
    onSuccess: (n) => {
      onGuardado(n);
      toast.success("Departamento actualizado.");
      onCerrar();
    },
    onError: (e) => setError(aplicarErroresApi(e, form.setError)),
  });
  const { errors } = form.formState;
  return (
    <Modal
      abierto={abierto}
      onCerrar={() => {
        setError(null);
        onCerrar();
      }}
      titulo="Editar departamento"
      ancho="sm"
      onSubmit={form.handleSubmit((v) => {
        setError(null);
        guardar.mutate(v);
      })}
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
      <Campo id="codigo" label="Código" error={errors.codigo?.message} ayuda="El cambio queda auditado.">
        <Input id="codigo" aria-invalid={!!errors.codigo} {...form.register("codigo")} />
      </Campo>
      <Campo id="piso" label="Piso" error={errors.piso?.message} ayuda="Vacío para quitarlo.">
        <Input id="piso" inputMode="numeric" aria-invalid={!!errors.piso} {...form.register("piso")} />
      </Campo>
      <ErrorFormulario mensaje={error} />
    </Modal>
  );
}
