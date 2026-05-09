// ─────────────────────────────────────────────────────────────────────────────
// BARRET WATER — Cloud Functions v3
// FCM (Android/Chrome) + Web Push VAPID nativo (iOS PWA)
// ─────────────────────────────────────────────────────────────────────────────
const { onValueWritten } = require("firebase-functions/v2/database");
const { initializeApp }  = require("firebase-admin/app");
const { getMessaging }   = require("firebase-admin/messaging");
const { getDatabase }    = require("firebase-admin/database");
const webpush            = require("web-push");

initializeApp();

const VAPID_PUBLIC  = "BEybofpYcq0TJmFvivMha3SxZtPVi9444ydLc-NJssYYP8oE7F4l9BdmFEs_ir5vMN6u248S_FXlIY8hRekjOtM";
const VAPID_PRIVATE = "byWhX1FxiCkMlDmDL7q1Rr1OpeOViMr6Zqz99outd60";

webpush.setVapidDetails("mailto:barretwater@gmail.com", VAPID_PUBLIC, VAPID_PRIVATE);

async function getFCMTokens() {
  const snap = await getDatabase().ref("barretwater/fcm_tokens").once("value");
  const data = snap.val();
  if (!data) return [];
  return Object.values(data).map(v => (typeof v === "string" ? v : v?.token)).filter(Boolean);
}

async function getIOSSubs() {
  const snap = await getDatabase().ref("barretwater/ios_push_subs").once("value");
  const data = snap.val();
  if (!data) return [];
  return Object.entries(data).filter(([,v]) => v?.endpoint && v?.p256dh && v?.auth).map(([k,v]) => ({key:k,...v}));
}

async function sendFCM(title, body) {
  const tokens = await getFCMTokens();
  if (!tokens.length) return;
  const results = await getMessaging().sendEachForMulticast({
    tokens,
    notification: { title, body, imageUrl: "https://barret-water.vercel.app/icon-192.png" },
    android:  { priority: "high", notification: { sound: "default", channelId: "barret_water" } },
    apns:     { payload: { aps: { sound: "default", badge: 1 } } },
    webpush:  { notification: { icon: "/icon-192.png", badge: "/icon-192.png", vibrate: [200,100,200] } },
  });
  const db = getDatabase();
  const toDelete = [];
  results.responses.forEach((r,i) => {
    if (!r.success && (r.error?.code === "messaging/invalid-registration-token" || r.error?.code === "messaging/registration-token-not-registered"))
      toDelete.push(tokens[i]);
  });
  if (toDelete.length) {
    const snap = await db.ref("barretwater/fcm_tokens").once("value");
    for (const [k,v] of Object.entries(snap.val()||{})) {
      const t = typeof v === "string" ? v : v?.token;
      if (toDelete.includes(t)) await db.ref(`barretwater/fcm_tokens/${k}`).remove();
    }
  }
}

async function sendIOS(title, body) {
  if (!VAPID_PRIVATE) { console.warn("[iOS] VAPID_PRIVATE_KEY no configurada"); return; }
  const subs = await getIOSSubs();
  if (!subs.length) return;
  const db = getDatabase();
  const payload = JSON.stringify({ title, body, icon: "/icon-192.png" });
  for (const sub of subs) {
    try {
      await webpush.sendNotification({ endpoint: sub.endpoint, keys: { p256dh: sub.p256dh, auth: sub.auth } }, payload);
    } catch (e) {
      if (e.statusCode === 410 || e.statusCode === 404)
        await db.ref(`barretwater/ios_push_subs/${sub.key}`).remove();
    }
  }
}

async function sendPush(title, body) {
  await Promise.allSettled([sendFCM(title, body), sendIOS(title, body)]);
}

exports.onNuevoPedido = onValueWritten({ ref: "/barretwater/pedidos_v1", region: "us-central1" }, async (event) => {
  const antes = event.data.before.val();
  const despues = event.data.after.val();
  if (!despues) return;
  const arrAntes = antes ? Object.values(antes) : [];
  const arrDespues = Object.values(despues);
  for (const p of arrDespues.filter(p => p && !p.entregado && !arrAntes.find(a => a.id === p.id))) {
    const bids = [p.bidones20>0?`${p.bidones20}×20L`:"", p.bidones12>0?`${p.bidones12}×12L`:""].filter(Boolean).join(" ");
    await sendPush("📦 Nuevo pedido", `${p.nombre||"Cliente"}${bids?" — "+bids:""}`);
  }
});

exports.onNuevaVenta = onValueWritten({ ref: "/barretwater/history_v5", region: "us-central1" }, async (event) => {
  const antes = event.data.before.val();
  const despues = event.data.after.val();
  if (!despues) return;
  const hoy = new Date().toISOString().slice(0,10);
  const dA = (antes ? Object.values(antes) : []).find(d => d.date === hoy);
  const dD = Object.values(despues).find(d => d.date === hoy);
  if (!dD?.ventas) return;
  const vA = dA?.ventas ? Object.values(dA.ventas) : [];
  const vD = Object.values(dD.ventas);
  for (const v of vD.filter(v => v && !vA.find(a => a.id === v.id))) {
    if (v.nota?.startsWith("Cobro fiado")) continue;
    const items = [v.u20>0?`${v.u20}×20L`:"", v.u12>0?`${v.u12}×12L`:""].filter(Boolean).join(" ");
    await sendPush("💰 Nueva venta", `${v.nombre||""}${items?" — "+items:""} | $${v.total||0}`);
  }
});

exports.onCierreCaja = onValueWritten({ ref: "/barretwater/history_v5", region: "us-central1" }, async (event) => {
  const antes = event.data.before.val();
  const despues = event.data.after.val();
  if (!despues) return;
  const dA = antes ? Object.values(antes) : [];
  const dD = Object.values(despues);
  const cierre = dD.find(d => d.cierreCaja && !dA.find(a => a.date === d.date && a.cierreCaja));
  if (cierre) await sendPush("🔒 Caja cerrada", `Día ${cierre.date} — $${cierre.totalDia||0} total`);
});
