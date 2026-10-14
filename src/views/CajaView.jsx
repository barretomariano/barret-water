import { useState } from "react";
import { api } from "../data";
import { GASTO_CATS, METODOS } from "../calc";
import { feedback } from "../feedback";
import { fmt as fmtReal, toInt, uid, timeLabel } from "../utils";
import { Chips, Empty, Field, Kpi, MoneyInput, Progress, Row, Sheet, useApp } from "../ui";

function GastoModal({ evento, gasto, onClose }) {
  const { toast, confirm } = useApp();
  const fmt = fmtReal;
  const [concepto, setConcepto] = useState(gasto?.concepto || "");
  const [categoria, setCategoria] = useState(gasto?.categoria || "artistas");
  const [monto, setMonto] = useState(gasto?.monto || 0);
  const [metodo, setMetodo] = useState(gasto?.metodo || "efectivo");
  const [nota, setNota] = useState(gasto?.nota || "");

  const guardar = () => {
    if (monto <= 0) return toast("Ingresá el monto del gasto", "bad");
    const cat = GASTO_CATS.find((c) => c.id === categoria);
    const g = { id: gasto?.id || uid(), ts: gasto?.ts || Date.now(), concepto: concepto.trim() || cat.label, categoria, monto: toInt(monto), metodo, nota: nota.trim() };
    api.saveGasto(evento.id, g).catch(() => toast("No se pudo guardar", "bad"));
    feedback.success(); toast(gasto ? "Gasto actualizado" : "Gasto registrado"); onClose();
  };

  return (
    <Sheet title={gasto ? "Editar gasto" : "Nuevo gasto"} onClose={onClose}>
      <Field label="Categoría"><Chips value={categoria} onChange={setCategoria} options={GASTO_CATS} /></Field>
      <Field label="Monto"><MoneyInput value={monto} onChange={setMonto} autoFocus={!gasto} /></Field>
      <Field label="Pagado con"><Chips value={metodo} onChange={setMetodo} options={METODOS} /></Field>
      <Field label="Concepto (opcional)"><input className="input" placeholder="Ej: DJ invitado, alquiler de sonido" value={concepto} onChange={(e) => setConcepto(e.target.value)} maxLength={80} /></Field>
      <Field label="Nota"><input className="input" value={nota} onChange={(e) => setNota(e.target.value)} maxLength={120} /></Field>
      <button className="btn primary" onClick={guardar}>{gasto ? "Guardar cambios" : `Registrar gasto · ${fmt(monto)}`}</button>
      {gasto && (
        <button className="btn danger block" style={{ marginTop: 10 }} onClick={() => confirm({ title: "Eliminar gasto", msg: `Se borra “${gasto.concepto}” (${fmt(gasto.monto)}).`, confirmLabel: "Eliminar",
          onConfirm: () => { api.deleteGasto(evento.id, gasto.id); toast("Gasto eliminado", "bad"); onClose(); } })}>🗑️ Eliminar gasto</button>
      )}
    </Sheet>
  );
}

// Arqueo: el efectivo que hay físicamente en la caja vs. el que debería haber según las ventas y gastos.
function Arqueo({ evento, r, locked }) {
  const { toast, money: fmt } = useApp();
  const guardado = r.arqueo !== null;
  const [v, setV] = useState(guardado ? r.arqueo : 0);

  const guardar = () => {
    api.patchEvento(evento.id, { arqueoEfectivo: toInt(v) }).catch(() => toast("No se pudo guardar", "bad"));
    feedback.success(); toast("Conteo guardado");
  };
  const borrar = () => {
    api.patchEvento(evento.id, { arqueoEfectivo: null }).catch(() => toast("No se pudo borrar", "bad"));
    setV(0); toast("Conteo borrado", "info");
  };

  return (
    <div className="card">
      <div className="row" style={{ padding: 0 }}><span className="l">Efectivo que debería haber</span><span className="r">{fmt(r.cajaEfectivo)}</span></div>
      {!locked && (
        <div style={{ marginTop: 10 }}>
          <div className="lbl">Efectivo contado en caja</div>
          <MoneyInput value={v} onChange={setV} />
          <div className="btns" style={{ marginTop: 10 }}>
            <button className="btn ghost" onClick={guardar}>🧮 Guardar conteo</button>
            {guardado && <button className="btn ghost" onClick={borrar}>Borrar</button>}
          </div>
        </div>
      )}
      {guardado && (
        <div className="row" style={{ marginTop: 10 }}>
          <span className="l">{r.arqueoDif === 0 ? "Cuadra ✅" : r.arqueoDif > 0 ? "Sobra efectivo" : "Falta efectivo"}</span>
          <span className={`r ${r.arqueoDif === 0 ? "ok" : "warn"}`}>{r.arqueoDif === 0 ? fmt(r.arqueo) : fmt(Math.abs(r.arqueoDif))}</span>
        </div>
      )}
      {!guardado && locked && <div className="small muted">No se cargó un conteo de caja.</div>}
    </div>
  );
}

export default function CajaView({ evento, r, gastos, locked }) {
  const { money: fmt } = useApp();
  const [modal, setModal] = useState(null); // "nuevo" | gasto
  const cats = Object.values(r.gastosPorCat).sort((a, b) => b.total - a.total);
  const maxCat = Math.max(1, ...cats.map((c) => c.total));
  const lista = [...gastos].sort((a, b) => (b.ts || 0) - (a.ts || 0));

  return (
    <>
      {locked && <div className="banner info">🔒 Evento cerrado: solo lectura.</div>}
      {r.cajaEfectivo < 0 && <div className="banner warn">Gastaste <b>{fmt(-r.cajaEfectivo)}</b> más en efectivo del que cobraste en efectivo. Revisá el método de pago de los gastos.</div>}

      <div className="cols">
        <div className="col">
          <div className="kpis">
            <Kpi k="💵 Caja efectivo" v={fmt(r.cajaEfectivo)} s="cobrado − gastos en efectivo" color={r.cajaEfectivo < 0 ? "var(--bad)" : undefined} />
            <Kpi k="🏦 En cuenta" v={fmt(r.cajaCuenta)} s="transferencias − gastos" color={r.cajaCuenta < 0 ? "var(--bad)" : undefined} />
          </div>

          <div className="card">
            <Row l="Cobrado" r={fmt(r.cobrado)} rc="ok" />
            <Row l="Gastos" r={`− ${fmt(r.gastosTotal)}`} />
            <Row l="Neto" r={fmt(r.neto)} rc={r.neto < 0 ? "bad" : "ok"} />
            {r.porCobrar > 0 && <Row l="Neto si cobrás lo pendiente" r={fmt(r.netoProyectado)} />}
          </div>

          <div className="sec">Arqueo de caja</div>
          <Arqueo key={`${evento.id}-${r.arqueo}`} evento={evento} r={r} locked={locked} />

          <div className="sec">
            <span>Gastos ({lista.length})</span>
            {!locked && <button className="btn ghost sm" onClick={() => { feedback.tap(); setModal("nuevo"); }}>+ Agregar</button>}
          </div>
          {lista.length === 0 ? <Empty icon="🧾">Sin gastos cargados.<br />Sumá artistas, sonido, seguridad, alquiler…</Empty> : lista.map((g) => {
            const c = GASTO_CATS.find((x) => x.id === g.categoria);
            return (
              <div className={`card${locked ? "" : " tap"}`} key={g.id} onClick={() => !locked && setModal(g)}>
                <div className="row" style={{ padding: 0 }}>
                  <span><b>{c?.icon} {g.concepto}</b><br /><span className="small muted">{c?.label} · {timeLabel(g.ts)} · {g.metodo}</span></span>
                  <span className="r" style={{ fontSize: 18 }}>{fmt(g.monto)}</span>
                </div>
              </div>
            );
          })}
        </div>

        <div className="col">
          {cats.length > 0 && (
            <>
              <div className="sec">Gastos por categoría</div>
              <div className="card">
                {cats.map((c) => { const cc = GASTO_CATS.find((x) => x.id === c.id); return (
                  <div className="bar-row" key={c.id}><div className="h"><span>{cc?.icon} {cc?.label || c.id}</span><b>{fmt(c.total)}</b></div><Progress pct={(c.total / maxCat) * 100} /></div>
                ); })}
              </div>
            </>
          )}

          {r.porVendedor.length > 0 && r.porVendedor.some((v) => v.nombre !== "Sin asignar") && (
            <>
              <div className="sec">Rendición por vendedor</div>
              <div className="card">
                {r.porVendedor.map((v) => (
                  <div key={v.nombre} style={{ padding: "8px 0", borderTop: "1px solid var(--line)" }}>
                    <div className="row" style={{ padding: 0 }}><b>🧾 {v.nombre}</b><span className="small muted">{v.cantidad} entradas · {fmt(v.facturado)}</span></div>
                    <div className="small muted" style={{ marginTop: 3 }}>💵 {fmt(v.efectivo)} efectivo · 🏦 {fmt(v.transferencia)}{v.porCobrar > 0 && <> · <span className="warn">debe {fmt(v.porCobrar)}</span></>}</div>
                  </div>
                ))}
              </div>
            </>
          )}

          <div className="sec">Reparto del neto</div>
          {r.reparto.length === 0 ? (
            <div className="card small muted">Para ver cuánto le toca a cada socio, cargá el reparto (%) al editar el evento, en la pestaña Eventos.</div>
          ) : (
            <div className="card">
              {!r.repartoOk && <div className="banner warn">Los porcentajes suman <b>{r.pctTotal}%</b>, no 100%. Corregilo en la edición del evento.</div>}
              {r.reparto.map((s) => <Row key={s.id} l={`${s.nombre} (${s.pct}%)`} r={fmt(s.monto)} />)}
              {r.neto <= 0 && <div className="tiny muted" style={{ marginTop: 8 }}>No hay ganancia para repartir todavía.</div>}
            </div>
          )}
        </div>
      </div>

      {modal && <GastoModal evento={evento} gasto={modal === "nuevo" ? null : modal} onClose={() => setModal(null)} />}
    </>
  );
}
