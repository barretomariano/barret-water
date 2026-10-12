import { useMemo, useState } from "react";
import { api } from "../data";
import { estadoPago, pagadoDe, pagosDe, saldoDe, sobrepagoDe, METODOS } from "../calc";
import { feedback } from "../feedback";
import { fmt, toList, uid, timeLabel, dateTimeLabel, toInt } from "../utils";
import { Chips, Empty, EstadoBadge, Field, MoneyInput, Progress, Seg, Sheet, Stepper, useApp } from "../ui";

export const tiersDe = (evento) => toList(evento?.tiers).sort((a, b) => (a.orden ?? 0) - (b.orden ?? 0));

// ───────────────────────── Alta / edición de venta ─────────────────────────
export function VentaModal({ evento, venta, ventas, onClose }) {
  const { toast } = useApp();
  const tiers = tiersDe(evento);
  const editing = !!venta;
  const first = tiers.find((t) => t.id === venta?.tierId) || tiers[0];

  const [tierId, setTierId] = useState(first?.id);
  const [cantidad, setCantidad] = useState(venta?.cantidad || 1);
  const [total, setTotal] = useState(venta ? venta.total : (first && !first.cortesia ? (first.precio || 0) : 0));
  const [tocado, setTocado] = useState(editing); // true = el usuario fijó el monto a mano
  const [comprador, setComprador] = useState(venta?.comprador || "");
  const [vendedor, setVendedor] = useState(venta?.vendedor || "");
  const [nota, setNota] = useState(venta?.nota || "");
  const [modo, setModo] = useState("todo"); // todo | parcial | nada
  const [metodo, setMetodo] = useState("efectivo");
  const [pagado, setPagado] = useState(0);
  const [intento, setIntento] = useState(false);

  const tier = tiers.find((t) => t.id === tierId);
  const cortesia = !!tier?.cortesia;
  const sugerido = cortesia ? 0 : (tier?.precio || 0) * cantidad;
  const distinto = !cortesia && tocado && tier?.precio > 0 && total !== sugerido;

  const recientes = useMemo(() => {
    const s = new Set();
    toList(ventas).sort((a, b) => (b.ts || 0) - (a.ts || 0)).forEach((v) => v.vendedor && s.add(v.vendedor.trim()));
    return [...s].slice(0, 6);
  }, [ventas]);

  const pickTier = (id) => {
    const t = tiers.find((x) => x.id === id);
    setTierId(id);
    if (t.cortesia) { setTotal(0); setTocado(false); }
    else if (!tocado || cortesia) { setTotal((t.precio || 0) * cantidad); setTocado(false); }
  };
  const pickCant = (c) => { setCantidad(c); if (tier && !tocado && !cortesia) setTotal((tier.precio || 0) * c); };

  const errTotal = !cortesia && total <= 0;
  const errParcial = !editing && !cortesia && modo === "parcial" && (pagado <= 0 || pagado >= total);

  const guardar = () => {
    setIntento(true);
    if (!tier) return toast("Este evento no tiene tipos de entrada", "bad");
    if (errTotal) return toast("Ingresá el monto de la venta", "bad");
    if (errParcial) return toast(pagado >= total ? "Si pagó todo, elegí “Pagó todo”" : "Ingresá cuánto pagó", "bad");
    const base = {
      tierId: tier.id, tierNombre: tier.nombre, cantidad: toInt(cantidad, 1, 999), total: cortesia ? 0 : toInt(total),
      comprador: comprador.trim(), vendedor: vendedor.trim(), nota: nota.trim(),
    };
    if (editing) {
      api.editVenta(evento.id, venta.id, base).catch(() => toast("No se pudo guardar", "bad"));
      toast("Venta actualizada"); feedback.success();
    } else {
      const v = { ...base, id: uid(), ts: Date.now() };
      const monto = modo === "todo" ? base.total : modo === "parcial" ? pagado : 0;
      if (!cortesia && monto > 0) { const pid = uid(); v.pagos = { [pid]: { id: pid, monto, metodo, ts: v.ts } }; }
      api.createVenta(evento.id, v).catch(() => toast("No se pudo guardar", "bad"));
      toast(cortesia ? "Cortesía registrada" : "Venta registrada"); feedback.cashier();
    }
    onClose();
  };

  return (
    <Sheet title={editing ? "Editar venta" : "Nueva venta"} onClose={onClose}>
      <Field label="Tipo de entrada">
        <Chips value={tierId} onChange={pickTier}
          options={tiers.map((t) => ({ id: t.id, label: t.nombre, sub: t.cortesia ? "sin cargo" : t.precio ? fmt(t.precio) : "monto libre" }))} />
      </Field>
      <Field label="Cantidad"><Stepper value={cantidad} onChange={pickCant} min={1} max={999} /></Field>
      {!cortesia && (
        <Field label="Monto total de la venta">
          <MoneyInput value={total} invalid={intento && errTotal} onChange={(n) => { setTotal(n); setTocado(true); }} />
          {distinto && (
            <div className="tiny muted" style={{ marginTop: 6 }}>
              Precio de lista: {fmt(sugerido)} ·{" "}
              <button type="button" className="link" onClick={() => { setTotal(sugerido); setTocado(false); }}>usar precio de lista</button>
            </div>
          )}
        </Field>
      )}

      {!editing && !cortesia && (
        <>
          <Field label="¿Cuánto pagó?">
            <Seg value={modo} onChange={setModo} options={[{ id: "todo", label: "Pagó todo" }, { id: "parcial", label: "Pago parcial" }, { id: "nada", label: "Aún nada" }]} />
          </Field>
          {modo !== "nada" && (
            <>
              {modo === "parcial" && (
                <Field label="Monto que pagó ahora">
                  <MoneyInput value={pagado} onChange={setPagado} invalid={intento && errParcial} />
                  {total > 0 && pagado > 0 && pagado < total && <div className="tiny muted" style={{ marginTop: 6 }}>Queda por cobrar {fmt(total - pagado)}</div>}
                </Field>
              )}
              <Field label="Método de pago"><Chips value={metodo} onChange={setMetodo} options={METODOS} /></Field>
            </>
          )}
        </>
      )}

      <div className="two">
        <Field label="Comprador (opcional)"><input className="input" placeholder="Nombre" value={comprador} onChange={(e) => setComprador(e.target.value)} maxLength={60} /></Field>
        <Field label="Vendedor (opcional)"><input className="input" placeholder="Quién vendió" value={vendedor} onChange={(e) => setVendedor(e.target.value)} maxLength={40} /></Field>
      </div>
      {recientes.length > 0 && !vendedor && (
        <div className="chips" style={{ marginTop: -6, marginBottom: 13 }}>
          {recientes.map((n) => <button type="button" key={n} className="chip" style={{ padding: "6px 12px", fontSize: 13 }} onClick={() => setVendedor(n)}>{n}</button>)}
        </div>
      )}
      <Field label="Nota"><input className="input" placeholder="Ej: anticipada de Instagram" value={nota} onChange={(e) => setNota(e.target.value)} maxLength={120} /></Field>

      <button className="btn primary" onClick={guardar}>{editing ? "Guardar cambios" : cortesia ? "Registrar cortesía" : `Registrar venta · ${fmt(total)}`}</button>
    </Sheet>
  );
}

// ───────────────────────── Detalle y cobros ─────────────────────────
function DetalleVenta({ evento, venta, locked, onClose, onEdit }) {
  const { toast, confirm } = useApp();
  const total = venta.total || 0, pagado = pagadoDe(venta), saldo = saldoDe(venta), sobre = sobrepagoDe(venta);
  const estado = estadoPago(venta);
  const [monto, setMonto] = useState(saldo);
  const [metodo, setMetodo] = useState("efectivo");

  const cobrar = () => {
    if (monto <= 0) return toast("Ingresá un monto", "bad");
    if (monto > saldo) return toast(`Supera el saldo (${fmt(saldo)})`, "bad");
    api.addPago(evento.id, venta.id, { id: uid(), monto: toInt(monto), metodo, ts: Date.now() }).catch(() => toast("No se pudo guardar", "bad"));
    feedback.cashier(); toast(monto === saldo ? "Venta saldada ✓" : `Cobro registrado · resta ${fmt(saldo - monto)}`);
    setMonto(Math.max(0, saldo - monto));
  };

  return (
    <Sheet title={`${venta.cantidad}× ${venta.tierNombre}`} onClose={onClose}>
      <div className="card" style={{ animation: "none" }}>
        <div className="row"><span className="l">Estado</span><EstadoBadge estado={estado} /></div>
        <div className="row"><span className="l">Total</span><span className="r">{fmt(total)}</span></div>
        <div className="row"><span className="l">Cobrado</span><span className="r ok">{fmt(pagado)}</span></div>
        {saldo > 0 && <div className="row"><span className="l">Falta cobrar</span><span className="r warn">{fmt(saldo)}</span></div>}
        {total > 0 && <div style={{ marginTop: 8 }}><Progress pct={(pagado / total) * 100} tone={estado === "pagada" ? "ok" : "warn"} /></div>}
        {sobre > 0 && <div className="banner warn" style={{ marginTop: 10, marginBottom: 0 }}>Se cobró <b>{fmt(sobre)}</b> de más (revisá los cobros o el total).</div>}
      </div>

      <div className="small muted" style={{ marginBottom: 12, lineHeight: 1.6 }}>
        {venta.comprador && <>👤 {venta.comprador}<br /></>}
        {venta.vendedor && <>🧾 Vendió: {venta.vendedor}<br /></>}
        {venta.nota && <>📝 {venta.nota}<br /></>}
        🕒 {dateTimeLabel(venta.ts)}{venta.anulada && <> · <b className="bad">Anulada</b></>}
      </div>

      {estado !== "anulada" && saldo > 0 && !locked && (
        <>
          <div className="lbl">Registrar cobro</div>
          <MoneyInput value={monto} onChange={setMonto} />
          <div style={{ margin: "10px 0" }}><Chips value={metodo} onChange={setMetodo} options={METODOS} /></div>
          <button className="btn primary" style={{ marginBottom: 14 }} onClick={cobrar}>Cobrar {fmt(monto)}</button>
        </>
      )}

      <div className="lbl">Cobros ({pagosDe(venta).length})</div>
      {pagosDe(venta).length === 0 && <div className="small muted" style={{ marginBottom: 12 }}>Todavía no hay cobros.</div>}
      {pagosDe(venta).map((p) => (
        <div className="row" key={p.id}>
          <span className="l">{METODOS.find((m) => m.id === p.metodo)?.icon} {timeLabel(p.ts)} · {p.metodo}</span>
          <span className="r">
            {fmt(p.monto)}{" "}
            {!locked && <button className="btn ghost sm" style={{ marginLeft: 6, padding: "4px 9px" }} aria-label="Quitar cobro"
              onClick={() => confirm({ title: "Quitar cobro", msg: `Se elimina el cobro de ${fmt(p.monto)}.`, confirmLabel: "Quitar",
                onConfirm: () => { api.removePago(evento.id, venta.id, p.id); toast("Cobro eliminado", "warn"); } })}>✕</button>}
          </span>
        </div>
      ))}

      {!locked && (
        <div className="btns" style={{ marginTop: 18 }}>
          <button className="btn ghost" onClick={onEdit}>✏️ Editar</button>
          <button className="btn ghost" onClick={() => {
            if (venta.anulada) { api.setAnulada(evento.id, venta.id, false); toast("Venta restaurada"); onClose(); }
            else confirm({ title: "Anular venta", msg: "La venta deja de contar en entradas y recaudación. Podés restaurarla después.", confirmLabel: "Anular",
              onConfirm: () => { api.setAnulada(evento.id, venta.id, true); toast("Venta anulada", "warn"); onClose(); } });
          }}>{venta.anulada ? "↩️ Restaurar" : "🚫 Anular"}</button>
          <button className="btn danger" onClick={() => confirm({ title: "Eliminar venta", msg: "Se borra definitivamente con todos sus cobros. Esto no se puede deshacer.", confirmLabel: "Eliminar",
            onConfirm: () => { api.deleteVenta(evento.id, venta.id); toast("Venta eliminada", "bad"); onClose(); } })}>🗑️</button>
        </div>
      )}
    </Sheet>
  );
}

// ───────────────────────── Lista ─────────────────────────
const FILTROS = [
  { id: "todas", label: "Todas" }, { id: "cobrar", label: "Por cobrar" }, { id: "pagadas", label: "Pagadas" }, { id: "anuladas", label: "Anuladas" },
];

export default function VentasView({ evento, ventas, locked, initialFilter }) {
  const [filtro, setFiltro] = useState(initialFilter || "todas");
  const [q, setQ] = useState("");
  const [sel, setSel] = useState(null);
  const [edit, setEdit] = useState(null);
  const [nueva, setNueva] = useState(false);

  const lista = useMemo(() => {
    const term = q.trim().toLowerCase();
    return ventas
      .filter((v) => {
        const e = estadoPago(v);
        if (filtro === "cobrar" && !(e === "pendiente" || e === "parcial")) return false;
        if (filtro === "pagadas" && !(e === "pagada" || e === "cortesia")) return false;
        if (filtro === "anuladas" && e !== "anulada") return false;
        if (term && !`${v.comprador || ""} ${v.vendedor || ""} ${v.nota || ""} ${v.tierNombre || ""}`.toLowerCase().includes(term)) return false;
        return true;
      })
      .sort((a, b) => (b.ts || 0) - (a.ts || 0));
  }, [ventas, filtro, q]);

  const venta = sel && ventas.find((v) => v.id === sel);
  const cobrarCount = ventas.filter((v) => ["pendiente", "parcial"].includes(estadoPago(v))).length;

  return (
    <>
      <div className="chips" style={{ marginBottom: 10 }}>
        {FILTROS.map((f) => (
          <button key={f.id} className={`chip${filtro === f.id ? " on" : ""}`} style={{ padding: "8px 13px", fontSize: 13 }} onClick={() => { feedback.tap(); setFiltro(f.id); }}>
            {f.label}{f.id === "cobrar" && cobrarCount > 0 ? ` (${cobrarCount})` : ""}
          </button>
        ))}
      </div>
      <input className="input search" type="search" placeholder="Buscar comprador, vendedor, nota…" value={q} onChange={(e) => setQ(e.target.value)} />

      {lista.length === 0 && (
        <Empty icon="🎟️">{ventas.length === 0 ? "Todavía no hay ventas en este evento.\nTocá + para registrar la primera." : "No hay ventas con ese filtro."}</Empty>
      )}
      {lista.map((v) => {
        const e = estadoPago(v), pag = pagadoDe(v), tot = v.total || 0;
        return (
          <div key={v.id} className="card tap" onClick={() => { feedback.tap(); setSel(v.id); }}>
            <div className={`venta${v.anulada ? " anulada" : ""}`}>
              <div className="t">{v.cantidad}× {v.tierNombre}</div>
              <div className="a">{fmt(tot)}</div>
              <div className="m">{timeLabel(v.ts)}{v.comprador ? ` · ${v.comprador}` : ""}{v.vendedor ? ` · 🧾 ${v.vendedor}` : ""}</div>
              <div style={{ textAlign: "right" }}><EstadoBadge estado={e} /></div>
            </div>
            {(e === "parcial") && (
              <div style={{ marginTop: 9 }}>
                <Progress pct={(pag / tot) * 100} tone="warn" />
                <div className="tiny muted" style={{ marginTop: 4 }}>Cobrado {fmt(pag)} · falta {fmt(tot - pag)}</div>
              </div>
            )}
          </div>
        );
      })}

      {!locked && <button className="fab" aria-label="Nueva venta" onClick={() => { feedback.tap(); setNueva(true); }}>+</button>}
      {nueva && <VentaModal evento={evento} ventas={ventas} onClose={() => setNueva(false)} />}
      {edit && <VentaModal evento={evento} ventas={ventas} venta={edit} onClose={() => setEdit(null)} />}
      {venta && !edit && <DetalleVenta evento={evento} venta={venta} locked={locked} onClose={() => setSel(null)} onEdit={() => setEdit(venta)} />}
    </>
  );
}
