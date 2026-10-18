// ─────────────────────────────────────────────────────────────────────────────
// EVENTOS — Cloud Functions
// Avisos push cuando otro celular registra una venta, se llena el aforo o se cierra un evento.
// FCM (Android/Chrome) + Web Push VAPID (iOS PWA). Mensajes "solo datos": los muestra el
// service worker (así no se duplican) y no se avisa al mismo celular que hizo la acción.
// ─────────────────────────────────────────────────────────────────────────────
const { onValueCreated, onValueUpdated } = require("firebase-functions/v2/database");
const { initializeApp } = require("firebase-admin/app");
const { getMessaging } = require("firebase-admin/messaging");
const { getDatabase } = require("firebase-admin/database");
const webpush = require("web-push");

initializeApp();

// Nombres de funciones: avisoNuevaVenta / avisoCierreEvento / avisoPrueba. Las viejas del negocio de
// agua (onNuevoPedido, onNuevaVenta, onCierreCaja) se borran en el deploy (workflow usa --force).
// TODO(seguridad): la clave privada está versionada en el repo. Rotala y pasala a un secreto
// (firebase functions:secrets:set VAPID_PRIVATE) cuando puedas. Ver informe del cambio.
const VAPID_PUBLIC = "BEybofpYcq0TJmFvivMha3SxZtPVi9444ydLc-NJssYYP8oE7F4l9BdmFEs_ir5vMN6u248S_FXlIY8hRekjOtM";
const VAPID_PRIVATE = process.env.VAPID_PRIVATE || "byWhX1FxiCkMlDmDL7q1Rr1OpeOViMr6Zqz99outd60";
webpush.setVapidDetails("mailto:barretwater@gmail.com", VAPID_PUBLIC, VAPID_PRIVATE);

const BASE = "barretwater";
const ROOT = `${BASE}/eventos_v1`;
const REGION = "us-central1";
const fmt = (n) => "$" + Math.round(Number(n) || 0).toLocaleString("es-AR");

// exclude = celular que originó la acción (no se le avisa); only = avisar solo a ese celular (prueba).
const pick = (device, exclude, only) => (!exclude || device !== exclude) && (!only || device === only);

async function fcmTargets(exclude, only) {
  const data = (await getDatabase().ref(`${BASE}/fcm_tokens`).once("value")).val() || {};
  return Object.entries(data)
    .map(([key, v]) => ({ key, token: typeof v === "string" ? v : v?.token, device: v?.device }))
    .filter((t) => t.token && pick(t.device, exclude, only));
}

async function iosTargets(exclude, only) {
  const data = (await getDatabase().ref(`${BASE}/ios_push_subs`).once("value")).val() || {};
  return Object.entries(data)
    .filter(([, v]) => v?.endpoint && v?.p256dh && v?.auth && pick(v.device, exclude, only))
    .map(([key, v]) => ({ key, ...v }));
}

async function sendFCM(title, body, exclude, only) {
  const targets = await fcmTargets(exclude, only);
  if (!targets.length) return;
  const res = await getMessaging().sendEachForMulticast({
    tokens: targets.map((t) => t.token),
    data: { title, body, url: "/" },
    android: { priority: "high" },
    webpush: { headers: { Urgency: "high", TTL: "86400" } },
  });
  console.log(`[FCM] enviados ${res.successCount}/${targets.length}`);
  const db = getDatabase();
  await Promise.all(res.responses.map((r, i) => {
    const code = r.error?.code;
    if (!r.success) console.warn("[FCM] fallo", code, r.error?.message);
    return !r.success && (code === "messaging/invalid-registration-token" || code === "messaging/registration-token-not-registered")
      ? db.ref(`${BASE}/fcm_tokens/${targets[i].key}`).remove() : null;
  }));
}

async function sendIOS(title, body, exclude, only) {
  const subs = await iosTargets(exclude, only);
  const db = getDatabase();
  const payload = JSON.stringify({ title, body, icon: "/icon-192.png" });
  await Promise.all(subs.map(async (sub) => {
    try {
      await webpush.sendNotification({ endpoint: sub.endpoint, keys: { p256dh: sub.p256dh, auth: sub.auth } }, payload);
    } catch (e) {
      console.warn("[iOS] fallo", e.statusCode, e.body || e.message);
      if (e.statusCode === 410 || e.statusCode === 404) await db.ref(`${BASE}/ios_push_subs/${sub.key}`).remove();
    }
  }));
}

const sendPush = (title, body, exclude, only) => Promise.allSettled([sendFCM(title, body, exclude, only), sendIOS(title, body, exclude, only)])
  .then((rs) => rs.forEach((r) => r.status === "rejected" && console.error("[push] error", r.reason)));

// Nueva venta de entradas (+ aviso único cuando se llena el aforo).
exports.avisoNuevaVenta = onValueCreated({ ref: `/${ROOT}/ventas/{eventoId}/{ventaId}`, region: REGION }, async (event) => {
  const v = event.data.val();
  if (!v || v.anulada) return;
  const db = getDatabase();
  const { eventoId, ventaId } = event.params;
  const ev = (await db.ref(`${ROOT}/eventos/${eventoId}`).once("value")).val();
  const nombre = ev?.nombre || "Evento";
  const cant = Number(v.cantidad) || 0;
  const monto = Number(v.total) > 0 ? ` — ${fmt(v.total)}` : " — cortesía";
  await sendPush(`🎟️ ${nombre}`, `${cant}× ${v.tierNombre || "entrada"}${monto}${v.vendedor ? ` (${v.vendedor})` : ""}`, v.por);

  const aforo = Number(ev?.aforo) || 0;
  if (aforo > 0) {
    const todas = Object.values((await db.ref(`${ROOT}/ventas/${eventoId}`).once("value")).val() || {}).filter((x) => x && !x.anulada);
    const total = todas.reduce((a, x) => a + (Number(x.cantidad) || 0), 0);
    if (total >= aforo && total - cant < aforo) await sendPush(`🔥 ${nombre}`, `¡Aforo completo! ${total}/${aforo} entradas vendidas`, null);
  }
  return ventaId;
});

// Cierre de evento.
exports.avisoCierreEvento = onValueUpdated({ ref: `/${ROOT}/eventos/{eventoId}`, region: REGION }, async (event) => {
  const antes = event.data.before.val();
  const despues = event.data.after.val();
  if (!despues || antes?.estado === despues.estado || despues.estado !== "cerrado") return;
  await sendPush("🔒 Evento cerrado", despues.nombre || "Evento", null);
});

// Prueba de avisos: el celular escribe /push_test/{id} con su deviceId y recibe un push solo él.
exports.avisoPrueba = onValueCreated({ ref: `/${BASE}/push_test/{id}`, region: REGION }, async (event) => {
  const v = event.data.val();
  await event.data.ref.remove().catch(() => {});
  if (!v?.device) return;
  await sendPush("✅ Prueba de avisos", "Si ves esto, los avisos remotos funcionan en este dispositivo", null, v.device);
});
