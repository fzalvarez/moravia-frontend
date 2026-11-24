import { useState } from "react";
import { Link, useParams } from "react-router-dom";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { CodigoActivacion, Confirmar } from "@/shared/components/app/Dialogos";
import { ErrorFormulario } from "@/shared/components/app/Formulario";
import { Datos, Encabezado, Tarjeta } from "@/shared/components/app/Pagina";
import { ErrorConsulta } from "@/shared/components/app/Tabla";
import { TableStateBlock } from "@/shared/components/TableState";
import { formatFechaHora } from "@/shared/lib/formato";
import { getApiErrorMessage } from "@/shared/lib/http-error";
import { getPersona, nombreCompleto } from "@/features/personas/services/personas.service";
import { getDepartamento } from "@/features/departamentos/services/departamentos.service";
import {
  asignarRoles,
  clavesCuentas,
  desactivarCuenta,
  getCuenta,
  reactivarCuenta,
  restablecerAcceso,
  ROLES_PERSONALES,
  type CodigoActivacion as Codigo,
  type CodigoRol,
  type Cuenta,
} from "../services/cuentas.service";
import { EstadoCuenta } from "./CuentasPage";

type Accion = "desactivar" | "reactivar" | "restablecer" | null;

export default function CuentaDetallePage() {
  const { id = "" } = useParams();
  const qc = useQueryClient();
  const cuenta = useQuery({ queryKey: clavesCuentas.una(id), queryFn: () => getCuenta(id) });
  const c = cuenta.data;
  const persona = useQuery({ queryKey: ["personas", c?.persona_id], queryFn: () => getPersona(c!.persona_id!), enabled: !!c?.persona_id });
  const depto = useQuery({ queryKey: ["departamentos", c?.departamento_id], queryFn: () => getDepartamento(c!.departamento_id!), enabled: !!c?.departamento_id });
  const [accion, setAccion] = useState<Accion>(null);
  const [codigo, setCodigo] = useState<Codigo | null>(null);

  const actualizar = (nueva: Cuenta) => {
    qc.setQueryData(clavesCuentas.una(id), nueva);
    qc.invalidateQueries({ queryKey: ["cuentas", "lista"] });
  };

  if (cuenta.isPending) return <TableStateBlock variant="loading" />;
  if (cuenta.isError || !c) return <ErrorConsulta error={cuenta.error} />;

  const vinculo = c.persona_id
    ? persona.data
      ? <Link className="text-brand-600 hover:underline" to={`/personas/${c.persona_id}`}>{nombreCompleto(persona.data)}</Link>
      : "…"
    : c.departamento_id
      ? depto.data
        ? <Link className="text-brand-600 hover:underline" to={`/departamentos/${c.departamento_id}`}>{depto.data.codigo}</Link>
        : "…"
      : "—";

  return (
    <>
      <Encabezado
        volver={{ to: "/cuentas", label: "Cuentas" }}
        titulo={c.nombre_usuario}
        descripcion={c.tipo === "departamento" ? "Cuenta de departamento (portal)" : "Cuenta personal"}
        acciones={
          <>
            <Button variant="outline" onClick={() => setAccion("restablecer")}>
              Restablecer acceso
            </Button>
            {c.activo ? (
              <Button variant="destructive" onClick={() => setAccion("desactivar")}>
                Desactivar
              </Button>
            ) : (
              <Button onClick={() => setAccion("reactivar")}>Reactivar</Button>
            )}
          </>
        }
      />
      <div className="space-y-5">
        {codigo && <CodigoActivacion codigo={codigo.codigo_activacion} expira={codigo.codigo_expira_en} usuario={c.nombre_usuario} />}
        <Tarjeta titulo="Datos">
          <Datos
            items={[
              { label: "Estado", valor: <EstadoCuenta cuenta={c} /> },
              { label: c.tipo === "departamento" ? "Departamento" : "Persona", valor: vinculo },
              { label: "Creada", valor: formatFechaHora(c.creado_en) },
            ]}
          />
        </Tarjeta>
        {c.tipo === "personal" && <EditorRoles cuenta={c} onGuardado={actualizar} />}
      </div>

      <Confirmar
        abierto={accion === "desactivar"}
        onCerrar={() => setAccion(null)}
        titulo="Desactivar cuenta"
        descripcion="Las sesiones abiertas de esta cuenta se cortan de inmediato."
        confirmar="Desactivar"
        peligro
        onConfirmar={async () => {
          actualizar(await desactivarCuenta(id));
          toast.success("Cuenta desactivada.");
        }}
      />
      <Confirmar
        abierto={accion === "reactivar"}
        onCerrar={() => setAccion(null)}
        titulo="Reactivar cuenta"
        descripcion="La cuenta vuelve a poder iniciar sesión con su contraseña actual."
        confirmar="Reactivar"
        onConfirmar={async () => {
          actualizar(await reactivarCuenta(id));
          toast.success("Cuenta reactivada.");
        }}
      />
      <Confirmar
        abierto={accion === "restablecer"}
        onCerrar={() => setAccion(null)}
        titulo="Restablecer acceso"
        descripcion="Anula la contraseña y las sesiones actuales y genera un código de activación nuevo."
        confirmar="Restablecer"
        peligro
        onConfirmar={async () => {
          const r = await restablecerAcceso(id);
          setCodigo(r);
          actualizar(r.cuenta);
        }}
      />
    </>
  );
}

function EditorRoles({ cuenta, onGuardado }: { cuenta: Cuenta; onGuardado: (c: Cuenta) => void }) {
  const [roles, setRoles] = useState<CodigoRol[]>(cuenta.roles as CodigoRol[]);
  const [error, setError] = useState<string | null>(null);
  const guardar = useMutation({
    mutationFn: () => asignarRoles(cuenta.id, roles),
    onSuccess: (c) => {
      onGuardado(c);
      setError(null);
      toast.success("Roles actualizados.");
    },
    onError: (e) => setError(getApiErrorMessage(e, "No se pudieron guardar los roles.")),
  });
  const cambiado = [...roles].sort().join() !== [...cuenta.roles].sort().join();

  return (
    <Tarjeta
      titulo="Roles"
      acciones={
        <Button size="sm" onClick={() => guardar.mutate()} disabled={!cambiado || roles.length === 0} loading={guardar.isPending}>
          Guardar roles
        </Button>
      }
    >
      <div className="p-5 space-y-2">
        {ROLES_PERSONALES.map((r) => (
          <label key={r.codigo} className="flex items-center gap-2 text-sm text-gray-700">
            <Checkbox
              checked={roles.includes(r.codigo)}
              onCheckedChange={(v) => setRoles((prev) => (v ? [...prev, r.codigo] : prev.filter((x) => x !== r.codigo)))}
            />
            {r.label}
          </label>
        ))}
        <ErrorFormulario mensaje={error} />
      </div>
    </Tarjeta>
  );
}
