import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { keepPreviousData, useQuery } from "@tanstack/react-query";
import { PlusIcon, SearchIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Encabezado, Tarjeta } from "@/shared/components/app/Pagina";
import { Paginador, Tabla } from "@/shared/components/app/Tabla";
import { usePermisos } from "@/shared/hooks/usePermisos";
import { clavesPersonas, listarPersonas, nombreCompleto } from "../services/personas.service";
import { PersonaFormulario } from "../components/PersonaFormulario";

export default function PersonasPage() {
  const navigate = useNavigate();
  const { puede } = usePermisos();
  const [texto, setTexto] = useState("");
  const [q, setQ] = useState("");
  const [offset, setOffset] = useState(0);
  const [nueva, setNueva] = useState(false);

  useEffect(() => {
    const t = setTimeout(() => {
      setQ(texto.trim());
      setOffset(0);
    }, 300);
    return () => clearTimeout(t);
  }, [texto]);

  const filtro = { q, offset, limit: 50 };
  const lista = useQuery({ queryKey: clavesPersonas.lista(filtro), queryFn: () => listarPersonas(filtro), placeholderData: keepPreviousData });

  return (
    <>
      <Encabezado
        titulo="Personas"
        descripcion="Propietarios, residentes, inquilinos y personal con cuenta."
        acciones={
          puede("personas.gestionar") && (
            <Button onClick={() => setNueva(true)}>
              <PlusIcon className="size-4" /> Nueva persona
            </Button>
          )
        }
      />
      <Tarjeta>
        <div className="p-4 border-b border-gray-100">
          <div className="relative max-w-md">
            <SearchIcon className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-gray-400" />
            <Input value={texto} onChange={(e) => setTexto(e.target.value)} placeholder="Buscar por nombre, apellido o documento" className="pl-9" />
          </div>
        </div>
        <Tabla
          columnas={[
            { titulo: "Nombre", celda: (p) => <span className="font-semibold text-gray-900">{nombreCompleto(p)}</span> },
            { titulo: "Documento", celda: (p) => (p.numero_documento ? `${p.tipo_documento} ${p.numero_documento}` : "—") },
            { titulo: "Teléfono", celda: (p) => p.telefono ?? "—" },
            { titulo: "Correo", celda: (p) => p.correo ?? "—" },
          ]}
          filas={lista.data?.items}
          clave={(p) => p.id}
          cargando={lista.isPending}
          error={lista.error}
          vacio={q ? "No hay personas que coincidan." : "No hay personas registradas."}
          onFila={(p) => navigate(`/personas/${p.id}`)}
          pie={lista.data && <Paginador {...lista.data} onOffset={setOffset} />}
        />
      </Tarjeta>
      <PersonaFormulario abierto={nueva} onCerrar={() => setNueva(false)} onGuardada={(p) => navigate(`/personas/${p.id}`)} />
    </>
  );
}
