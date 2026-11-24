import { useQuery } from "@tanstack/react-query";
import { usePermisos } from "@/shared/hooks/usePermisos";
import { clavesPeriodos, getResumenLiquidaciones, listarPeriodos, type Periodo } from "../services/periodos.service";


/** El periodo abierto más reciente; si no hay abiertos, el último. Solo para mostrarlo. */
function elegirVigente(periodos: Periodo[]): Periodo | null {
  const orden = [...periodos].sort((a, b) => b.anio - a.anio || b.mes - a.mes);
  return orden.find((p) => p.estado === "abierto") ?? orden[0] ?? null;
}

export function usePeriodoVigente() {
  const { puede } = usePermisos();
  const habilitado = puede("finanzas.ver");
  const periodos = useQuery({ queryKey: clavesPeriodos.lista, queryFn: listarPeriodos, enabled: habilitado });
  const vigente = periodos.data ? elegirVigente(periodos.data) : null;
  const resumen = useQuery({
    queryKey: clavesPeriodos.resumen(vigente?.id ?? ""),
    queryFn: () => getResumenLiquidaciones(vigente!.id),
    enabled: habilitado && !!vigente,
  });
  return { vigente, resumen: resumen.data ?? null };
}
