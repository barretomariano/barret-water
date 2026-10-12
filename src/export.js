import { estadoPago, pagadoDe, saldoDe, pagosDe, GASTO_CATS } from "./calc";
import { toCSV, downloadFile, slug, dateTimeLabel, toList } from "./utils";

export function exportVentasCSV(evento, ventas) {
  const rows = [["Fecha y hora", "Tipo de entrada", "Cantidad", "Total", "Cobrado", "Saldo", "Estado", "Comprador", "Vendedor", "Nota", "Detalle de cobros"]];
  toList(ventas).sort((a, b) => (a.ts || 0) - (b.ts || 0)).forEach((v) => {
    rows.push([
      dateTimeLabel(v.ts), v.tierNombre, v.cantidad, v.total || 0, pagadoDe(v), saldoDe(v), estadoPago(v),
      v.comprador || "", v.vendedor || "", v.nota || "",
      pagosDe(v).map((p) => `${p.metodo} $${p.monto}`).join(" + "),
    ]);
  });
  downloadFile(`ventas-${slug(evento.nombre)}-${evento.fecha || ""}.csv`, toCSV(rows));
}

export function exportGastosCSV(evento, gastos) {
  const rows = [["Fecha y hora", "Concepto", "Categoría", "Monto", "Método", "Nota"]];
  toList(gastos).sort((a, b) => (a.ts || 0) - (b.ts || 0)).forEach((g) => {
    rows.push([dateTimeLabel(g.ts), g.concepto, GASTO_CATS.find((c) => c.id === g.categoria)?.label || g.categoria, g.monto, g.metodo, g.nota || ""]);
  });
  downloadFile(`gastos-${slug(evento.nombre)}-${evento.fecha || ""}.csv`, toCSV(rows));
}

export async function compartirTexto(texto) {
  if (navigator.share) {
    try { await navigator.share({ text: texto }); return "shared"; } catch (e) { if (e?.name === "AbortError") return "cancel"; }
  }
  try { await navigator.clipboard.writeText(texto); return "copied"; } catch { return "error"; }
}
