// Componentes de interfaz compartidos.
import { createContext, useContext, useEffect, useState } from "react";
import { feedback } from "./feedback";
import { montoInput, parseMonto } from "./utils";

export const AppCtx = createContext(null);
export const useApp = () => useContext(AppCtx);

export function Sheet({ title, onClose, children }) {
  useEffect(() => {
    const onKey = (e) => e.key === "Escape" && onClose();
    document.addEventListener("keydown", onKey);
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => { document.removeEventListener("keydown", onKey); document.body.style.overflow = prev; };
  }, [onClose]);
  return (
    <div className="backdrop" onMouseDown={(e) => e.target === e.currentTarget && onClose()}>
      <div className="sheet-wrap">
        <div className="sheet" role="dialog" aria-modal="true" aria-label={title}>
          <div className="grab" />
          <button className="btn ghost sm x" onClick={() => { feedback.tap(); onClose(); }} aria-label="Cerrar">✕</button>
          {title && <h2>{title}</h2>}
          {children}
        </div>
      </div>
    </div>
  );
}

export function ConfirmDialog({ title = "¿Confirmar?", msg, confirmLabel = "Confirmar", danger = true, onConfirm, onCancel }) {
  return (
    <div className="backdrop center" onMouseDown={(e) => e.target === e.currentTarget && onCancel()}>
      <div className="dialog" role="alertdialog" aria-modal="true">
        <h3>{title}</h3>
        <p>{msg}</p>
        <div className="btns">
          <button className="btn ghost" onClick={() => { feedback.tap(); onCancel(); }}>Cancelar</button>
          <button className={`btn ${danger ? "danger" : "primary"}`} style={danger ? { flex: 1.4 } : { flex: 1.4, width: "auto" }}
            onClick={() => { feedback.warning(); onConfirm(); }}>{confirmLabel}</button>
        </div>
      </div>
    </div>
  );
}

export function MoneyInput({ value, onChange, placeholder = "$ 0", invalid, autoFocus }) {
  const [txt, setTxt] = useState(montoInput(value));
  // Si el valor cambia desde afuera (ej. total sugerido), refrescamos el texto.
  useEffect(() => { if (parseMonto(txt) !== (value || 0)) setTxt(montoInput(value)); }, [value]); // eslint-disable-line
  return (
    <input className={`input money${invalid ? " err" : ""}`} inputMode="numeric" autoComplete="off" autoFocus={autoFocus}
      placeholder={placeholder} value={txt ? `$ ${txt}` : ""}
      onChange={(e) => { const n = parseMonto(e.target.value); setTxt(montoInput(n)); onChange(n); }} />
  );
}

export function Stepper({ value, onChange, min = 0, max = 999 }) {
  const set = (n) => { feedback.tap(); onChange(Math.min(max, Math.max(min, n))); };
  return (
    <div className="stepper">
      <button type="button" onClick={() => set(value - 1)} aria-label="Menos">−</button>
      <b>{value}</b>
      <button type="button" onClick={() => set(value + 1)} aria-label="Más">+</button>
    </div>
  );
}

export function Chips({ options, value, onChange }) {
  return (
    <div className="chips">
      {options.map((o) => (
        <button type="button" key={o.id} className={`chip${value === o.id ? " on" : ""}`}
          onClick={() => { feedback.tap(); onChange(o.id); }}>
          {o.icon ? `${o.icon} ` : ""}{o.label}{o.sub ? <small>{o.sub}</small> : null}
        </button>
      ))}
    </div>
  );
}

export function Seg({ options, value, onChange }) {
  return (
    <div className="seg">
      {options.map((o) => (
        <button type="button" key={o.id} className={value === o.id ? "on" : ""} onClick={() => { feedback.tap(); onChange(o.id); }}>{o.label}</button>
      ))}
    </div>
  );
}

export const Field = ({ label, children }) => (
  <div className="field">{label && <label>{label}</label>}{children}</div>
);
export const Progress = ({ pct, tone }) => (
  <div className={`progress ${tone || ""}`}><div style={{ width: `${Math.min(100, Math.max(0, pct))}%` }} /></div>
);
export const Kpi = ({ k, v, s, color }) => (
  <div className="kpi"><div className="k">{k}</div><div className="v" style={color ? { color } : undefined}>{v}</div>{s && <div className="s">{s}</div>}</div>
);
export const Empty = ({ icon, children }) => (
  <div className="empty"><div className="ic">{icon}</div><p>{children}</p></div>
);
export const Toggle = ({ on, onChange }) => (
  <button type="button" role="switch" aria-checked={on} className={`toggle${on ? " on" : ""}`} onClick={() => { feedback.tap(); onChange(!on); }} />
);
export const Row = ({ l, r, rc }) => (
  <div className="row"><span className="l">{l}</span><span className={`r ${rc || ""}`}>{r}</span></div>
);

export const ESTADO_UI = {
  pagada: { label: "Pagada", cls: "ok" },
  parcial: { label: "Parcial", cls: "warn" },
  pendiente: { label: "Sin pagar", cls: "bad" },
  cortesia: { label: "Cortesía", cls: "accent" },
  anulada: { label: "Anulada", cls: "mute" },
};
export const EstadoBadge = ({ estado }) => {
  const e = ESTADO_UI[estado] || ESTADO_UI.pendiente;
  return <span className={`badge ${e.cls}`}>{e.label}</span>;
};
