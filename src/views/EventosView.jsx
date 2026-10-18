import { useState } from "react";
import { api } from "../data";
import { TIPOS_EVENTO } from "../calc";
import { feedback } from "../feedback";
import { enableNotifications, testNotifications, notifStatus, isIOS, isPWA } from "../notifications";
import { fmt, labelDate, montoInput, parseMonto, todayKey, toInt, toList, uid } from "../utils";
import { Chips, Empty, Field, Sheet, Toggle, useApp } from "../ui";
import { tiersDe } from "./VentasView";

const tipoDe = (id) => TIPOS_EVENTO.find((t) => t.id === id) || TIPOS_EVENTO[2];
const reparticion = (ev) => toList(ev?.reparto);

// ───────────────────────── Formulario de evento ─────────────────────────
function EventoForm({ base, onClose, onSaved }) {
  const { toast } = useApp();
  const editing = !!base?.id && !base.__copia;
  const [nombre, setNombre] = useState(base?.nombre || "");
  const [tipo, setTipo] = useState(base?.tipo || "bachata");
  const [fecha, setFecha] = useState(base?.fecha || todayKey());
  const [lugar, setLugar] = useState(base?.lugar || "");
  const [aforo, setAforo] = useState(base?.aforo || 0);
  const [tiers, setTiers] = useState(() => {
    const t = base ? tiersDe(base) : [];
    return t.length ? t.map((x) => ({ ...x })) : [
      { id: uid(), nombre: "Anticipada", precio: 0 }, { id: uid(), nombre: "Puerta", precio: 0 }, { id: uid(), nombre: "Cortesía", precio: 0, cortesia: true },
    ];
  });
  const [reparto, setReparto] = useState(() => reparticion(base).map((x) => ({ ...x })));

  const upTier = (id, patch) => setTiers((l) => l.map((t) => (t.id === id ? { ...t, ...patch } : t)));
  const upRep = (id, patch) => setReparto((l) => l.map((t) => (t.id === id ? { ...t, ...patch } : t)));
  const pctSum = reparto.reduce((a, s) => a + (Number(s.pct) || 0), 0);

  const guardar = () => {
    const nom = nombre.trim();
    if (!nom) return toast("Poné un nombre al evento", "bad");
    if (!fecha) return toast("Elegí la fecha", "bad");
    const ts = tiers.map((t) => ({ ...t, nombre: t.nombre.trim() }));
    if (!ts.length) return toast("Agregá al menos un tipo de entrada", "bad");
    if (ts.some((t) => !t.nombre)) return toast("Todos los tipos de entrada necesitan nombre", "bad");
    if (new Set(ts.map((t) => t.nombre.toLowerCase())).size !== ts.length) return toast("Hay tipos de entrada repetidos", "bad");
    const rs = reparto.map((s) => ({ ...s, nombre: s.nombre.trim() }));
    if (rs.some((s) => !s.nombre)) return toast("Cada socio del reparto necesita nombre", "bad");
    if (rs.length && Math.round(pctSum * 100) !== 10000) return toast(`El reparto suma ${pctSum}%, tiene que sumar 100%`, "bad");

    const ev = {
      id: editing ? base.id : uid(), nombre: nom, tipo, fecha, lugar: lugar.trim(), aforo: toInt(aforo),
      estado: editing ? base.estado || "abierto" : "abierto",
      createdAt: editing ? base.createdAt || Date.now() : Date.now(),
      tiers: Object.fromEntries(ts.map((t, i) => [t.id, { id: t.id, nombre: t.nombre, precio: t.cortesia ? 0 : toInt(t.precio), cortesia: !!t.cortesia, orden: i }])),
      reparto: Object.fromEntries(rs.map((s) => [s.id, { id: s.id, nombre: s.nombre, pct: Number(s.pct) || 0 }])),
    };
    if (editing && base.cerradoAt) ev.cerradoAt = base.cerradoAt;
    api.saveEvento(ev).catch(() => toast("No se pudo guardar", "bad"));
    feedback.success(); toast(editing ? "Evento actualizado" : "Evento creado");
    onSaved(ev, !editing); onClose();
  };

  return (
    <Sheet title={editing ? "Editar evento" : "Nuevo evento"} onClose={onClose}>
      <Field label="Nombre"><input className="input" placeholder="Ej: Noche de Bachata — Sábado" value={nombre} onChange={(e) => setNombre(e.target.value)} maxLength={60} autoFocus={!editing} /></Field>
      <Field label="Tipo"><Chips value={tipo} onChange={setTipo} options={TIPOS_EVENTO} /></Field>
      <div className="two">
        <Field label="Fecha"><input className="input" type="date" value={fecha} onChange={(e) => setFecha(e.target.value)} /></Field>
        <Field label="Aforo (0 = sin límite)"><input className="input" inputMode="numeric" value={aforo || ""} placeholder="0" onChange={(e) => setAforo(parseMonto(e.target.value))} /></Field>
      </div>
      <Field label="Lugar (opcional)"><input className="input" value={lugar} onChange={(e) => setLugar(e.target.value)} maxLength={60} /></Field>

      <div className="lbl">Tipos de entrada</div>
      <div className="small muted" style={{ marginBottom: 8 }}>El precio es una sugerencia: en cada venta podés poner el monto real. Con precio $0 el monto se escribe en cada venta.</div>
      {tiers.map((t) => (
        <div key={t.id} className="card" style={{ padding: 12, animation: "none" }}>
          <div className="two" style={{ gridTemplateColumns: "1.3fr 1fr" }}>
            <input className="input" placeholder="Nombre" value={t.nombre} onChange={(e) => upTier(t.id, { nombre: e.target.value })} maxLength={30} />
            <input className="input" inputMode="numeric" placeholder="$ precio" disabled={t.cortesia} value={t.cortesia ? "" : montoInput(t.precio)} onChange={(e) => upTier(t.id, { precio: parseMonto(e.target.value) })} />
          </div>
          <div className="row" style={{ paddingBottom: 0 }}>
            <label className="small muted" style={{ display: "flex", alignItems: "center", gap: 10 }}>
              <Toggle on={!!t.cortesia} onChange={(v) => upTier(t.id, { cortesia: v, precio: v ? 0 : t.precio })} /> Cortesía (sin cargo)
            </label>
            {tiers.length > 1 && <button className="btn danger sm" onClick={() => setTiers((l) => l.filter((x) => x.id !== t.id))} aria-label="Quitar tipo">✕</button>}
          </div>
        </div>
      ))}
      <button className="btn ghost block" style={{ marginBottom: 16 }} onClick={() => setTiers((l) => [...l, { id: uid(), nombre: "", precio: 0 }])}>+ Agregar tipo de entrada</button>

      <div className="lbl">Reparto del neto entre socios (opcional)</div>
      {reparto.map((s) => (
        <div key={s.id} className="two" style={{ gridTemplateColumns: "1.4fr .8fr auto", marginBottom: 8 }}>
          <input className="input" placeholder="Socio / destino" value={s.nombre} onChange={(e) => upRep(s.id, { nombre: e.target.value })} maxLength={30} />
          <input className="input" inputMode="decimal" placeholder="%" value={s.pct || ""} onChange={(e) => upRep(s.id, { pct: Math.min(100, Math.max(0, parseFloat(e.target.value.replace(",", ".")) || 0)) })} />
          <button className="btn danger sm" onClick={() => setReparto((l) => l.filter((x) => x.id !== s.id))} aria-label="Quitar socio">✕</button>
        </div>
      ))}
      {reparto.length > 0 && <div className={`tiny ${Math.round(pctSum * 100) === 10000 ? "ok" : "warn"}`} style={{ marginBottom: 8 }}>Suma: {pctSum}% {Math.round(pctSum * 100) === 10000 ? "✓" : "(debe ser 100%)"}</div>}
      <button className="btn ghost block" style={{ marginBottom: 18 }} onClick={() => setReparto((l) => [...l, { id: uid(), nombre: "", pct: 0 }])}>+ Agregar socio</button>

      <button className="btn primary" onClick={guardar}>{editing ? "Guardar cambios" : "Crear evento"}</button>
    </Sheet>
  );
}

// ───────────────────────── Acciones sobre un evento ─────────────────────────
function Acciones({ ev, esActivo, r, onClose, onEdit, onDuplicate }) {
  const { toast, confirm } = useApp();
  const cerrado = ev.estado === "cerrado";
  return (
    <Sheet title={ev.nombre} onClose={onClose}>
      <div className="btns" style={{ flexDirection: "column" }}>
        <button className="btn ghost" onClick={onEdit}>✏️ Editar datos, entradas y reparto</button>
        <button className="btn ghost" onClick={onDuplicate}>📑 Duplicar para otra fecha</button>
        {cerrado ? (
          <button className="btn ghost" onClick={() => { api.patchEvento(ev.id, { estado: "abierto", cerradoAt: null }); toast("Evento reabierto"); onClose(); }}>🔓 Reabrir evento</button>
        ) : (
          <button className="btn ghost" onClick={() => confirm({
            title: "Cerrar evento", danger: false, confirmLabel: "Cerrar evento",
            msg: `Se bloquean ventas, gastos y contador de puerta.${esActivo && r?.pendientes ? ` Ojo: hay ${r.pendientes} ventas con ${fmt(r.porCobrar)} sin cobrar.` : ""}${esActivo && r && r.arqueo === null ? " Todavía no cargaste el conteo de efectivo en Caja." : ""}${esActivo ? " Antes de cerrar, mandá el resumen por WhatsApp desde Resumen." : ""} Podés reabrirlo cuando quieras.`,
            onConfirm: () => { api.patchEvento(ev.id, { estado: "cerrado", cerradoAt: Date.now() }); toast("Evento cerrado", "info"); onClose(); },
          })}>🔒 Cerrar evento</button>
        )}
        <button className="btn danger" disabled={!cerrado} onClick={() => confirm({
          title: "Eliminar evento", confirmLabel: "Eliminar para siempre",
          msg: "Se borran sus ventas, cobros, gastos y conteo de puerta. No se puede deshacer. Si lo necesitás, mandá antes el resumen por WhatsApp desde la pestaña Resumen.",
          onConfirm: () => { api.deleteEvento(ev.id); toast("Evento eliminado", "bad"); onClose(); },
        })}>🗑️ Eliminar evento</button>
        {!cerrado && <div className="tiny muted" style={{ textAlign: "center" }}>Para eliminar un evento primero hay que cerrarlo.</div>}
      </div>
    </Sheet>
  );
}

// ───────────────────────── Pantalla ─────────────────────────
export default function EventosView({ eventos, activeId, r, onActivate, version }) {
  const { toast } = useApp();
  const [form, setForm] = useState(null);       // null | {} | evento
  const [acc, setAcc] = useState(null);
  const [sound, setSound] = useState(feedback.isEnabled());
  const [push, setPush] = useState(notifStatus());
  const [busy, setBusy] = useState(false);

  const lista = [...eventos].sort((a, b) => (a.estado === "cerrado") - (b.estado === "cerrado") || (b.fecha || "").localeCompare(a.fecha || ""));

  const activarPush = async () => {
    setBusy(true);
    const res = await enableNotifications();
    setBusy(false); setPush(notifStatus());
    if (res.ok) toast("Notificaciones activadas en este dispositivo");
    else if (res.reason === "ios-install") toast("En iPhone: Compartir → “Agregar a inicio” y abrí la app desde ahí", "warn");
    else if (res.reason === "denied") toast("Permiso denegado. Habilitalo en los ajustes del navegador.", "bad");
    else toast(`No se pudieron activar las notificaciones${res.message ? `: ${res.message}` : ""}`, "bad");
  };

  const probarPush = async () => {
    setBusy(true);
    const res = await testNotifications();
    setBusy(false);
    if (res.ok) toast("Prueba enviada: deberían llegar 2 avisos (local y desde el servidor)", "info");
    else toast(`No se pudo probar${res.message ? `: ${res.message}` : ""}`, "bad");
  };

  return (
    <div className="cols">
      <div className="col">
      <div className="sec"><span>Mis eventos</span><button className="btn ghost sm" onClick={() => { feedback.tap(); setForm({}); }}>+ Nuevo</button></div>
      {lista.length === 0 && (
        <>
          <Empty icon="🎶">Todavía no creaste ningún evento.<br />Creá el primero para empezar a vender y contar entradas.</Empty>
          <button className="btn primary" onClick={() => setForm({})}>Crear mi primer evento</button>
        </>
      )}
      {lista.map((ev) => {
        const t = tipoDe(ev.tipo), activo = ev.id === activeId, cerrado = ev.estado === "cerrado";
        return (
          <div key={ev.id} className="card tap" style={activo ? { borderColor: "var(--accent)", boxShadow: "0 0 24px var(--glow)" } : undefined}
            onClick={() => { feedback.tap(); onActivate(ev.id); }}>
            <div className="row" style={{ padding: 0, alignItems: "flex-start" }}>
              <div style={{ minWidth: 0 }}>
                <div style={{ fontWeight: 800, fontSize: 16 }}>{t.icon} {ev.nombre}</div>
                <div className="small muted" style={{ marginTop: 3 }}>{labelDate(ev.fecha)}{ev.lugar ? ` · ${ev.lugar}` : ""}{ev.aforo ? ` · aforo ${ev.aforo}` : ""}</div>
                <div style={{ marginTop: 8, display: "flex", gap: 6 }}>
                  {activo && <span className="badge accent">En pantalla</span>}
                  <span className={`badge ${cerrado ? "mute" : "ok"}`}>{cerrado ? "Cerrado" : "Abierto"}</span>
                </div>
              </div>
              <button className="btn ghost sm" onClick={(e) => { e.stopPropagation(); setAcc(ev.id); }} aria-label="Más opciones">⋯</button>
            </div>
          </div>
        );
      })}

      </div>
      <div className="col">
      <div className="sec">Ajustes de este dispositivo</div>
      <div className="card">
        <div className="row"><span>🔊 Sonido y vibración</span><Toggle on={sound} onChange={(v) => { feedback.setEnabled(v); setSound(v); if (v) feedback.success(); }} /></div>
        <div className="row">
          <span>🔔 Avisos de ventas<br /><span className="tiny muted">{push === "on" ? "Activados" : push === "denied" ? "Bloqueados por el navegador" : push === "unsupported" ? "No disponible acá" : isIOS() && !isPWA() ? "Instalá la app en inicio primero" : "Recibí un aviso cuando otro celular venda"}</span></span>
          {push !== "unsupported" && push !== "denied" && (
            <span style={{ display: "flex", gap: 6 }}>
              {push === "on" && <button className="btn ghost sm" disabled={busy} onClick={probarPush}>Probar</button>}
              <button className="btn ghost sm" disabled={busy || push === "on"} onClick={activarPush}>{push === "on" ? "✓" : "Activar"}</button>
            </span>
          )}
        </div>
      </div>

      <div className="tiny dim" style={{ textAlign: "center", marginTop: 14 }}>Eventos 🎟️ · v{version}</div>

      </div>

      {form && <EventoForm base={form.id || form.__copia ? form : null} onClose={() => setForm(null)} onSaved={(ev, isNew) => onActivate(ev.id, isNew)} />}
      {acc && (() => {
        const ev = eventos.find((e) => e.id === acc);
        if (!ev) return null;
        return <Acciones ev={ev} esActivo={ev.id === activeId} r={r} onClose={() => setAcc(null)}
          onEdit={() => { setAcc(null); setForm(ev); }}
          onDuplicate={() => { setAcc(null); setForm({ ...ev, __copia: true, id: undefined, nombre: `${ev.nombre} (copia)`, fecha: todayKey(), estado: "abierto", cerradoAt: undefined, createdAt: undefined,
            tiers: Object.fromEntries(tiersDe(ev).map((t) => { const id = uid(); return [id, { ...t, id }]; })),
            reparto: Object.fromEntries(reparticion(ev).map((s) => { const id = uid(); return [id, { ...s, id }]; })) }); }} />;
      })()}
    </div>
  );
}
