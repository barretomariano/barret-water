// Acceso a datos. Cada venta/gasto es un registro propio (no arrays completos), así dos celulares
// pueden cargar a la vez sin pisarse. Las escrituras NO se esperan con await: sin señal, Firebase
// las guarda en cola y las sincroniza al reconectar, y la pantalla se actualiza al instante.
import { useEffect, useState } from "react";
import { ref, onValue, set, update, remove, runTransaction } from "firebase/database";
import { db, ROOT } from "./firebase";
import { clean, uid, deviceId } from "./utils";

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

  // ── Puerta: contador atómico (varios celulares pueden contar a la vez sin perder toques) ──
  async puerta(eid, delta) {
    const res = await runTransaction(P(`ingresos/${eid}`), (cur) => {
      const next = (Number(cur) || 0) + delta;
      return next < 0 ? undefined : next; // undefined = abortar (nunca bajar de 0)
    });
    if (res.committed) {
      const ts = Date.now();
      await set(P(`ingresosLog/${eid}/${ts}_${uid().slice(0, 5)}`), { ts, d: delta, dev: deviceId() });
    }
    return res.committed;
  },
};
