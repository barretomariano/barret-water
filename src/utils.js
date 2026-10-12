// Utilidades generales: formato, fechas (siempre hora Argentina), ids, CSV.

const TZ = "America/Argentina/Buenos_Aires";

export const fmt = (n) => "$" + Math.round(Number(n) || 0).toLocaleString("es-AR");
export const fmtNum = (n) => Math.round(Number(n) || 0).toLocaleString("es-AR");

export const uid = () =>
  typeof crypto !== "undefined" && crypto.randomUUID
    ? crypto.randomUUID().replace(/-/g, "").slice(0, 20)
    : `${Date.now().toString(36)}${Math.random().toString(36).slice(2, 10)}`;

// Convierte lo que escribe el usuario ("15.000", "$ 15000") en un entero de pesos.
export const parseMonto = (s) => {
  const digits = String(s ?? "").replace(/\D/g, "");
  return digits ? parseInt(digits, 10) : 0;
};
// Valor para mostrar dentro de un input de dinero.
export const montoInput = (n) => (n ? Math.round(n).toLocaleString("es-AR") : "");

export const toInt = (v, min = 0, max = 999999999) => {
  const n = Math.round(Number(v));
  if (!Number.isFinite(n)) return min;
  return Math.min(max, Math.max(min, n));
};

// Fecha de hoy en Argentina (YYYY-MM-DD), sin saltos de día por huso horario.
export const todayKey = () =>
  new Intl.DateTimeFormat("en-CA", { timeZone: TZ, year: "numeric", month: "2-digit", day: "2-digit" }).format(new Date());

// Argentina no usa horario de verano: -03:00 fijo.
const noon = (iso) => new Date(`${iso}T12:00:00-03:00`);

export const labelDate = (iso) =>
  iso ? noon(iso).toLocaleDateString("es-AR", { weekday: "short", day: "numeric", month: "short", timeZone: TZ }) : "";
export const labelDateLong = (iso) =>
  iso ? noon(iso).toLocaleDateString("es-AR", { weekday: "long", day: "numeric", month: "long", year: "numeric", timeZone: TZ }) : "";
export const diffDays = (a, b) => Math.round((noon(b) - noon(a)) / 86400000);

export const timeLabel = (ts) =>
  ts ? new Date(ts).toLocaleTimeString("es-AR", { hour: "2-digit", minute: "2-digit", hour12: false, timeZone: TZ }) : "";
export const hourOf = (ts) =>
  parseInt(new Intl.DateTimeFormat("en-GB", { hour: "2-digit", hour12: false, timeZone: TZ }).format(new Date(ts)), 10) % 24;
export const dateTimeLabel = (ts) =>
  ts
    ? new Date(ts).toLocaleString("es-AR", { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit", hour12: false, timeZone: TZ })
    : "";

// RTDB puede devolver objetos {id: item} o arrays; lo normalizamos a lista.
export const toList = (v) => {
  if (!v) return [];
  const arr = Array.isArray(v) ? v : Object.values(v);
  return arr.filter((x) => x !== null && x !== undefined);
};

// RTDB rechaza `undefined`: limpiamos recursivamente.
export const clean = (x) => {
  if (Array.isArray(x)) return x.filter((i) => i !== undefined).map(clean);
  if (x && typeof x === "object") {
    const o = {};
    for (const k of Object.keys(x)) if (x[k] !== undefined) o[k] = clean(x[k]);
    return o;
  }
  return x;
};

// ── CSV ─────────────────────────────────────────────────────────────────────
const csvCell = (v) => {
  let s = v === null || v === undefined ? "" : String(v);
  // Evita que Excel interprete texto como fórmula (inyección CSV).
  if (/^[=+\-@\t\r]/.test(s) && Number.isNaN(Number(s))) s = "'" + s;
  return /[",\n;]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
};
export const toCSV = (rows) => "\uFEFF" + rows.map((r) => r.map(csvCell).join(";")).join("\r\n");

export function downloadFile(filename, content, mime = "text/csv;charset=utf-8") {
  const blob = new Blob([content], { type: mime });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 1500);
}

export const slug = (s) =>
  String(s || "evento").toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "") || "evento";

// ── Preferencias del dispositivo (no se comparten entre celulares) ─────────
export const local = {
  get(k, d = null) {
    try { const v = localStorage.getItem(`ev:${k}`); return v === null ? d : JSON.parse(v); } catch { return d; }
  },
  set(k, v) { try { localStorage.setItem(`ev:${k}`, JSON.stringify(v)); } catch {} },
};
export const deviceId = () => {
  let id = local.get("deviceId");
  if (!id) { id = uid(); local.set("deviceId", id); }
  return id;
};
