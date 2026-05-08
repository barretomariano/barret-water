import { useState, useEffect, useMemo, useCallback, useRef } from "react";

// ─────────────────────────────────────────────────────────────────────────────
// FIREBASE REST
// ─────────────────────────────────────────────────────────────────────────────
const FB = "https://barretwater-default-rtdb.firebaseio.com/barretwater";

const storage = {
  async get(key) {
    try {
      const r = await fetch(`${FB}/${key}.json`);
      if (!r.ok) return null;
      const data = await r.json();
      return data === null || data === undefined ? null : { key, value: data };
    } catch (e) { console.error("storage.get", key, e); return null; }
  },
  async set(key, value) {
    try {
      const clean = (x) => {
        if (Array.isArray(x)) return x.filter(i => i !== undefined && i !== null).map(clean);
        if (x && typeof x === "object") { const o = {}; for (const k in x) if (x[k] !== undefined) o[k] = clean(x[k]); return o; }
        return x;
      };
      const toStore = typeof value === "string"
        ? (() => { try { return JSON.parse(value); } catch { return value; } })()
        : clean(value);
      const r = await fetch(`${FB}/${key}.json`, {
        method: "PUT", body: JSON.stringify(toStore),
        headers: { "Content-Type": "application/json" },
      });
      return r.ok ? { key, value } : null;
    } catch (e) { console.error("storage.set", key, e); return null; }
  },
  async delete(key) {
    try { await fetch(`${FB}/${key}.json`, { method: "DELETE" }); return { key, deleted: true }; }
    catch { return null; }
  },
  async multiSet(entries) {
    const results = await Promise.all(entries.map(([k, v]) => this.set(k, v)));
    const failed = entries.filter((_, i) => !results[i]);
    if (failed.length) await Promise.all(failed.map(([k, v]) => this.set(k, v)));
  },
};

function firebaseToJs(v, depth = 0) {
  if (depth > 20) return v;
  if (v === null || v === undefined) return v;
  if (typeof v === "string") { try { return JSON.parse(v); } catch { return v; } }
  if (Array.isArray(v)) return v.map(x => firebaseToJs(x, depth + 1));
  if (typeof v === "object") {
    const keys = Object.keys(v);
    if (keys.length > 0 && keys.every(k => String(parseInt(k, 10)) === k))
      return keys.sort((a, b) => parseInt(a, 10) - parseInt(b, 10)).map(k => firebaseToJs(v[k], depth + 1));
    const out = {};
    for (const k of keys) out[k] = firebaseToJs(v[k], depth + 1);
    return out;
  }
  return v;
}

async function sget(k) {
  try { const r = await storage.get(k); if (!r) return null; return firebaseToJs(r.value); }
  catch { return null; }
}
async function sset(k, v) { try { await storage.set(k, v); } catch {} }

// ─────────────────────────────────────────────────────────────────────────────
// LOGO (abreviado — usar el original completo del repo)
// ─────────────────────────────────────────────────────────────────────────────
const LOGO_B64 = "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAEMAAAB4CAYAAACpd08dAABAS0lEQVR42uW9d5xV1dk2fN1rrb33KdOBoYMKogJWsBcYFTHEEpMZNfYSeDTWWFHxMBpb1MSWGDFqYo0zJvaCIsVuBEEFRFBARPr0U/beq9zfH2cGe8TE5H2f9zu/Wb8zs88+5+x17evu91oD/B96ZJgFAFw8861+J7+zfNUps+b8BABGzZyp/k9dk/g/8q3MtKgR1LBggb9KpB/JSa9vXpb88ZcvvT1kdk2N6QLq/xdgjJoF2VhH9ol15jZX3m2fuLUptkFQ3RKUPJl57q2yegCZTEb8Pw/GqJkz1ewaMifPfO90W145MWxtNkJI32SzxpSUbftxOnUfiNys0aP/3wajtqFBzq6pMWfPmr9z6Cd/HxXylpglAJAgFbe1aVtWddRJM+dfOrumxvy39Qf9N/UEALrh9dfT87lyTqyCITbMOyIhvnQOQ0rrKSXLCu0H/umAkTNqGxpkY12d/X+KGaNmQYLIva/L/mjTZUNsoWC+AgQAEBGsFYaBXJB++LLZc3o31ta6TOa/o1DFf1NPnDJj3gRbXvnzuL3NkKBvFwEi4eLQmUSq5woEDwgheNboWeK/wWLx39ITZ8yau10+SP0uyuc26YnvlF0SUre3G1dWdcDxM96t79Qf8n83GMwE1GLOHPZaKHjAKi/FWhfF4fuUmSAZdbSZMFEy+dTp82pm19SY2oYG+b8WjFGzZsnGOrK/bZ53DUorR9hczhDR5k6oqD8cIx8ED1zzyrs9Guvq3H/S/xD/afE4/tm39s97qYtyTc0GDEn8Q2wdCRuHzqVK+y50ciozY9GwYf8x3UH/OfEAXTJ9bun8ULxvvaC/shFLKYWUBCkFSAC8eYDAWRunq3v5ifWfH3/v/js/VFTINeZ/BTNGzZolQeT+0RLdklPJAYVc3kaGRWwstHHQ2sIZxuawhJ21fmmZL9taPqj2Um/WNrAcPXq0+09ct/pPiEdjTY0Z/eCMI9pk8mTX2mp8QYqZYZ2AdYAnCc4xJAsoQSBJ38oSZmdVqlSqsLBgK9N+UH3N7mu/wj76QUL3X2ZGJiMaF9byL//+drc2403N5yLWsRGRsYiMRaQtIm0QaofIOGjtEGsHaxzgviqzzGxlskT6OlrRM7v+oPqa3dcyM534xof3nzhjfgZE/GNblx8VjNphUwj15F5b13JzTgTVLixYa1jEcScQnaDE2iDWDpG2iI1FrB2MsXCWi4rEOSeDhPSsXlNZaBt7yyGj1jCzOPW1Dx+JSypPiPzkZWe/8u7Qxro6+2MCIn5U8agju//d0w4ryPRJcXurscYpqw2ccTDa4augmE6mOMS6CEgcOxhtHaRHPnO2LNd6+O/H7L6EAJww+4M/Fkorjg43rg+d7/vrrfxDkUm1/5dZE2bCFFBm2KzU31flF+Vk0I+dYUghSBBICkgpIIQASQEhASkJnpRQkqCEhFICHoGlr1wq8EV3Wzj07gN3eR4ATpwx/3e6qsd5hZYWTQSPAZMoK1fJ9o0T7xu986xaifKISaE8ZzgIAMAMAHACDST+YAYA/Qa8CIBNj4YAAAAAElFkJggg==";

// ─────────────────────────────────────────────────────────────────────────────
// CONSTANTS
// ─────────────────────────────────────────────────────────────────────────────
const APP_VERSION = "11.0";
const DEFAULT_PRICES     = { p20: 5000, p12: 3000 };
const DEFAULT_CV20       = [{ id: "tapa20", name: "Tapa", monto: 100 }, { id: "etiq20", name: "Etiqueta", monto: 84 }];
const DEFAULT_CV12       = [{ id: "tapa12", name: "Tapa", monto: 100 }, { id: "etiq12", name: "Etiqueta", monto: 84 }];
const DEFAULT_FIJOS_CATS = [
  { id: "gnc", name: "GNC", icon: "⛽" }, { id: "agua", name: "Agua", icon: "💧" },
  { id: "luz", name: "Luz", icon: "💡" }, { id: "filtros", name: "Filtros", icon: "🔧" },
];
const DEFAULT_SECTORS = [
  { id: "reinversion", name: "Reinversión", monto: 800,  color: "#0EA5E9", icon: "🏭" },
  { id: "sueldos",     name: "Sueldos",     monto: 1200, color: "#10B981", icon: "💼" },
  { id: "insumos",     name: "Insumos",     monto: 484,  color: "#F59E0B", icon: "🧴" },
  { id: "operativo",   name: "Operativos",  monto: 600,  color: "#8B5CF6", icon: "⚙️" },
  { id: "ganancia",    name: "Ganancia",    monto: 1416, color: "#EC4899", icon: "📈" },
];
const DEFAULT_ZONES = [
  { id: "sanjose",     name: "San José",      color: "#0EA5E9", icon: "📍" },
  { id: "colon",       name: "Colón",         color: "#10B981", icon: "📍" },
  { id: "brillante",   name: "El Brillante",  color: "#F59E0B", icon: "📍" },
  { id: "teresita",    name: "Santa Teresita",color: "#8B5CF6", icon: "📍" },
];
const DAILY_UNIT_GOAL = 10;
const PAGO_TIPOS = [
  { id: "efectivo",      label: "Efectivo",      icon: "💵", color: "#10B981" },
  { id: "transferencia", label: "Transferencia", icon: "🏦", color: "#0EA5E9" },
  { id: "fiado",         label: "Fiado",         icon: "📋", color: "#F59E0B" },
];
const GASTO_TIPOS = [
  { id: "operativo",      label: "Operativo",      icon: "⚙️", color: "#8B5CF6" },
  { id: "fijo",           label: "Costo Fijo",     icon: "🔁", color: "#0EA5E9" },
  { id: "extraordinario", label: "Extraordinario", icon: "⚠️", color: "#ef4444" },
];
const DIAS_SEMANA = ["Dom", "Lun", "Mar", "Mié", "Jue", "Vie", "Sáb"];
const ESTADOS_CLIENTE = [
  { id: "activo",  label: "Activo",  color: "#10B981" },
  { id: "pausado", label: "Pausado", color: "#F59E0B" },
  { id: "perdido", label: "Perdido", color: "#ef4444" },
];

// ─────────────────────────────────────────────────────────────────────────────
// UTILS
// ─────────────────────────────────────────────────────────────────────────────
const fmt       = n => "$" + Math.round(n).toLocaleString("es-AR");
const uid       = () => (typeof crypto !== "undefined" && crypto.randomUUID) ? crypto.randomUUID() : `${Date.now()}-${Math.random().toString(36).slice(2)}`;
const clampArr  = arr => Array.isArray(arr) ? arr.filter(Boolean) : [];
const arDate    = () => new Date(new Date().toLocaleString("en-US", { timeZone: "America/Argentina/Buenos_Aires" }));
const todayKey  = () => { const d = arDate(); return d.toISOString().slice(0, 10); };
const todayDow  = () => arDate().getDay();
const labelDate = iso => new Date(iso + "T12:00:00").toLocaleDateString("es-AR", { weekday: "short", day: "numeric", month: "short" });
const labelDateLong = iso => new Date(iso + "T12:00:00").toLocaleDateString("es-AR", { weekday: "long", day: "numeric", month: "long" });
const currentMonth  = () => todayKey().slice(0, 7);
const prevMonth     = () => { const d = new Date(currentMonth() + "-01"); d.setMonth(d.getMonth() - 1); return d.toISOString().slice(0, 7); };
const weekStart     = () => { const d = arDate(); d.setDate(d.getDate() - d.getDay()); return d.toISOString().slice(0, 10); };
const prevWeekStart = () => { const d = arDate(); d.setDate(d.getDate() - d.getDay() - 7); return d.toISOString().slice(0, 10); };
const prevWeekEnd   = () => { const d = arDate(); d.setDate(d.getDate() - d.getDay() - 1); return d.toISOString().slice(0, 10); };
const diffDays      = (a, b) => Math.round((new Date(b + "T12:00:00") - new Date(a + "T12:00:00")) / 86400000);
const addDays       = (iso, n) => { const d = new Date(iso + "T12:00:00"); d.setDate(d.getDate() + n); return d.toISOString().slice(0, 10); };

function proximaVisita(cli) {
  const hoy = todayKey();
  if (!cli.frecuenciaTipo || cli.frecuenciaTipo === "ninguna") return null;
  if (cli.frecuenciaTipo === "dias") {
    const cada = cli.frecuenciaDias || 7;
    const ultima = cli.ultimaVisita || hoy;
    return addDays(ultima, cada);
  }
  if (cli.frecuenciaTipo === "semanal") {
    const dias = clampArr(cli.diasSemana);
    if (!dias.length) return null;
    const dow = todayDow();
    let menor = 99;
    dias.forEach(d => { let diff = (d - dow + 7) % 7; if (diff === 0) diff = 7; if (diff < menor) menor = diff; });
    return addDays(hoy, menor);
  }
  return null;
}

function tocaHoy(cli) {
  if (!cli.frecuenciaTipo || cli.frecuenciaTipo === "ninguna") return false;
  if (cli.estado === "pausado" || cli.estado === "perdido") return false;
  if (cli.frecuenciaTipo === "semanal") return clampArr(cli.diasSemana).includes(todayDow());
  if (cli.frecuenciaTipo === "dias") {
    if (!cli.ultimaVisita) return true;
    const prox = proximaVisita(cli);
    return prox !== null && prox <= todayKey();
  }
  return false;
}

const emptyDay   = (date) => ({ date: date || todayKey(), ventas: [], gastos: [], nota: "" });
const costoTotal = arr => clampArr(arr).reduce((a, c) => a + (parseFloat(c.monto) || 0), 0);

function dayTotals(day, prices) {
  const p20 = prices?.p20 || 5000, p12 = prices?.p12 || 3000;
  let cobrado = 0, fiado = 0, efectivo = 0, transferencia = 0, u20 = 0, u12 = 0;
  clampArr(day?.ventas).forEach(v => {
    const m = v.montoManual != null ? v.montoManual : ((v.u20 || 0) * p20 + (v.u12 || 0) * p12);
    u20 += (v.u20 || 0); u12 += (v.u12 || 0);
    if (v.pago === "fiado") fiado += m;
    else { cobrado += m; if (v.pago === "efectivo") efectivo += m; else transferencia += m; }
  });
  const gastos      = clampArr(day?.gastos);
  const gastosOp    = gastos.filter(g => g.tipo === "operativo").reduce((a, g) => a + (parseFloat(g.monto) || 0), 0);
  const gastosExt   = gastos.filter(g => g.tipo === "extraordinario").reduce((a, g) => a + (parseFloat(g.monto) || 0), 0);
  const gastosFijos = gastos.filter(g => g.tipo === "fijo").reduce((a, g) => a + (parseFloat(g.monto) || 0), 0);
  return { cobrado, fiado, efectivo, transferencia, gastos: gastosOp + gastosExt + gastosFijos, gastosOp, gastosExt, gastosFijos, u20, u12 };
}

function calcCierreSemanal(days, prices, cv20, cv12, fijosCats) {
  const u20 = days.reduce((a, d) => a + dayTotals(d, prices).u20, 0);
  const u12 = days.reduce((a, d) => a + dayTotals(d, prices).u12, 0);
  const totalBidones = u20 + u12;
  const cobrado  = days.reduce((a, d) => a + dayTotals(d, prices).cobrado, 0);
  const gastosOp = days.reduce((a, d) => a + dayTotals(d, prices).gastosOp, 0);
  const gastosExt= days.reduce((a, d) => a + dayTotals(d, prices).gastosExt, 0);
  const fijosPorCat = clampArr(fijosCats).map(cat => {
    const total = days.reduce((a, d) => a + clampArr(d.gastos).filter(g => g.tipo === "fijo" && g.cat === cat.id).reduce((b, g) => b + (parseFloat(g.monto) || 0), 0), 0);
    return { ...cat, total, porBidon: totalBidones > 0 ? total / totalBidones : 0 };
  }).filter(c => c.total > 0);
  const totalFijos     = fijosPorCat.reduce((a, c) => a + c.total, 0);
  const costosVarTotal = u20 * costoTotal(cv20) + u12 * costoTotal(cv12);
  const costoTotalReal = costosVarTotal + totalFijos + gastosOp;
  const costoXBidon    = totalBidones > 0 ? costoTotalReal / totalBidones : 0;
  const precioPromedio = totalBidones > 0 ? cobrado / totalBidones : 0;
  const utilidad       = cobrado - costoTotalReal - gastosExt;
  return { u20, u12, totalBidones, cobrado, gastosOp, gastosExt, totalFijos, fijosPorCat, costosVarTotal, costoTotalReal, costoXBidon, precioPromedio, utilidad };
}

function validateBackup(data) {
  if (!data || typeof data !== "object") return false;
  for (const key of ["history", "fiados", "clientes"]) {
    if (data[key] !== undefined && !Array.isArray(data[key])) return false;
  }
  if (data.prices && (typeof data.prices.p20 !== "number" || typeof data.prices.p12 !== "number")) return false;
  return true;
}

// ─────────────────────────────────────────────────────────────────────────────
// NOTIFICATIONS
// ─────────────────────────────────────────────────────────────────────────────
async function requestNotifPermission() {
  if (!("Notification" in window)) return false;
  if (Notification.permission === "granted") return true;
  const perm = await Notification.requestPermission();
  return perm === "granted";
}
function sendNotif(title, body, icon = "/icon-192.png") {
  if (!("Notification" in window) || Notification.permission !== "granted") return;
  try { new Notification(title, { body, icon }); } catch {}
}

// ─────────────────────────────────────────────────────────────────────────────
// THEME
// ─────────────────────────────────────────────────────────────────────────────
const DARK = {
  bg: "#060d1a", bgCard: "linear-gradient(160deg,rgba(255,255,255,0.07) 0%,rgba(255,255,255,0.02) 100%)",
  border: "rgba(255,255,255,0.08)", borderTop: "rgba(255,255,255,0.18)",
  text: "#f1f5f9", textMuted: "#7c8fa8", textDim: "#2d3f55",
  input: "rgba(255,255,255,0.05)", inputBorder: "rgba(255,255,255,0.12)",
  navBg: "rgba(6,13,26,0.97)", accent: "#38bdf8", accentAlt: "#818cf8",
  success: "#34d399", warning: "#fbbf24", danger: "#f87171",
};
const LIGHT = {
  bg: "#f8fafc", bgCard: "linear-gradient(160deg,rgba(255,255,255,0.95) 0%,rgba(241,245,249,0.85) 100%)",
  border: "rgba(0,0,0,0.07)", borderTop: "rgba(255,255,255,0.95)",
  text: "#0f172a", textMuted: "#64748b", textDim: "#cbd5e1",
  input: "rgba(0,0,0,0.04)", inputBorder: "rgba(0,0,0,0.09)",
  navBg: "rgba(248,250,252,0.97)", accent: "#0284C7", accentAlt: "#6366f1",
  success: "#10B981", warning: "#F59E0B", danger: "#ef4444",
};

// ─────────────────────────────────────────────────────────────────────────────
// DESIGN PRIMITIVES
// ─────────────────────────────────────────────────────────────────────────────
const glassCard = (th) => ({
  background: th.bgCard, border: `1px solid ${th.border}`, borderTop: `1px solid ${th.borderTop}`,
  borderRadius: 20, boxShadow: "0 2px 16px rgba(0,0,0,0.15),inset 0 1px 0 rgba(255,255,255,0.1)",
  padding: "14px 16px", marginBottom: 12,
});
const inputStyle = (th) => ({
  padding: "11px 14px", background: th.input, border: `1px solid ${th.inputBorder}`,
  borderRadius: 12, color: th.text, fontSize: 14, outline: "none",
  width: "100%", boxSizing: "border-box",
});
const btnPrimary = {
  background: "linear-gradient(135deg,#38bdf8,#0284C7)", border: "none", borderRadius: 14,
  color: "white", fontSize: 14, fontWeight: 700, cursor: "pointer", padding: "13px",
  width: "100%", boxShadow: "0 6px 20px rgba(56,189,248,0.25)", letterSpacing: "0.02em",
};
const btnGhost = (th) => ({
  background: "rgba(255,255,255,0.06)", border: `1px solid ${th.border}`,
  borderRadius: 11, color: th.textMuted, cursor: "pointer", padding: "8px 14px", fontSize: 13,
});

// ─────────────────────────────────────────────────────────────────────────────
// UI PRIMITIVES
// ─────────────────────────────────────────────────────────────────────────────
function GCard({ children, style, th }) {
  return <div style={{ ...glassCard(th), ...style }}>{children}</div>;
}
function Label({ children, th }) {
  return <div style={{ fontSize: 11, fontWeight: 600, color: th?.textMuted, marginBottom: 5, textTransform: "uppercase", letterSpacing: "0.05em" }}>{children}</div>;
}
function Row({ label, value, vc, th }) {
  return (
    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "5px 0" }}>
      <span style={{ fontSize: 12, color: th?.textMuted }}>{label}</span>
      <span style={{ fontSize: 13, fontWeight: 600, color: vc || th?.text }}>{value}</span>
    </div>
  );
}
function PBar({ pct, a, b, style }) {
  return (
    <div style={{ height: 6, borderRadius: 99, background: "rgba(255,255,255,0.06)", overflow: "hidden", ...style }}>
      <div style={{ height: "100%", width: `${Math.min(Math.max(pct, 0), 100)}%`, background: `linear-gradient(90deg,${a},${b})`, borderRadius: 99, transition: "width 0.5s ease" }} />
    </div>
  );
}
function StatBox({ label, value, color, sub, th }) {
  return (
    <div style={{ padding: 12, background: `${color}12`, borderRadius: 13, border: `1px solid ${color}22`, borderTop: `1px solid ${color}35` }}>
      <div style={{ fontSize: 10, color: th?.textMuted, marginBottom: 3, textTransform: "uppercase", letterSpacing: "0.04em" }}>{label}</div>
      <div style={{ fontSize: 18, fontWeight: 700, color }}>{value}</div>
      {sub && <div style={{ fontSize: 10, color: th?.textMuted, marginTop: 2 }}>{sub}</div>}
    </div>
  );
}
function Empty({ icon, text, th }) {
  return (
    <div style={{ textAlign: "center", padding: "48px 20px", color: th?.textMuted }}>
      <div style={{ fontSize: 40, marginBottom: 12, opacity: 0.5 }}>{icon}</div>
      <div style={{ fontSize: 13 }}>{text}</div>
    </div>
  );
}
function SectionTitle({ children, th, style }) {
  return <div style={{ fontSize: 12, fontWeight: 700, color: th?.textMuted, textTransform: "uppercase", letterSpacing: "0.07em", marginBottom: 10, marginTop: 4, ...style }}>{children}</div>;
}
function TotalRow({ label, value, color, th }) {
  return (
    <div style={{ marginTop: 10, padding: "10px 13px", background: "rgba(255,255,255,0.04)", borderRadius: 10, display: "flex", justifyContent: "space-between", borderTop: "1px solid rgba(255,255,255,0.08)" }}>
      <span style={{ fontSize: 13, color: th?.textMuted }}>{label}</span>
      <span style={{ fontSize: 15, fontWeight: 700, color: color || th?.text }}>{value}</span>
    </div>
  );
}
function ZoneBadge({ zoneId, zones }) {
  const z = zones?.find(x => x.id === zoneId);
  if (!z) return null;
  return (
    <span style={{ fontSize: 10, fontWeight: 600, padding: "2px 7px", borderRadius: 20, background: `${z.color}22`, color: z.color, border: `1px solid ${z.color}44`, whiteSpace: "nowrap" }}>
      {z.icon} {z.name}
    </span>
  );
}
function Toggle({ value, onChange }) {
  return (
    <div onClick={() => onChange(!value)} style={{ width: 44, height: 24, borderRadius: 99, background: value ? "#10B981" : "rgba(255,255,255,0.15)", cursor: "pointer", position: "relative", transition: "background 0.2s", flexShrink: 0 }}>
      <div style={{ position: "absolute", top: 3, left: value ? 23 : 3, width: 18, height: 18, borderRadius: 99, background: "white", transition: "left 0.2s" }} />
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// CONFIRM DIALOG
// ─────────────────────────────────────────────────────────────────────────────
function ConfirmDialog({ msg, onConfirm, onCancel, th }) {
  return (
    <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.7)", zIndex: 500, display: "flex", alignItems: "center", justifyContent: "center", padding: 20 }}>
      <div style={{ ...glassCard(th), maxWidth: 340, width: "100%", padding: 24 }}>
        <div style={{ fontSize: 15, fontWeight: 600, color: th.text, marginBottom: 8 }}>⚠️ Confirmar acción</div>
        <div style={{ fontSize: 13, color: th.textMuted, marginBottom: 20 }}>{msg}</div>
        <div style={{ display: "flex", gap: 10 }}>
          <button onClick={onCancel} style={{ ...btnGhost(th), flex: 1, textAlign: "center" }}>Cancelar</button>
          <button onClick={onConfirm} style={{ flex: 2, padding: "11px", background: "linear-gradient(135deg,#ef4444,#dc2626)", border: "none", borderRadius: 11, color: "white", fontWeight: 700, cursor: "pointer", fontSize: 13 }}>Confirmar</button>
        </div>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// BOTTOM MODAL
// ─────────────────────────────────────────────────────────────────────────────
function BottomModal({ children, onClose, th }) {
  return (
    <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.7)", zIndex: 300, display: "flex", alignItems: "flex-end" }} onClick={e => e.target === e.currentTarget && onClose()}>
      <div style={{ width: "100%", maxWidth: 500, margin: "0 auto", background: th.bg, borderRadius: "22px 22px 0 0", padding: "16px 18px 40px", boxShadow: "0 -12px 48px rgba(0,0,0,0.4)", borderTop: `1px solid ${th.border}`, maxHeight: "92vh", overflowY: "auto" }}>
        <div style={{ display: "flex", justifyContent: "center", marginBottom: 14, position: "relative" }}>
          <div style={{ width: 36, height: 4, background: th.border, borderRadius: 99 }} />
          <button onClick={onClose} style={{ position: "absolute", right: 0, top: -8, ...btnGhost(th), padding: "3px 10px", fontSize: 16 }}>✕</button>
        </div>
        {children}
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// CLIENT SEARCH
// ─────────────────────────────────────────────────────────────────────────────
function ClienteSearch({ clientes, value, onChange, th }) {
  const [showSug, setShowSug] = useState(false);
  const ref = useRef(null);

  const filtered = useMemo(() => {
    if (!value || value.length < 1) return [];
    const q = value.toLowerCase();
    return clientes.filter(c =>
      (c.nombre || "").toLowerCase().includes(q) ||
      (c.direccion || "").toLowerCase().includes(q) ||
      (c.tel || "").includes(value)
    ).slice(0, 6);
  }, [clientes, value]);

  useEffect(() => {
    const handler = (e) => { if (ref.current && !ref.current.contains(e.target)) setShowSug(false); };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  return (
    <div ref={ref} style={{ position: "relative" }}>
      <input type="text" placeholder="Buscar cliente..." value={value}
        onChange={e => { onChange({ query: e.target.value, cliente: null }); setShowSug(true); }}
        onFocus={() => setShowSug(true)}
        style={inputStyle(th)} />
      {showSug && filtered.length > 0 && (
        <div style={{ position: "absolute", top: "100%", left: 0, right: 0, background: th.bg, borderRadius: "0 0 12px 12px", border: `1px solid ${th.border}`, zIndex: 50, overflow: "hidden", boxShadow: "0 8px 24px rgba(0,0,0,0.3)" }}>
          {filtered.map(c => (
            <div key={c.id} onMouseDown={() => { onChange({ query: c.nombre, cliente: c }); setShowSug(false); }}
              style={{ padding: "10px 14px", cursor: "pointer", fontSize: 13, borderBottom: `1px solid ${th.border}`, color: th.text }}>
              <span style={{ fontWeight: 600 }}>{c.nombre}</span>
              {c.direccion && <span style={{ color: th.textMuted, marginLeft: 8, fontSize: 11 }}>📍 {c.direccion}</span>}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// ENTREGAR MODAL
// ─────────────────────────────────────────────────────────────────────────────
function EntregarModal({ pedido, onConfirm, onClose, th }) {
  const [pago, setPago] = useState("efectivo");
  const [c20, setC20]   = useState(true);
  const [c12, setC12]   = useState(true);
  const [nota, setNota] = useState("");
  return (
    <BottomModal onClose={onClose} th={th}>
      <div style={{ fontSize: 15, fontWeight: 700, color: th.text, marginBottom: 14 }}>✅ Confirmar entrega</div>
      <GCard th={th} style={{ marginBottom: 14 }}>
        <div style={{ fontWeight: 600, color: th.text }}>{pedido.nombre}</div>
        <div style={{ fontSize: 12, color: th.textMuted, marginTop: 2 }}>
          {[pedido.u20 > 0 ? `${pedido.u20}×20L` : "", pedido.u12 > 0 ? `${pedido.u12}×12L` : ""].filter(Boolean).join(" · ")}
          {pedido.nota ? ` · ${pedido.nota}` : ""}
        </div>
      </GCard>
      {pedido.u20 > 0 && (
        <div onClick={() => setC20(v => !v)} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "12px 14px", background: c20 ? "rgba(16,185,129,0.08)" : "rgba(245,158,11,0.08)", borderRadius: 12, border: `1px solid ${c20 ? "rgba(16,185,129,0.2)" : "rgba(245,158,11,0.2)"}`, marginBottom: 8, cursor: "pointer", userSelect: "none" }}>
          <span style={{ fontSize: 13, color: th.text }}>🪣 Bidón 20L — ¿trajo el vacío?</span>
          <span style={{ fontWeight: 700, color: c20 ? "#10B981" : "#F59E0B" }}>{c20 ? "✓ Sí" : "✗ No"}</span>
        </div>
      )}
      {pedido.u12 > 0 && (
        <div onClick={() => setC12(v => !v)} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "12px 14px", background: c12 ? "rgba(16,185,129,0.08)" : "rgba(245,158,11,0.08)", borderRadius: 12, border: `1px solid ${c12 ? "rgba(16,185,129,0.2)" : "rgba(245,158,11,0.2)"}`, marginBottom: 14, cursor: "pointer", userSelect: "none" }}>
          <span style={{ fontSize: 13, color: th.text }}>🪣 Bidón 12L — ¿trajo el vacío?</span>
          <span style={{ fontWeight: 700, color: c12 ? "#10B981" : "#F59E0B" }}>{c12 ? "✓ Sí" : "✗ No"}</span>
        </div>
      )}
      <Label th={th}>Forma de pago</Label>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 8, marginBottom: 12 }}>
        {PAGO_TIPOS.map(t => (
          <button key={t.id} onClick={() => setPago(t.id)} style={{ padding: "10px 4px", borderRadius: 12, border: `2px solid ${pago === t.id ? t.color : th.border}`, background: pago === t.id ? `${t.color}20` : "transparent", color: pago === t.id ? t.color : th.textMuted, cursor: "pointer", fontWeight: pago === t.id ? 700 : 400, fontSize: 12 }}>
            <div style={{ fontSize: 18, marginBottom: 2 }}>{t.icon}</div>{t.label}
          </button>
        ))}
      </div>
      <Label th={th}>Nota de visita</Label>
      <input type="text" placeholder="Algo para recordar..." value={nota} onChange={e => setNota(e.target.value)} style={{ ...inputStyle(th), marginBottom: 16 }} />
      <button onClick={() => onConfirm({ pago, canje20: c20, canje12: c12, nota })} style={{ ...btnPrimary, background: "linear-gradient(135deg,#10B981,#059669)", boxShadow: "0 6px 20px rgba(16,185,129,0.3)" }}>
        ✅ Confirmar entrega
      </button>
    </BottomModal>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// NUEVO PEDIDO MODAL
// ─────────────────────────────────────────────────────────────────────────────
function NuevoPedidoModal({ clientes, editPedido, onSave, onClose, onAddCliente, th }) {
  const init = editPedido || { clienteId: null, nombre: "", direccion: "", u20: 0, u12: 0, nota: "" };
  const [form, setForm]   = useState(init);
  const [query, setQuery] = useState(editPedido?.nombre || "");
  const setU = (f, d) => setForm(v => ({ ...v, [f]: Math.max(0, (v[f] || 0) + d) }));
  const canSave = form.clienteId && (form.u20 > 0 || form.u12 > 0);
  return (
    <BottomModal onClose={onClose} th={th}>
      <div style={{ fontSize: 15, fontWeight: 700, color: th.text, marginBottom: 14 }}>{editPedido ? "✏️ Editar pedido" : "📦 Nuevo pedido"}</div>
      <Label th={th}>Cliente *</Label>
      <ClienteSearch clientes={clientes} value={query} th={th}
        onChange={({ query: q, cliente }) => { setQuery(q); if (cliente) setForm(v => ({ ...v, clienteId: cliente.id, nombre: cliente.nombre, direccion: cliente.direccion || "" })); else setForm(v => ({ ...v, clienteId: null, nombre: "", direccion: "" })); }} />
      {!form.clienteId && query.length > 1 && (
        <button onClick={() => onAddCliente(query, setForm, setQuery)} style={{ width: "100%", padding: "8px", background: "rgba(16,185,129,0.08)", border: "1px dashed rgba(16,185,129,0.3)", borderRadius: 10, color: "#10B981", cursor: "pointer", fontSize: 12, marginTop: 6 }}>
          ➕ Agregar "{query}" como nuevo cliente
        </button>
      )}
      {form.clienteId && <div style={{ fontSize: 11, color: "#10B981", marginTop: 4 }}>✓ {form.nombre}</div>}
      <div style={{ marginTop: 12 }}>
        <Label th={th}>Bidones</Label>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10, marginBottom: 12 }}>
          {[["u20", "20L"], ["u12", "12L"]].map(([field, label]) => (
            <GCard key={field} th={th} style={{ marginBottom: 0, padding: "10px 12px" }}>
              <div style={{ fontSize: 12, fontWeight: 600, color: th.text, marginBottom: 10 }}>Bidón {label}</div>
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                <button onClick={() => setU(field, -1)} style={{ width: 34, height: 34, borderRadius: 9, background: "rgba(255,255,255,0.07)", border: `1px solid ${th.border}`, color: th.text, fontSize: 20, cursor: "pointer" }}>−</button>
                <span style={{ fontSize: 24, fontWeight: 700, color: form[field] > 0 ? th.accent : th.textDim }}>{form[field] || 0}</span>
                <button onClick={() => setU(field, 1)} style={{ width: 34, height: 34, borderRadius: 9, background: `${th.accent}22`, border: `1px solid ${th.accent}44`, color: th.accent, fontSize: 20, cursor: "pointer" }}>+</button>
              </div>
            </GCard>
          ))}
        </div>
      </div>
      <Label th={th}>Nota</Label>
      <input type="text" placeholder="Observación..." value={form.nota || ""} onChange={e => setForm(v => ({ ...v, nota: e.target.value }))} style={{ ...inputStyle(th), marginBottom: 16 }} />
      <button onClick={() => canSave && onSave({ ...form, id: editPedido?.id || uid() })} disabled={!canSave}
        style={{ ...btnPrimary, opacity: canSave ? 1 : 0.4, cursor: canSave ? "pointer" : "not-allowed" }}>
        {editPedido ? "✅ Guardar cambios" : "➕ Agregar pedido"}
      </button>
    </BottomModal>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// SALE MODAL
// ─────────────────────────────────────────────────────────────────────────────
function SaleModal({ clientes, prices, onSave, onClose, onAddCliente, editVenta, th }) {
  const init = editVenta || { clienteId: null, nombre: "", u20: 0, u12: 0, pago: "efectivo", nota: "", canje20: true, canje12: true };
  const [venta, setVenta] = useState(init);
  const [query, setQuery] = useState(editVenta?.nombre || "");
  const p20 = prices?.p20 || 5000, p12 = prices?.p12 || 3000;
  const monto = (venta.u20 || 0) * p20 + (venta.u12 || 0) * p12;
  const canSave = venta.clienteId && (venta.u20 > 0 || venta.u12 > 0);
  const tipo = PAGO_TIPOS.find(t => t.id === venta.pago);
  const setU = (field, delta) => setVenta(v => ({ ...v, [field]: Math.max(0, (v[field] || 0) + delta) }));
  return (
    <BottomModal onClose={onClose} th={th}>
      <div style={{ fontSize: 15, fontWeight: 700, color: th.text, marginBottom: 14 }}>{editVenta ? "✏️ Editar venta" : "➕ Nueva venta"}</div>
      <Label th={th}>Cliente *</Label>
      <ClienteSearch clientes={clientes} value={query} th={th}
        onChange={({ query: q, cliente }) => { setQuery(q); if (cliente) setVenta(v => ({ ...v, clienteId: cliente.id, nombre: cliente.nombre })); else setVenta(v => ({ ...v, clienteId: null, nombre: "" })); }} />
      {!venta.clienteId && query.length > 1 && (
        <button onClick={() => onAddCliente(query, setVenta, setQuery)} style={{ width: "100%", padding: "8px", background: "rgba(16,185,129,0.08)", border: "1px dashed rgba(16,185,129,0.3)", borderRadius: 10, color: "#10B981", cursor: "pointer", fontSize: 12, marginTop: 6 }}>
          ➕ Agregar "{query}" como nuevo cliente
        </button>
      )}
      {venta.clienteId && <div style={{ fontSize: 11, color: "#10B981", marginTop: 4 }}>✓ {venta.nombre}</div>}
      <div style={{ marginTop: 12 }}>
        <Label th={th}>Bidones</Label>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10, marginBottom: 12 }}>
          {[["u20", "20L", p20, "canje20"], ["u12", "12L", p12, "canje12"]].map(([field, label, price, cf]) => (
            <GCard key={field} th={th} style={{ marginBottom: 0, padding: "10px 12px" }}>
              <div style={{ fontSize: 12, fontWeight: 600, color: th.text }}>{label}</div>
              <div style={{ fontSize: 10, color: th.textMuted, marginBottom: 8 }}>{fmt(price)} c/u</div>
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 8 }}>
                <button onClick={() => setU(field, -1)} style={{ width: 32, height: 32, borderRadius: 9, background: "rgba(255,255,255,0.07)", border: `1px solid ${th.border}`, color: th.text, fontSize: 18, cursor: "pointer" }}>−</button>
                <span style={{ fontSize: 22, fontWeight: 700, color: venta[field] > 0 ? th.accent : th.textDim }}>{venta[field] || 0}</span>
                <button onClick={() => setU(field, 1)} style={{ width: 32, height: 32, borderRadius: 9, background: `${th.accent}22`, border: `1px solid ${th.accent}44`, color: th.accent, fontSize: 18, cursor: "pointer" }}>+</button>
              </div>
              {venta[field] > 0 && (
                <div onClick={() => setVenta(v => ({ ...v, [cf]: !v[cf] }))} style={{ display: "flex", alignItems: "center", gap: 6, cursor: "pointer", fontSize: 11, color: venta[cf] ? "#10B981" : "#F59E0B", userSelect: "none" }}>
                  <div style={{ width: 14, height: 14, borderRadius: 4, border: `2px solid ${venta[cf] ? "#10B981" : "#F59E0B"}`, background: venta[cf] ? "#10B981" : "transparent", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 9, color: "white" }}>{venta[cf] ? "✓" : ""}</div>
                  {venta[cf] ? "Trajo vacío" : "Sin vacío ⚠️"}
                </div>
              )}
            </GCard>
          ))}
        </div>
      </div>
      <Label th={th}>Forma de pago</Label>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 8, marginBottom: 12 }}>
        {PAGO_TIPOS.map(t => (
          <button key={t.id} onClick={() => setVenta(v => ({ ...v, pago: t.id }))} style={{ padding: "10px 4px", borderRadius: 12, border: `2px solid ${venta.pago === t.id ? t.color : th.border}`, background: venta.pago === t.id ? `${t.color}20` : "transparent", color: venta.pago === t.id ? t.color : th.textMuted, cursor: "pointer", fontWeight: venta.pago === t.id ? 700 : 400, fontSize: 12 }}>
            <div style={{ fontSize: 18, marginBottom: 2 }}>{t.icon}</div>{t.label}
          </button>
        ))}
      </div>
      <Label th={th}>Nota</Label>
      <input type="text" placeholder="Observación..." value={venta.nota} onChange={e => setVenta(v => ({ ...v, nota: e.target.value }))} style={{ ...inputStyle(th), marginBottom: 12 }} />
      {monto > 0 && (
        <div style={{ padding: "10px 14px", background: `${tipo?.color}15`, borderRadius: 11, marginBottom: 12, display: "flex", justifyContent: "space-between", border: `1px solid ${tipo?.color}25` }}>
          <span style={{ fontSize: 13, color: th.textMuted }}>Total</span>
          <span style={{ fontWeight: 700, fontSize: 18, color: tipo?.color }}>{fmt(monto)}</span>
        </div>
      )}
      <button onClick={() => canSave && onSave({ ...venta, id: editVenta?.id || uid() })} disabled={!canSave}
        style={{ ...btnPrimary, opacity: canSave ? 1 : 0.4, cursor: canSave ? "pointer" : "not-allowed" }}>
        {editVenta ? "✅ Guardar cambios" : "✅ Registrar venta"}
      </button>
    </BottomModal>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// COBRAR MODAL
// ─────────────────────────────────────────────────────────────────────────────
function CobrarModal({ fiado, onCobrar, onClose, th }) {
  const [fecha, setFecha] = useState(todayKey());
  return (
    <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.7)", zIndex: 300, display: "flex", alignItems: "center", justifyContent: "center", padding: 20 }} onClick={e => e.target === e.currentTarget && onClose()}>
      <div style={{ ...glassCard(th), maxWidth: 380, width: "100%", padding: 24 }}>
        <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 6 }}>
          <div style={{ fontSize: 15, fontWeight: 700, color: th.text }}>✅ Registrar cobro</div>
          <button onClick={onClose} style={{ ...btnGhost(th), padding: "3px 10px" }}>✕</button>
        </div>
        <div style={{ fontSize: 13, color: th.textMuted, marginBottom: 16 }}>{fiado.nombre} · <span style={{ color: "#F59E0B", fontWeight: 600 }}>{fmt(fiado.monto)}</span></div>
        <Label th={th}>Fecha de cobro</Label>
        <input type="date" value={fecha} max={todayKey()} onChange={e => setFecha(e.target.value)} style={{ ...inputStyle(th), marginBottom: 12 }} />
        <div style={{ fontSize: 12, color: th.textMuted, marginBottom: 16, padding: "10px 12px", background: "rgba(16,185,129,0.08)", borderRadius: 10 }}>
          Se sumará al reporte del {labelDate(fecha)}.
        </div>
        <div style={{ display: "flex", gap: 10 }}>
          <button onClick={onClose} style={{ ...btnGhost(th), flex: 1, textAlign: "center" }}>Cancelar</button>
          <button onClick={() => onCobrar(fiado, fecha)} style={{ flex: 2, padding: "12px", background: "linear-gradient(135deg,#10B981,#059669)", border: "none", borderRadius: 12, color: "white", fontWeight: 700, cursor: "pointer" }}>✅ Confirmar</button>
        </div>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// FIADO MANUAL MODAL
// ─────────────────────────────────────────────────────────────────────────────
function FiadoManualModal({ clientes, onSave, onClose, th }) {
  const [nombre, setNombre] = useState(""); const [clienteId, setClienteId] = useState(null);
  const [monto, setMonto]   = useState(""); const [fecha, setFecha]         = useState(todayKey());
  const [nota, setNota]     = useState(""); const [query, setQuery]         = useState("");
  const canSave = nombre && parseFloat(monto) > 0;
  return (
    <BottomModal onClose={onClose} th={th}>
      <div style={{ fontSize: 15, fontWeight: 700, color: th.text, marginBottom: 14 }}>📋 Agregar fiado</div>
      <Label th={th}>Cliente</Label>
      <ClienteSearch clientes={clientes} value={query} th={th}
        onChange={({ query: q, cliente }) => { setQuery(q); setNombre(q); if (cliente) { setClienteId(cliente.id); setNombre(cliente.nombre); } else setClienteId(null); }} />
      <div style={{ marginTop: 10 }}>
        <Label th={th}>Monto</Label>
        <div style={{ position: "relative" }}>
          <span style={{ position: "absolute", left: 13, top: "50%", transform: "translateY(-50%)", color: th.textMuted }}>$</span>
          <input type="number" placeholder="0" value={monto} onChange={e => setMonto(e.target.value)} style={{ ...inputStyle(th), paddingLeft: 26 }} />
        </div>
      </div>
      <div style={{ marginTop: 10 }}>
        <Label th={th}>Fecha</Label>
        <input type="date" value={fecha} max={todayKey()} onChange={e => setFecha(e.target.value)} style={inputStyle(th)} />
      </div>
      <div style={{ marginTop: 10, marginBottom: 16 }}>
        <Label th={th}>Nota</Label>
        <input type="text" placeholder="..." value={nota} onChange={e => setNota(e.target.value)} style={inputStyle(th)} />
      </div>
      <button onClick={() => canSave && onSave({ id: uid(), nombre, clienteId, monto: parseFloat(monto), fecha, nota, cobrado: false })} disabled={!canSave}
        style={{ ...btnPrimary, background: "linear-gradient(135deg,#F59E0B,#d97706)", boxShadow: "0 6px 20px rgba(245,158,11,0.3)", opacity: canSave ? 1 : 0.4, cursor: canSave ? "pointer" : "not-allowed" }}>
        ✅ Agregar fiado
      </button>
    </BottomModal>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// FIADO ROW
// ─────────────────────────────────────────────────────────────────────────────
function FiadoRow({ f, onCobrar, onDelete, dimmed, th }) {
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 8, padding: "10px 12px", marginBottom: 8, background: "rgba(255,255,255,0.03)", borderRadius: 11, border: "1px solid rgba(255,255,255,0.07)", opacity: dimmed ? 0.55 : 1 }}>
      <div style={{ flex: 1 }}>
        <div style={{ display: "flex", alignItems: "baseline", gap: 6, flexWrap: "wrap" }}>
          <span style={{ fontSize: 13, fontWeight: 600, color: th.text, textDecoration: dimmed ? "line-through" : "none" }}>{String(f.nombre || "")}</span>
          {f.direccion && <span style={{ fontSize: 10, color: th.textMuted, fontStyle: "italic" }}>📍 {f.direccion}</span>}
        </div>
        {f.nota && <div style={{ fontSize: 11, color: th.textMuted }}>{f.nota}</div>}
        <div style={{ fontSize: 10, color: th.textDim }}>{labelDate(f.fecha)}{f.fechaCobro ? ` → cobrado ${labelDate(f.fechaCobro)}` : ""}</div>
      </div>
      <span style={{ fontWeight: 700, color: dimmed ? "#10B981" : "#F59E0B", fontSize: 14 }}>{fmt(f.monto)}</span>
      {!dimmed && <button onClick={onCobrar} style={{ background: "rgba(16,185,129,0.15)", border: "1px solid rgba(16,185,129,0.28)", borderRadius: 8, color: "#10B981", cursor: "pointer", padding: "5px 9px", fontSize: 12, fontWeight: 600 }}>✅ Cobrar</button>}
      <button onClick={onDelete} style={{ background: "rgba(239,68,68,0.08)", border: "1px solid rgba(239,68,68,0.18)", borderRadius: 8, color: "#ef4444", cursor: "pointer", padding: "4px 9px", fontSize: 14 }}>×</button>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// GASTO PANEL
// ─────────────────────────────────────────────────────────────────────────────
function GastoPanel({ gastos, setGastos, fijosCats, onSave, onBack, th }) {
  const list = gastos.length ? gastos : [{ desc: "", monto: "", tipo: "operativo", cat: "" }];
  const upd  = (i, patch) => { const ng = [...list]; ng[i] = { ...ng[i], ...patch }; setGastos(ng); };
  return (
    <div>
      <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 16 }}>
        <button onClick={onBack} style={btnGhost(th)}>← Volver</button>
        <span style={{ fontWeight: 700, fontSize: 15, color: th.text }}>💸 Gastos del día</span>
      </div>
      {list.map((g, i) => (
        <GCard key={i} th={th} style={{ padding: 12 }}>
          <div style={{ display: "flex", gap: 8, marginBottom: 8 }}>
            <input type="text" placeholder="Descripción..." value={g.desc} onChange={e => upd(i, { desc: e.target.value })} style={{ ...inputStyle(th), flex: 2, fontSize: 13 }} />
            <div style={{ position: "relative", flex: 1 }}>
              <span style={{ position: "absolute", left: 10, top: "50%", transform: "translateY(-50%)", color: th.textMuted, fontSize: 13 }}>$</span>
              <input type="number" placeholder="0" value={g.monto} onChange={e => upd(i, { monto: e.target.value })} style={{ ...inputStyle(th), paddingLeft: 24, fontSize: 13 }} />
            </div>
            {list.length > 1 && <button onClick={() => setGastos(list.filter((_, j) => j !== i))} style={{ background: "rgba(239,68,68,0.1)", border: "1px solid rgba(239,68,68,0.3)", borderRadius: 10, color: "#ef4444", cursor: "pointer", padding: "0 10px", fontSize: 18 }}>×</button>}
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 6, marginBottom: g.tipo === "fijo" ? 8 : 0 }}>
            {GASTO_TIPOS.map(t => (
              <button key={t.id} onClick={() => upd(i, { tipo: t.id, cat: t.id === "fijo" ? (fijosCats[0]?.id || "") : "" })}
                style={{ padding: "7px 4px", borderRadius: 9, border: `2px solid ${g.tipo === t.id ? t.color : th.border}`, background: g.tipo === t.id ? `${t.color}18` : "transparent", color: g.tipo === t.id ? t.color : th.textMuted, cursor: "pointer", fontSize: 11, fontWeight: g.tipo === t.id ? 700 : 400 }}>
                {t.icon} {t.label}
              </button>
            ))}
          </div>
          {g.tipo === "fijo" && (
            <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
              {fijosCats.map(cat => (
                <button key={cat.id} onClick={() => upd(i, { cat: cat.id })}
                  style={{ padding: "5px 10px", borderRadius: 8, border: `1px solid ${g.cat === cat.id ? "#0EA5E9" : th.border}`, background: g.cat === cat.id ? "rgba(14,165,233,0.15)" : "transparent", color: g.cat === cat.id ? "#0EA5E9" : th.textMuted, cursor: "pointer", fontSize: 12, fontWeight: g.cat === cat.id ? 700 : 400 }}>
                  {cat.icon} {cat.name}
                </button>
              ))}
            </div>
          )}
        </GCard>
      ))}
      <button onClick={() => setGastos([...list, { desc: "", monto: "", tipo: "operativo", cat: "" }])}
        style={{ width: "100%", padding: "9px", background: "transparent", border: `1px dashed ${th.border}`, borderRadius: 10, color: th.textMuted, cursor: "pointer", fontSize: 12, marginBottom: 14 }}>
        + Agregar gasto
      </button>
      <button onClick={onSave} style={{ ...btnPrimary, background: "linear-gradient(135deg,#F59E0B,#d97706)", boxShadow: "0 6px 20px rgba(245,158,11,0.25)" }}>
        ✅ Guardar gastos
      </button>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// CIERRE DE CAJA MODAL
// ─────────────────────────────────────────────────────────────────────────────
function CierreCajaModal({ day, prices, sectors, onCerrar, onClose, th }) {
  const t = useMemo(() => dayTotals(day, prices), [day, prices]);
  const [conteo, setConteo]       = useState({ efectivo: "", transferencia: "" });
  const [confirmado, setConfirmado] = useState(false);
  const sectorDist = useMemo(() => sectors.map(s => ({ ...s, totalDay: s.monto * (t.u20 + t.u12) })), [sectors, t]);
  const diferenciaEf = parseFloat(conteo.efectivo  || 0) - t.efectivo;
  const diferenciaTr = parseFloat(conteo.transferencia || 0) - t.transferencia;
  return (
    <BottomModal onClose={onClose} th={th}>
      <div style={{ fontSize: 15, fontWeight: 700, color: th.text, marginBottom: 4 }}>🔒 Cierre de caja</div>
      <div style={{ fontSize: 11, color: th.textMuted, marginBottom: 16 }}>{labelDateLong(day.date)}</div>
      <GCard th={th} style={{ marginBottom: 12 }}>
        <SectionTitle th={th}>Resumen del día</SectionTitle>
        <Row label="💵 Efectivo cobrado" value={fmt(t.efectivo)} vc="#10B981" th={th} />
        <Row label="🏦 Transferencia cobrada" value={fmt(t.transferencia)} vc={th.accent} th={th} />
        {t.fiado > 0 && <Row label="📋 Fiados (no cobrado)" value={fmt(t.fiado)} vc="#F59E0B" th={th} />}
        {t.gastos > 0 && <Row label="💸 Gastos" value={`−${fmt(t.gastos)}`} vc="#ef4444" th={th} />}
        <TotalRow label="Ganancia estimada" value={fmt(t.cobrado - t.gastos)} color="#10B981" th={th} />
      </GCard>
      <GCard th={th} style={{ marginBottom: 12 }}>
        <SectionTitle th={th}>Conteo físico</SectionTitle>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
          {[["efectivo", "💵 Efectivo", diferenciaEf], ["transferencia", "🏦 Transf.", diferenciaTr]].map(([k, l, dif]) => (
            <div key={k}>
              <Label th={th}>{l}</Label>
              <div style={{ position: "relative" }}>
                <span style={{ position: "absolute", left: 11, top: "50%", transform: "translateY(-50%)", color: th.textMuted, fontSize: 12 }}>$</span>
                <input type="number" placeholder="0" value={conteo[k]} onChange={e => setConteo(c => ({ ...c, [k]: e.target.value }))} style={{ ...inputStyle(th), paddingLeft: 22, fontSize: 13 }} />
              </div>
              {conteo[k] !== "" && (
                <div style={{ fontSize: 11, marginTop: 3, color: dif === 0 ? "#10B981" : "#ef4444", fontWeight: 600 }}>
                  {dif >= 0 ? "▲" : "▼"} {fmt(Math.abs(dif))} dif.
                </div>
              )}
            </div>
          ))}
        </div>
      </GCard>
      {(t.u20 + t.u12) > 0 && (
        <GCard th={th} style={{ marginBottom: 14 }}>
          <SectionTitle th={th}>Separación por sector</SectionTitle>
          {sectorDist.map(s => (
            <div key={s.id} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "8px 10px", marginBottom: 5, background: `${s.color}0d`, borderRadius: 9, border: `1px solid ${s.color}20` }}>
              <span style={{ fontSize: 12, color: th.text }}>{s.icon} {s.name}</span>
              <span style={{ fontWeight: 700, color: s.color, fontSize: 14 }}>{fmt(s.totalDay)}</span>
            </div>
          ))}
          <TotalRow label="Total separado" value={fmt(sectorDist.reduce((a, s) => a + s.totalDay, 0))} color={th.accent} th={th} />
        </GCard>
      )}
      <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 16 }}>
        <div onClick={() => setConfirmado(v => !v)} style={{ width: 20, height: 20, borderRadius: 6, border: `2px solid ${confirmado ? "#10B981" : th.border}`, background: confirmado ? "#10B981" : "transparent", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 12, color: "white", flexShrink: 0 }}>{confirmado ? "✓" : ""}</div>
        <span style={{ fontSize: 13, color: th.textMuted }}>Confirmé el conteo físico y la separación del dinero</span>
      </div>
      <button onClick={() => confirmado && onCerrar({ conteoEfectivo: parseFloat(conteo.efectivo || 0), conteoTransferencia: parseFloat(conteo.transferencia || 0), diferenciaEf, diferenciaTr, fecha: day.date, cerradoEn: Date.now() })}
        disabled={!confirmado}
        style={{ ...btnPrimary, background: confirmado ? "linear-gradient(135deg,#10B981,#059669)" : undefined, opacity: confirmado ? 1 : 0.4, cursor: confirmado ? "pointer" : "not-allowed" }}>
        🔒 Cerrar caja del día
      </button>
    </BottomModal>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// CALENDARIO VIEW
// ─────────────────────────────────────────────────────────────────────────────
function CalendarioView({ history, prices, fiados, goalArs, th }) {
  const [viewMonth, setViewMonth] = useState(currentMonth());

  const { cells, monthTotal, monthFiados, activeDays, maxCobrado } = useMemo(() => {
    const [y, m] = viewMonth.split("-").map(Number);
    const firstDow   = new Date(y, m - 1, 1).getDay();
    const daysInMonth = new Date(y, m, 0).getDate();
    const cells = [];
    for (let i = 0; i < firstDow; i++) cells.push(null);
    for (let d = 1; d <= daysInMonth; d++) {
      const iso = `${viewMonth}-${String(d).padStart(2, "0")}`;
      const day = history.find(h => h.date === iso) || null;
      const t   = day ? dayTotals(day, prices) : null;
      cells.push({ iso, day, t });
    }
    const filledCells = cells.filter(Boolean);
    const monthTotal  = filledCells.reduce((a, c) => a + (c.t?.cobrado || 0), 0);
    const activeDays  = filledCells.filter(c => c.t && c.t.cobrado > 0).length;
    const maxCobrado  = Math.max(...filledCells.map(c => c.t?.cobrado || 0), 1);
    const monthFiados = fiados.filter(f => !f.cobrado && (f.fecha || "").startsWith(viewMonth)).reduce((a, f) => a + f.monto, 0);
    return { cells, monthTotal, monthFiados, activeDays, maxCobrado };
  }, [viewMonth, history, prices, fiados]);

  const prevM = () => { const d = new Date(viewMonth + "-01"); d.setMonth(d.getMonth() - 1); setViewMonth(d.toISOString().slice(0, 7)); };
  const nextM = () => { const d = new Date(viewMonth + "-01"); d.setMonth(d.getMonth() + 1); const nm = d.toISOString().slice(0, 7); if (nm <= currentMonth()) setViewMonth(nm); };

  return (
    <div>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 14 }}>
        <button onClick={prevM} style={{ ...btnGhost(th), padding: "8px 16px" }}>‹</button>
        <div style={{ fontWeight: 700, fontSize: 15, color: th.text, textTransform: "capitalize" }}>
          {new Date(viewMonth + "-15").toLocaleDateString("es-AR", { month: "long", year: "numeric" })}
        </div>
        <button onClick={nextM} style={{ ...btnGhost(th), padding: "8px 16px", opacity: viewMonth >= currentMonth() ? 0.3 : 1 }}>›</button>
      </div>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 8, marginBottom: 14 }}>
        <StatBox label="Cobrado" value={fmt(monthTotal)} color={th.accent} th={th} />
        <StatBox label="Días activos" value={activeDays} color="#8B5CF6" th={th} />
        <StatBox label="Fiado pend." value={fmt(monthFiados)} color="#F59E0B" th={th} />
      </div>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(7,1fr)", gap: 3, marginBottom: 4 }}>
        {DIAS_SEMANA.map(d => <div key={d} style={{ textAlign: "center", fontSize: 10, color: th.textMuted, fontWeight: 600, padding: "3px 0" }}>{d}</div>)}
      </div>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(7,1fr)", gap: 3, marginBottom: 16 }}>
        {cells.map((cell, i) => {
          if (!cell) return <div key={`e${i}`} />;
          const isHoy    = cell.iso === todayKey();
          const hasSales = cell.t && cell.t.cobrado > 0;
          const pct      = hasSales ? cell.t.cobrado / maxCobrado : 0;
          return (
            <div key={cell.iso} style={{ aspectRatio: "1", background: hasSales ? `rgba(56,189,248,${0.08 + pct * 0.5})` : "rgba(255,255,255,0.02)", borderRadius: 8, border: `1.5px solid ${isHoy ? th.accent : hasSales ? "rgba(56,189,248,0.25)" : th.border}`, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", padding: 2, position: "relative" }}>
              <span style={{ fontSize: 11, fontWeight: isHoy ? 700 : 400, color: isHoy ? th.accent : th.text }}>{new Date(cell.iso + "T12:00:00").getDate()}</span>
              {hasSales && <span style={{ fontSize: 7, color: th.accent, fontWeight: 600, lineHeight: 1 }}>{fmt(cell.t.cobrado).replace("$", "")}</span>}
              {cell.day?.cierreCaja && <span style={{ position: "absolute", top: 1, right: 2, fontSize: 7 }}>🔒</span>}
              {cell.t?.gastos > 0 && <span style={{ position: "absolute", bottom: 1, right: 2, fontSize: 7 }}>💸</span>}
            </div>
          );
        })}
      </div>
      <SectionTitle th={th}>Días del mes</SectionTitle>
      {[...history].filter(d => d.date.startsWith(viewMonth)).sort((a, b) => b.date.localeCompare(a.date)).map(d => {
        const t = dayTotals(d, prices);
        return (
          <GCard key={d.date} th={th} style={{ marginBottom: 8, padding: "10px 14px" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <div>
                <div style={{ fontWeight: 600, fontSize: 13, color: th.text }}>{labelDate(d.date)} {d.cierreCaja ? "🔒" : ""}</div>
                <div style={{ fontSize: 11, color: th.textMuted }}>{d.ventas?.length || 0} ventas · {t.u20 + t.u12} bidones</div>
              </div>
              <div style={{ textAlign: "right" }}>
                <div style={{ fontWeight: 700, color: th.accent, fontSize: 14 }}>{fmt(t.cobrado)}</div>
                {t.gastos > 0 && <div style={{ fontSize: 10, color: "#ef4444" }}>−{fmt(t.gastos)}</div>}
              </div>
            </div>
          </GCard>
        );
      })}
      {!history.some(d => d.date.startsWith(viewMonth)) && <Empty icon="📅" text="Sin actividad este mes" th={th} />}
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// FINANZAS VIEW
// ─────────────────────────────────────────────────────────────────────────────
function FinanzasView({ history, prices, fiados, sectors, cv20, cv12, fijosCats, th }) {
  const [sub, setSub] = useState("resumen");
  const cm = currentMonth(), pm = prevMonth(), ws = weekStart(), pws = prevWeekStart(), pwe = prevWeekEnd();

  const thisMonthDays  = useMemo(() => history.filter(d => d.date.startsWith(cm)), [history, cm]);
  const lastMonthDays  = useMemo(() => history.filter(d => d.date.startsWith(pm)), [history, pm]);
  const thisWeekDays   = useMemo(() => history.filter(d => d.date >= ws), [history, ws]);
  const prevWeekDays   = useMemo(() => history.filter(d => d.date >= pws && d.date <= pwe), [history, pws, pwe]);

  const tm = useMemo(() => ({
    cobrado:  thisMonthDays.reduce((a, d) => a + dayTotals(d, prices).cobrado, 0),
    gastos:   thisMonthDays.reduce((a, d) => a + dayTotals(d, prices).gastos, 0),
    efectivo: thisMonthDays.reduce((a, d) => a + dayTotals(d, prices).efectivo, 0),
    trans:    thisMonthDays.reduce((a, d) => a + dayTotals(d, prices).transferencia, 0),
    u20:      thisMonthDays.reduce((a, d) => a + dayTotals(d, prices).u20, 0),
    u12:      thisMonthDays.reduce((a, d) => a + dayTotals(d, prices).u12, 0),
  }), [thisMonthDays, prices]);

  const lm = useMemo(() => ({
    cobrado: lastMonthDays.reduce((a, d) => a + dayTotals(d, prices).cobrado, 0),
    gastos:  lastMonthDays.reduce((a, d) => a + dayTotals(d, prices).gastos, 0),
  }), [lastMonthDays, prices]);

  const thisCierre = useMemo(() => calcCierreSemanal(thisWeekDays, prices, cv20, cv12, fijosCats), [thisWeekDays, prices, cv20, cv12, fijosCats]);
  const prevCierre = useMemo(() => calcCierreSemanal(prevWeekDays, prices, cv20, cv12, fijosCats), [prevWeekDays, prices, cv20, cv12, fijosCats]);
  const fiadosPend = useMemo(() => fiados.filter(f => !f.cobrado).reduce((a, f) => a + f.monto, 0), [fiados]);
  const crecimiento = lm.cobrado > 0 ? ((tm.cobrado - lm.cobrado) / lm.cobrado * 100).toFixed(1) : null;
  const cierresDia  = useMemo(() => history.filter(d => d.cierreCaja).sort((a, b) => b.date.localeCompare(a.date)), [history]);

  const tabs = [["resumen", "📊 Resumen"], ["semana", "📅 Semana"], ["mes", "🗓 Mes"], ["cierres", "🔒 Cierres"]];

  return (
    <div>
      <div style={{ display: "flex", gap: 6, marginBottom: 16, overflowX: "auto", paddingBottom: 4 }}>
        {tabs.map(([k, l]) => (
          <button key={k} onClick={() => setSub(k)} style={{ padding: "8px 14px", borderRadius: 20, border: `1px solid ${sub === k ? th.accent : th.border}`, background: sub === k ? `${th.accent}20` : "transparent", color: sub === k ? th.accent : th.textMuted, cursor: "pointer", fontSize: 12, fontWeight: sub === k ? 700 : 400, whiteSpace: "nowrap", flexShrink: 0 }}>
            {l}
          </button>
        ))}
      </div>

      {sub === "resumen" && <>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10, marginBottom: 12 }}>
          <StatBox label="Cobrado este mes" value={fmt(tm.cobrado)} color={th.accent} th={th} sub={crecimiento ? `${crecimiento > 0 ? "▲" : "▼"} ${Math.abs(crecimiento)}% vs anterior` : undefined} />
          <StatBox label="Utilidad mes" value={fmt(tm.cobrado - tm.gastos)} color="#10B981" th={th} />
          <StatBox label="Fiado pendiente" value={fmt(fiadosPend)} color="#F59E0B" th={th} />
          <StatBox label="Gastos mes" value={fmt(tm.gastos)} color="#ef4444" th={th} />
        </div>
        <GCard th={th} style={{ marginBottom: 12 }}>
          <SectionTitle th={th}>Ingresos por forma de pago</SectionTitle>
          <Row label="💵 Efectivo" value={fmt(tm.efectivo)} vc="#10B981" th={th} />
          <Row label="🏦 Transferencia" value={fmt(tm.trans)} vc={th.accent} th={th} />
          <Row label="📦 20L" value={`${tm.u20} u.`} vc={th.textMuted} th={th} />
          <Row label="📦 12L" value={`${tm.u12} u.`} vc={th.textMuted} th={th} />
          <TotalRow label="Total cobrado" value={fmt(tm.cobrado)} color={th.accent} th={th} />
        </GCard>
        {(tm.u20 + tm.u12) > 0 && (
          <GCard th={th}>
            <SectionTitle th={th}>Distribución sectorial del mes</SectionTitle>
            {sectors.map(s => {
              const total = s.monto * (tm.u20 + tm.u12);
              return (
                <div key={s.id} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "8px 10px", marginBottom: 5, background: `${s.color}0d`, borderRadius: 9, border: `1px solid ${s.color}20` }}>
                  <span style={{ fontSize: 12, color: th.text }}>{s.icon} {s.name}</span>
                  <span style={{ fontWeight: 700, color: s.color, fontSize: 14 }}>{fmt(total)}</span>
                </div>
              );
            })}
          </GCard>
        )}
      </>}

      {sub === "semana" && <>
        <GCard th={th}>
          <SectionTitle th={th}>Semana actual</SectionTitle>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10, marginBottom: 14 }}>
            <StatBox label="Cobrado" value={fmt(thisCierre.cobrado)} color={th.accent} th={th} />
            <StatBox label="Utilidad" value={fmt(thisCierre.utilidad)} color="#10B981" th={th} />
            <StatBox label="20L" value={`${thisCierre.u20} u.`} color="#8B5CF6" th={th} />
            <StatBox label="12L" value={`${thisCierre.u12} u.`} color="#64748b" th={th} />
          </div>
          {thisCierre.costoXBidon > 0 && <Row label="Costo/bidón" value={fmt(Math.round(thisCierre.costoXBidon))} vc={th.textMuted} th={th} />}
          {thisCierre.precioPromedio > 0 && <Row label="Precio prom." value={fmt(Math.round(thisCierre.precioPromedio))} vc={th.textMuted} th={th} />}
          {thisCierre.gastosOp > 0 && <Row label="⚙️ Operativos" value={`−${fmt(thisCierre.gastosOp)}`} vc="#8B5CF6" th={th} />}
          {thisCierre.gastosExt > 0 && <Row label="⚠️ Extraordinarios" value={`−${fmt(thisCierre.gastosExt)}`} vc="#ef4444" th={th} />}
          {thisCierre.fijosPorCat.map(c => <Row key={c.id} label={`${c.icon} ${c.name}`} value={`${fmt(c.total)} (${fmt(Math.round(c.porBidon))}/u)`} vc={th.accent} th={th} />)}
          <TotalRow label="✅ Utilidad" value={fmt(thisCierre.utilidad)} color="#10B981" th={th} />
        </GCard>
        {prevCierre.cobrado > 0 && (
          <GCard th={th} style={{ marginTop: 12 }}>
            <SectionTitle th={th}>Semana anterior</SectionTitle>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10, marginBottom: 10 }}>
              <StatBox label="Cobrado" value={fmt(prevCierre.cobrado)} color={th.textMuted} th={th} />
              <StatBox label="Utilidad" value={fmt(prevCierre.utilidad)} color={th.textMuted} th={th} />
            </div>
            <div style={{ padding: "11px", background: thisCierre.utilidad >= prevCierre.utilidad ? "rgba(16,185,129,0.1)" : "rgba(239,68,68,0.1)", borderRadius: 11, border: `1px solid ${thisCierre.utilidad >= prevCierre.utilidad ? "rgba(16,185,129,0.25)" : "rgba(239,68,68,0.25)"}`, textAlign: "center" }}>
              <div style={{ fontSize: 11, color: th.textMuted, marginBottom: 3 }}>Utilidad vs semana anterior</div>
              <div style={{ fontSize: 18, fontWeight: 700, color: thisCierre.utilidad >= prevCierre.utilidad ? "#10B981" : "#ef4444" }}>
                {thisCierre.utilidad >= prevCierre.utilidad ? "▲" : "▼"} {fmt(Math.abs(thisCierre.utilidad - prevCierre.utilidad))}
              </div>
            </div>
          </GCard>
        )}
      </>}

      {sub === "mes" && (
        <GCard th={th}>
          <SectionTitle th={th}>{new Date(cm + "-15").toLocaleDateString("es-AR", { month: "long", year: "numeric" })}</SectionTitle>
          {thisMonthDays.length === 0 ? <Empty icon="🗓" text="Sin datos este mes" th={th} /> : <>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10, marginBottom: 12 }}>
              <StatBox label="Total cobrado" value={fmt(tm.cobrado)} color={th.accent} th={th} />
              <StatBox label="Días activos" value={thisMonthDays.length} color="#8B5CF6" th={th} />
            </div>
            {lm.cobrado > 0 && (
              <div style={{ padding: "11px", background: tm.cobrado >= lm.cobrado ? "rgba(16,185,129,0.1)" : "rgba(239,68,68,0.1)", borderRadius: 11, border: `1px solid ${tm.cobrado >= lm.cobrado ? "rgba(16,185,129,0.25)" : "rgba(239,68,68,0.25)"}`, textAlign: "center" }}>
                <div style={{ fontSize: 11, color: th.textMuted, marginBottom: 3 }}>vs mes anterior ({fmt(lm.cobrado)})</div>
                <div style={{ fontSize: 18, fontWeight: 700, color: tm.cobrado >= lm.cobrado ? "#10B981" : "#ef4444" }}>
                  {tm.cobrado >= lm.cobrado ? "▲" : "▼"} {fmt(Math.abs(tm.cobrado - lm.cobrado))} ({Math.round(Math.abs((tm.cobrado - lm.cobrado) / lm.cobrado) * 100)}%)
                </div>
              </div>
            )}
          </>}
        </GCard>
      )}

      {sub === "cierres" && (
        cierresDia.length === 0 ? <Empty icon="🔒" text="Sin cierres registrados" th={th} /> :
        cierresDia.map(d => {
          const t = dayTotals(d, prices);
          return (
            <GCard key={d.date} th={th} style={{ marginBottom: 10 }}>
              <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 6 }}>
                <div>
                  <div style={{ fontWeight: 600, fontSize: 14, color: th.text }}>{labelDateLong(d.date)}</div>
                  <div style={{ fontSize: 11, color: "#10B981" }}>🔒 Caja cerrada</div>
                </div>
                <div style={{ textAlign: "right" }}>
                  <div style={{ fontWeight: 700, color: th.accent, fontSize: 14 }}>{fmt(t.cobrado)}</div>
                  <div style={{ fontSize: 10, color: th.textMuted }}>Gan: {fmt(t.cobrado - t.gastos)}</div>
                </div>
              </div>
              {d.cierreCaja && (
                <div style={{ fontSize: 11 }}>
                  {d.cierreCaja.diferenciaEf !== 0 && <div style={{ color: d.cierreCaja.diferenciaEf > 0 ? "#10B981" : "#ef4444" }}>Efectivo: {d.cierreCaja.diferenciaEf > 0 ? "+" : ""}{fmt(d.cierreCaja.diferenciaEf)} diferencia</div>}
                  {d.cierreCaja.diferenciaTr !== 0 && <div style={{ color: d.cierreCaja.diferenciaTr > 0 ? "#10B981" : "#ef4444" }}>Transf.: {d.cierreCaja.diferenciaTr > 0 ? "+" : ""}{fmt(d.cierreCaja.diferenciaTr)} diferencia</div>}
                  {d.cierreCaja.diferenciaEf === 0 && d.cierreCaja.diferenciaTr === 0 && <div style={{ color: "#10B981" }}>✓ Sin diferencias</div>}
                </div>
              )}
            </GCard>
          );
        })
      )}
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// APP ROOT
// ─────────────────────────────────────────────────────────────────────────────
export default function App() {
  const [darkMode, setDarkMode] = useState(true);
  const th = darkMode ? DARK : LIGHT;

  const [mainTab, setMainTab] = useState("ruteo");
  const [subTab,  setSubTab]  = useState("caja");

  // ── core data ──
  const [sectors,    setSectors]    = useState(DEFAULT_SECTORS);
  const [prices,     setPrices]     = useState(DEFAULT_PRICES);
  const [cv20,       setCv20]       = useState(DEFAULT_CV20);
  const [cv12,       setCv12]       = useState(DEFAULT_CV12);
  const [fijosCats,  setFijosCats]  = useState(DEFAULT_FIJOS_CATS);
  const [history,    setHistory]    = useState([]);
  const [fiados,     setFiados]     = useState([]);
  const [clientes,   setClientes]   = useState([]);
  const [pedidos,    setPedidos]    = useState([]);
  const [zones,      setZones]      = useState(DEFAULT_ZONES);
  const [appName,    setAppName]    = useState("Barret Water");
  const [goalArs,    setGoalArs]    = useState(50000);
  const [alertPct,   setAlertPct]   = useState(30);
  const [notifEnabled, setNotifEnabled] = useState({ nuevoPedido: true, nuevaVenta: true, cierreCaja: true });

  // ── ui ──
  const [loading,          setLoading]         = useState(true);
  const [toast,            setToast]           = useState(null);
  const [confirm,          setConfirm]         = useState(null);
  const [selectedDate,     setSelectedDate]    = useState(todayKey());
  const [today,            setToday]           = useState(emptyDay());
  const [saleModal,        setSaleModal]       = useState(null);
  const [cobrarModal,      setCobrarModal]     = useState(null);
  const [fiadoManual,      setFiadoManual]     = useState(false);
  const [nuevoPedidoModal, setNuevoPedidoModal]= useState(null);
  const [entregarModal,    setEntregarModal]   = useState(null);
  const [cierreCajaModal,  setCierreCajaModal] = useState(false);
  const [showBidones,      setShowBidones]     = useState(false);
  const [dragIdx,          setDragIdx]         = useState(null);
  const [cliSearch,        setCliSearch]       = useState("");
  const [cliZoneFilter,    setCliZoneFilter]   = useState("todas");
  const [editingCli,       setEditingCli]      = useState(null);

  const EMPTY_CLI_FORM = { nombre: "", tel: "", direccion: "", nota: "", estado: "activo", zona: "", frecuenciaTipo: "ninguna", frecuenciaDias: 7, diasSemana: [], u20Estimado: 0, u12Estimado: 0 };
  const [cForm, setCForm] = useState(EMPTY_CLI_FORM);

  // config tmp
  const [tmpSectors,   setTmpSectors]   = useState(DEFAULT_SECTORS);
  const [tmpPrices,    setTmpPrices]    = useState(DEFAULT_PRICES);
  const [tmpCv20,      setTmpCv20]      = useState(DEFAULT_CV20);
  const [tmpCv12,      setTmpCv12]      = useState(DEFAULT_CV12);
  const [tmpFijosCats, setTmpFijosCats] = useState(DEFAULT_FIJOS_CATS);
  const [tmpName,      setTmpName]      = useState("Barret Water");
  const [tmpZones,     setTmpZones]     = useState(DEFAULT_ZONES);
  const [restoreText,  setRestoreText]  = useState("");
  const [showRestore,  setShowRestore]  = useState(false);

  // ── LOAD ──
  useEffect(() => {
    (async () => {
      try {
        const keys = ["sectors_v3","prices_v1","costos20_v2","costos12_v2","fijosCats_v1","history_v5","fiados_v2","clientes_v1","alertPct","goalArs","appName","darkMode","pedidos_v1","zones_v1","notifEnabled"];
        const vals = await Promise.all(keys.map(sget));
        const [s,pr,c20,c12,fc,h,f,c,al,gl,an,dm,p,zs,ne] = vals;
        if (s)  { setSectors(s);    setTmpSectors(s); }
        if (pr) { setPrices(pr);    setTmpPrices(pr); }
        if (c20){ setCv20(c20);     setTmpCv20(c20); }
        if (c12){ setCv12(c12);     setTmpCv12(c12); }
        if (fc) { setFijosCats(fc); setTmpFijosCats(fc); }
        if (h)  setHistory(h);
        if (f)  setFiados(f);
        if (c)  setClientes(c);
        if (al != null) setAlertPct(al);
        if (gl != null) setGoalArs(gl);
        if (an) { setAppName(an); setTmpName(an); }
        if (dm != null) setDarkMode(dm);
        if (zs) { setZones(zs); setTmpZones(zs); }
        if (ne) setNotifEnabled(ne);
        if (p) {
          const arr = Array.isArray(p) ? p : Object.values(p || {});
          const hoy = todayKey();
          const act = clampArr(arr).filter(x => !x.entregado).map(x => x.fecha < hoy ? { ...x, fecha: hoy } : x);
          setPedidos(act);
          await sset("pedidos_v1", act);
        }
        requestNotifPermission();
      } catch (e) { console.error("load error", e); }
      finally { setLoading(false); }
    })();
  }, []); // eslint-disable-line

  useEffect(() => {
    const d = history.find(x => x.date === selectedDate) || emptyDay(selectedDate);
    setToday(d);
  }, [selectedDate, history]);

  // ── HELPERS ──
  const showToast  = useCallback((msg, color = "#10B981") => { setToast({ msg, color }); setTimeout(() => setToast(null), 2800); }, []);
  const askConfirm = useCallback((msg, onConfirm) => setConfirm({ msg, onConfirm }), []);

  const saveDay = useCallback(async (day) => {
    const nh = [{ ...day, savedAt: Date.now() }, ...history.filter(d => d.date !== day.date)];
    setHistory(nh);
    await sset("history_v5", nh);
  }, [history]);

  // ── PEDIDOS ──
  const savePedido = useCallback(async (pedido) => {
    const existe = pedidos.find(p => p.id === pedido.id);
    const np = existe
      ? pedidos.map(p => p.id === pedido.id ? { ...pedido, fecha: pedido.fecha || todayKey() } : p)
      : [...pedidos, { ...pedido, fecha: todayKey(), entregado: false }];
    setPedidos(np);
    await sset("pedidos_v1", np);
    setNuevoPedidoModal(null);
    showToast(existe ? "✅ Pedido actualizado" : "📦 Pedido agregado");
    if (!existe && notifEnabled.nuevoPedido) sendNotif("📦 Nuevo pedido", pedido.nombre);
  }, [pedidos, notifEnabled, showToast]);

  const deletePedido = useCallback(async (id) => {
    askConfirm("¿Eliminar este pedido?", async () => {
      const np = pedidos.filter(p => p.id !== id);
      setPedidos(np); await sset("pedidos_v1", np);
      setConfirm(null); showToast("🗑️ Eliminado", "#ef4444");
    });
  }, [pedidos, askConfirm, showToast]);

  const confirmarEntrega = useCallback(async (pedido, { pago, canje20, canje12, nota }) => {
    const venta = { id: uid(), clienteId: pedido.clienteId, nombre: pedido.nombre, u20: pedido.u20 || 0, u12: pedido.u12 || 0, pago, nota, canje20, canje12 };
    const hoy   = todayKey();
    const targetDay = history.find(d => d.date === hoy) || emptyDay(hoy);
    const newDay    = { ...targetDay, ventas: [...clampArr(targetDay.ventas), venta] };
    const nh        = [{ ...newDay, savedAt: Date.now() }, ...history.filter(d => d.date !== hoy)];
    setHistory(nh);
    if (selectedDate === hoy) setToday(newDay);

    let newFiados = fiados;
    if (pago === "fiado") {
      const monto  = (pedido.u20 || 0) * prices.p20 + (pedido.u12 || 0) * prices.p12;
      const cliEnt = clientes.find(c => c.id === pedido.clienteId);
      newFiados = [...fiados, { id: uid(), nombre: pedido.nombre, clienteId: pedido.clienteId, direccion: cliEnt?.direccion || "", monto, nota, fecha: hoy, cobrado: false, ventaId: venta.id }];
      setFiados(newFiados);
    }

    let newClientes = clientes;
    if (pedido.clienteId) {
      const deudas = [];
      if (!canje20 && (pedido.u20 || 0) > 0) deudas.push({ tipo: "20L", cant: pedido.u20 });
      if (!canje12 && (pedido.u12 || 0) > 0) deudas.push({ tipo: "12L", cant: pedido.u12 });
      newClientes = clientes.map(c => {
        if (c.id !== pedido.clienteId) return c;
        const bd = [...clampArr(c.bidonesDeben)];
        deudas.forEach(d => { const ex = bd.find(b => b.tipo === d.tipo); if (ex) ex.cant += d.cant; else bd.push({ ...d }); });
        return { ...c, bidonesDeben: bd, ultimaVisita: hoy, visitas: (c.visitas || 0) + 1, notaUltimaVisita: nota || c.notaUltimaVisita };
      });
      setClientes(newClientes);
    }

    const np = pedidos.filter(p => p.id !== pedido.id);
    setPedidos(np);

    await storage.multiSet([
      ["history_v5", nh], ["fiados_v2", newFiados],
      ["clientes_v1", newClientes], ["pedidos_v1", np],
    ]);

    setEntregarModal(null);
    showToast("✅ Entrega confirmada");
    if (notifEnabled.nuevaVenta) sendNotif("✅ Venta registrada", `${pedido.nombre} — ${pago}`);
  }, [history, fiados, clientes, pedidos, prices, selectedDate, notifEnabled, showToast]);

  const onDragStart = (i) => setDragIdx(i);
  const onDragOver  = (e, i) => { e.preventDefault(); if (dragIdx === null || dragIdx === i) return; const np = [...pedidos]; const [r] = np.splice(dragIdx, 1); np.splice(i, 0, r); setDragIdx(i); setPedidos(np); };
  const onDragEnd   = async () => { setDragIdx(null); await sset("pedidos_v1", pedidos); };

  // ── VENTAS ──
  const addVenta = useCallback(async (venta) => {
    const newDay = { ...today, ventas: [...clampArr(today.ventas), venta] };
    setToday(newDay); setSaleModal(null);

    let newFiados = fiados;
    if (venta.pago === "fiado") {
      const monto = (venta.u20 || 0) * prices.p20 + (venta.u12 || 0) * prices.p12;
      const cliV  = clientes.find(c => c.id === venta.clienteId);
      newFiados = [...fiados, { id: uid(), nombre: venta.nombre, clienteId: venta.clienteId, direccion: cliV?.direccion || "", monto, nota: venta.nota, fecha: selectedDate, cobrado: false, ventaId: venta.id }];
      setFiados(newFiados);
    }

    const deudas = [];
    if (!venta.canje20 && (venta.u20 || 0) > 0) deudas.push({ tipo: "20L", cant: venta.u20 });
    if (!venta.canje12 && (venta.u12 || 0) > 0) deudas.push({ tipo: "12L", cant: venta.u12 });
    let newClientes = clientes;
    if (deudas.length && venta.clienteId) {
      newClientes = clientes.map(c => { if (c.id !== venta.clienteId) return c; const bd = [...clampArr(c.bidonesDeben)]; deudas.forEach(d => { const ex = bd.find(b => b.tipo === d.tipo); if (ex) ex.cant += d.cant; else bd.push({ ...d }); }); return { ...c, bidonesDeben: bd }; });
      setClientes(newClientes);
    }

    const nh = [{ ...newDay, savedAt: Date.now() }, ...history.filter(d => d.date !== newDay.date)];
    setHistory(nh);
    await storage.multiSet([["history_v5", nh], ["fiados_v2", newFiados], ["clientes_v1", newClientes]]);
    showToast("✅ Venta registrada");
    if (notifEnabled.nuevaVenta) sendNotif("💰 Nueva venta", venta.nombre);
  }, [today, fiados, clientes, history, prices, selectedDate, notifEnabled, showToast]);

  const editVentaFn = useCallback(async (venta) => {
    const newDay = { ...today, ventas: clampArr(today.ventas).map(v => v.id === venta.id ? venta : v) };
    setToday(newDay); setSaleModal(null);
    await saveDay(newDay); showToast("✅ Venta actualizada");
  }, [today, saveDay, showToast]);

  const deleteVenta = useCallback(async (id) => {
    askConfirm("¿Eliminar esta venta?", async () => {
      const newDay = { ...today, ventas: clampArr(today.ventas).filter(v => v.id !== id) };
      setToday(newDay);
      const nf = fiados.filter(f => f.ventaId !== id); setFiados(nf);
      const nh = [{ ...newDay, savedAt: Date.now() }, ...history.filter(d => d.date !== newDay.date)];
      setHistory(nh);
      await storage.multiSet([["history_v5", nh], ["fiados_v2", nf]]);
      setConfirm(null); showToast("🗑️ Eliminado", "#ef4444");
    });
  }, [today, fiados, history, askConfirm, showToast]);

  const saveGastos = useCallback(async () => {
    await saveDay(today); setSubTab("caja"); showToast("✅ Gastos guardados");
  }, [today, saveDay, showToast]);

  const handleCierreCaja = useCallback(async (cierreData) => {
    const newDay = { ...today, cierreCaja: cierreData };
    setToday(newDay); await saveDay(newDay);
    setCierreCajaModal(false); showToast("🔒 Caja cerrada");
    if (notifEnabled.cierreCaja) sendNotif("🔒 Caja cerrada", labelDate(today.date));
  }, [today, saveDay, notifEnabled, showToast]);

  // ── CLIENTES ──
  const handleAddClienteFromModal = useCallback(async (nombre, setFormFn, setQuery) => {
    const nuevo = { id: uid(), nombre, tel: "", direccion: "", nota: "", bidonesDeben: [], estado: "activo", frecuenciaTipo: "ninguna", frecuenciaDias: 7, diasSemana: [], visitas: 0, zona: "" };
    const nc = [...clientes, nuevo]; setClientes(nc); await sset("clientes_v1", nc);
    setFormFn(v => ({ ...v, clienteId: nuevo.id, nombre: nuevo.nombre, direccion: "" }));
    setQuery && setQuery(nuevo.nombre);
    showToast(`👤 "${nombre}" agregado`);
  }, [clientes, showToast]);

  const addFiadoManual = useCallback(async (f) => {
    const nf = [...fiados, f]; setFiados(nf); await sset("fiados_v2", nf);
    setFiadoManual(false); showToast("📋 Fiado agregado");
  }, [fiados, showToast]);

  const cobrarFiado = useCallback(async (fiado, fecha) => {
    const nf = fiados.map(f => f.id === fiado.id ? { ...f, cobrado: true, fechaCobro: fecha } : f);
    setFiados(nf);
    const targetDay  = fecha === todayKey() ? today : (history.find(d => d.date === fecha) || emptyDay(fecha));
    const cobroVenta = { id: uid(), clienteId: fiado.clienteId, nombre: fiado.nombre, u20: 0, u12: 0, pago: "efectivo", nota: `Cobro fiado ${labelDate(fiado.fecha)}`, montoManual: fiado.monto };
    const newDay     = { ...targetDay, ventas: [...clampArr(targetDay.ventas), cobroVenta] };
    const nh         = [{ ...newDay, savedAt: Date.now() }, ...history.filter(d => d.date !== fecha)];
    setHistory(nh);
    if (fecha === selectedDate) setToday(newDay);
    await storage.multiSet([["fiados_v2", nf], ["history_v5", nh]]);
    setCobrarModal(null); showToast(`✅ Cobro en ${labelDate(fecha)}`);
  }, [fiados, today, history, selectedDate, showToast]);

  const deleteFiado = useCallback(async (id) => {
    askConfirm("¿Eliminar este fiado?", async () => {
      const nf = fiados.filter(f => f.id !== id); setFiados(nf); await sset("fiados_v2", nf);
      setConfirm(null); showToast("🗑️ Eliminado", "#ef4444");
    });
  }, [fiados, askConfirm, showToast]);

  const saveCliente = useCallback(async () => {
    if (!cForm.nombre) return;
    const base = { ...cForm, bidonesDeben: editingCli ? (clientes.find(c => c.id === editingCli)?.bidonesDeben || []) : [] };
    const nc = editingCli
      ? clientes.map(c => c.id === editingCli ? { ...c, ...base } : c)
      : [...clientes, { id: uid(), ...base, visitas: 0, bidonesDeben: [] }];
    setClientes(nc); await sset("clientes_v1", nc);
    setCForm(EMPTY_CLI_FORM); setEditingCli(null);
    showToast(editingCli ? "✅ Cliente actualizado" : "👤 Cliente agregado");
  }, [cForm, editingCli, clientes, showToast]);

  const deleteCliente = useCallback(async (id) => {
    askConfirm("¿Eliminar este cliente?", async () => {
      const nc = clientes.filter(c => c.id !== id); setClientes(nc); await sset("clientes_v1", nc);
      setConfirm(null); showToast("🗑️ Cliente eliminado", "#ef4444");
    });
  }, [clientes, askConfirm, showToast]);

  const devolverBidon = useCallback(async (clienteId, tipo) => {
    const nc = clientes.map(c => { if (c.id !== clienteId) return c; const bd = clampArr(c.bidonesDeben).map(b => b.tipo === tipo ? { ...b, cant: Math.max(0, b.cant - 1) } : b).filter(b => b.cant > 0); return { ...c, bidonesDeben: bd }; });
    setClientes(nc); await sset("clientes_v1", nc); showToast("✅ Bidón devuelto");
  }, [clientes, showToast]);

  const handleFoto = (clienteId, e) => {
    const file = e.target.files[0]; if (!file) return;
    const reader = new FileReader();
    reader.onload = async (ev) => { const nc = clientes.map(c => c.id === clienteId ? { ...c, foto: ev.target.result } : c); setClientes(nc); await sset("clientes_v1", nc); showToast("📷 Foto guardada"); };
    reader.readAsDataURL(file);
  };

  // ── CONFIG ──
  const saveCfg = useCallback(async () => {
    setSectors(tmpSectors); setPrices(tmpPrices); setCv20(tmpCv20);
    setCv12(tmpCv12); setFijosCats(tmpFijosCats); setAppName(tmpName); setZones(tmpZones);
    await storage.multiSet([
      ["sectors_v3", tmpSectors], ["prices_v1", tmpPrices], ["costos20_v2", tmpCv20],
      ["costos12_v2", tmpCv12], ["fijosCats_v1", tmpFijosCats], ["alertPct", alertPct],
      ["goalArs", goalArs], ["appName", tmpName], ["zones_v1", tmpZones], ["notifEnabled", notifEnabled],
    ]);
    showToast("✅ Configuración guardada");
  }, [tmpSectors, tmpPrices, tmpCv20, tmpCv12, tmpFijosCats, tmpName, tmpZones, alertPct, goalArs, notifEnabled, showToast]);

  const exportBackup = () => {
    const data = { history, fiados, clientes, sectors, prices, cv20, cv12, fijosCats, zones, alertPct, goalArs, appName, version: APP_VERSION };
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: "application/json" });
    const url  = URL.createObjectURL(blob);
    const a    = document.createElement("a"); a.href = url; a.download = `barret-backup-${todayKey()}.json`; a.click();
    URL.revokeObjectURL(url); showToast("📤 Exportado");
  };

  const importBackup = async () => {
    try {
      const data = JSON.parse(restoreText);
      if (!validateBackup(data)) { showToast("❌ Estructura inválida", "#ef4444"); return; }
      if (data.history)  { setHistory(data.history);   await sset("history_v5", data.history); }
      if (data.fiados)   { setFiados(data.fiados);     await sset("fiados_v2", data.fiados); }
      if (data.clientes) { setClientes(data.clientes); await sset("clientes_v1", data.clientes); }
      if (data.sectors)  { setSectors(data.sectors);   setTmpSectors(data.sectors); await sset("sectors_v3", data.sectors); }
      if (data.prices)   { setPrices(data.prices);     setTmpPrices(data.prices);   await sset("prices_v1", data.prices); }
      if (data.zones)    { setZones(data.zones);       setTmpZones(data.zones);     await sset("zones_v1", data.zones); }
      if (data.appName)  { setAppName(data.appName);   setTmpName(data.appName);    await sset("appName", data.appName); }
      setRestoreText(""); setShowRestore(false); showToast("✅ Datos restaurados");
    } catch { showToast("❌ JSON inválido", "#ef4444"); }
  };

  // ── WHATSAPP ──
  const buildWADia = (day) => {
    const t = dayTotals(day, prices);
    const cobradas = clampArr(day.ventas).filter(v => v.pago !== "fiado");
    const fiadas   = clampArr(day.ventas).filter(v => v.pago === "fiado");
    const lines = [`💧 *${appName}*`, `📅 ${labelDateLong(day.date)}`, ``,
      `🛒 *Ventas*`,
      ...cobradas.map(v => { const m = v.montoManual != null ? v.montoManual : ((v.u20 || 0) * prices.p20 + (v.u12 || 0) * prices.p12); const desc = v.montoManual != null ? "(cobro fiado)" : [v.u20 > 0 ? `${v.u20}×20L` : "", v.u12 > 0 ? `${v.u12}×12L` : ""].filter(Boolean).join(" "); return `  • ${v.nombre} — ${desc} — ${fmt(m)}`; }),
      `  *Total cobrado: ${fmt(t.cobrado)}*`, ``,
      fiadas.length ? `📋 *Fiados: ${fmt(t.fiado)}*` : null,
      fiadas.length ? fiadas.map(v => `  • ${v.nombre}`).join("\n") : null,
      t.gastos > 0 ? `💸 *Egresos: ${fmt(t.gastos)}*` : null,
      `📈 *Ganancia: ${fmt(t.cobrado - t.gastos)}*`,
      day.nota ? `\n📝 ${day.nota}` : null,
    ].filter(l => l !== null).join("\n");
    window.open(`https://wa.me/?text=${encodeURIComponent(lines)}`, "_blank");
  };

  // ── DERIVED ──
  const todayT     = useMemo(() => dayTotals(today, prices), [today, prices]);
  const isToday    = selectedDate === todayKey();
  const ws         = weekStart();

  const goalProgress = useMemo(() => Math.min((todayT.cobrado / (goalArs || 1)) * 100, 100), [todayT.cobrado, goalArs]);
  const unitProgress = useMemo(() => Math.min(((todayT.u20 + todayT.u12) / DAILY_UNIT_GOAL) * 100, 100), [todayT.u20, todayT.u12]);
  const gastoAlert   = useMemo(() => todayT.cobrado > 0 && (todayT.gastos / todayT.cobrado) * 100 > alertPct, [todayT, alertPct]);
  const sectoresToday= useMemo(() => sectors.map(s => ({ ...s, totalDay: s.monto * (todayT.u20 + todayT.u12) })), [sectors, todayT]);

  const visitasProgramadas = useMemo(() =>
    clientes.filter(c => { try { return tocaHoy(c) && c.estado !== "perdido"; } catch { return false; } }),
    [clientes]
  );
  const bidonesSinDevolver = useMemo(() =>
    clientes.flatMap(c => clampArr(c.bidonesDeben).filter(b => b.cant > 0).map(b => ({ ...b, nombre: String(c.nombre || ""), clienteId: c.id }))),
    [clientes]
  );
  const totalSinDevolver = useMemo(() => bidonesSinDevolver.reduce((a, b) => a + b.cant, 0), [bidonesSinDevolver]);
  const fiadosPendTotal  = useMemo(() => fiados.filter(f => !f.cobrado).reduce((a, f) => a + f.monto, 0), [fiados]);
  const cierreSemana     = useMemo(() => calcCierreSemanal(history.filter(d => d.date >= ws), prices, cv20, cv12, fijosCats), [history, ws, prices, cv20, cv12, fijosCats]);

  const clientesFiltrados = useMemo(() => {
    let list = clientes;
    if (cliZoneFilter !== "todas") list = list.filter(c => c.zona === cliZoneFilter);
    if (cliSearch) { const q = cliSearch.toLowerCase(); list = list.filter(c => (c.nombre || "").toLowerCase().includes(q) || (c.direccion || "").toLowerCase().includes(q) || (c.tel || "").includes(cliSearch)); }
    return list;
  }, [clientes, cliSearch, cliZoneFilter]);

  const clienteRanking = useMemo(() => {
    const cm = currentMonth();
    return clientes.map(c => ({
      ...c,
      totalMes: history.filter(d => d.date.startsWith(cm)).reduce((a, d) => {
        const vs = clampArr(d.ventas).filter(v => v.clienteId === c.id && !v.montoManual && v.pago !== "fiado");
        return a + vs.reduce((b, v) => b + (v.u20 || 0) * prices.p20 + (v.u12 || 0) * prices.p12, 0);
      }, 0),
    })).filter(c => c.totalMes > 0).sort((a, b) => b.totalMes - a.totalMes).slice(0, 5);
  }, [clientes, history, prices]);

  const NAV_TABS = [
    { id: "ventas",   label: "Ventas",   icon: "💰" },
    { id: "clientes", label: "Clientes", icon: "👥" },
    { id: "finanzas", label: "Finanzas", icon: "📊" },
    { id: "config",   label: "Config",   icon: "⚙️" },
  ];

  // ── LOADING ──
  if (loading) return (
    <div style={{ minHeight: "100vh", background: "#060d1a", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 16 }}>
      <img src={LOGO_B64} alt="" style={{ width: 72, height: 72, objectFit: "contain" }} />
      <div style={{ color: "#38bdf8", fontWeight: 700, fontSize: 18, fontFamily: "system-ui" }}>Barret Water</div>
      <div style={{ color: "#7c8fa8", fontSize: 13 }}>Cargando datos…</div>
      <div style={{ width: 120, height: 4, borderRadius: 99, background: "rgba(255,255,255,0.08)", overflow: "hidden" }}>
        <div style={{ height: "100%", width: "55%", background: "linear-gradient(90deg,#38bdf8,#0284C7)", borderRadius: 99, animation: "ldpulse 1.2s ease-in-out infinite" }} />
      </div>
      <style>{`@keyframes ldpulse{0%,100%{opacity:1}50%{opacity:0.4}}`}</style>
    </div>
  );

  // ── RENDER ──
  return (
    <div style={{ minHeight: "100vh", background: th.bg, fontFamily: "'DM Sans',system-ui,sans-serif", color: th.text, paddingBottom: 72 }}>

      {/* MODALS */}
      {saleModal    && <SaleModal clientes={clientes} prices={prices} editVenta={saleModal !== "new" ? saleModal : null} onSave={saleModal === "new" ? addVenta : editVentaFn} onAddCliente={handleAddClienteFromModal} onClose={() => setSaleModal(null)} th={th} />}
      {cobrarModal  && <CobrarModal fiado={cobrarModal} onCobrar={cobrarFiado} onClose={() => setCobrarModal(null)} th={th} />}
      {fiadoManual  && <FiadoManualModal clientes={clientes} onSave={addFiadoManual} onClose={() => setFiadoManual(false)} th={th} />}
      {nuevoPedidoModal && <NuevoPedidoModal clientes={clientes} editPedido={nuevoPedidoModal !== "new" ? nuevoPedidoModal : null} onSave={savePedido} onClose={() => setNuevoPedidoModal(null)} onAddCliente={handleAddClienteFromModal} th={th} />}
      {entregarModal && <EntregarModal pedido={entregarModal} onConfirm={opts => confirmarEntrega(entregarModal, opts)} onClose={() => setEntregarModal(null)} th={th} />}
      {cierreCajaModal && <CierreCajaModal day={today} prices={prices} sectors={sectors} onCerrar={handleCierreCaja} onClose={() => setCierreCajaModal(false)} th={th} />}
      {confirm      && <ConfirmDialog msg={confirm.msg} onConfirm={confirm.onConfirm} onCancel={() => setConfirm(null)} th={th} />}

      {/* TOAST */}
      {toast && <div style={{ position: "fixed", top: 20, left: "50%", transform: "translateX(-50%)", background: toast.color, color: "white", padding: "10px 20px", borderRadius: 30, fontSize: 13, fontWeight: 600, zIndex: 999, boxShadow: "0 8px 24px rgba(0,0,0,0.4)", whiteSpace: "nowrap" }}>{toast.msg}</div>}

      {/* BIDONES OVERLAY */}
      {showBidones && (
        <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.7)", zIndex: 400, display: "flex", alignItems: "center", justifyContent: "center", padding: 20 }} onClick={() => setShowBidones(false)}>
          <div style={{ ...glassCard(th), maxWidth: 380, width: "100%", padding: 24 }} onClick={e => e.stopPropagation()}>
            <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 16 }}>
              <div style={{ fontSize: 15, fontWeight: 700, color: th.text }}>🪣 Bidones sin devolver</div>
              <button onClick={() => setShowBidones(false)} style={{ ...btnGhost(th), padding: "3px 10px" }}>✕</button>
            </div>
            {bidonesSinDevolver.length === 0 ? <div style={{ color: th.textMuted, fontSize: 13 }}>Todos devueltos ✅</div> :
              bidonesSinDevolver.map((b, i) => (
                <div key={i} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "10px 12px", marginBottom: 8, background: "rgba(239,68,68,0.08)", borderRadius: 11, border: "1px solid rgba(239,68,68,0.2)" }}>
                  <div><div style={{ fontSize: 13, fontWeight: 600, color: th.text }}>{b.nombre}</div><div style={{ fontSize: 12, color: "#ef4444" }}>{b.cant}× {b.tipo}</div></div>
                  <button onClick={() => devolverBidon(b.clienteId, b.tipo)} style={{ fontSize: 12, padding: "5px 10px", background: "rgba(16,185,129,0.15)", border: "1px solid rgba(16,185,129,0.3)", borderRadius: 8, color: "#10B981", cursor: "pointer" }}>Devolvió 1</button>
                </div>
              ))}
          </div>
        </div>
      )}

      {/* HEADER */}
      <div style={{ background: darkMode ? "linear-gradient(135deg,rgba(56,189,248,0.1),rgba(6,13,26,0.95))" : "linear-gradient(135deg,rgba(2,132,199,0.06),rgba(248,250,252,0.97))", borderBottom: `1px solid ${th.border}`, padding: "12px 16px", display: "flex", alignItems: "center", justifyContent: "space-between", position: "sticky", top: 0, zIndex: 100, backdropFilter: "blur(16px)" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <img src={LOGO_B64} alt="logo" style={{ width: 34, height: 34, objectFit: "contain" }} />
          <div>
            <div style={{ fontWeight: 700, fontSize: 14, color: th.text }}>{appName}</div>
            <div style={{ fontSize: 10, color: th.textMuted }}>{labelDate(todayKey())}</div>
          </div>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          {totalSinDevolver > 0 && <button onClick={() => setShowBidones(true)} style={{ background: "rgba(239,68,68,0.15)", border: "1px solid rgba(239,68,68,0.3)", borderRadius: 20, padding: "4px 11px", color: "#ef4444", cursor: "pointer", fontSize: 11, fontWeight: 700 }}>🪣 {totalSinDevolver}</button>}
          {fiadosPendTotal > 0 && <div style={{ textAlign: "right" }}><div style={{ fontSize: 9, color: th.textMuted }}>Fiados</div><div style={{ color: "#F59E0B", fontWeight: 700, fontSize: 12 }}>{fmt(fiadosPendTotal)}</div></div>}
          {cierreSemana.cobrado > 0 && <div style={{ textAlign: "right" }}><div style={{ fontSize: 9, color: th.textMuted }}>Semana</div><div style={{ color: th.accent, fontWeight: 700, fontSize: 13 }}>{fmt(cierreSemana.cobrado)}</div></div>}
          <button onClick={async () => { const nd = !darkMode; setDarkMode(nd); await sset("darkMode", nd); }} style={{ ...btnGhost(th), padding: "6px 10px", fontSize: 14 }}>{darkMode ? "☀️" : "🌙"}</button>
        </div>
      </div>

      {/* CONTENT */}
      <div style={{ padding: "16px 14px", maxWidth: 680, margin: "0 auto" }}>

        {/* ═══════════════════════ RUTEO ═══════════════════════ */}
        {mainTab === "ruteo" && <>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 10 }}>
            <div style={{ fontSize: 13, fontWeight: 700, color: th.text }}>📅 Visitas programadas hoy</div>
            <div style={{ fontSize: 11, color: th.textMuted }}>{visitasProgramadas.length} cliente{visitasProgramadas.length !== 1 ? "s" : ""}</div>
          </div>

          {visitasProgramadas.length === 0 && (
            <GCard th={th} style={{ textAlign: "center", padding: "20px", marginBottom: 16 }}>
              <div style={{ fontSize: 11, color: th.textMuted }}>Sin visitas programadas para hoy</div>
              <div style={{ fontSize: 10, color: th.textDim, marginTop: 4 }}>Configurá la frecuencia en el tab Clientes</div>
            </GCard>
          )}

          {visitasProgramadas.map((cli, i) => {
            const yaEntregado = pedidos.some(p => p.clienteId === cli.id && p.esProgramado);
            const diasSinVisita = cli.ultimaVisita ? diffDays(cli.ultimaVisita, todayKey()) : null;
            const mapsUrl = cli.direccion ? `https://maps.google.com/?q=${encodeURIComponent(cli.direccion + " San José Entre Ríos Argentina")}` : "";
            return (
              <GCard key={cli.id} th={th} style={{ marginBottom: 10, opacity: yaEntregado ? 0.5 : 1 }}>
                <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 10 }}>
                  <div style={{ width: 32, height: 32, borderRadius: 10, background: `${th.accent}20`, border: `1px solid ${th.accent}35`, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 14, fontWeight: 700, color: th.accent, flexShrink: 0 }}>{i + 1}</div>
                  <div style={{ flex: 1 }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 6, flexWrap: "wrap" }}>
                      <span style={{ fontWeight: 600, fontSize: 14, color: th.text }}>{cli.nombre}</span>
                      <ZoneBadge zoneId={cli.zona} zones={zones} />
                      {yaEntregado && <span style={{ fontSize: 11, color: "#10B981", fontWeight: 600 }}>✅ Entregado</span>}
                    </div>
                    <div style={{ fontSize: 11, color: th.textMuted, display: "flex", gap: 8, flexWrap: "wrap", marginTop: 2 }}>
                      {cli.direccion && <span>📍 {cli.direccion}</span>}
                      {(cli.u20Estimado > 0 || cli.u12Estimado > 0) && <span style={{ color: th.accent }}>{cli.u20Estimado > 0 ? `${cli.u20Estimado}×20L` : ""}{cli.u12Estimado > 0 ? ` ${cli.u12Estimado}×12L` : ""} est.</span>}
                    </div>
                    {diasSinVisita !== null && <div style={{ fontSize: 10, color: diasSinVisita > 7 ? "#ef4444" : th.textDim, marginTop: 2 }}>Última visita: hace {diasSinVisita}d</div>}
                    {cli.notaUltimaVisita && <div style={{ fontSize: 10, color: th.textMuted, marginTop: 2, fontStyle: "italic" }}>"{cli.notaUltimaVisita}"</div>}
                  </div>
                </div>
                {!yaEntregado && (
                  <div style={{ display: "grid", gridTemplateColumns: mapsUrl ? "1fr 1fr 1fr" : "1fr 1fr", gap: 8 }}>
                    {mapsUrl && <a href={mapsUrl} target="_blank" rel="noreferrer" style={{ padding: "9px 4px", background: `${th.accent}14`, border: `1px solid ${th.accent}30`, borderRadius: 10, color: th.accent, textDecoration: "none", fontWeight: 600, fontSize: 12, textAlign: "center", display: "block" }}>📍 Maps</a>}
                    <button onClick={() => setEntregarModal({ ...cli, clienteId: cli.id, u20: cli.u20Estimado || 0, u12: cli.u12Estimado || 0, esProgramado: true })} style={{ padding: "9px 4px", background: "rgba(16,185,129,0.15)", border: "1px solid rgba(16,185,129,0.3)", borderRadius: 10, color: "#10B981", cursor: "pointer", fontWeight: 700, fontSize: 12 }}>✅ Entregar</button>
                    <button onClick={() => setNuevoPedidoModal({ id: `prog-${cli.id}`, clienteId: cli.id, nombre: cli.nombre, direccion: cli.direccion || "", u20: cli.u20Estimado || 0, u12: cli.u12Estimado || 0, nota: "", esProgramado: true })} style={{ padding: "9px 4px", background: "rgba(139,92,246,0.1)", border: "1px solid rgba(139,92,246,0.25)", borderRadius: 10, color: "#8B5CF6", cursor: "pointer", fontWeight: 600, fontSize: 12 }}>✏️ Ajustar</button>
                  </div>
                )}
              </GCard>
            );
          })}

          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginTop: 8, marginBottom: 10 }}>
            <div style={{ fontSize: 13, fontWeight: 700, color: th.text }}>📲 Pedidos del día</div>
            <button onClick={() => setNuevoPedidoModal("new")} style={{ padding: "7px 13px", background: `${th.accent}20`, border: `1px solid ${th.accent}35`, borderRadius: 10, color: th.accent, fontWeight: 700, cursor: "pointer", fontSize: 12 }}>+ Pedido</button>
          </div>

          {pedidos.length === 0 && <GCard th={th} style={{ textAlign: "center", padding: "18px" }}><div style={{ fontSize: 11, color: th.textMuted }}>Sin pedidos puntuales</div></GCard>}

          {pedidos.map((p, i) => {
            const cli = clientes.find(c => c.id === p.clienteId);
            const mapsUrl = cli?.direccion ? `https://maps.google.com/?q=${encodeURIComponent(cli.direccion + " San José Entre Ríos Argentina")}` : "";
            return (
              <div key={p.id} draggable onDragStart={() => onDragStart(i)} onDragOver={e => onDragOver(e, i)} onDragEnd={onDragEnd}
                style={{ ...glassCard(th), marginBottom: 10, cursor: "grab", opacity: dragIdx === i ? 0.45 : 1 }}>
                <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 10 }}>
                  <div style={{ width: 28, height: 28, borderRadius: 9, background: "rgba(139,92,246,0.15)", border: "1px solid rgba(139,92,246,0.3)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 12, fontWeight: 700, color: "#8B5CF6", flexShrink: 0 }}>{i + 1}</div>
                  <div style={{ flex: 1 }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 6, flexWrap: "wrap" }}>
                      <span style={{ fontWeight: 600, fontSize: 13, color: th.text }}>{p.nombre}</span>
                      <ZoneBadge zoneId={cli?.zona} zones={zones} />
                    </div>
                    <div style={{ fontSize: 11, color: th.textMuted }}>{[p.u20 > 0 ? `${p.u20}×20L` : "", p.u12 > 0 ? `${p.u12}×12L` : ""].filter(Boolean).join(" · ")}{p.nota ? ` · ${p.nota}` : ""}</div>
                    {cli?.direccion && <div style={{ fontSize: 10, color: th.textDim, marginTop: 1 }}>📍 {cli.direccion}</div>}
                  </div>
                  <span style={{ fontSize: 16, color: th.textDim }}>⠿</span>
                </div>
                <div style={{ display: "grid", gridTemplateColumns: mapsUrl ? "auto 1fr 1fr 1fr" : "1fr 1fr 1fr", gap: 7 }}>
                  {mapsUrl && <a href={mapsUrl} target="_blank" rel="noreferrer" style={{ padding: "8px 12px", background: `${th.accent}14`, border: `1px solid ${th.accent}30`, borderRadius: 9, color: th.accent, textDecoration: "none", fontWeight: 600, fontSize: 11, textAlign: "center", display: "block" }}>📍</a>}
                  <button onClick={() => setNuevoPedidoModal(p)} style={{ padding: "8px", background: "rgba(139,92,246,0.1)", border: "1px solid rgba(139,92,246,0.22)", borderRadius: 9, color: "#8B5CF6", cursor: "pointer", fontWeight: 600, fontSize: 11 }}>✏️</button>
                  <button onClick={() => setEntregarModal(p)} style={{ padding: "8px", background: "rgba(16,185,129,0.15)", border: "1px solid rgba(16,185,129,0.3)", borderRadius: 9, color: "#10B981", cursor: "pointer", fontWeight: 700, fontSize: 11 }}>✅</button>
                  <button onClick={() => deletePedido(p.id)} style={{ padding: "8px", background: "rgba(239,68,68,0.08)", border: "1px solid rgba(239,68,68,0.18)", borderRadius: 9, color: "#ef4444", cursor: "pointer", fontSize: 11 }}>🗑️</button>
                </div>
              </div>
            );
          })}
          {pedidos.length > 1 && <div style={{ textAlign: "center", fontSize: 11, color: th.textDim, marginTop: 4 }}>💡 Arrastrá para reordenar</div>}
        </>}

        {/* ═══════════════════════ VENTAS ═══════════════════════ */}
        {mainTab === "ventas" && <>
          <div style={{ display: "flex", gap: 6, marginBottom: 16, overflowX: "auto" }}>
            {[["caja", "📦 Caja"], ["fiados", "💳 Fiados"], ["gastos", "💸 Gastos"], ["historial", "📅 Historial"]].map(([k, l]) => (
              <button key={k} onClick={() => setSubTab(k)} style={{ padding: "8px 14px", borderRadius: 20, border: `1px solid ${subTab === k ? th.accent : th.border}`, background: subTab === k ? `${th.accent}20` : "transparent", color: subTab === k ? th.accent : th.textMuted, cursor: "pointer", fontSize: 12, fontWeight: subTab === k ? 700 : 400, whiteSpace: "nowrap", flexShrink: 0 }}>{l}</button>
            ))}
          </div>

          {subTab === "caja" && <>
            <GCard th={th} style={{ marginBottom: 14, display: "flex", alignItems: "center", justifyContent: "space-between", gap: 10 }}>
              <div>
                <div style={{ fontSize: 10, color: th.textMuted, textTransform: "uppercase" }}>Día</div>
                <div style={{ fontWeight: 700, fontSize: 14, color: isToday ? th.accent : th.text }}>{isToday ? "📅 Hoy" : labelDate(selectedDate)}</div>
              </div>
              <input type="date" value={selectedDate} max={todayKey()} onChange={e => setSelectedDate(e.target.value)} style={{ ...inputStyle(th), width: "auto", fontSize: 13 }} />
            </GCard>

            {isToday && (
              <GCard th={th} style={{ marginBottom: 14 }}>
                <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 5 }}>
                  <span style={{ fontSize: 12, fontWeight: 600, color: th.textMuted, textTransform: "uppercase" }}>Objetivo diario</span>
                  <span style={{ fontSize: 12, color: goalProgress >= 100 ? "#10B981" : th.textMuted }}>{fmt(todayT.cobrado)} / {fmt(goalArs)}</span>
                </div>
                <PBar pct={goalProgress} a={th.accent} b="#38bdf8" />
                <div style={{ display: "flex", justifyContent: "space-between", marginTop: 5 }}>
                  <span style={{ fontSize: 10, color: th.textDim }}>Unidades: {todayT.u20 + todayT.u12} / {DAILY_UNIT_GOAL}</span>
                  <span style={{ fontSize: 10, color: goalProgress >= 100 ? "#10B981" : th.textMuted, fontWeight: 600 }}>{goalProgress >= 100 ? "🎉 Meta!" : `${Math.round(goalProgress)}%`}</span>
                </div>
                <PBar pct={unitProgress} a="#8B5CF6" b="#a78bfa" style={{ marginTop: 4 }} />
              </GCard>
            )}

            {gastoAlert && <div style={{ background: "rgba(239,68,68,0.1)", border: "1px solid rgba(239,68,68,0.25)", borderRadius: 12, padding: "10px 14px", marginBottom: 12, fontSize: 13, color: "#fca5a5" }}>⚠️ Gastos ({Math.round((todayT.gastos / todayT.cobrado) * 100)}%) superan el {alertPct}%</div>}
            {today.cierreCaja && <div style={{ background: "rgba(16,185,129,0.1)", border: "1px solid rgba(16,185,129,0.25)", borderRadius: 12, padding: "10px 14px", marginBottom: 12, fontSize: 13, color: "#10B981" }}>🔒 Caja cerrada este día</div>}

            <div style={{ marginBottom: 14 }}>
              {clampArr(today.ventas).length === 0 && <Empty icon="🛒" text="Sin ventas en este día" th={th} />}
              {clampArr(today.ventas).map(v => {
                const tipo  = PAGO_TIPOS.find(t => t.id === v.pago) || PAGO_TIPOS[0];
                const monto = v.montoManual != null ? v.montoManual : ((v.u20 || 0) * prices.p20 + (v.u12 || 0) * prices.p12);
                return (
                  <div key={v.id} style={{ ...glassCard(th), display: "flex", alignItems: "center", gap: 8, padding: "10px 12px", marginBottom: 8, borderLeft: `3px solid ${tipo.color}` }}>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontWeight: 600, fontSize: 13, color: th.text }}>{v.nombre}</div>
                      <div style={{ fontSize: 11, color: th.textMuted }}>{[v.u20 > 0 ? `${v.u20}×20L` : "", v.u12 > 0 ? `${v.u12}×12L` : "", v.nota].filter(Boolean).join(" · ")}</div>
                      {((!v.canje20 && v.u20 > 0) || (!v.canje12 && v.u12 > 0)) && <div style={{ fontSize: 10, color: "#F59E0B" }}>⚠️ Bidón sin devolver</div>}
                    </div>
                    <div style={{ textAlign: "right" }}>
                      <div style={{ fontWeight: 700, color: tipo.color, fontSize: 14 }}>{fmt(monto)}</div>
                      <div style={{ fontSize: 10, color: th.textDim }}>{tipo.label}</div>
                    </div>
                    {!v.montoManual && <button onClick={() => setSaleModal(v)} style={{ ...btnGhost(th), padding: "4px 8px", fontSize: 12 }}>✏️</button>}
                    <button onClick={() => deleteVenta(v.id)} style={{ background: "rgba(239,68,68,0.08)", border: "1px solid rgba(239,68,68,0.18)", borderRadius: 8, color: "#ef4444", cursor: "pointer", padding: "4px 9px", fontSize: 13 }}>×</button>
                  </div>
                );
              })}
              <button onClick={() => setSaleModal("new")} style={{ ...btnPrimary, marginTop: 4 }}>+ Nueva venta</button>
            </div>

            {clampArr(today.ventas).length > 0 && <>
              <GCard th={th} style={{ marginBottom: 12 }}>
                <SectionTitle th={th}>Resumen del día</SectionTitle>
                <Row label="💵 Efectivo" value={fmt(todayT.efectivo)} vc="#10B981" th={th} />
                <Row label="🏦 Transferencia" value={fmt(todayT.transferencia)} vc={th.accent} th={th} />
                {todayT.fiado > 0 && <Row label="📋 Fiados" value={fmt(todayT.fiado)} vc="#F59E0B" th={th} />}
                <TotalRow label="Total cobrado" value={fmt(todayT.cobrado)} color={th.accent} th={th} />
                {todayT.gastos > 0 && <>
                  {todayT.gastosOp > 0 && <Row label="⚙️ Operativos" value={`−${fmt(todayT.gastosOp)}`} vc="#8B5CF6" th={th} />}
                  {todayT.gastosFijos > 0 && <Row label="🔁 Costos fijos" value={`−${fmt(todayT.gastosFijos)}`} vc={th.accent} th={th} />}
                  {todayT.gastosExt > 0 && <Row label="⚠️ Extraordinarios" value={`−${fmt(todayT.gastosExt)}`} vc="#ef4444" th={th} />}
                  <TotalRow label="Ganancia est." value={fmt(todayT.cobrado - todayT.gastos)} color="#10B981" th={th} />
                </>}
              </GCard>
              {(todayT.u20 + todayT.u12) > 0 && (
                <GCard th={th} style={{ marginBottom: 12 }}>
                  <SectionTitle th={th}>Separación del día</SectionTitle>
                  {sectoresToday.map(s => (
                    <div key={s.id} style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "8px 10px", marginBottom: 5, background: `${s.color}0d`, borderRadius: 9, border: `1px solid ${s.color}20` }}>
                      <div><span style={{ marginRight: 6 }}>{s.icon}</span><span style={{ fontSize: 12, color: th.text }}>{s.name}</span><span style={{ fontSize: 10, color: th.textMuted, marginLeft: 6 }}>{fmt(s.monto)}/u</span></div>
                      <span style={{ fontWeight: 700, color: s.color, fontSize: 14 }}>{fmt(s.totalDay)}</span>
                    </div>
                  ))}
                </GCard>
              )}
              <div style={{ display: "flex", gap: 10, marginBottom: 12 }}>
                <button onClick={() => buildWADia(today)} style={{ flex: 1, padding: "11px", background: "rgba(37,211,102,0.12)", border: "1px solid rgba(37,211,102,0.25)", borderRadius: 12, color: "#25d366", cursor: "pointer", fontWeight: 600, fontSize: 13 }}>📤 WA</button>
                {!today.cierreCaja && isToday && (
                  <button onClick={() => setCierreCajaModal(true)} style={{ flex: 1, padding: "11px", background: "rgba(16,185,129,0.12)", border: "1px solid rgba(16,185,129,0.3)", borderRadius: 12, color: "#10B981", cursor: "pointer", fontWeight: 600, fontSize: 13 }}>🔒 Cerrar caja</button>
                )}
              </div>
            </>}

            <GCard th={th}>
              <Label th={th}>Nota del día</Label>
              <textarea placeholder="Anotá algo..." value={today.nota || ""} onChange={e => setToday(t => ({ ...t, nota: e.target.value }))} onBlur={() => saveDay(today)} rows={2} style={{ ...inputStyle(th), resize: "none" }} />
            </GCard>
          </>}

          {subTab === "gastos" && (
            <GastoPanel
              gastos={clampArr(today.gastos).length ? today.gastos : [{ desc: "", monto: "", tipo: "operativo", cat: "" }]}
              setGastos={g => setToday(t => ({ ...t, gastos: g }))}
              fijosCats={fijosCats} onSave={saveGastos} onBack={() => setSubTab("caja")} th={th}
            />
          )}

          {subTab === "fiados" && <>
            <button onClick={() => setFiadoManual(true)} style={{ width: "100%", padding: "11px", marginBottom: 14, background: "rgba(245,158,11,0.08)", border: "1px dashed rgba(245,158,11,0.3)", borderRadius: 12, color: "#F59E0B", cursor: "pointer", fontWeight: 600, fontSize: 13 }}>+ Agregar fiado manualmente</button>
            {fiados.filter(f => !f.cobrado).length > 0 ? <>
              <SectionTitle th={th}>Pendientes</SectionTitle>
              {fiados.filter(f => !f.cobrado).map(f => <FiadoRow key={f.id} f={f} onCobrar={() => setCobrarModal(f)} onDelete={() => deleteFiado(f.id)} th={th} />)}
              <TotalRow label="Total pendiente" value={fmt(fiadosPendTotal)} color="#F59E0B" th={th} />
            </> : <Empty icon="💳" text="Sin fiados pendientes" th={th} />}
            {fiados.filter(f => f.cobrado).length > 0 && <>
              <SectionTitle th={th} style={{ marginTop: 16 }}>Cobrados recientes</SectionTitle>
              {[...fiados.filter(f => f.cobrado)].reverse().slice(0, 8).map(f => <FiadoRow key={f.id} f={f} onCobrar={() => {}} onDelete={() => deleteFiado(f.id)} dimmed th={th} />)}
            </>}
          </>}

          {subTab === "historial" && <>
            {history.length === 0 && <Empty icon="📅" text="Sin días guardados" th={th} />}
            {[...history].sort((a, b) => String(b.date || "").localeCompare(String(a.date || ""))).map(d => {
              const t = dayTotals(d, prices);
              return (
                <GCard key={d.date} th={th} style={{ marginBottom: 10 }}>
                  <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 8 }}>
                    <div>
                      <div style={{ fontWeight: 600, fontSize: 14, color: th.text }}>{labelDate(d.date)} {d.cierreCaja ? "🔒" : ""}</div>
                      <div style={{ fontSize: 11, color: th.textMuted }}>{d.ventas?.length || 0} ventas · {t.u20 + t.u12} bidones</div>
                      {t.fiado > 0 && <div style={{ fontSize: 11, color: "#F59E0B" }}>📋 Fiados: {fmt(t.fiado)}</div>}
                    </div>
                    <div style={{ textAlign: "right" }}>
                      <div style={{ fontSize: 18, fontWeight: 700, color: th.accent }}>{fmt(t.cobrado)}</div>
                      {t.gastos > 0 && <div style={{ fontSize: 11, color: th.textMuted }}>−{fmt(t.gastos)}</div>}
                    </div>
                  </div>
                  <div style={{ display: "flex", gap: 8 }}>
                    <button onClick={() => { setSelectedDate(d.date); setSubTab("caja"); }} style={{ flex: 1, padding: "8px", ...btnGhost(th), textAlign: "center", fontSize: 12, fontWeight: 600 }}>✏️ Editar</button>
                    <button onClick={() => buildWADia(d)} style={{ flex: 1, padding: "8px", background: "rgba(37,211,102,0.1)", border: "1px solid rgba(37,211,102,0.22)", borderRadius: 9, color: "#25d366", cursor: "pointer", fontSize: 12, fontWeight: 600 }}>📤 WA</button>
                    <button onClick={() => askConfirm("¿Eliminar este día?", async () => { const nh = history.filter(x => x.date !== d.date); setHistory(nh); await sset("history_v5", nh); setConfirm(null); showToast("🗑️ Eliminado", "#ef4444"); })} style={{ padding: "8px 10px", background: "rgba(239,68,68,0.08)", border: "1px solid rgba(239,68,68,0.18)", borderRadius: 9, color: "#ef4444", cursor: "pointer", fontSize: 12 }}>🗑️</button>
                  </div>
                </GCard>
              );
            })}
          </>}
        </>}

        {/* ═══════════════════════ CLIENTES ═══════════════════════ */}
        {mainTab === "clientes" && <>
          <GCard th={th} style={{ marginBottom: 14 }}>
            <input type="text" placeholder="Buscar por nombre, dirección o teléfono..." value={cliSearch} onChange={e => setCliSearch(e.target.value)} style={{ ...inputStyle(th), marginBottom: 10 }} />
            <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
              <button onClick={() => setCliZoneFilter("todas")} style={{ padding: "5px 12px", borderRadius: 20, border: `1px solid ${cliZoneFilter === "todas" ? th.accent : th.border}`, background: cliZoneFilter === "todas" ? `${th.accent}20` : "transparent", color: cliZoneFilter === "todas" ? th.accent : th.textMuted, cursor: "pointer", fontSize: 11, fontWeight: 600 }}>Todas</button>
              {zones.map(z => (
                <button key={z.id} onClick={() => setCliZoneFilter(z.id)} style={{ padding: "5px 12px", borderRadius: 20, border: `1px solid ${cliZoneFilter === z.id ? z.color : th.border}`, background: cliZoneFilter === z.id ? `${z.color}20` : "transparent", color: cliZoneFilter === z.id ? z.color : th.textMuted, cursor: "pointer", fontSize: 11, fontWeight: 600 }}>
                  {z.icon} {z.name}
                </button>
              ))}
            </div>
          </GCard>

          <GCard th={th} style={{ marginBottom: 16 }}>
            <SectionTitle th={th}>{editingCli ? "✏️ Editar cliente" : "👤 Agregar cliente"}</SectionTitle>
            <input type="text" placeholder="Nombre *" value={cForm.nombre} onChange={e => setCForm(f => ({ ...f, nombre: e.target.value }))} style={{ ...inputStyle(th), marginBottom: 8 }} />
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8, marginBottom: 8 }}>
              <div><Label th={th}>Teléfono</Label><input type="text" value={cForm.tel} onChange={e => setCForm(f => ({ ...f, tel: e.target.value }))} style={inputStyle(th)} /></div>
              <div><Label th={th}>Dirección</Label><input type="text" value={cForm.direccion} onChange={e => setCForm(f => ({ ...f, direccion: e.target.value }))} style={inputStyle(th)} /></div>
            </div>
            <Label th={th}>Zona</Label>
            <div style={{ display: "flex", gap: 6, marginBottom: 10, flexWrap: "wrap" }}>
              <button onClick={() => setCForm(f => ({ ...f, zona: "" }))} style={{ padding: "5px 12px", borderRadius: 20, border: `1px solid ${!cForm.zona ? th.accent : th.border}`, background: !cForm.zona ? `${th.accent}20` : "transparent", color: !cForm.zona ? th.accent : th.textMuted, cursor: "pointer", fontSize: 11 }}>Sin zona</button>
              {zones.map(z => (
                <button key={z.id} onClick={() => setCForm(f => ({ ...f, zona: z.id }))} style={{ padding: "5px 12px", borderRadius: 20, border: `1px solid ${cForm.zona === z.id ? z.color : th.border}`, background: cForm.zona === z.id ? `${z.color}20` : "transparent", color: cForm.zona === z.id ? z.color : th.textMuted, cursor: "pointer", fontSize: 11, fontWeight: cForm.zona === z.id ? 700 : 400 }}>
                  {z.icon} {z.name}
                </button>
              ))}
            </div>
            <Label th={th}>Estado</Label>
            <div style={{ display: "flex", gap: 8, marginBottom: 10 }}>
              {ESTADOS_CLIENTE.map(e => (
                <button key={e.id} onClick={() => setCForm(f => ({ ...f, estado: e.id }))} style={{ flex: 1, padding: "7px", borderRadius: 9, border: `2px solid ${cForm.estado === e.id ? e.color : th.border}`, background: cForm.estado === e.id ? `${e.color}18` : "transparent", color: cForm.estado === e.id ? e.color : th.textMuted, cursor: "pointer", fontSize: 12, fontWeight: cForm.estado === e.id ? 700 : 400 }}>{e.label}</button>
              ))}
            </div>
            <Label th={th}>Frecuencia de visita</Label>
            <div style={{ display: "flex", gap: 6, marginBottom: 10 }}>
              {[["ninguna", "Sin frecuencia"], ["semanal", "Días fijos"], ["dias", "Cada X días"]].map(([k, l]) => (
                <button key={k} onClick={() => setCForm(f => ({ ...f, frecuenciaTipo: k }))} style={{ flex: 1, padding: "7px 4px", borderRadius: 9, border: `2px solid ${cForm.frecuenciaTipo === k ? th.accent : th.border}`, background: cForm.frecuenciaTipo === k ? `${th.accent}18` : "transparent", color: cForm.frecuenciaTipo === k ? th.accent : th.textMuted, cursor: "pointer", fontSize: 11, fontWeight: cForm.frecuenciaTipo === k ? 700 : 400 }}>{l}</button>
              ))}
            </div>
            {cForm.frecuenciaTipo === "semanal" && (
              <div style={{ display: "flex", gap: 6, marginBottom: 10, flexWrap: "wrap" }}>
                {DIAS_SEMANA.map((d, i) => {
                  const sel = clampArr(cForm.diasSemana).includes(i);
                  return (
                    <button key={i} onClick={() => setCForm(f => ({ ...f, diasSemana: sel ? clampArr(f.diasSemana).filter(x => x !== i) : [...clampArr(f.diasSemana), i] }))}
                      style={{ padding: "6px 10px", borderRadius: 9, border: `2px solid ${sel ? th.accent : th.border}`, background: sel ? `${th.accent}20` : "transparent", color: sel ? th.accent : th.textMuted, cursor: "pointer", fontSize: 12, fontWeight: sel ? 700 : 400 }}>
                      {d}
                    </button>
                  );
                })}
              </div>
            )}
            {cForm.frecuenciaTipo === "dias" && (
              <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 10 }}>
                <span style={{ fontSize: 12, color: th.textMuted }}>Cada</span>
                <input type="number" min="1" max="60" value={cForm.frecuenciaDias} onChange={e => setCForm(f => ({ ...f, frecuenciaDias: parseInt(e.target.value) || 7 }))} style={{ ...inputStyle(th), width: 70, textAlign: "center" }} />
                <span style={{ fontSize: 12, color: th.textMuted }}>días</span>
              </div>
            )}
            {cForm.frecuenciaTipo !== "ninguna" && <>
              <Label th={th}>Bidones estimados por visita</Label>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8, marginBottom: 10 }}>
                {[["u20Estimado", "20L"], ["u12Estimado", "12L"]].map(([field, label]) => (
                  <div key={field} style={{ display: "flex", alignItems: "center", gap: 8 }}>
                    <span style={{ fontSize: 12, color: th.textMuted, minWidth: 30 }}>{label}:</span>
                    <button onClick={() => setCForm(f => ({ ...f, [field]: Math.max(0, (f[field] || 0) - 1) }))} style={{ ...btnGhost(th), padding: "4px 10px" }}>−</button>
                    <span style={{ fontWeight: 700, color: th.accent, minWidth: 20, textAlign: "center" }}>{cForm[field] || 0}</span>
                    <button onClick={() => setCForm(f => ({ ...f, [field]: (f[field] || 0) + 1 }))} style={{ ...btnGhost(th), padding: "4px 10px" }}>+</button>
                  </div>
                ))}
              </div>
            </>}
            <Label th={th}>Nota</Label>
            <input type="text" value={cForm.nota} onChange={e => setCForm(f => ({ ...f, nota: e.target.value }))} style={{ ...inputStyle(th), marginBottom: 12 }} />
            <div style={{ display: "flex", gap: 8 }}>
              {editingCli && <button onClick={() => { setEditingCli(null); setCForm(EMPTY_CLI_FORM); }} style={btnGhost(th)}>Cancelar</button>}
              <button onClick={saveCliente} style={{ ...btnPrimary, background: "linear-gradient(135deg,#8B5CF6,#7C3AED)", boxShadow: "0 6px 20px rgba(139,92,246,0.3)" }}>
                {editingCli ? "✅ Guardar" : "👤 Agregar"}
              </button>
            </div>
          </GCard>

          {clientesFiltrados.length === 0 && <Empty icon="👥" text="Sin clientes" th={th} />}
          {clientesFiltrados.map(c => {
            const estado       = ESTADOS_CLIENTE.find(e => e.id === (c.estado || "activo")) || ESTADOS_CLIENTE[0];
            const fiadosPend   = fiados.filter(f => f.clienteId === c.id && !f.cobrado).reduce((a, f) => a + f.monto, 0);
            const bidonesDeben = clampArr(c.bidonesDeben).filter(b => b.cant > 0);
            const prox         = proximaVisita(c);
            const diasProx     = prox ? diffDays(todayKey(), prox) : null;
            const totalCompras = history.reduce((a, d) => { const vs = clampArr(d.ventas).filter(v => v.clienteId === c.id && !v.montoManual && v.pago !== "fiado"); return a + vs.reduce((b, v) => b + (v.u20 || 0) * prices.p20 + (v.u12 || 0) * prices.p12, 0); }, 0);
            return (
              <GCard key={c.id} th={th} style={{ marginBottom: 12 }}>
                <div style={{ display: "flex", gap: 12, marginBottom: 10 }}>
                  <div style={{ position: "relative", flexShrink: 0 }}>
                    <div style={{ width: 50, height: 50, borderRadius: 12, background: `${th.accent}15`, border: `1px solid ${th.border}`, overflow: "hidden", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 20 }}>
                      {c.foto ? <img src={c.foto} alt="" style={{ width: "100%", height: "100%", objectFit: "cover" }} /> : "👤"}
                    </div>
                    <label style={{ position: "absolute", bottom: -4, right: -4, width: 18, height: 18, borderRadius: 6, background: th.accent, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 9 }}>
                      📷<input type="file" accept="image/*" style={{ display: "none" }} onChange={e => handleFoto(c.id, e)} />
                    </label>
                  </div>
                  <div style={{ flex: 1 }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 6, flexWrap: "wrap", marginBottom: 2 }}>
                      <span style={{ fontWeight: 700, fontSize: 14, color: th.text }}>{c.nombre}</span>
                      <span style={{ fontSize: 10, fontWeight: 600, color: estado.color, background: `${estado.color}18`, padding: "2px 7px", borderRadius: 20 }}>{estado.label}</span>
                      <ZoneBadge zoneId={c.zona} zones={zones} />
                    </div>
                    {c.tel && <a href={`https://wa.me/54${String(c.tel).replace(/\D/g, "")}`} target="_blank" rel="noreferrer" style={{ fontSize: 12, color: "#25d366", textDecoration: "none", display: "block" }}>📱 {c.tel}</a>}
                    {c.direccion && <a href={`https://maps.google.com/?q=${encodeURIComponent(c.direccion + " San José Entre Ríos Argentina")}`} target="_blank" rel="noreferrer" style={{ display: "block", fontSize: 12, color: th.accent, textDecoration: "none" }}>📍 {c.direccion}</a>}
                    {c.frecuenciaTipo && c.frecuenciaTipo !== "ninguna" && (
                      <div style={{ fontSize: 10, color: th.textMuted, marginTop: 2 }}>
                        {c.frecuenciaTipo === "semanal" ? `📅 ${clampArr(c.diasSemana).map(d => DIAS_SEMANA[d] || "").join(", ")}` : `🔄 Cada ${c.frecuenciaDias}d`}
                        {prox && <span style={{ marginLeft: 6, color: diasProx <= 1 ? "#10B981" : diasProx <= 3 ? "#F59E0B" : th.textDim }}>→ {diasProx === 0 ? "hoy" : diasProx === 1 ? "mañana" : `en ${diasProx}d`}</span>}
                      </div>
                    )}
                    {c.visitas > 0 && <div style={{ fontSize: 10, color: th.textDim }}>{c.visitas} visita{c.visitas !== 1 ? "s" : ""}{c.ultimaVisita ? ` · última hace ${diffDays(c.ultimaVisita, todayKey())}d` : ""}</div>}
                  </div>
                  <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
                    <button onClick={() => { setEditingCli(c.id); setCForm({ nombre: c.nombre, tel: c.tel || "", direccion: c.direccion || "", nota: c.nota || "", estado: c.estado || "activo", zona: c.zona || "", frecuenciaTipo: c.frecuenciaTipo || "ninguna", frecuenciaDias: c.frecuenciaDias || 7, diasSemana: clampArr(c.diasSemana), u20Estimado: c.u20Estimado || 0, u12Estimado: c.u12Estimado || 0 }); window.scrollTo(0, 0); }} style={{ ...btnGhost(th), padding: "4px 9px", fontSize: 12 }}>✏️</button>
                    <button onClick={() => deleteCliente(c.id)} style={{ background: "rgba(239,68,68,0.08)", border: "1px solid rgba(239,68,68,0.18)", borderRadius: 8, color: "#ef4444", cursor: "pointer", padding: "4px 9px", fontSize: 13 }}>🗑️</button>
                  </div>
                </div>
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8, marginBottom: bidonesDeben.length > 0 ? 10 : 0 }}>
                  <div style={{ padding: "8px 10px", background: `${th.accent}0d`, borderRadius: 9 }}><div style={{ fontSize: 9, color: th.textMuted, textTransform: "uppercase" }}>Compras totales</div><div style={{ fontWeight: 600, color: th.accent, fontSize: 13 }}>{totalCompras > 0 ? fmt(totalCompras) : "—"}</div></div>
                  <div style={{ padding: "8px 10px", background: fiadosPend > 0 ? "rgba(245,158,11,0.1)" : "rgba(255,255,255,0.04)", borderRadius: 9 }}><div style={{ fontSize: 9, color: th.textMuted, textTransform: "uppercase" }}>Fiado pend.</div><div style={{ fontWeight: 600, color: fiadosPend > 0 ? "#F59E0B" : th.textDim, fontSize: 13 }}>{fiadosPend > 0 ? fmt(fiadosPend) : "—"}</div></div>
                </div>
                {bidonesDeben.length > 0 && (
                  <div style={{ padding: "9px 11px", background: "rgba(239,68,68,0.08)", borderRadius: 9, border: "1px solid rgba(239,68,68,0.2)" }}>
                    <div style={{ fontSize: 10, color: "#ef4444", marginBottom: 5 }}>🪣 Bidones que debe</div>
                    {bidonesDeben.map(b => (
                      <div key={b.tipo} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 4 }}>
                        <span style={{ fontSize: 12, color: th.text }}>{b.cant}× bidón {b.tipo}</span>
                        <button onClick={() => devolverBidon(c.id, b.tipo)} style={{ fontSize: 11, padding: "3px 9px", background: "rgba(16,185,129,0.15)", border: "1px solid rgba(16,185,129,0.3)", borderRadius: 7, color: "#10B981", cursor: "pointer" }}>Devolvió 1</button>
                      </div>
                    ))}
                  </div>
                )}
                {c.notaUltimaVisita && <div style={{ fontSize: 11, color: th.textMuted, marginTop: 8, padding: "7px 10px", background: "rgba(255,255,255,0.03)", borderRadius: 8, borderLeft: `2px solid ${th.accent}`, fontStyle: "italic" }}>"{c.notaUltimaVisita}"</div>}
              </GCard>
            );
          })}
        </>}

        {/* ═══════════════════════ FINANZAS ═══════════════════════ */}
        {mainTab === "finanzas" && <>
          <div style={{ display: "flex", gap: 6, marginBottom: 16, overflowX: "auto", paddingBottom: 4 }}>
            {[["dashboard", "📊 Dashboard"], ["calendario", "📅 Calendario"], ["metricas", "📈 Métricas"]].map(([k, l]) => (
              <button key={k} onClick={() => setSubTab(k)} style={{ padding: "8px 14px", borderRadius: 20, border: `1px solid ${subTab === k ? th.accent : th.border}`, background: subTab === k ? `${th.accent}20` : "transparent", color: subTab === k ? th.accent : th.textMuted, cursor: "pointer", fontSize: 12, fontWeight: subTab === k ? 700 : 400, whiteSpace: "nowrap", flexShrink: 0 }}>{l}</button>
            ))}
          </div>
          {subTab === "dashboard"  && <FinanzasView history={history} prices={prices} fiados={fiados} sectors={sectors} cv20={cv20} cv12={cv12} fijosCats={fijosCats} th={th} />}
          {subTab === "calendario" && <CalendarioView history={history} prices={prices} fiados={fiados} goalArs={goalArs} th={th} />}
          {subTab === "metricas"   && <>
            <GCard th={th} style={{ marginBottom: 12 }}>
              <SectionTitle th={th}>Rentabilidad por producto</SectionTitle>
              {[["20L", prices.p20, cv20], ["12L", prices.p12, cv12]].map(([l, p, costos]) => {
                const cT = costoTotal(costos);
                const pct = p > 0 ? ((p - cT) / p) * 100 : 0;
                return (
                  <div key={l} style={{ padding: 12, background: "rgba(255,255,255,0.03)", borderRadius: 11, marginBottom: 10, border: `1px solid ${th.border}` }}>
                    <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 8 }}>
                      <span style={{ fontWeight: 600, color: th.text }}>Bidón {l}</span>
                      <span style={{ color: "#10B981", fontWeight: 700 }}>Margen: {fmt(p - cT)}</span>
                    </div>
                    {clampArr(costos).map(c => <Row key={c.id} label={`• ${c.name}`} value={fmt(c.monto)} vc={th.textMuted} th={th} />)}
                    <Row label="Costo variable" value={fmt(cT)} vc="#F59E0B" th={th} />
                    <Row label="Precio venta" value={fmt(p)} vc={th.accent} th={th} />
                    <PBar pct={pct} a="#10B981" b="#34d399" style={{ marginTop: 8 }} />
                    <div style={{ fontSize: 10, color: th.textMuted, marginTop: 4 }}>{Math.round(pct)}% margen bruto</div>
                  </div>
                );
              })}
            </GCard>
            {clienteRanking.length > 0 && (
              <GCard th={th}>
                <SectionTitle th={th}>Top clientes del mes</SectionTitle>
                {clienteRanking.map((c, i) => (
                  <div key={c.id} style={{ display: "flex", alignItems: "center", gap: 10, padding: "9px 11px", marginBottom: 6, background: "rgba(255,255,255,0.03)", borderRadius: 10 }}>
                    <div style={{ width: 26, height: 26, borderRadius: 8, background: i === 0 ? "rgba(245,158,11,0.2)" : "rgba(255,255,255,0.06)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 12, fontWeight: 700, color: i === 0 ? "#F59E0B" : th.textMuted }}>{i + 1}</div>
                    <div style={{ flex: 1 }}>
                      <div style={{ fontSize: 13, fontWeight: 600, color: th.text }}>{c.nombre}</div>
                      <ZoneBadge zoneId={c.zona} zones={zones} />
                    </div>
                    <div style={{ fontWeight: 700, color: th.accent, fontSize: 14 }}>{fmt(c.totalMes)}</div>
                  </div>
                ))}
              </GCard>
            )}
          </>}
        </>}

        {/* ═══════════════════════ CONFIG ═══════════════════════ */}
        {mainTab === "config" && <>
          <GCard th={th} style={{ marginBottom: 12 }}>
            <SectionTitle th={th}>General</SectionTitle>
            <Label th={th}>Nombre de la app</Label>
            <input type="text" value={tmpName} onChange={e => setTmpName(e.target.value)} style={{ ...inputStyle(th), marginBottom: 10 }} />
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
              <div><Label th={th}>Meta diaria $</Label><div style={{ position: "relative" }}><span style={{ position: "absolute", left: 12, top: "50%", transform: "translateY(-50%)", color: th.textMuted }}>$</span><input type="number" value={goalArs} onChange={e => setGoalArs(parseFloat(e.target.value) || 0)} style={{ ...inputStyle(th), paddingLeft: 24 }} /></div></div>
              <div><Label th={th}>Alerta gastos %</Label><input type="number" value={alertPct} onChange={e => setAlertPct(parseFloat(e.target.value) || 0)} style={inputStyle(th)} /></div>
            </div>
          </GCard>

          <GCard th={th} style={{ marginBottom: 12 }}>
            <SectionTitle th={th}>Zonas de reparto</SectionTitle>
            {tmpZones.map((z, i) => (
              <div key={z.id} style={{ display: "flex", gap: 8, alignItems: "center", marginBottom: 8 }}>
                <input type="text" value={z.icon} onChange={e => { const nz = [...tmpZones]; nz[i] = { ...nz[i], icon: e.target.value }; setTmpZones(nz); }} style={{ ...inputStyle(th), width: 44, textAlign: "center", padding: "8px" }} />
                <input type="text" value={z.name} onChange={e => { const nz = [...tmpZones]; nz[i] = { ...nz[i], name: e.target.value }; setTmpZones(nz); }} style={{ ...inputStyle(th), flex: 2 }} />
                <input type="color" value={z.color} onChange={e => { const nz = [...tmpZones]; nz[i] = { ...nz[i], color: e.target.value }; setTmpZones(nz); }} style={{ width: 36, height: 36, borderRadius: 9, border: "none", cursor: "pointer", padding: 2 }} />
                <button onClick={() => setTmpZones(tmpZones.filter((_, j) => j !== i))} style={{ background: "rgba(239,68,68,0.1)", border: "1px solid rgba(239,68,68,0.3)", borderRadius: 9, color: "#ef4444", cursor: "pointer", padding: "0 10px", fontSize: 18, height: 38 }}>×</button>
              </div>
            ))}
            <button onClick={() => setTmpZones([...tmpZones, { id: uid(), name: "Nueva zona", color: "#64748b", icon: "📍" }])} style={{ width: "100%", padding: "8px", background: "transparent", border: `1px dashed ${th.border}`, borderRadius: 10, color: th.textMuted, cursor: "pointer", fontSize: 12 }}>+ Agregar zona</button>
          </GCard>

          <GCard th={th} style={{ marginBottom: 12 }}>
            <SectionTitle th={th}>Notificaciones push</SectionTitle>
            {[["nuevoPedido", "📦 Nuevo pedido"], ["nuevaVenta", "💰 Nueva venta"], ["cierreCaja", "🔒 Cierre de caja"]].map(([k, l]) => (
              <div key={k} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "9px 0", borderBottom: `1px solid ${th.border}` }}>
                <span style={{ fontSize: 13, color: th.text }}>{l}</span>
                <Toggle value={!!notifEnabled[k]} onChange={v => setNotifEnabled(n => ({ ...n, [k]: v }))} />
              </div>
            ))}
            <button onClick={requestNotifPermission} style={{ ...btnGhost(th), marginTop: 10, width: "100%", textAlign: "center", fontSize: 12 }}>🔔 Solicitar permiso de notificaciones</button>
          </GCard>

          <GCard th={th} style={{ marginBottom: 12 }}>
            <SectionTitle th={th}>Precios</SectionTitle>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
              <div><Label th={th}>Bidón 20L</Label><div style={{ position: "relative" }}><span style={{ position: "absolute", left: 12, top: "50%", transform: "translateY(-50%)", color: th.textMuted }}>$</span><input type="number" value={tmpPrices.p20} onChange={e => setTmpPrices(p => ({ ...p, p20: parseFloat(e.target.value) || 0 }))} style={{ ...inputStyle(th), paddingLeft: 24 }} /></div></div>
              <div><Label th={th}>Bidón 12L</Label><div style={{ position: "relative" }}><span style={{ position: "absolute", left: 12, top: "50%", transform: "translateY(-50%)", color: th.textMuted }}>$</span><input type="number" value={tmpPrices.p12} onChange={e => setTmpPrices(p => ({ ...p, p12: parseFloat(e.target.value) || 0 }))} style={{ ...inputStyle(th), paddingLeft: 24 }} /></div></div>
            </div>
          </GCard>

          <GCard th={th} style={{ marginBottom: 12 }}>
            <SectionTitle th={th}>Separación por sector</SectionTitle>
            {tmpSectors.map((s, i) => (
              <div key={s.id} style={{ display: "flex", gap: 8, alignItems: "center", marginBottom: 8 }}>
                <input type="text" value={s.icon} onChange={e => { const ns = [...tmpSectors]; ns[i] = { ...ns[i], icon: e.target.value }; setTmpSectors(ns); }} style={{ ...inputStyle(th), width: 44, textAlign: "center", padding: "8px" }} />
                <input type="text" value={s.name} onChange={e => { const ns = [...tmpSectors]; ns[i] = { ...ns[i], name: e.target.value }; setTmpSectors(ns); }} style={{ ...inputStyle(th), flex: 2 }} />
                <div style={{ position: "relative", flex: 1 }}><span style={{ position: "absolute", left: 10, top: "50%", transform: "translateY(-50%)", color: th.textMuted, fontSize: 12 }}>$</span><input type="number" value={s.monto} onChange={e => { const ns = [...tmpSectors]; ns[i] = { ...ns[i], monto: parseFloat(e.target.value) || 0 }; setTmpSectors(ns); }} style={{ ...inputStyle(th), paddingLeft: 22 }} /></div>
                <input type="color" value={s.color} onChange={e => { const ns = [...tmpSectors]; ns[i] = { ...ns[i], color: e.target.value }; setTmpSectors(ns); }} style={{ width: 36, height: 36, borderRadius: 9, border: "none", cursor: "pointer", padding: 2 }} />
              </div>
            ))}
          </GCard>

          <GCard th={th} style={{ marginBottom: 12 }}>
            <SectionTitle th={th}>Costos variables — 20L</SectionTitle>
            {tmpCv20.map((c, i) => (
              <div key={c.id} style={{ display: "flex", gap: 8, marginBottom: 8 }}>
                <input type="text" value={c.name} onChange={e => { const n = [...tmpCv20]; n[i] = { ...n[i], name: e.target.value }; setTmpCv20(n); }} style={{ ...inputStyle(th), flex: 2 }} />
                <div style={{ position: "relative", flex: 1 }}><span style={{ position: "absolute", left: 10, top: "50%", transform: "translateY(-50%)", color: th.textMuted, fontSize: 12 }}>$</span><input type="number" value={c.monto} onChange={e => { const n = [...tmpCv20]; n[i] = { ...n[i], monto: parseFloat(e.target.value) || 0 }; setTmpCv20(n); }} style={{ ...inputStyle(th), paddingLeft: 22 }} /></div>
              </div>
            ))}
            <SectionTitle th={th} style={{ marginTop: 12 }}>Costos variables — 12L</SectionTitle>
            {tmpCv12.map((c, i) => (
              <div key={c.id} style={{ display: "flex", gap: 8, marginBottom: 8 }}>
                <input type="text" value={c.name} onChange={e => { const n = [...tmpCv12]; n[i] = { ...n[i], name: e.target.value }; setTmpCv12(n); }} style={{ ...inputStyle(th), flex: 2 }} />
                <div style={{ position: "relative", flex: 1 }}><span style={{ position: "absolute", left: 10, top: "50%", transform: "translateY(-50%)", color: th.textMuted, fontSize: 12 }}>$</span><input type="number" value={c.monto} onChange={e => { const n = [...tmpCv12]; n[i] = { ...n[i], monto: parseFloat(e.target.value) || 0 }; setTmpCv12(n); }} style={{ ...inputStyle(th), paddingLeft: 22 }} /></div>
              </div>
            ))}
          </GCard>

          <GCard th={th} style={{ marginBottom: 12 }}>
            <SectionTitle th={th}>Categorías costos fijos</SectionTitle>
            {tmpFijosCats.map((c, i) => (
              <div key={c.id} style={{ display: "flex", gap: 8, marginBottom: 8 }}>
                <input type="text" value={c.icon} onChange={e => { const n = [...tmpFijosCats]; n[i] = { ...n[i], icon: e.target.value }; setTmpFijosCats(n); }} style={{ ...inputStyle(th), width: 44, textAlign: "center", padding: "8px" }} />
                <input type="text" value={c.name} onChange={e => { const n = [...tmpFijosCats]; n[i] = { ...n[i], name: e.target.value }; setTmpFijosCats(n); }} style={{ ...inputStyle(th), flex: 1 }} />
                <button onClick={() => setTmpFijosCats(tmpFijosCats.filter((_, j) => j !== i))} style={{ background: "rgba(239,68,68,0.1)", border: "1px solid rgba(239,68,68,0.3)", borderRadius: 9, color: "#ef4444", cursor: "pointer", padding: "0 10px", fontSize: 18, height: 38 }}>×</button>
              </div>
            ))}
            <button onClick={() => setTmpFijosCats([...tmpFijosCats, { id: uid(), name: "Nueva categoría", icon: "📌" }])} style={{ width: "100%", padding: "8px", background: "transparent", border: `1px dashed ${th.border}`, borderRadius: 10, color: th.textMuted, cursor: "pointer", fontSize: 12 }}>+ Agregar categoría</button>
          </GCard>

          <button onClick={saveCfg} style={{ ...btnPrimary, marginBottom: 12 }}>✅ Guardar configuración</button>

          <GCard th={th} style={{ marginBottom: 12 }}>
            <SectionTitle th={th}>Backup & Restauración</SectionTitle>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8 }}>
              <button onClick={exportBackup} style={{ padding: "10px", background: "rgba(16,185,129,0.1)", border: "1px solid rgba(16,185,129,0.25)", borderRadius: 11, color: "#10B981", cursor: "pointer", fontSize: 13, fontWeight: 600 }}>📤 Exportar</button>
              <button onClick={() => setShowRestore(v => !v)} style={{ padding: "10px", background: "rgba(245,158,11,0.1)", border: "1px solid rgba(245,158,11,0.25)", borderRadius: 11, color: "#F59E0B", cursor: "pointer", fontSize: 13, fontWeight: 600 }}>📥 Importar</button>
            </div>
            {showRestore && <>
              <textarea placeholder="Pegá el JSON de backup aquí..." value={restoreText} onChange={e => setRestoreText(e.target.value)} rows={4} style={{ ...inputStyle(th), resize: "none", marginTop: 10 }} />
              <button onClick={importBackup} style={{ ...btnPrimary, marginTop: 8, background: "linear-gradient(135deg,#F59E0B,#d97706)" }}>✅ Restaurar</button>
            </>}
          </GCard>

          <div style={{ textAlign: "center", fontSize: 10, color: th.textDim, paddingBottom: 8 }}>
            {appName} v{APP_VERSION} · Firebase RTDB
          </div>
        </>}

      </div>

      {/* BOTTOM NAV */}
      <div style={{ position: "fixed", bottom: 0, left: 0, right: 0, background: th.navBg, borderTop: `1px solid ${th.border}`, display: "flex", alignItems: "center", zIndex: 200, backdropFilter: "blur(16px)" }}>
        <button onClick={() => setMainTab("ruteo")} style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", padding: "10px 0", flex: 1, border: "none", background: "none", cursor: "pointer", color: mainTab === "ruteo" ? th.accent : th.textMuted, borderTop: mainTab === "ruteo" ? `2px solid ${th.accent}` : "2px solid transparent" }}>
          <span style={{ fontSize: 20, marginBottom: 2 }}>🗺</span>
          <span style={{ fontSize: 10, fontWeight: mainTab === "ruteo" ? 700 : 400 }}>Ruteo</span>
        </button>
        {NAV_TABS.map(t => (
          <button key={t.id} onClick={() => { setMainTab(t.id); if (t.id === "ventas") setSubTab("caja"); if (t.id === "finanzas") setSubTab("dashboard"); }} style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", padding: "10px 0", flex: 1, border: "none", background: "none", cursor: "pointer", color: mainTab === t.id ? th.accent : th.textMuted, borderTop: mainTab === t.id ? `2px solid ${th.accent}` : "2px solid transparent" }}>
            <span style={{ fontSize: 20, marginBottom: 2 }}>{t.icon}</span>
            <span style={{ fontSize: 10, fontWeight: mainTab === t.id ? 700 : 400 }}>{t.label}</span>
          </button>
        ))}
      </div>
    </div>
  );
}

