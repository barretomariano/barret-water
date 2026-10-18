import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import "./styles.css";
import { AppCtx, ConfirmDialog, Empty } from "./ui";
import { useOnline, useRtdb } from "./data";
import { resumenEvento } from "./calc";
import { feedback } from "./feedback";
import { listenForeground, refreshNotifications } from "./notifications";
import { diffDays, fmt, local, todayKey, toList } from "./utils";
import EventoView from "./views/EventoView";
import VentasView, { tiersDe } from "./views/VentasView";
import PuertaView from "./views/PuertaView";
import CajaView from "./views/CajaView";
import EventosView from "./views/EventosView";

const APP_VERSION = "2.0.0";
const OCULTO = "$ ••••";

const TABS = [
  { id: "resumen", label: "Resumen", icon: "📊" },
  { id: "ventas", label: "Ventas", icon: "🎟️" },
  { id: "puerta", label: "Puerta", icon: "🚪" },
  { id: "caja", label: "Caja", icon: "💰" },
  { id: "eventos", label: "Eventos", icon: "🎶" },
];

// Elige qué evento mostrar: el último usado en este celular; si no existe, el abierto más cercano a hoy.
function pickActivo(eventos, saved) {
  if (saved && eventos.some((e) => e.id === saved)) return saved;
  const hoy = todayKey();
  const abiertos = eventos.filter((e) => e.estado !== "cerrado");
  const pool = abiertos.length ? abiertos : eventos;
  return [...pool].sort((a, b) => Math.abs(diffDays(hoy, a.fecha || hoy)) - Math.abs(diffDays(hoy, b.fecha || hoy)))[0]?.id || null;
}

export default function App() {
  const online = useOnline();
  const [tab, setTab] = useState("resumen");
  const [ventasFilter, setVentasFilter] = useState(null);
  const [toastState, setToast] = useState(null);
  const [confirmState, setConfirm] = useState(null);
  const [activeId, setActiveId] = useState(() => local.get("activo"));
  const toastTimer = useRef(null);
  // Privacidad: oculta los montos en pantalla (se recuerda en este dispositivo).
  const [hide, setHideState] = useState(() => local.get("ocultarMontos", false) === true);
  const setHide = useCallback((v) => { setHideState(v); local.set("ocultarMontos", v); }, []);
  const money = useCallback((n) => (hide ? OCULTO : fmt(n)), [hide]);

  // ── Datos en tiempo real ──
  const evs = useRtdb("eventos");
  const eventos = useMemo(() => toList(evs.data), [evs.data]);

  useEffect(() => {
    if (evs.loading || evs.error) return;
    const next = pickActivo(eventos, activeId);
    if (next !== activeId) setActiveId(next);
    if (next) local.set("activo", next);
  }, [eventos, evs.loading, evs.error, activeId]);

  // Si abrís la app sin señal por primera vez, Firebase no tiene nada para mostrar: avisamos en vez de dejar el spinner mudo.
  const [lento, setLento] = useState(false);
  useEffect(() => {
    if (!evs.loading) { setLento(false); return undefined; }
    const t = setTimeout(() => setLento(true), 7000);
    return () => clearTimeout(t);
  }, [evs.loading]);

  const evento = eventos.find((e) => e.id === activeId) || null;
  const eid = evento?.id || null;
  const ventasDb = useRtdb(eid ? `ventas/${eid}` : null);
  const gastosDb = useRtdb(eid ? `gastos/${eid}` : null);
  const ingDb = useRtdb(eid ? `ingresos/${eid}` : null);
  const logDb = useRtdb(eid ? `ingresosLog/${eid}` : null);

  const ventas = useMemo(() => toList(ventasDb.data), [ventasDb.data]);
  const gastos = useMemo(() => toList(gastosDb.data), [gastosDb.data]);
  const log = useMemo(() => toList(logDb.data).filter((e) => e && e.ts), [logDb.data]);
  const r = useMemo(() => {
    const res = resumenEvento(evento, ventas, gastos, Number(ingDb.data) || 0);
    // Si se renombró un tipo de entrada, mostramos el nombre vigente.
    const nombres = Object.fromEntries(tiersDe(evento).map((t) => [t.id, t.nombre]));
    res.porTier = res.porTier.map((t) => ({ ...t, nombre: nombres[t.id] || t.nombre }));
    return res;
  }, [evento, ventas, gastos, ingDb.data]);

  // ── Toast / confirmación ──
  const toast = useCallback((msg, kind = "ok") => {
    setToast({ msg, kind });
    if (kind === "bad") feedback.error(); else if (kind === "ok") feedback.success(); else feedback.tap();
    clearTimeout(toastTimer.current);
    toastTimer.current = setTimeout(() => setToast(null), 2600);
  }, []);
  const confirm = useCallback((c) => setConfirm(c), []);
  useEffect(() => () => clearTimeout(toastTimer.current), []);

  // ── Service worker (notificaciones + modo offline) ──
  useEffect(() => {
    if (!("serviceWorker" in navigator)) return;
    navigator.serviceWorker.register("/firebase-messaging-sw.js")
      .catch((e) => console.warn("[SW]", e))
      .then(() => refreshNotifications());
  }, []);
  useEffect(() => {
    let off = () => {};
    listenForeground((title, body) => toast(`${title}${body ? ` — ${body}` : ""}`, "info")).then((f) => { off = f; });
    return () => off();
  }, [toast]);

  const activar = useCallback((id, ir = true) => {
    setActiveId(id); local.set("activo", id);
    if (ir) { setTab("resumen"); window.scrollTo(0, 0); }
  }, []);
  const go = useCallback((t, filtro = null) => { setVentasFilter(filtro); setTab(t); window.scrollTo(0, 0); }, []);

  const locked = evento?.estado === "cerrado";

  // Título de la pestaña del navegador: evento + ventas por cobrar (útil con varias pestañas abiertas).
  useEffect(() => {
    document.title = evento ? `${r.pendientes > 0 ? `(${r.pendientes}) ` : ""}${evento.nombre} · Eventos 🎟️` : "Eventos 🎟️";
  }, [evento, r.pendientes]);

  // Atajos de teclado (PC/Mac): 1–5 cambian de sección.
  useEffect(() => {
    const onKey = (e) => {
      if (e.metaKey || e.ctrlKey || e.altKey || /INPUT|TEXTAREA|SELECT/.test(e.target?.tagName) || document.querySelector(".backdrop")) return;
      const t = TABS[Number(e.key) - 1];
      if (t && (evento || t.id === "eventos")) go(t.id);
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [evento, go]);
  const ctx = useMemo(() => ({ toast, confirm, money, hide }), [toast, confirm, money, hide]);
  const pendientes = r.pendientes;
  const cargandoEvento = !!eid && (ventasDb.loading || gastosDb.loading || ingDb.loading);

  // Sin eventos todavía → siempre se muestra la pestaña de eventos.
  const tabActual = !evento && !evs.loading ? "eventos" : tab;

  return (
    <AppCtx.Provider value={ctx}>
      <div className="app" data-theme={evento?.tipo || "otro"}>
        <div className="shell">
          <header className="topbar">
            <div className="brand">
              <small>{evento ? (evento.tipo === "rock" ? "🎸 Noche de rock" : evento.tipo === "bachata" ? "💃 Noche de bachata" : "🎉 Evento") : "Control de entradas"}</small>
              <h1>{evento?.nombre || "Eventos"}</h1>
            </div>
            <button type="button" className={`privacy${hide ? " on" : ""}`} role="switch" aria-checked={hide} aria-label="Ocultar montos"
              title={hide ? "Montos ocultos: tocá para mostrarlos" : "Ocultar montos por privacidad"}
              onClick={() => { feedback.tap(); setHide(!hide); }}>
              <span aria-hidden="true">{hide ? "🙈" : "👁️"}</span><b>{hide ? "Montos ocultos" : "Ocultar montos"}</b>
            </button>
            <div className={`conn${online ? "" : " off"}`} title={online ? "Conectado" : "Sin conexión: los cambios se guardan y se sincronizan al volver la señal"}><i />{online ? "En línea" : "Sin señal"}</div>
          </header>

          {!online && <div className="banner warn">📡 <b>Sin conexión.</b> Seguí cargando: se guarda en el celular y se sincroniza cuando vuelva la señal. No cierres la app.</div>}

          {evs.error ? (
            <div className="banner bad">
              <b>No se pudo leer la base de datos.</b><br />Puede ser un problema de conexión o de permisos de Firebase ({evs.error.code || evs.error.message}).
              <div style={{ marginTop: 10 }}><button className="btn ghost sm" onClick={() => window.location.reload()}>Reintentar</button></div>
            </div>
          ) : evs.loading ? (
            <>
              <div className="spinner" role="status" aria-label="Cargando" />
              {lento && <div className="banner warn">Está tardando más de lo normal. Revisá tu señal: la primera vez que se abre la app hace falta conexión para cargar los eventos.
                <div style={{ marginTop: 10 }}><button className="btn ghost sm" onClick={() => window.location.reload()}>Reintentar</button></div></div>}
            </>
          ) : (
            <main className="tab" key={`${tabActual}-${eid}`}>
              {tabActual !== "eventos" && cargandoEvento && <div className="spinner" role="status" aria-label="Cargando evento" />}
              {tabActual === "resumen" && evento && !cargandoEvento && <EventoView evento={evento} r={r} ventas={ventas} locked={locked} go={go} />}
              {tabActual === "ventas" && evento && !cargandoEvento && <VentasView evento={evento} ventas={ventas} locked={locked} initialFilter={ventasFilter} />}
              {tabActual === "puerta" && evento && !cargandoEvento && <PuertaView evento={evento} r={r} log={log} locked={locked} />}
              {tabActual === "caja" && evento && !cargandoEvento && <CajaView evento={evento} r={r} gastos={gastos} locked={locked} />}
              {tabActual === "eventos" && <EventosView eventos={eventos} activeId={activeId} r={r} onActivate={activar} version={APP_VERSION} />}
              {!evento && tabActual !== "eventos" && <Empty icon="🎶">Creá un evento para empezar.</Empty>}
            </main>
          )}
        </div>

        <nav className="nav" aria-label="Secciones">
          <div className="nav-in">
            {TABS.map((t) => (
              <button key={t.id} className={tabActual === t.id ? "on" : ""} disabled={!evento && t.id !== "eventos"} onClick={() => { feedback.tap(); go(t.id); }} aria-current={tabActual === t.id ? "page" : undefined}>
                <span>{t.icon}</span>{t.label}
                {t.id === "ventas" && pendientes > 0 && <b className="dot">{pendientes}</b>}
              </button>
            ))}
          </div>
        </nav>

        {toastState && <div className={`toast ${toastState.kind === "ok" ? "" : toastState.kind}`} role="status">{toastState.msg}</div>}
        {confirmState && (
          <ConfirmDialog {...confirmState} onCancel={() => setConfirm(null)} onConfirm={() => { const f = confirmState.onConfirm; setConfirm(null); f?.(); }} />
        )}
      </div>
    </AppCtx.Provider>
  );
}
