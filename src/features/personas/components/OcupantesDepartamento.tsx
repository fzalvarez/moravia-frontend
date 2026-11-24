import { useState } from "react";
import { Link } from "react-router-dom";
import { useQueries, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { PlusIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Buscador } from "@/shared/components/app/Buscador";
import { CodigoActivacion, Confirmar } from "@/shared/components/app/Dialogos";
import { Campo, Select } from "@/shared/components/app/Formulario";
import { Etiqueta, Tarjeta } from "@/shared/components/app/Pagina";
import { Tabla } from "@/shared/components/app/Tabla";
import { usePermisos } from "@/shared/hooks/usePermisos";
import { formatFecha, hoyLima } from "@/shared/lib/formato";
import type { Departamento } from "@/features/departamentos/services/departamentos.service";
import {
  cerrarVinculo,
  clavesPersonas,
  crearVinculo,
  designarPrincipal,
  getPersona,
  listarPersonas,
  NOMBRE_VINCULO,
  nombreCompleto,
  vinculosDeDepartamento,
  type Persona,
  type TipoVinculo,
  type Vinculo,
  type VinculoResultado,
} from "../services/personas.service";

const AVISO_ACCESO = "Si el departamento tiene cuenta en el portal, su acceso se restablece: las sesiones abiertas se cierran y hará falta el código nuevo.";

export function OcupantesDepartamento({ departamento: d }: { departamento: Departamento }) {
  const qc = useQueryClient();
  const gestionar = usePermisos().puede("personas.gestionar") && d.activo;
  const [historial, setHistorial] = useState(false);
  const [nuevo, setNuevo] = useState(false);
  const [cerrar, setCerrar] = useState<Vinculo | null>(null);
  const [principal, setPrincipal] = useState<Vinculo | null>(null);
  const [resultado, setResultado] = useState<VinculoResultado["acceso_restablecido"]>(null);

  const vinculos = useQuery({ queryKey: clavesPersonas.ocupantes(d.id, !historial), queryFn: () => vinculosDeDepartamento(d.id, !historial) });
  const ids = [...new Set(vinculos.data?.map((v) => v.persona_id) ?? [])];
  const personas = useQueries({ queries: ids.map((id) => ({ queryKey: clavesPersonas.una(id), queryFn: () => getPersona(id) })) });
  const persona = (id: string) => personas.find((q) => q.data?.id === id)?.data;

  const despues = (r: VinculoResultado) => {
    qc.invalidateQueries({ queryKey: ["departamentos", d.id, "vinculos"] });
    qc.invalidateQueries({ queryKey: clavesPersonas.vinculos(r.vinculo.persona_id) });
    qc.invalidateQueries({ queryKey: ["cuentas"] });
    setResultado(r.acceso_restablecido);
  };

  return (
    <div className="space-y-5">
      {resultado && <CodigoActivacion codigo={resultado.codigo_activacion} expira={resultado.codigo_expira_en} usuario={`la cuenta de ${d.codigo}`} />}
      <Tarjeta
        titulo="Ocupantes"
        acciones={
          <>
            <label className="flex items-center gap-2 text-[13px] text-gray-600">
              <Checkbox checked={historial} onCheckedChange={(v) => setHistorial(!!v)} /> Ver historial
            </label>
            {gestionar && (
              <Button size="sm" onClick={() => setNuevo(true)}>
                <PlusIcon className="size-4" /> Agregar ocupante
              </Button>
            )}
          </>
        }
      >
        <Tabla
          columnas={[
            {
              titulo: "Persona",
              celda: (v) => {
                const p = persona(v.persona_id);
                return (
                  <Link to={`/personas/${v.persona_id}`} className="font-semibold text-brand-600 hover:underline">
                    {p ? nombreCompleto(p) : "…"}
                  </Link>
                );
              },
            },
            { titulo: "Tipo", celda: (v) => <span className="flex items-center gap-2">{NOMBRE_VINCULO[v.tipo]} {v.es_principal && <Etiqueta tono="azul">Principal</Etiqueta>}</span> },
            { titulo: "Contacto", celda: (v) => [persona(v.persona_id)?.telefono, persona(v.persona_id)?.correo].filter(Boolean).join(" · ") || "—" },
            { titulo: "Desde", celda: (v) => formatFecha(v.fecha_inicio) },
            ...(historial ? [{ titulo: "Hasta", celda: (v: Vinculo) => (v.fecha_fin ? formatFecha(v.fecha_fin) : "—") }] : []),
            ...(gestionar
              ? [
                  {
                    titulo: "",
                    className: "text-right whitespace-nowrap",
                    celda: (v: Vinculo) =>
                      v.vigente && (
                        <div className="flex justify-end gap-1">
                          {v.tipo !== "propietario" && !v.es_principal && (
                            <Button size="sm" variant="ghost" onClick={() => setPrincipal(v)}>
                              Hacer principal
                            </Button>
                          )}
                          <Button size="sm" variant="ghost" onClick={() => setCerrar(v)}>
                            Cerrar
                          </Button>
                        </div>
                      ),
                  },
                ]
              : []),
          ]}
          filas={vinculos.data}
          clave={(v) => v.id}
          cargando={vinculos.isPending}
          error={vinculos.error}
          vacio={historial ? "Sin vínculos registrados." : "Sin ocupantes vigentes."}
        />
      </Tarjeta>

      {nuevo && <NuevoVinculo departamento={d} onCerrar={() => setNuevo(false)} onCreado={despues} />}
      {cerrar && <CerrarVinculo vinculo={cerrar} nombre={persona(cerrar.persona_id)} onCerrar={() => setCerrar(null)} onCerrado={despues} />}
      <Confirmar
        abierto={!!principal}
        onCerrar={() => setPrincipal(null)}
        titulo="Designar residente principal"
        descripcion="No cambia el acceso de la cuenta del departamento."
        confirmar="Designar"
        onConfirmar={async () => {
          await designarPrincipal(d.id, principal!.id);
          qc.invalidateQueries({ queryKey: ["departamentos", d.id, "vinculos"] });
          toast.success("Residente principal designado.");
        }}
      />
    </div>
  );
}

function NuevoVinculo({ departamento, onCerrar, onCreado }: { departamento: Departamento; onCerrar: () => void; onCreado: (r: VinculoResultado) => void }) {
  const [persona, setPersona] = useState<Persona | null>(null);
  const [tipo, setTipo] = useState<TipoVinculo>("propietario");
  const [fecha, setFecha] = useState(hoyLima());
  const [esPrincipal, setEsPrincipal] = useState(false);

  return (
    <Confirmar
      abierto
      onCerrar={onCerrar}
      titulo={`Agregar ocupante a ${departamento.codigo}`}
      descripcion={AVISO_ACCESO}
      confirmar="Agregar"
      deshabilitado={!persona || !fecha}
      onConfirmar={async () => {
        const r = await crearVinculo(departamento.id, {
          persona_id: persona!.id,
          tipo,
          fecha_inicio: fecha,
          es_principal: tipo !== "propietario" && esPrincipal,
        });
        onCreado(r);
        toast.success("Ocupante agregado.");
      }}
    >
      <Campo label="Persona" ayuda="Si no existe, regístrela antes en Personas.">
        <Buscador
          clave={["personas"]}
          buscar={async (q) => (await listarPersonas({ q, limit: 20 })).items}
          idDe={(p) => p.id}
          etiqueta={nombreCompleto}
          detalle={(p) => p.numero_documento}
          seleccionado={persona}
          onSeleccionar={setPersona}
          placeholder="Buscar por nombre o documento"
        />
      </Campo>
      <div className="grid gap-4 sm:grid-cols-2">
        <Campo id="tipo" label="Tipo">
          <Select id="tipo" value={tipo} onChange={(e) => setTipo(e.target.value as TipoVinculo)}>
            {Object.entries(NOMBRE_VINCULO).map(([v, l]) => (
              <option key={v} value={v}>
                {l}
              </option>
            ))}
          </Select>
        </Campo>
        <Campo id="fecha_inicio" label="Fecha de inicio">
          <Input id="fecha_inicio" type="date" max={hoyLima()} value={fecha} onChange={(e) => setFecha(e.target.value)} />
        </Campo>
      </div>
      {tipo !== "propietario" && (
        <label className="flex items-center gap-2 text-sm text-gray-700">
          <Checkbox checked={esPrincipal} onCheckedChange={(v) => setEsPrincipal(!!v)} /> Residente principal
        </label>
      )}
    </Confirmar>
  );
}

function CerrarVinculo({ vinculo, nombre, onCerrar, onCerrado }: { vinculo: Vinculo; nombre?: Persona; onCerrar: () => void; onCerrado: (r: VinculoResultado) => void }) {
  const [fecha, setFecha] = useState(hoyLima());
  return (
    <Confirmar
      abierto
      onCerrar={onCerrar}
      titulo={`Cerrar vínculo${nombre ? ` de ${nombreCompleto(nombre)}` : ""}`}
      descripcion={AVISO_ACCESO}
      confirmar="Cerrar vínculo"
      peligro
      deshabilitado={!fecha}
      onConfirmar={async () => {
        onCerrado(await cerrarVinculo(vinculo.id, fecha));
        toast.success("Vínculo cerrado.");
      }}
    >
      <Campo id="fecha_fin" label="Fecha de fin" ayuda={`Entre el ${formatFecha(vinculo.fecha_inicio)} y hoy.`}>
        <Input id="fecha_fin" type="date" min={vinculo.fecha_inicio} max={hoyLima()} value={fecha} onChange={(e) => setFecha(e.target.value)} />
      </Campo>
    </Confirmar>
  );
}
