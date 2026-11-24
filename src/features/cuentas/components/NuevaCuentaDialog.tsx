import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import { Buscador } from "@/shared/components/app/Buscador";
import { CodigoActivacion, Modal } from "@/shared/components/app/Dialogos";
import { Campo, ErrorFormulario } from "@/shared/components/app/Formulario";
import { getApiErrorDetails, getApiErrorMessage } from "@/shared/lib/http-error";
import { listarDepartamentos, type Departamento } from "@/features/departamentos/services/departamentos.service";
import { listarPersonas, nombreCompleto, type Persona } from "@/features/personas/services/personas.service";
import {
  clavesCuentas,
  crearCuenta,
  ROLES_PERSONALES,
  type CodigoActivacion as Creada,
  type CodigoRol,
} from "../services/cuentas.service";

type Tipo = "personal" | "departamento";

export function NuevaCuentaDialog({ abierto, onCerrar }: { abierto: boolean; onCerrar: () => void }) {
  const qc = useQueryClient();
  const [tipo, setTipo] = useState<Tipo>("personal");
  const [usuario, setUsuario] = useState("");
  const [persona, setPersona] = useState<Persona | null>(null);
  const [departamento, setDepartamento] = useState<Departamento | null>(null);
  const [roles, setRoles] = useState<CodigoRol[]>([]);
  const [errores, setErrores] = useState<Record<string, string>>({});
  const [error, setError] = useState<string | null>(null);
  const [creada, setCreada] = useState<Creada | null>(null);

  const reiniciar = () => {
    setTipo("personal");
    setUsuario("");
    setPersona(null);
    setDepartamento(null);
    setRoles([]);
    setErrores({});
    setError(null);
    setCreada(null);
  };

  const cerrar = () => {
    reiniciar();
    onCerrar();
  };

  const mutacion = useMutation({
    mutationFn: crearCuenta,
    onSuccess: (r) => {
      setCreada(r);
      qc.invalidateQueries({ queryKey: clavesCuentas.todas });
    },
    onError: (e) => {
      setErrores(getApiErrorDetails(e));
      setError(getApiErrorMessage(e, "No se pudo crear la cuenta."));
    },
  });

  const enviar = (e: React.FormEvent) => {
    e.preventDefault();
    const locales: Record<string, string> = {};
    if (!usuario.trim()) locales.nombre_usuario = "Requerido";
    if (tipo === "personal" && !persona) locales.persona_id = "Elija una persona";
    if (tipo === "personal" && roles.length === 0) locales.roles = "Elija al menos un rol";
    if (tipo === "departamento" && !departamento) locales.departamento_id = "Elija un departamento";
    setErrores(locales);
    setError(null);
    if (Object.keys(locales).length) return;
    mutacion.mutate(
      tipo === "personal"
        ? { nombre_usuario: usuario.trim(), persona_id: persona!.id, roles }
        : { nombre_usuario: usuario.trim(), departamento_id: departamento!.id, roles: [] }
    );
  };

  if (creada) {
    return (
      <Modal abierto={abierto} onCerrar={cerrar} titulo="Cuenta creada" pie={<Button onClick={cerrar}>Listo</Button>}>
        <CodigoActivacion codigo={creada.codigo_activacion} expira={creada.codigo_expira_en} usuario={creada.cuenta.nombre_usuario} />
      </Modal>
    );
  }

  return (
    <Modal
      abierto={abierto}
      onCerrar={cerrar}
      titulo="Nueva cuenta"
      descripcion="La persona fija su contraseña con el código de activación que se mostrará al crearla."
      onSubmit={enviar}
      pie={
        <>
          <Button type="button" variant="outline" onClick={cerrar} disabled={mutacion.isPending}>
            Cancelar
          </Button>
          <Button type="submit" loading={mutacion.isPending}>
            Crear cuenta
          </Button>
        </>
      }
    >
      <div className="grid grid-cols-2 gap-2">
        {(["personal", "departamento"] as Tipo[]).map((t) => (
          <button
            key={t}
            type="button"
            onClick={() => setTipo(t)}
            className={`rounded-xl border p-3 text-left text-sm ${tipo === t ? "border-brand-500 bg-brand-50" : "border-gray-200"}`}
          >
            <span className="font-semibold text-gray-900">{t === "personal" ? "Personal" : "De departamento"}</span>
            <span className="block text-[12px] text-gray-500">
              {t === "personal" ? "Administración, junta o personal" : "Compartida por los ocupantes (portal)"}
            </span>
          </button>
        ))}
      </div>

      <Campo id="nombre_usuario" label="Nombre de usuario" error={errores.nombre_usuario} ayuda="3 a 50 caracteres: minúsculas, números, punto, guion.">
        <Input id="nombre_usuario" value={usuario} onChange={(e) => setUsuario(e.target.value)} aria-invalid={!!errores.nombre_usuario} />
      </Campo>

      {tipo === "personal" ? (
        <>
          <Campo label="Persona" error={errores.persona_id}>
            <Buscador
              clave={["personas"]}
              buscar={async (q) => (await listarPersonas({ q, limit: 20 })).items}
              idDe={(p) => p.id}
              etiqueta={nombreCompleto}
              detalle={(p) => p.numero_documento}
              seleccionado={persona}
              onSeleccionar={setPersona}
              placeholder="Buscar por nombre o documento"
              invalido={!!errores.persona_id}
            />
          </Campo>
          <Campo label="Roles" error={errores.roles}>
            <div className="space-y-2">
              {ROLES_PERSONALES.map((r) => (
                <label key={r.codigo} className="flex items-center gap-2 text-sm text-gray-700">
                  <Checkbox
                    checked={roles.includes(r.codigo)}
                    onCheckedChange={(v) => setRoles((prev) => (v ? [...prev, r.codigo] : prev.filter((x) => x !== r.codigo)))}
                  />
                  {r.label}
                </label>
              ))}
            </div>
          </Campo>
        </>
      ) : (
        <Campo label="Departamento" error={errores.departamento_id}>
          <Buscador
            clave={["departamentos"]}
            buscar={async (q) => (await listarDepartamentos({ q, activo: true, limit: 20 })).items}
            idDe={(d) => d.id}
            etiqueta={(d) => d.codigo}
            detalle={(d) => (d.piso !== null ? `Piso ${d.piso}` : null)}
            seleccionado={departamento}
            onSeleccionar={setDepartamento}
            placeholder="Buscar por código"
            invalido={!!errores.departamento_id}
          />
        </Campo>
      )}
      <ErrorFormulario mensaje={error} />
    </Modal>
  );
}
