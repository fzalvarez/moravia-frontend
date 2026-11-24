import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useForm, useWatch } from "react-hook-form";
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
import { clavesEstructura, getEstructura, type Estructura } from "@/features/estructura/services/estructura.service";
import {
  actualizarDepartamento,
  asignarTipoDepartamento,
  clavesDepartamentos,
  desactivarDepartamento,
  eliminarDepartamento,
  reactivarDepartamento,
  type Departamento,
} from "../services/departamentos.service";

export function DatosDepartamento({ departamento: d }: { departamento: Departamento }) {
  const qc = useQueryClient();
  const { puede } = usePermisos();
  const gestionar = puede("departamentos.gestionar");
  const [editar, setEditar] = useState(false);
  const [confirmar, setConfirmar] = useState<"desactivar" | "reactivar" | "eliminar" | null>(null);
  const navigate = useNavigate();
  const tipos = useQuery({ queryKey: clavesTipos.lista, queryFn: listarTipos, enabled: puede("finanzas.ver") });
  const estructura = useQuery({ queryKey: clavesEstructura.estructura, queryFn: getEstructura });
  const torre = estructura.data?.torres.find((x) => x.id === d.torre_id);

  const guardado = (nuevo: Departamento) => {
    qc.setQueryData(clavesDepartamentos.uno(d.id), nuevo);
    qc.invalidateQueries({ queryKey: ["departamentos"] });
    qc.invalidateQueries({ queryKey: clavesEstructura.estructura });
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
              <Button size="sm" variant="ghost" onClick={() => setConfirmar("eliminar")}>
                Eliminar
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
            ...(estructura.data?.tipo === "condominio" ? [{ label: "Torre", valor: torre ? torre.nombre : "Sin torre" }] : []),
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

      <EditarDepartamento departamento={d} estructura={estructura.data ?? null} abierto={editar} onCerrar={() => setEditar(false)} onGuardado={guardado} />
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
        abierto={confirmar === "eliminar"}
        onCerrar={() => setConfirmar(null)}
        titulo={`Eliminar ${d.codigo}`}
        descripcion="Solo para corregir un alta errónea: se borra con sus estacionamientos y depósitos. Si tiene ocupantes, cuenta de acceso, liquidaciones, pagos u otro historial, no se puede eliminar; en ese caso desactívelo."
        confirmar="Eliminar definitivamente"
        peligro
        onConfirmar={async () => {
          await eliminarDepartamento(d.id);
          qc.removeQueries({ queryKey: clavesDepartamentos.uno(d.id) });
          qc.invalidateQueries({ queryKey: ["departamentos"] });
          qc.invalidateQueries({ queryKey: clavesEstructura.estructura });
          toast.success(`Departamento ${d.codigo} eliminado.`);
          navigate("/departamentos", { replace: true });
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
  torre_id: z.string(),
});
type Valores = z.infer<typeof esquema>;

function EditarDepartamento({ departamento: d, estructura, abierto, onCerrar, onGuardado }: { departamento: Departamento; estructura: Estructura | null; abierto: boolean; onCerrar: () => void; onGuardado: (d: Departamento) => void }) {
  const [error, setError] = useState<string | null>(null);
  const form = useForm<Valores>({ resolver: zodResolver(esquema), values: { codigo: d.codigo, piso: d.piso?.toString() ?? "", torre_id: d.torre_id ?? (estructura?.tipo === "edificio" ? (estructura.torres[0]?.id ?? "") : "") } });
  const torreId = useWatch({ control: form.control, name: "torre_id" });
  const torreElegida = estructura?.torres.find((x) => x.id === torreId);
  const guardar = useMutation({
    mutationFn: (v: Valores) =>
      actualizarDepartamento(d.id, { codigo: v.codigo, piso: v.piso === "" ? null : Number(v.piso), ...(estructura ? { torre_id: v.torre_id || null } : {}) }),
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
      {estructura?.tipo === "condominio" && (
        <Campo id="torre_id" label="Torre" error={errors.torre_id?.message}>
          <Select id="torre_id" {...form.register("torre_id")}>
            <option value="">Sin torre</option>
            {estructura.torres.map((x) => (
              <option key={x.id} value={x.id}>
                {x.nombre}
              </option>
            ))}
          </Select>
        </Campo>
      )}
      <Campo id="piso" label="Piso" error={errors.piso?.message} ayuda={torreElegida ? `Entre 1 y ${torreElegida.pisos}.` : "Vacío para quitarlo."}>
        <Input id="piso" inputMode="numeric" aria-invalid={!!errors.piso} {...form.register("piso")} />
      </Campo>
      <ErrorFormulario mensaje={error} />
    </Modal>
  );
}
