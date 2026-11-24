import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Modal } from "@/shared/components/app/Dialogos";
import { Campo, ErrorFormulario, Select } from "@/shared/components/app/Formulario";
import { aplicarErroresApi, nulo } from "@/shared/lib/formularios";
import { opcional, requerido } from "@/shared/lib/validacion";
import { actualizarPersona, clavesPersonas, crearPersona, type Persona } from "../services/personas.service";

const esquema = z
  .object({
    nombres: requerido(100),
    apellidos: requerido(100),
    tipo_documento: opcional(20),
    numero_documento: opcional(30),
    telefono: opcional(30),
    correo: z.union([z.literal(""), z.email("Correo no válido").max(254)]),
  })
  .refine((v) => !v.tipo_documento === !v.numero_documento, { path: ["numero_documento"], message: "Indique tipo y número, o ninguno" });
type Valores = z.infer<typeof esquema>;

// Valores habituales; el backend admite cualquier texto de hasta 20 caracteres.
const TIPOS_DOCUMENTO = ["DNI", "CE", "PASAPORTE", "RUC"];

type Props = { persona?: Persona; abierto: boolean; onCerrar: () => void; onGuardada?: (p: Persona) => void };

export function PersonaFormulario({ persona, abierto, onCerrar, onGuardada }: Props) {
  const qc = useQueryClient();
  const [error, setError] = useState<string | null>(null);
  const form = useForm<Valores>({
    resolver: zodResolver(esquema),
    values: {
      nombres: persona?.nombres ?? "",
      apellidos: persona?.apellidos ?? "",
      tipo_documento: persona?.tipo_documento ?? "",
      numero_documento: persona?.numero_documento ?? "",
      telefono: persona?.telefono ?? "",
      correo: persona?.correo ?? "",
    },
  });
  const guardar = useMutation({
    mutationFn: (v: Valores) => {
      const datos = {
        nombres: v.nombres,
        apellidos: v.apellidos,
        tipo_documento: nulo(v.tipo_documento),
        numero_documento: nulo(v.numero_documento),
        telefono: nulo(v.telefono),
        correo: nulo(v.correo),
      };
      return persona ? actualizarPersona(persona.id, datos) : crearPersona(datos);
    },
    onSuccess: (p) => {
      qc.setQueryData(clavesPersonas.una(p.id), p);
      qc.invalidateQueries({ queryKey: ["personas", "lista"] });
      toast.success(persona ? "Persona actualizada." : "Persona registrada.");
      onGuardada?.(p);
      cerrar();
    },
    onError: (e) => setError(aplicarErroresApi(e, form.setError)),
  });
  const cerrar = () => {
    setError(null);
    form.reset();
    onCerrar();
  };
  const { errors } = form.formState;
  const r = form.register;

  return (
    <Modal
      abierto={abierto}
      onCerrar={cerrar}
      titulo={persona ? "Editar persona" : "Nueva persona"}
      onSubmit={form.handleSubmit((v) => {
        setError(null);
        guardar.mutate(v);
      })}
      pie={
        <>
          <Button type="button" variant="outline" onClick={cerrar} disabled={guardar.isPending}>
            Cancelar
          </Button>
          <Button type="submit" loading={guardar.isPending}>
            Guardar
          </Button>
        </>
      }
    >
      <div className="grid gap-4 sm:grid-cols-2">
        <Campo id="nombres" label="Nombres" error={errors.nombres?.message}>
          <Input id="nombres" autoFocus aria-invalid={!!errors.nombres} {...r("nombres")} />
        </Campo>
        <Campo id="apellidos" label="Apellidos" error={errors.apellidos?.message}>
          <Input id="apellidos" aria-invalid={!!errors.apellidos} {...r("apellidos")} />
        </Campo>
        <Campo id="tipo_documento" label="Tipo de documento" error={errors.tipo_documento?.message}>
          <Select id="tipo_documento" {...r("tipo_documento")}>
            <option value="">Sin documento</option>
            {[...new Set([...TIPOS_DOCUMENTO, persona?.tipo_documento].filter(Boolean))].map((t) => (
              <option key={t} value={t!}>
                {t}
              </option>
            ))}
          </Select>
        </Campo>
        <Campo id="numero_documento" label="Número de documento" error={errors.numero_documento?.message}>
          <Input id="numero_documento" aria-invalid={!!errors.numero_documento} {...r("numero_documento")} />
        </Campo>
        <Campo id="telefono" label="Teléfono" error={errors.telefono?.message}>
          <Input id="telefono" inputMode="tel" {...r("telefono")} />
        </Campo>
        <Campo id="correo" label="Correo" error={errors.correo?.message}>
          <Input id="correo" type="email" aria-invalid={!!errors.correo} {...r("correo")} />
        </Campo>
      </div>
      <ErrorFormulario mensaje={error} />
    </Modal>
  );
}
