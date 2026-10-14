import { useEffect, useMemo, useRef } from "react";
import { api } from "../data";
import { feedback } from "../feedback";
import { fmtNum, hourOf, timeLabel } from "../utils";
import { Progress, useApp } from "../ui";

export default function PuertaView({ evento, r, log, locked }) {
  const { toast } = useApp();
  const n = r.ingresos;

  // Mantiene la pantalla encendida mientras se cuenta en la puerta (si el navegador lo permite).
  useEffect(() => {
    let lock = null, cancelled = false;
    const pedir = async () => {
      try { if ("wakeLock" in navigator && document.visibilityState === "visible") { lock = await navigator.wakeLock.request("screen"); if (cancelled) lock.release().catch(() => {}); } } catch {}
    };
    pedir();
    document.addEventListener("visibilitychange", pedir);
    return () => { cancelled = true; document.removeEventListener("visibilitychange", pedir); lock?.release?.().catch(() => {}); };
  }, []);

  const lleno = r.aforo > 0 && n >= r.aforo;

  const tocar = (delta) => {
    if (locked) return;
    if (delta < 0 && n + delta < 0) return feedback.error();
    api.puerta(evento.id, delta).then((ok) => { if (!ok) toast("No se puede bajar de 0", "warn"); }).catch(() => toast("No se pudo registrar", "bad"));
    if (delta > 0) { if (r.aforo > 0 && n + delta === r.aforo) feedback.full(); else feedback.door(); } else feedback.doorUndo();
  };

  // Atajos de teclado para el mostrador (Mac/PC): Espacio, Enter, + o ↑ suma · − o ↓ resta.
  // Se ignoran mientras se escribe en un campo o hay una ventana abierta.
  const tocarRef = useRef(tocar);
  tocarRef.current = tocar;
  useEffect(() => {
    const onKey = (e) => {
      if (e.metaKey || e.ctrlKey || e.altKey || e.repeat) return;
      const tag = e.target?.tagName;
      if (tag === "INPUT" || tag === "TEXTAREA" || tag === "SELECT" || document.querySelector(".backdrop")) return;
      const nativo = tag === "BUTTON" || tag === "A"; // Espacio/Enter ya activan el botón enfocado
      if (e.key === "+" || e.key === "ArrowUp" || (!nativo && (e.key === " " || e.key === "Enter"))) { e.preventDefault(); tocarRef.current(1); }
      else if (e.key === "-" || e.key === "ArrowDown") { e.preventDefault(); tocarRef.current(-1); }
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, []);

  // Flujo de ingreso por hora (hora Argentina), en orden cronológico.
  const flow = useMemo(() => {
    const m = new Map();
    log.forEach((e) => { const k = Math.floor(e.ts / 3600000); m.set(k, (m.get(k) || 0) + (e.d || 0)); });
    return [...m.entries()].sort((a, b) => a[0] - b[0]).slice(-10).map(([k, v]) => ({ h: hourOf(k * 3600000 + 1800000), v: Math.max(0, v) }));
  }, [log]);
  const maxFlow = Math.max(1, ...flow.map((f) => f.v));
  const recientes = useMemo(() => [...log].sort((a, b) => b.ts - a.ts).slice(0, 6), [log]);

  return (
    <>
      {locked && <div className="banner info">🔒 Evento cerrado: el contador está bloqueado.</div>}
      {lleno && <div className="banner bad">🚫 <b>Aforo completo</b> ({fmtNum(r.aforo)}). {n > r.aforo && `Hay ${n - r.aforo} personas de más.`}</div>}

      <div className="cols">
      <div className="col">
      <div className="card" style={{ paddingTop: 20, paddingBottom: 20 }}>
        <div className={`door-count${lleno ? " full" : ""}`} aria-live="polite">{fmtNum(n)}</div>
        <div className="door-cap">Personas adentro</div>
      </div>

      <button className="door-plus" disabled={locked} onClick={() => tocar(1)} aria-label="Sumar una persona">+1</button>
      <div className="door-quick">
        <button disabled={locked || n < 1} onClick={() => tocar(-1)} aria-label="Restar una persona">−1</button>
        <button disabled={locked} onClick={() => tocar(2)}>+2</button>
        <button disabled={locked} onClick={() => tocar(5)}>+5</button>
      </div>

      <div className="kbd-hint">⌨️ Teclado: <kbd>Espacio</kbd> o <kbd>+</kbd> suma · <kbd>−</kbd> resta</div>

      </div>
      <div className="col">
      <div className="sec">Control de ingreso</div>
      <div className="card">
        <div className="bar-row" style={{ marginTop: 0 }}>
          <div className="h"><span>Ingresaron / vendidas</span><b>{fmtNum(n)} / {fmtNum(r.entradas)}</b></div>
          <Progress pct={r.entradas ? (n / r.entradas) * 100 : 0} tone={n > r.entradas ? "warn" : ""} />
        </div>
        {r.aforo > 0 && (
          <div className="bar-row" style={{ marginBottom: 0 }}>
            <div className="h"><span>Ocupación del aforo</span><b>{fmtNum(n)} / {fmtNum(r.aforo)}</b></div>
            <Progress pct={(n / r.aforo) * 100} tone={lleno ? "bad" : n / r.aforo >= 0.9 ? "warn" : ""} />
          </div>
        )}
        {n > r.entradas && <div className="tiny muted" style={{ marginTop: 10 }}>Ingresaron {n - r.entradas} más que las entradas registradas (staff, invitados o ventas sin cargar).</div>}
        {r.faltanIngresar > 0 && <div className="tiny muted" style={{ marginTop: 10 }}>Faltan ingresar {r.faltanIngresar} entradas vendidas.</div>}
      </div>

      {flow.length > 0 && (
        <>
          <div className="sec">Ingreso por hora</div>
          <div className="card">
            <div className="flow">{flow.map((f, i) => (
              <div key={i}><span>{f.v}</span><i style={{ height: `${(f.v / maxFlow) * 62}%` }} /><span>{String(f.h).padStart(2, "0")}h</span></div>
            ))}</div>
          </div>
        </>
      )}

      {recientes.length > 0 && (
        <>
          <div className="sec">Últimos movimientos</div>
          <div className="card">
            {recientes.map((e) => (
              <div className="row" key={`${e.ts}${e.dev}${e.d}`}>
                <span className="l">{timeLabel(e.ts)}</span>
                <span className={`r ${e.d > 0 ? "ok" : "warn"}`}>{e.d > 0 ? `+${e.d}` : e.d}</span>
              </div>
            ))}
          </div>
        </>
      )}
      </div>
      </div>
    </>
  );
}
