// functions/index.js
// ─────────────────────────────────────────────────────────────────────────────
// BARRET WATER — Cloud Functions para notificaciones push FCM
// Deploy: firebase deploy --only functions
// ─────────────────────────────────────────────────────────────────────────────
const { onValueWritten } = require("firebase-functions/v2/database");
const { initializeApp }  = require("firebase-admin/app");
const { getMessaging }   = require("firebase-admin/messaging");
const { getDatabase }    = require("firebase-admin/database");
 
initializeApp();
 
// ── Helper: obtener todos los tokens FCM guardados ──
async function getTokens() {
  const db  = getDatabase();
  const snap = await db.ref("barretwater/fcm_tokens").once("value");
  const data = snap.val();
  if (!data) return [];
  return Object.values(data).filter(Boolean);
}
 
// ── Helper: enviar push a todos los dispositivos registrados ──
async function sendPush(title, body) {
  const tokens = await getTokens();
  if (!tokens.length) return;
 
  const messaging = getMessaging();
  const results = await messaging.sendEachForMulticast({
    tokens,
    notification: { title, body, imageUrl: "https://barretwater.firebaseapp.com/icon-192.png" },
    android: { priority: "high", notification: { sound: "default", channelId: "barret_water" } },
    apns:    { payload: { aps: { sound: "default", badge: 1 } } },
    webpush: { notification: { icon: "/icon-192.png", badge: "/icon-192.png", vibrate: [200, 100, 200] } },
  });
 
  // Limpiar tokens inválidos automáticamente
  const db = getDatabase();
  const toDelete = [];
  results.responses.forEach((resp, i) => {
    if (!resp.success && (
      resp.error?.code === "messaging/invalid-registration-token" ||
      resp.error?.code === "messaging/registration-token-not-registered"
    )) toDelete.push(tokens[i]);
  });
  if (toDelete.length) {
    const snap = await db.ref("barretwater/fcm_tokens").once("value");
    const all  = snap.val() || {};
    for (const [k, v] of Object.entries(all)) {
      if (toDelete.includes(v)) await db.ref(`barretwater/fcm_tokens/${k}`).remove();
    }
  }
}
 
// ── TRIGGER 1: Nuevo pedido ──
exports.onNuevoPedido = onValueWritten(
  { ref: "/barretwater/pedidos_v1", region: "us-central1" },
  async (event) => {
    const antes  = event.data.before.val();
    const despues = event.data.after.val();
    if (!despues) return;
 
    const arrAntes   = antes   ? Object.values(antes)   : [];
    const arrDespues = despues ? Object.values(despues) : [];
 
    // Detectar pedidos nuevos (que no existían antes)
    const nuevos = arrDespues.filter(p =>
      !p.entregado && !arrAntes.find(a => a.id === p.id)
    );
 
    for (const pedido of nuevos) {
      await sendPush("📦 Nuevo pedido", pedido.nombre || "Sin nombre");
    }
  }
);
 
// ── TRIGGER 2: Nueva venta (history actualizado) ──
exports.onNuevaVenta = onValueWritten(
  { ref: "/barretwater/history_v5", region: "us-central1" },
  async (event) => {
    const antes   = event.data.before.val();
    const despues = event.data.after.val();
    if (!despues) return;
 
    const diasAntes   = antes   ? Object.values(antes)   : [];
    const diasDespues = despues ? Object.values(despues) : [];
 
    // Buscar ventas nuevas en el día de hoy
    const hoy = new Date().toISOString().slice(0, 10);
    const diaAntes   = diasAntes.find(d => d.date === hoy);
    const diaDespues = diasDespues.find(d => d.date === hoy);
    if (!diaDespues?.ventas) return;
 
    const ventasAntes   = diaAntes?.ventas   ? Object.values(diaAntes.ventas)   : [];
    const ventasDespues = diaDespues.ventas  ? Object.values(diaDespues.ventas) : [];
 
    const nuevas = ventasDespues.filter(v =>
      v && !ventasAntes.find(a => a.id === v.id)
    );
 
    for (const venta of nuevas) {
      if (venta.nota?.startsWith("Cobro fiado")) continue; // no notificar cobros de fiado
      const items = [venta.u20 > 0 ? `${venta.u20}×20L` : "", venta.u12 > 0 ? `${venta.u12}×12L` : ""].filter(Boolean).join(" ");
      await sendPush("💰 Nueva venta", `${venta.nombre || ""}${items ? " — " + items : ""}`);
    }
  }
);
 
// ── TRIGGER 3: Cierre de caja ──
exports.onCierreCaja = onValueWritten(
  { ref: "/barretwater/history_v5", region: "us-central1" },
  async (event) => {
    const antes   = event.data.before.val();
    const despues = event.data.after.val();
    if (!despues) return;
 
    const diasAntes   = antes   ? Object.values(antes)   : [];
    const diasDespues = despues ? Object.values(despues) : [];
 
    const nuevoCierre = diasDespues.find(d =>
      d.cierreCaja && !diasAntes.find(a => a.date === d.date && a.cierreCaja)
    );
 
    if (nuevoCierre) {
      await sendPush("🔒 Caja cerrada", `Día ${nuevoCierre.date} cerrado correctamente`);
    }
  }
);
