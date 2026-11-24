import { useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { useQueries, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Confirmar } from "@/shared/components/app/Dialogos";
import { Datos, Encabezado, Etiqueta, Tarjeta } from "@/shared/components/app/Pagina";
import { ErrorConsulta, Tabla } from "@/shared/components/app/Tabla";
import { TableStateBlock } from "@/shared/components/TableState";
import { usePermisos } from "@/shared/hooks/usePermisos";
import { formatFecha } from "@/shared/lib/formato";
import { clavesDepartamentos, getDepartamento } from "@/features/departamentos/services/departamentos.service";
import { borrarPersona, clavesPersonas, getPersona, NOMBRE_VINCULO, nombreCompleto, vinculosDePersona } from "../services/personas.service";
import { PersonaFormulario } from "../components/PersonaFormulario";

export default function PersonaPage() {
  const { id = "" } = useParams();
  const navigate = useNavigate();
  const qc = useQueryClient();
  const { puede } = usePermisos();
  const [editar, setEditar] = useState(false);
  const [borrar, setBorrar] = useState(false);
  const persona = useQuery({ queryKey: clavesPersonas.una(id), queryFn: () => getPersona(id) });
  const vinculos = useQuery({ queryKey: clavesPersonas.vinculos(id), queryFn: () => vinculosDePersona(id) });
  const deptoIds = [...new Set(vinculos.data?.map((v) => v.departamento_id) ?? [])];
  const deptos = useQueries({
    queries: deptoIds.map((d) => ({ queryKey: clavesDepartamentos.uno(d), queryFn: () => getDepartamento(d) })),
  });
  const codigo = (deptoId: string) => deptos.find((q) => q.data?.id === deptoId)?.data?.codigo ?? "…";

  if (persona.isPending) return <TableStateBlock variant="loading" />;
  if (persona.isError) return <ErrorConsulta error={persona.error} />;
  const p = persona.data;

  return (
    <>
      <Encabezado
        volver={{ to: "/personas", label: "Personas" }}
        titulo={nombreCompleto(p)}
        acciones={
          puede("personas.gestionar") && (
            <>
              <Button variant="outline" onClick={() => setEditar(true)}>
                Editar
              </Button>
              <Button variant="destructive" onClick={() => setBorrar(true)}>
                Borrar
              </Button>
            </>
          )
        }
      />
      <div className="space-y-5">
        <Tarjeta titulo="Datos">
          <Datos
            items={[
              { label: "Documento", valor: p.numero_documento ? `${p.tipo_documento} ${p.numero_documento}` : "—" },
              { label: "Teléfono", valor: p.telefono ?? "—" },
              { label: "Correo", valor: p.correo ?? "—" },
            ]}
          />
        </Tarjeta>
        <Tarjeta titulo="Vínculos con departamentos">
          <Tabla
            columnas={[
              {
                titulo: "Departamento",
                celda: (v) => (
                  <Link className="font-semibold text-brand-600 hover:underline" to={`/departamentos/${v.departamento_id}`}>
                    {codigo(v.departamento_id)}
                  </Link>
                ),
              },
              { titulo: "Tipo", celda: (v) => NOMBRE_VINCULO[v.tipo] + (v.es_principal ? " (principal)" : "") },
              { titulo: "Desde", celda: (v) => formatFecha(v.fecha_inicio) },
              { titulo: "Hasta", celda: (v) => (v.fecha_fin ? formatFecha(v.fecha_fin) : "—") },
              { titulo: "Estado", celda: (v) => (v.vigente ? <Etiqueta tono="verde">Vigente</Etiqueta> : <Etiqueta>Cerrado</Etiqueta>) },
            ]}
            filas={vinculos.data}
            clave={(v) => v.id}
            cargando={vinculos.isPending}
            error={vinculos.error}
            vacio="Sin vínculos. Se crean desde la pestaña Ocupantes del departamento."
          />
        </Tarjeta>
      </div>
      <PersonaFormulario persona={p} abierto={editar} onCerrar={() => setEditar(false)} />
      <Confirmar
        abierto={borrar}
        onCerrar={() => setBorrar(false)}
        titulo="Borrar persona"
        descripcion="Solo se puede borrar si no tiene vínculos ni cuenta de acceso."
        confirmar="Borrar"
        peligro
        onConfirmar={async () => {
          await borrarPersona(id);
          qc.removeQueries({ queryKey: clavesPersonas.una(id) });
          qc.invalidateQueries({ queryKey: ["personas", "lista"] });
          toast.success("Persona borrada.");
          navigate("/personas", { replace: true });
        }}
      />
    </>
  );
}
