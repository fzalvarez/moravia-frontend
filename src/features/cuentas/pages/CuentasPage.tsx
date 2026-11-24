import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { keepPreviousData, useQuery } from "@tanstack/react-query";
import { PlusIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Encabezado, Etiqueta, Tarjeta } from "@/shared/components/app/Pagina";
import { Paginador, Tabla } from "@/shared/components/app/Tabla";
import { formatFechaHora } from "@/shared/lib/formato";
import { clavesCuentas, listarCuentas, nombreRol, type Cuenta } from "../services/cuentas.service";
import { NuevaCuentaDialog } from "../components/NuevaCuentaDialog";

export function EstadoCuenta({ cuenta }: { cuenta: Cuenta }) {
  if (!cuenta.activo) return <Etiqueta tono="rojo">Desactivada</Etiqueta>;
  if (cuenta.pendiente_activacion) return <Etiqueta tono="ambar">Pendiente de activar</Etiqueta>;
  return <Etiqueta tono="verde">Activa</Etiqueta>;
}

export default function CuentasPage() {
  const navigate = useNavigate();
  const [offset, setOffset] = useState(0);
  const [nueva, setNueva] = useState(false);
  const cuentas = useQuery({ queryKey: clavesCuentas.lista(offset), queryFn: () => listarCuentas(offset), placeholderData: keepPreviousData });

  return (
    <>
      <Encabezado
        titulo="Cuentas de acceso"
        descripcion="Cuentas personales de la administración y cuentas de departamento para el portal."
        acciones={
          <Button onClick={() => setNueva(true)}>
            <PlusIcon className="size-4" /> Nueva cuenta
          </Button>
        }
      />
      <Tarjeta>
        <Tabla
          columnas={[
            { titulo: "Usuario", celda: (c) => <span className="font-semibold text-gray-900">{c.nombre_usuario}</span> },
            { titulo: "Tipo", celda: (c) => (c.tipo === "departamento" ? "Departamento" : "Personal") },
            { titulo: "Roles", celda: (c) => c.roles.map(nombreRol).join(", ") || "—" },
            { titulo: "Estado", celda: (c) => <EstadoCuenta cuenta={c} /> },
            { titulo: "Creada", celda: (c) => formatFechaHora(c.creado_en), className: "whitespace-nowrap" },
          ]}
          filas={cuentas.data?.items}
          clave={(c) => c.id}
          cargando={cuentas.isPending}
          error={cuentas.error}
          vacio="No hay cuentas."
          onFila={(c) => navigate(`/cuentas/${c.id}`)}
          pie={cuentas.data && <Paginador {...cuentas.data} onOffset={setOffset} />}
        />
      </Tarjeta>
      <NuevaCuentaDialog abierto={nueva} onCerrar={() => setNueva(false)} />
    </>
  );
}
