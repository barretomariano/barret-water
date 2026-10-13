// Base en memoria que imita a Firebase RTDB para tests (suscripciones + escrituras por registro).
import { useEffect, useState } from "react";

let tree = {};
let cache = new Map();
const subs = new Set();
const notify = () => { cache = new Map(); subs.forEach((f) => f()); };
const read = (path) => {
  if (cache.has(path)) return cache.get(path);
  const v = path.split("/").reduce((o, k) => (o == null ? undefined : o[k]), tree);
  const out = v === undefined ? null : JSON.parse(JSON.stringify(v));
  cache.set(path, out);
  return out;
};
const write = (path, val) => {
  const keys = path.split("/");
  let o = tree;
  keys.slice(0, -1).forEach((k) => { if (typeof o[k] !== "object" || o[k] === null) o[k] = {}; o = o[k]; });
  const last = keys[keys.length - 1];
  if (val === null || val === undefined) delete o[last]; else o[last] = JSON.parse(JSON.stringify(val));
  notify();
};
const ok = (v = true) => Promise.resolve(v);

export const __reset = () => { tree = {}; notify(); };
export const __tree = () => tree;

export function useRtdb(path) {
  const [, tick] = useState(0);
  useEffect(() => { const f = () => tick((x) => x + 1); subs.add(f); return () => subs.delete(f); }, []);
  if (!path) return { data: null, loading: false, error: null };
  return { data: read(path), loading: false, error: null };
}
export const useOnline = () => true;

export const api = {
  saveEvento: (ev) => (write(`eventos/${ev.id}`, ev), ok()),
  patchEvento: (id, patch) => { Object.entries(patch).forEach(([k, v]) => write(`eventos/${id}/${k}`, v)); return ok(); },
  deleteEvento: (id) => { ["eventos", "ventas", "gastos", "ingresos", "ingresosLog"].forEach((b) => write(`${b}/${id}`, null)); return ok(); },
  createVenta: (eid, v) => (write(`ventas/${eid}/${v.id}`, v), ok()),
  editVenta: (eid, vid, f) => { Object.entries(f).forEach(([k, v]) => write(`ventas/${eid}/${vid}/${k}`, v)); return ok(); },
  setAnulada: (eid, vid, a) => (write(`ventas/${eid}/${vid}/anulada`, a ? true : null), ok()),
  deleteVenta: (eid, vid) => (write(`ventas/${eid}/${vid}`, null), ok()),
  addPago: (eid, vid, p) => (write(`ventas/${eid}/${vid}/pagos/${p.id}`, p), ok()),
  removePago: (eid, vid, pid) => (write(`ventas/${eid}/${vid}/pagos/${pid}`, null), ok()),
  saveGasto: (eid, g) => (write(`gastos/${eid}/${g.id}`, g), ok()),
  deleteGasto: (eid, gid) => (write(`gastos/${eid}/${gid}`, null), ok()),
  puerta: (eid, d) => {
    const cur = Number(read(`ingresos/${eid}`)) || 0;
    if (cur + d < 0) return ok(false);
    write(`ingresos/${eid}`, cur + d);
    const ts = Date.now() + Math.random();
    write(`ingresosLog/${eid}/${ts}`, { ts, d, dev: "t" });
    return ok(true);
  },
};
