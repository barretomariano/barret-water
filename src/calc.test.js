import { estadoPago, pagadoDe, saldoDe, resumenEvento } from "./calc";
import { parseMonto, toCSV, toList, clean } from "./utils";

const venta = (o = {}) => ({ id: "v", cantidad: 1, total: 10000, tierId: "t1", tierNombre: "Anticipada", pagos: {}, ...o });
const pago = (monto, metodo = "efectivo", ts = 1) => ({ id: `p${ts}${monto}`, monto, metodo, ts });
const pagos = (...ps) => Object.fromEntries(ps.map((p) => [p.id, p]));

describe("estado de pago", () => {
  test("pendiente sin pagos", () => expect(estadoPago(venta())).toBe("pendiente"));
  test("parcial con pago incompleto", () => expect(estadoPago(venta({ pagos: pagos(pago(4000)) }))).toBe("parcial"));
  test("pagada en partes", () => {
    const v = venta({ pagos: pagos(pago(4000, "efectivo", 1), pago(6000, "transferencia", 2)) });
    expect(estadoPago(v)).toBe("pagada");
    expect(pagadoDe(v)).toBe(10000);
    expect(saldoDe(v)).toBe(0);
  });
  test("cortesía (total 0) no es deuda", () => expect(estadoPago(venta({ total: 0 }))).toBe("cortesia"));
  test("anulada manda sobre el resto", () => expect(estadoPago(venta({ anulada: true, pagos: pagos(pago(10000)) }))).toBe("anulada"));
  test("pagos como array también funcionan (RTDB)", () => expect(pagadoDe(venta({ pagos: [pago(500), pago(700, "efectivo", 2)] }))).toBe(1200));
});

describe("resumen del evento", () => {
  const evento = {
    aforo: 100,
    reparto: { a: { id: "a", nombre: "Socio A", pct: 60 }, b: { id: "b", nombre: "Socio B", pct: 40 } },
  };
  const ventas = {
    1: venta({ id: "1", cantidad: 2, total: 16000, vendedor: "Juli", pagos: pagos(pago(16000, "transferencia")) }),
    2: venta({ id: "2", cantidad: 3, total: 30000, tierId: "t2", tierNombre: "Puerta", vendedor: "Juli", pagos: pagos(pago(10000, "efectivo", 1)) }),
    3: venta({ id: "3", cantidad: 1, total: 0, tierId: "t3", tierNombre: "Cortesía" }),
    4: venta({ id: "4", cantidad: 5, total: 50000, anulada: true, pagos: pagos(pago(50000)) }),
  };
  const gastos = {
    g1: { id: "g1", monto: 12000, metodo: "efectivo", categoria: "sonido" },
    g2: { id: "g2", monto: 8000, metodo: "transferencia", categoria: "artistas" },
  };
  const r = resumenEvento(evento, ventas, gastos, 4);

  test("cuenta entradas ignorando anuladas", () => {
    expect(r.entradas).toBe(6);
    expect(r.entradasPagas).toBe(5);
    expect(r.cortesias).toBe(1);
    expect(r.anuladas).toBe(1);
  });
  test("separa facturado, cobrado y por cobrar", () => {
    expect(r.facturado).toBe(46000);
    expect(r.cobrado).toBe(26000);
    expect(r.porCobrar).toBe(20000);
    expect(r.pendientes).toBe(1);
  });
  test("divide efectivo y transferencia", () => {
    expect(r.efectivo).toBe(10000);
    expect(r.transferencia).toBe(16000);
  });
  test("caja descuenta gastos por método", () => {
    expect(r.gastosTotal).toBe(20000);
    expect(r.cajaEfectivo).toBe(-2000); // se gastó más efectivo del que entró: debe verse
    expect(r.cajaCuenta).toBe(8000);
    expect(r.neto).toBe(6000);
    expect(r.netoProyectado).toBe(26000);
  });
  test("reparto del neto por porcentaje", () => {
    expect(r.reparto.map((s) => s.monto)).toEqual([3600, 2400]);
    expect(r.repartoOk).toBe(true);
  });
  test("no reparte si hay pérdida", () => {
    const perd = resumenEvento(evento, {}, gastos, 0);
    expect(perd.neto).toBe(-20000);
    expect(perd.reparto.every((s) => s.monto === 0)).toBe(true);
  });
  test("detecta reparto que no suma 100%", () => {
    const e = { reparto: [{ id: "a", nombre: "A", pct: 70 }, { id: "b", nombre: "B", pct: 20 }] };
    expect(resumenEvento(e, {}, {}, 0).repartoOk).toBe(false);
  });
  test("ocupación, ingresos y faltantes", () => {
    expect(r.ocupacion).toBeCloseTo(0.06);
    expect(r.faltanIngresar).toBe(2);
  });
  test("agrupa por vendedor", () => {
    const juli = r.porVendedor.find((s) => s.nombre === "Juli");
    expect(juli.cantidad).toBe(5);
    expect(juli.efectivo).toBe(10000);
    expect(juli.porCobrar).toBe(20000);
    expect(r.porVendedor.find((s) => s.nombre === "Sin asignar").cantidad).toBe(1);
  });
  test("evento vacío no rompe (sin NaN)", () => {
    const v = resumenEvento(null, null, null, undefined);
    expect(v.entradas).toBe(0);
    expect(Number.isNaN(v.ticketPromedio)).toBe(false);
  });
});

describe("utils", () => {
  test("parseMonto entiende formato argentino", () => {
    expect(parseMonto("15.000")).toBe(15000);
    expect(parseMonto("$ 8.500")).toBe(8500);
    expect(parseMonto("")).toBe(0);
    expect(parseMonto("abc")).toBe(0);
  });
  test("toList normaliza objeto, array y null", () => {
    expect(toList(null)).toEqual([]);
    expect(toList({ a: 1, b: 2 })).toEqual([1, 2]);
    expect(toList([1, null, 3])).toEqual([1, 3]);
  });
  test("clean elimina undefined (RTDB lo rechaza)", () => {
    expect(clean({ a: 1, b: undefined, c: { d: undefined, e: 2 } })).toEqual({ a: 1, c: { e: 2 } });
  });
  test("CSV escapa comillas y neutraliza fórmulas", () => {
    const csv = toCSV([["a", 'di "hola"'], ["=SUM(A1)", 5]]);
    expect(csv).toContain('"di ""hola"""');
    expect(csv).toContain("'=SUM(A1)");
  });
});
