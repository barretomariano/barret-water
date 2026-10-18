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

  const cajaEfectivo = efectivo - gastosEfectivo;
  const arqueo = evento?.arqueoEfectivo === null || evento?.arqueoEfectivo === undefined ? null : n(evento.arqueoEfectivo);

  return {
    entradas, entradasPagas, cortesias, anuladas: ventas.length - activas.length, cantVentas: activas.length, pendientes,
    facturado, cobrado, efectivo, transferencia, porCobrar, sobrepago,
    gastosTotal, gastosEfectivo, gastosTransferencia, gastosPorCat,
    cajaEfectivo,
    cajaCuenta: transferencia - gastosTransferencia,
    arqueo, arqueoDif: arqueo === null ? 0 : arqueo - cajaEfectivo,
    neto, netoProyectado,
    ticketPromedio: entradasPagas > 0 ? facturado / entradasPagas : 0,
    aforo, ocupacion: aforo > 0 ? entradas / aforo : 0,
    ingresos: n(ingresos), faltanIngresar: Math.max(0, entradas - n(ingresos)),
    porTier: Object.values(porTier).sort((a, b) => b.cantidad - a.cantidad),
    porVendedor: Object.values(porVendedor).sort((a, b) => b.facturado - a.facturado),
    reparto, pctTotal, repartoOk: socios.length === 0 || Math.round(pctTotal * 100) === 10000,
  };
}

// Resumen ÚNICO del evento, pensado para WhatsApp: entradas, ingresos (ventas), egresos (gastos) y resultado.
// `fmt` se inyecta para poder mostrar una vista con montos ocultos sin duplicar la lógica.
export function textoResumen(evento, r, fmt, fechaLabel) {
  const L = [];
  L.push(`🎟️ *${evento.nombre}*${fechaLabel ? ` — ${fechaLabel}` : ""}`);
  if (evento.lugar) L.push(`📍 ${evento.lugar}`);
  if (evento.estado === "cerrado") L.push("🔒 Evento cerrado");

  L.push("", "🎫 *ENTRADAS*");
  L.push(`Vendidas: *${r.entradas}*${r.aforo ? ` de ${r.aforo}` : ""}${r.cortesias ? ` (${r.cortesias} cortesías)` : ""}`);
  L.push(`Ingresaron: *${r.ingresos}*${r.faltanIngresar > 0 ? ` · faltan ${r.faltanIngresar}` : ""}`);
  if (r.anuladas > 0) L.push(`Ventas anuladas: ${r.anuladas}`);

  L.push("", "💰 *INGRESOS (ventas)*");
  if (r.porTier.length === 0) L.push("Sin ventas cargadas");
  r.porTier.forEach((t) => L.push(`• ${t.nombre}: ${t.cantidad} → ${fmt(t.facturado)}`));
  L.push(`Total vendido: ${fmt(r.facturado)}`);
  L.push(`Cobrado: *${fmt(r.cobrado)}*  (💵 ${fmt(r.efectivo)} · 🏦 ${fmt(r.transferencia)})`);
  if (r.porCobrar > 0) L.push(`Por cobrar: ${fmt(r.porCobrar)} (${r.pendientes} ${r.pendientes === 1 ? "venta" : "ventas"})`);

  L.push("", "🧾 *EGRESOS (gastos)*");
  const cats = Object.values(r.gastosPorCat).sort((a, b) => b.total - a.total);
  if (cats.length === 0) L.push("Sin gastos cargados");
  cats.forEach((c) => { const cat = GASTO_CATS.find((x) => x.id === c.id); L.push(`• ${cat?.icon || "📦"} ${cat?.label || c.id}: ${fmt(c.total)}`); });
  L.push(`Total gastos: *${fmt(r.gastosTotal)}*  (💵 ${fmt(r.gastosEfectivo)} · 🏦 ${fmt(r.gastosTransferencia)})`);

  L.push("", "📊 *RESULTADO*");
  L.push(`*Neto: ${fmt(r.neto)}*  (cobrado − gastos)`);
  if (r.porCobrar > 0) L.push(`Si se cobra todo: ${fmt(r.netoProyectado)}`);
  L.push(`💵 Caja en efectivo: ${fmt(r.cajaEfectivo)}`);
  L.push(`🏦 En cuenta: ${fmt(r.cajaCuenta)}`);
  if (r.arqueo !== null) L.push(`🧮 Efectivo contado: ${fmt(r.arqueo)}${r.arqueoDif === 0 ? " ✅ cuadra" : ` (${r.arqueoDif > 0 ? "sobran" : "faltan"} ${fmt(Math.abs(r.arqueoDif))})`}`);

  const vendedores = r.porVendedor.filter((v) => v.nombre !== "Sin asignar");
  if (vendedores.length) {
    L.push("", "🧑‍💼 *POR VENDEDOR*");
    vendedores.forEach((v) => L.push(`• ${v.nombre}: ${v.cantidad} entradas · cobró ${fmt(v.cobrado)}${v.porCobrar > 0 ? ` · debe ${fmt(v.porCobrar)}` : ""}`));
  }
  if (r.reparto.length) {
    L.push("", "👥 *REPARTO DEL NETO*");
    r.reparto.forEach((s) => L.push(`• ${s.nombre} (${s.pct}%): ${fmt(s.monto)}`));
  }
  return L.join("\n");
}

// Personas adentro = contador heredado (eventos viejos) + suma de los toques nuevos (v:2) del registro.
// Cada toque es un registro propio: varios celulares pueden contar a la vez y todo se fusiona sin pisarse.
export function contarIngresos(base, log = []) {
  const suma = log.reduce((t, e) => (e && e.v === 2 ? t + (Number(e.d) || 0) : t), 0);
  return Math.max(0, (Number(base) || 0) + suma);
}
