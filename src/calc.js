// Lógica pura de negocio: cobros, resumen del evento, reparto. Sin dependencias de UI.
import { toList } from "./utils";

export const METODOS = [
  { id: "efectivo", label: "Efectivo", icon: "💵" },
  { id: "transferencia", label: "Transferencia", icon: "🏦" },
];

export const GASTO_CATS = [
  { id: "artistas", label: "Artistas / DJ", icon: "🎤" },
  { id: "sonido", label: "Sonido / Luces", icon: "🔊" },
  { id: "seguridad", label: "Seguridad", icon: "🛡️" },
  { id: "local", label: "Alquiler del local", icon: "🏠" },
  { id: "barra", label: "Barra / Insumos", icon: "🍹" },
  { id: "publicidad", label: "Publicidad", icon: "📣" },
  { id: "personal", label: "Personal", icon: "🧑‍🍳" },
  { id: "otros", label: "Otros", icon: "📦" },
];

export const TIPOS_EVENTO = [
  { id: "bachata", label: "Bachata", icon: "💃" },
  { id: "rock", label: "Rock", icon: "🎸" },
  { id: "otro", label: "Otro", icon: "🎉" },
];

const n = (v) => {
  const x = Number(v);
  return Number.isFinite(x) ? x : 0;
};

export const pagosDe = (venta) => toList(venta?.pagos).sort((a, b) => n(a.ts) - n(b.ts));
export const pagadoDe = (venta) => pagosDe(venta).reduce((a, p) => a + n(p.monto), 0);
export const saldoDe = (venta) => Math.max(0, n(venta?.total) - pagadoDe(venta));
export const sobrepagoDe = (venta) => Math.max(0, pagadoDe(venta) - n(venta?.total));

// anulada | cortesia | pagada | parcial | pendiente
export function estadoPago(venta) {
  if (!venta) return "pendiente";
  if (venta.anulada) return "anulada";
  const total = n(venta.total);
  if (total <= 0) return "cortesia";
  const pagado = pagadoDe(venta);
  if (pagado >= total) return "pagada";
  return pagado > 0 ? "parcial" : "pendiente";
}

export function resumenEvento(evento, ventasRaw, gastosRaw, ingresos = 0) {
  const ventas = toList(ventasRaw);
  const activas = ventas.filter((v) => !v.anulada);
  const gastos = toList(gastosRaw);

  let entradas = 0, entradasPagas = 0, cortesias = 0;
  let facturado = 0, cobrado = 0, efectivo = 0, transferencia = 0, porCobrar = 0, sobrepago = 0;
  const porTier = {};
  const porVendedor = {};
  let pendientes = 0;

  for (const v of activas) {
    const cant = n(v.cantidad);
    const total = n(v.total);
    const pagos = pagosDe(v);
    const pag = pagos.reduce((a, p) => a + n(p.monto), 0);
    const ef = pagos.filter((p) => p.metodo === "efectivo").reduce((a, p) => a + n(p.monto), 0);
    const tr = pag - ef;
    const saldo = Math.max(0, total - pag);

    entradas += cant;
    if (total > 0) entradasPagas += cant; else cortesias += cant;
    facturado += total;
    cobrado += pag;
    efectivo += ef;
    transferencia += tr;
    porCobrar += saldo;
    sobrepago += Math.max(0, pag - total);
    if (saldo > 0) pendientes += 1;

    const tk = v.tierId || "?";
    const t = (porTier[tk] ||= { id: tk, nombre: v.tierNombre || "—", cantidad: 0, facturado: 0, cobrado: 0 });
    t.cantidad += cant; t.facturado += total; t.cobrado += pag;

    const vk = (v.vendedor || "").trim() || "Sin asignar";
    const s = (porVendedor[vk] ||= { nombre: vk, cantidad: 0, facturado: 0, cobrado: 0, efectivo: 0, transferencia: 0, porCobrar: 0 });
    s.cantidad += cant; s.facturado += total; s.cobrado += pag; s.efectivo += ef; s.transferencia += tr; s.porCobrar += saldo;
  }

  let gastosTotal = 0, gastosEfectivo = 0, gastosTransferencia = 0;
  const gastosPorCat = {};
  for (const g of gastos) {
    const m = n(g.monto);
    gastosTotal += m;
    if (g.metodo === "efectivo") gastosEfectivo += m; else gastosTransferencia += m;
    const c = (gastosPorCat[g.categoria || "otros"] ||= { id: g.categoria || "otros", total: 0, cantidad: 0 });
    c.total += m; c.cantidad += 1;
  }

  const neto = cobrado - gastosTotal;
  const netoProyectado = facturado - gastosTotal;
  const aforo = n(evento?.aforo);
  const socios = toList(evento?.reparto);
  const pctTotal = socios.reduce((a, s) => a + n(s.pct), 0);
  // Solo se reparte ganancia positiva; si hay pérdida, se muestra el reparto en 0.
  const base = Math.max(0, neto);
  const reparto = socios.map((s) => ({ id: s.id, nombre: s.nombre, pct: n(s.pct), monto: Math.round((base * n(s.pct)) / 100) }));

  return {
    entradas, entradasPagas, cortesias, anuladas: ventas.length - activas.length, cantVentas: activas.length, pendientes,
    facturado, cobrado, efectivo, transferencia, porCobrar, sobrepago,
    gastosTotal, gastosEfectivo, gastosTransferencia, gastosPorCat,
    cajaEfectivo: efectivo - gastosEfectivo,
    cajaCuenta: transferencia - gastosTransferencia,
    neto, netoProyectado,
    ticketPromedio: entradasPagas > 0 ? facturado / entradasPagas : 0,
    aforo, ocupacion: aforo > 0 ? entradas / aforo : 0,
    ingresos: n(ingresos), faltanIngresar: Math.max(0, entradas - n(ingresos)),
    porTier: Object.values(porTier).sort((a, b) => b.cantidad - a.cantidad),
    porVendedor: Object.values(porVendedor).sort((a, b) => b.facturado - a.facturado),
    reparto, pctTotal, repartoOk: socios.length === 0 || Math.round(pctTotal * 100) === 10000,
  };
}

// Texto listo para pegar en WhatsApp.
export function textoResumen(evento, r, fmt, fechaLabel) {
  const L = [];
  L.push(`🎟️ *${evento.nombre}*${fechaLabel ? ` — ${fechaLabel}` : ""}`);
  if (evento.lugar) L.push(`📍 ${evento.lugar}`);
  L.push("");
  L.push(`Entradas vendidas: *${r.entradas}*${r.aforo ? ` de ${r.aforo}` : ""}${r.cortesias ? ` (${r.cortesias} cortesías)` : ""}`);
  L.push(`Ingresaron: *${r.ingresos}*`);
  r.porTier.forEach((t) => L.push(`  • ${t.nombre}: ${t.cantidad} → ${fmt(t.facturado)}`));
  L.push("");
  L.push(`Cobrado: *${fmt(r.cobrado)}*  (💵 ${fmt(r.efectivo)} · 🏦 ${fmt(r.transferencia)})`);
  if (r.porCobrar > 0) L.push(`Por cobrar: ${fmt(r.porCobrar)} (${r.pendientes} ventas)`);
  L.push(`Gastos: ${fmt(r.gastosTotal)}`);
  L.push(`*Neto: ${fmt(r.neto)}*`);
  if (r.reparto.length) {
    L.push("");
    L.push("Reparto:");
    r.reparto.forEach((s) => L.push(`  • ${s.nombre} (${s.pct}%): ${fmt(s.monto)}`));
  }
  return L.join("\n");
}
