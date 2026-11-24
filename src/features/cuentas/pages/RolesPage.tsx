import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { TriangleAlertIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { ErrorFormulario } from "@/shared/components/app/Formulario";
import { Encabezado, Etiqueta, Tarjeta } from "@/shared/components/app/Pagina";
import { ErrorConsulta } from "@/shared/components/app/Tabla";
import { TableStateBlock } from "@/shared/components/TableState";
import { getApiErrorMessage } from "@/shared/lib/http-error";
import { actualizarPermisosRol, clavesCuentas, listarPermisos, listarRoles, type Permiso, type Rol } from "../services/cuentas.service";

export default function RolesPage() {
  const roles = useQuery({ queryKey: clavesCuentas.roles, queryFn: listarRoles });
  const permisos = useQuery({ queryKey: clavesCuentas.permisos, queryFn: listarPermisos });

  return (
    <>
      <Encabezado titulo="Roles y permisos" descripcion="El rol administrador tiene siempre todos los permisos. «Gestionar cuentas» no se puede delegar." />
      {roles.isPending || permisos.isPending ? (
        <TableStateBlock variant="loading" />
      ) : roles.isError || permisos.isError ? (
        <ErrorConsulta error={roles.error ?? permisos.error} />
      ) : (
        <div className="grid gap-5 lg:grid-cols-2">
          {roles.data.map((r) => (
            <EditorRol key={r.codigo} rol={r} catalogo={permisos.data} />
          ))}
        </div>
      )}
    </>
  );
}

function EditorRol({ rol, catalogo }: { rol: Rol; catalogo: Permiso[] }) {
  const qc = useQueryClient();
  const [marcados, setMarcados] = useState<string[]>(rol.permisos);
  const [error, setError] = useState<string | null>(null);
  const guardar = useMutation({
    mutationFn: () => actualizarPermisosRol(rol.codigo, marcados),
    onSuccess: (r) => {
      qc.setQueryData<Rol[]>(clavesCuentas.roles, (prev) => prev?.map((x) => (x.codigo === r.codigo ? r : x)));
      setError(null);
      toast.success(`Permisos de «${r.nombre}» guardados.`);
    },
    onError: (e) => setError(getApiErrorMessage(e, "No se pudieron guardar los permisos.")),
  });
  const cambiado = [...marcados].sort().join() !== [...rol.permisos].sort().join();
  // PERMISSIONS.md §6: con gastos.ver, las cuentas de departamento verían todos los gastos.
  const riesgo = rol.codigo === "departamento" && marcados.includes("gastos.ver");

  return (
    <Tarjeta
      titulo={
        <span className="flex items-center gap-2">
          {rol.nombre} {!rol.editable && <Etiqueta>Solo lectura</Etiqueta>}
        </span>
      }
      acciones={
        rol.editable && (
          <Button size="sm" onClick={() => guardar.mutate()} disabled={!cambiado} loading={guardar.isPending}>
            Guardar
          </Button>
        )
      }
    >
      <div className="p-5 space-y-2">
        {catalogo.map((p) => (
          <label key={p.clave} className="flex items-start gap-2 text-sm text-gray-700">
            <Checkbox
              className="mt-0.5"
              checked={marcados.includes(p.clave)}
              disabled={!rol.editable || !p.delegable}
              onCheckedChange={(v) => setMarcados((prev) => (v ? [...prev, p.clave] : prev.filter((x) => x !== p.clave)))}
            />
            <span>
              {p.descripcion}
              <span className="block text-[11px] text-gray-400 font-mono">{p.clave}</span>
            </span>
          </label>
        ))}
        {riesgo && (
          <p className="flex gap-2 text-[13px] text-warning-900 bg-warning-50 border border-warning-200 rounded-lg px-3 py-2">
            <TriangleAlertIcon className="size-4 shrink-0 mt-0.5" />
            Con este permiso, todas las cuentas de departamento verán todos los gastos y proveedores del condominio.
          </p>
        )}
        <ErrorFormulario mensaje={error} />
      </div>
    </Tarjeta>
  );
}
