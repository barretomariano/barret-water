// Notificaciones push: FCM (Android/Chrome) + Web Push VAPID (iOS PWA).
// Se activan SOLO con un toque del usuario (iOS exige un gesto para pedir permiso).
import { ref, set, get, remove } from "firebase/database";
import { getMessaging, getToken, isSupported, onMessage } from "firebase/messaging";
import { app, db, BASE } from "./firebase";
import { deviceId, local, uid } from "./utils";

// Clave pública VAPID (la privada vive en las Cloud Functions).
const VAPID_PUBLIC = "BEybofpYcq0TJmFvivMha3SxZtPVi9444ydLc-NJssYYP8oE7F4l9BdmFEs_ir5vMN6u248S_FXlIY8hRekjOtM";
const SW_URL = "/firebase-messaging-sw.js";

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

const withTimeout = (p, ms, msg) =>
  Promise.race([p, new Promise((_, rej) => setTimeout(() => rej(new Error(msg)), ms))]);

// Registra (idempotente) el service worker y espera a que esté activo.
// Antes se usaba solo serviceWorker.ready, que se cuelga para siempre si el registro falló.
async function getRegistration() {
  const reg = await navigator.serviceWorker.register(SW_URL);
  if (reg.active) return reg;
  return withTimeout(navigator.serviceWorker.ready, 10000, "El service worker no se activó. Recargá la app e intentá de nuevo.");
}

// Borra registros viejos del MISMO dispositivo (el token rota) para no mandar avisos duplicados.
async function pruneOld(path, keepKey) {
  try {
    const all = (await get(ref(db, `${BASE}/${path}`))).val() || {};
    await Promise.all(Object.entries(all)
      .filter(([k, v]) => k !== keepKey && v?.device === deviceId())
      .map(([k]) => remove(ref(db, `${BASE}/${path}/${k}`))));
  } catch { /* limpieza best-effort */ }
}

async function registerFCM(reg) {
  if (!(await isSupported())) throw new Error("Este navegador no soporta avisos push (FCM)");
  const messaging = getMessaging(app);
  const token = await getToken(messaging, { vapidKey: VAPID_PUBLIC, serviceWorkerRegistration: reg });
  if (!token) throw new Error("No se obtuvo el token de avisos");
  const key = tokenKey(token);
  await set(ref(db, `${BASE}/fcm_tokens/${key}`), {
    token, ts: Date.now(), device: deviceId(), ua: navigator.userAgent.slice(0, 80),
  });
  await pruneOld("fcm_tokens", key);
}

const b64ToBytes = (b64url) => {
  const b64 = b64url.replace(/-/g, "+").replace(/_/g, "/");
  return Uint8Array.from(atob(b64), (c) => c.charCodeAt(0));
};

async function registerIOS(reg) {
  const opts = { userVisibleOnly: true, applicationServerKey: b64ToBytes(VAPID_PUBLIC) };
  let sub;
  try {
    sub = await reg.pushManager.subscribe(opts);
  } catch (e) {
    // Suscripción previa hecha con otra clave: hay que darla de baja y volver a suscribir.
    const old = await reg.pushManager.getSubscription();
    if (!old) throw e;
    await old.unsubscribe();
    sub = await reg.pushManager.subscribe(opts);
  }
  const j = sub.toJSON();
  if (!j.endpoint || !j.keys?.p256dh || !j.keys?.auth) throw new Error("Suscripción iOS incompleta");
  const key = tokenKey(j.endpoint);
  await set(ref(db, `${BASE}/ios_push_subs/${key}`), {
    endpoint: j.endpoint, p256dh: j.keys.p256dh, auth: j.keys.auth,
    ts: Date.now(), device: deviceId(), ua: navigator.userAgent.slice(0, 80),
  });
  await pruneOld("ios_push_subs", key);
}

const register = (reg) => (isIOS() ? registerIOS(reg) : registerFCM(reg));

export async function enableNotifications() {
  if (!("Notification" in window) || !("serviceWorker" in navigator)) return { ok: false, reason: "unsupported" };
  if (isIOS() && !isPWA()) return { ok: false, reason: "ios-install" };
  try {
    // Lo primero es pedir permiso: iOS exige que ocurra dentro del gesto del usuario.
    const perm = Notification.permission === "granted" ? "granted" : await Notification.requestPermission();
    if (perm !== "granted") return { ok: false, reason: "denied" };
    const reg = await getRegistration();
    await register(reg);
    local.set("notif", true);
    return { ok: true };
  } catch (e) {
    console.warn("[push]", e);
    return { ok: false, reason: "error", message: e?.message };
  }
}

// Al abrir la app: si los avisos figuran activados, se renueva el token/suscripción en la base.
// Así se repara solo cuando el token rotó, el servidor lo dio de baja o se borró la base.
export async function refreshNotifications() {
  if (notifStatus() !== "on" || !("serviceWorker" in navigator)) return;
  try {
    await register(await getRegistration());
  } catch (e) {
    console.warn("[push] refresh", e);
  }
}

// Prueba en dos pasos: aviso local (confirma que el dispositivo puede mostrarlos) y
// aviso remoto (pasa por la Cloud Function: confirma el camino servidor → celular).
export async function testNotifications() {
  try {
    const reg = await getRegistration();
    await reg.showNotification("Eventos 🎟️", {
      body: "Prueba local: este dispositivo muestra avisos ✅", icon: "/icon-192.png", badge: "/icon-192.png", tag: "ev-test-local",
    });
    await set(ref(db, `${BASE}/push_test/${uid()}`), { device: deviceId(), ts: Date.now() });
    return { ok: true };
  } catch (e) {
    console.warn("[push] test", e);
    return { ok: false, message: e?.message };
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
