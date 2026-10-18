// Acceso a datos. Cada venta/gasto es un registro propio (no arrays completos), así dos celulares
// pueden cargar a la vez sin pisarse. Las escrituras NO se esperan con await: sin señal, Firebase
// las guarda en cola y las sincroniza al reconectar, y la pantalla se actualiza al instante.
import { useEffect, useState } from "react";
import { ref, onValue, set, update, remove } from "firebase/database";
import { db, ROOT } from "./firebase";
import { clean, uid, deviceId, local } from "./utils";

const P = (path) => ref(db, `${ROOT}/${path}`);

export function useRtdb(path) {
  const [state, setState] = useState({ data: undefined, loading: true, error: null });
  useEffect(() => {
    if (!path) { setState({ data: null, loading: false, error: null }); return undefined; }
    setState({ data: undefined, loading: true, error: null });
    const off = onValue(
      P(path),
      (snap) => setState({ data: snap.val(), loading: false, error: null }),
      (error) => setState({ data: null, loading: false, error })
    );
    return off;
  }, [path]);
  return state;
}

export function useOnline() {
  const [online, setOnline] = useState(true);
  useEffect(() => {
    const off = onValue(ref(db, ".info/connected"), (s) => setOnline(s.val() === true));
    return off;
  }, []);
  return online;
}

export const api = {
  // ── Eventos ──
  saveEvento: (ev) => set(P(`eventos/${ev.id}`), clean(ev)),
  patchEvento: (id, patch) => update(P(`eventos/${id}`), clean(patch)),
  deleteEvento: (id) =>
    update(ref(db, ROOT), {
      [`eventos/${id}`]: null, [`ventas/${id}`]: null, [`gastos/${id}`]: null,
      [`ingresos/${id}`]: null, [`ingresosLog/${id}`]: null,
    }),

  // ── Ventas ──
  createVenta: (eid, v) => set(P(`ventas/${eid}/${v.id}`), clean({ ...v, por: deviceId() })),
  editVenta: (eid, vid, fields) => update(P(`ventas/${eid}/${vid}`), clean(fields)), // no toca los pagos
  setAnulada: (eid, vid, anulada) =>
    update(P(`ventas/${eid}/${vid}`), { anulada: anulada ? true : null, anuladaTs: anulada ? Date.now() : null }),
  deleteVenta: (eid, vid) => remove(P(`ventas/${eid}/${vid}`)),
  addPago: (eid, vid, p) => set(P(`ventas/${eid}/${vid}/pagos/${p.id}`), clean({ ...p, ts: p.ts || Date.now() })),
  removePago: (eid, vid, pid) => remove(P(`ventas/${eid}/${vid}/pagos/${pid}`)),

  // ── Gastos ──
  saveGasto: (eid, g) => set(P(`gastos/${eid}/${g.id}`), clean(g)),
  deleteGasto: (eid, gid) => remove(P(`gastos/${eid}/${gid}`)),

  // ── Puerta: cada toque es un registro propio en ingresosLog (clave única). Se fusiona entre celulares
  // sin transacciones ni esperas, y se muestra al instante. Si no hay señal o se cierra la app,
  // el toque queda en una cola local y se reenvía solo (misma clave: nunca se duplica). ──
  puerta(eid, delta) {
    const ts = Date.now();
    const e = { eid, key: `${ts}_${uid().slice(0, 5)}`, ts, d: delta, dev: deviceId() };
    saveOutbox([...outbox(), e]);
    enviarToque(e);
    return Promise.resolve(true);
  },
};

// ── Cola local de toques de puerta ──
const OUT_KEY = "puertaOutbox";
const outbox = () => local.get(OUT_KEY, []);
let pendientes = outbox().length;
const oyentes = new Set();
function saveOutbox(arr) {
  local.set(OUT_KEY, arr);
  pendientes = arr.length;
  oyentes.forEach((f) => f());
}
function enviarToque(e) {
  set(P(`ingresosLog/${e.eid}/${e.key}`), { ts: e.ts, d: e.d, dev: e.dev, v: 2 })
    .then(() => saveOutbox(outbox().filter((x) => x.key !== e.key)))
    .catch(() => {}); // queda en la cola y se reintenta
}
export const flushPuerta = () => outbox().forEach(enviarToque);

// Cantidad de toques todavía sin confirmar por el servidor.
export function usePuertaPendientes() {
  const [n, setN] = useState(pendientes);
  useEffect(() => {
    const f = () => setN(pendientes);
    oyentes.add(f); f();
    return () => oyentes.delete(f);
  }, []);
  return n;
}
