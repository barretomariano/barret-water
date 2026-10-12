// Notificaciones push: FCM (Android/Chrome) + Web Push VAPID (iOS PWA).
// Se activan SOLO con un toque del usuario (iOS exige un gesto para pedir permiso).
import { ref, set } from "firebase/database";
import { getMessaging, getToken, isSupported, onMessage } from "firebase/messaging";
import { app, db, BASE } from "./firebase";
import { deviceId, local } from "./utils";

// Clave pública VAPID (la privada vive en las Cloud Functions).
const VAPID_PUBLIC = "BEybofpYcq0TJmFvivMha3SxZtPVi9444ydLc-NJssYYP8oE7F4l9BdmFEs_ir5vMN6u248S_FXlIY8hRekjOtM";

export const isIOS = () =>
  (/iPad|iPhone|iPod/.test(navigator.userAgent) && !window.MSStream) ||
  (navigator.platform === "MacIntel" && navigator.maxTouchPoints > 1);
export const isPWA = () =>
  window.matchMedia("(display-mode: standalone)").matches || window.navigator.standalone === true;

export const notifStatus = () => {
  if (!("Notification" in window)) return "unsupported";
  if (Notification.permission === "denied") return "denied";
  return Notification.permission === "granted" && local.get("notif") ? "on" : "off";
};

const tokenKey = (s) => String(s).replace(/[^a-zA-Z0-9]/g, "").slice(-30);

async function registerFCM(reg) {
  if (!(await isSupported())) throw new Error("FCM no soportado en este navegador");
  const messaging = getMessaging(app);
  const token = await getToken(messaging, { vapidKey: VAPID_PUBLIC, serviceWorkerRegistration: reg });
  if (!token) throw new Error("No se obtuvo token");
  await set(ref(db, `${BASE}/fcm_tokens/${tokenKey(token)}`), {
    token, ts: Date.now(), device: deviceId(), ua: navigator.userAgent.slice(0, 80),
  });
}

async function registerIOS(reg) {
  const b64 = VAPID_PUBLIC.replace(/-/g, "+").replace(/_/g, "/");
  const key = Uint8Array.from(atob(b64), (c) => c.charCodeAt(0));
  const sub = await reg.pushManager.subscribe({ userVisibleOnly: true, applicationServerKey: key });
  const j = sub.toJSON();
  await set(ref(db, `${BASE}/ios_push_subs/${tokenKey(j.endpoint)}`), {
    endpoint: j.endpoint, p256dh: j.keys?.p256dh, auth: j.keys?.auth,
    ts: Date.now(), device: deviceId(), ua: navigator.userAgent.slice(0, 80),
  });
}

export async function enableNotifications() {
  if (!("Notification" in window) || !("serviceWorker" in navigator)) return { ok: false, reason: "unsupported" };
  if (isIOS() && !isPWA()) return { ok: false, reason: "ios-install" };
  try {
    const perm = Notification.permission === "granted" ? "granted" : await Notification.requestPermission();
    if (perm !== "granted") return { ok: false, reason: "denied" };
    const reg = await navigator.serviceWorker.ready;
    if (isIOS()) await registerIOS(reg); else await registerFCM(reg);
    local.set("notif", true);
    return { ok: true };
  } catch (e) {
    console.warn("[push]", e);
    return { ok: false, reason: "error", message: e?.message };
  }
}

// Mensajes que llegan con la app abierta: los muestra la propia app (toast), no el sistema.
export async function listenForeground(cb) {
  try {
    if (!(await isSupported())) return () => {};
    return onMessage(getMessaging(app), (payload) => {
      const d = payload.data || {};
      const n = payload.notification || {};
      cb(n.title || d.title || "", n.body || d.body || "");
    });
  } catch {
    return () => {};
  }
}
