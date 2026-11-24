import { useQueries, useQuery } from "@tanstack/react-query";
import { usePermisos } from "@/shared/hooks/usePermisos";
import { Modal } from "@/shared/components/app/Dialogos";
import { TableStateBlock } from "@/shared/components/TableState";
import { MensajeDepartamentoDialog } from "@/features/departamentos/components/MensajeDepartamentoDialog";
import { clavesDepartamentos, listarAnexos, type Departamento } from "@/features/departamentos/services/departamentos.service";
import type { DepartamentoFicha } from "@/features/departamentos/types";
import { clavesTipos, listarTipos } from "@/features/configuracion/services/tipos.service";
import { clavesPersonas, getPersona, vinculosDeDepartamento } from "@/features/personas/services/personas.service";
import { clavesLiquidaciones, getLiquidacion, listarLiquidacionesDepartamento } from "@/features/liquidaciones/services/liquidaciones.service";
import { clavesReportes, getMorosidad } from "@/features/reportes/services/reportes.service";
import { clavesCuenta, getEstadoCuenta, listarPagos } from "../services/cuenta.service";

/**
 * Mensaje a ocupantes (F-008): reúne los datos reales del departamento y abre el
 * modal que redacta el texto para correo o WhatsApp. Moravia no lo envía.
 */
export function MensajeDepartamento({ departamento: d, onCerrar }: { departamento: Departamento; onCerrar: () => void }) {
  const finanzas = usePermisos().puede("finanzas.ver");
  const vinculos = useQuery({ queryKey: clavesPersonas.ocupantes(d.id, true), queryFn: () => vinculosDeDepartamento(d.id, true) });
  const personas = useQueries({
    queries: (vinculos.data ?? []).map((v) => ({ queryKey: clavesPersonas.una(v.persona_id), queryFn: () => getPersona(v.persona_id) })),
  });
  const anexos = useQuery({ queryKey: clavesDepartamentos.anexos(d.id), queryFn: () => listarAnexos(d.id) });
  const tipos = useQuery({ queryKey: clavesTipos.lista, queryFn: listarTipos, enabled: finanzas });
  const estado = useQuery({ queryKey: clavesCuenta.estado(d.id, ""), queryFn: () => getEstadoCuenta(d.id), enabled: finanzas });
  const pagos = useQuery({ queryKey: clavesCuenta.pagos(d.id), queryFn: () => listarPagos(d.id), enabled: finanzas });
  const morosidad = useQuery({ queryKey: clavesReportes.morosidad(false), queryFn: () => getMorosidad(false), enabled: finanzas });
  const liqs = useQuery({ queryKey: clavesLiquidaciones.delDepartamento(d.id), queryFn: () => listarLiquidacionesDepartamento(d.id), enabled: finanzas });
  const ultima = liqs.data?.filter((l) => l.estado === "emitida").sort((a, b) => (b.anio ?? 0) - (a.anio ?? 0) || (b.mes ?? 0) - (a.mes ?? 0))[0];
  const liquidacion = useQuery({ queryKey: clavesLiquidaciones.una(ultima?.id ?? ""), queryFn: () => getLiquidacion(ultima!.id), enabled: !!ultima });

  const cargando =
    vinculos.isPending ||
    personas.some((p) => p.isPending) ||
    anexos.isPending ||
    (finanzas && (estado.isPending || pagos.isPending || morosidad.isPending || liqs.isPending || (!!ultima && liquidacion.isPending)));

  if (cargando) {
    return (
      <Modal abierto onCerrar={onCerrar} titulo="Mensaje a ocupantes">
        <TableStateBlock variant="loading" />
      </Modal>
    );
  }

  const ficha: DepartamentoFicha = {
    departamento: d,
    tipo: tipos.data?.find((t) => t.id === d.tipo_departamento_id) ?? null,
    anexos: anexos.data ?? [],
    ocupantes: (vinculos.data ?? []).flatMap((v) => {
      const persona = personas.find((p) => p.data?.id === v.persona_id)?.data;
      return persona ? [{ vinculo: v, persona }] : [];
    }),
    morosidad: morosidad.data?.filas.find((f) => f.departamento_id === d.id) ?? null,
    estadoCuenta: estado.data ?? null,
    liquidacion: liquidacion.data ? { ...liquidacion.data, departamento_codigo: liquidacion.data.departamento_codigo ?? null } : null,
    pagos: pagos.data ?? [],
  };

  return <MensajeDepartamentoDialog ficha={ficha} onClose={onCerrar} />;
}
