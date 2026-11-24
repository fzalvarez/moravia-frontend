import { useState, type ReactNode } from "react";
import { useParams } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { Encabezado, Etiqueta, Pestanas } from "@/shared/components/app/Pagina";
import { ErrorConsulta } from "@/shared/components/app/Tabla";
import { TableStateBlock } from "@/shared/components/TableState";
import { usePermisos } from "@/shared/hooks/usePermisos";
import { clavesDepartamentos, getDepartamento, type Departamento } from "../services/departamentos.service";
import { DatosDepartamento } from "../components/DatosDepartamento";
import { AnexosDepartamento } from "../components/AnexosDepartamento";
import { OcupantesDepartamento } from "@/features/personas/components/OcupantesDepartamento";

type Pestana = "datos" | "anexos" | "ocupantes";

export default function DepartamentoPage() {
  const { id = "" } = useParams();
  const { puede } = usePermisos();
  const [pestana, setPestana] = useState<Pestana>("datos");
  const depto = useQuery({ queryKey: clavesDepartamentos.uno(id), queryFn: () => getDepartamento(id) });

  if (depto.isPending) return <TableStateBlock variant="loading" />;
  if (depto.isError) return <ErrorConsulta error={depto.error} />;
  const d = depto.data;

  const pestanas: { valor: Pestana; label: string; ver: boolean; contenido: (d: Departamento) => ReactNode }[] = [
    { valor: "datos", label: "Datos", ver: true, contenido: (d) => <DatosDepartamento departamento={d} /> },
    { valor: "anexos", label: "Anexos", ver: puede("departamentos.ver"), contenido: (d) => <AnexosDepartamento departamento={d} /> },
    { valor: "ocupantes", label: "Ocupantes", ver: puede("personas.ver"), contenido: (d) => <OcupantesDepartamento departamento={d} /> },
  ];
  const visibles = pestanas.filter((p) => p.ver);
  const actual = visibles.find((p) => p.valor === pestana) ?? visibles[0];

  return (
    <>
      <Encabezado
        volver={{ to: "/departamentos", label: "Departamentos" }}
        titulo={
          <span className="flex items-center gap-3">
            Departamento {d.codigo} {!d.activo && <Etiqueta tono="rojo">Desactivado</Etiqueta>}
          </span>
        }
        descripcion={d.piso !== null ? `Piso ${d.piso}` : undefined}
      />
      <Pestanas valor={actual.valor} opciones={visibles} onChange={setPestana} />
      {actual.contenido(d)}
    </>
  );
}
