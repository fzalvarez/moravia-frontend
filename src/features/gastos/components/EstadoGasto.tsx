import { Etiqueta, type Tono } from "@/shared/components/app/Pagina";
import { NOMBRE_ESTADO_PAGO, type Gasto } from "../services/gastos.service";

const TONO: Record<Gasto["estado"], Tono> = { pendiente: "ambar", parcial: "azul", pagado: "verde", anulado: "gris" };

export function EstadoGasto({ gasto }: { gasto: Gasto }) {
  return (
    <span className="flex flex-wrap gap-1">
      <Etiqueta tono={TONO[gasto.estado]}>{NOMBRE_ESTADO_PAGO[gasto.estado]}</Etiqueta>
      {gasto.vencido && <Etiqueta tono="rojo">Vencido</Etiqueta>}
    </span>
  );
}
