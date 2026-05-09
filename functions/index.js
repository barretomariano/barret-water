// ─────────────────────────────────────────────────────────────────────────────
// BARRET WATER — Cloud Functions v2
// Deploy: firebase deploy --only functions
// ─────────────────────────────────────────────────────────────────────────────
const { onValueWritten } = require("firebase-functions/v2/database");
const { initializeApp }  = require("firebase-admin/app");
const { getMessaging }   = require("firebase-admin/messaging");
const { getDatabase }    = require("firebase-admin/database");

initializeApp();

// ── Helper: obtener todos los tokens FCM guardados ──────────────────────────
async function getTokens() {
  const db   = getDatabase();
  const snap = await db.ref("barretwater/fcm_tokens").once("value");
  const data = snap.val();
  if (!data) return [];
  // Los tokens se guardan como objetos { token, ts, ua } — extraer solo el string
  return Object.values(data)
    .map(v => (typeof v === "string" ? v : v?.token))
    .filter(Boolean);
}

// ── Helper: enviar push a todos los dispositivos ────────────────────────────
async function sendPush(title, body) {
  const tokens = await getTokens();
  if (!tokens.length) {
    console.log("[FCM] No hay tokens registrados");
    return;
  }

  const messaging = getMessaging();
  const results = await messaging.sendEachForMulticast({
    tokens,
    notification: {
      title,
      body,
      imageUrl: "https://barret-water.vercel.app/icon-192.png",
    },
    android: {
      priority: "high",
      notification: { sound: "default", channelId: "barret_water" },
    },
    apns: {
      payload: { aps: { sound: "default", badge: 1 } },
    },
    webpush: {
      notification: {
        icon:   "/icon-192.png",
        badge:  "/icon-192.png",
        vibrate: [200, 100, 200],
      },
    },
  });

  console.log(`[FCM] Enviado a ${tokens.length} dispositivos:`, title, body);

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
    console.log(`[FCM] Limpiando ${toDelete.length} tokens inválidos`);
    const snap = await db.ref("barretwater/fcm_tokens").once("value");
    const all  = snap.val() || {};
    for (const [k, v] of Object.entries(all)) {
      const t = typeof v === "string" ? v : v?.token;
      if (toDelete.includes(t)) await db.ref(`barretwater/fcm_tokens/${k}`).remove();
    }
  }
}

// ── TRIGGER 1: Nuevo pedido ─────────────────────────────────────────────────
exports.onNuevoPedido = onValueWritten(
  { ref: "/barretwater/pedidos_v1", region: "us-central1" },
  async (event) => {
    const antes   = event.data.before.val();
    const despues = event.data.after.val();
    if (!despues) return;

    const arrAntes   = antes   ? Object.values(antes)   : [];
    const arrDespues = despues ? Object.values(despues) : [];

    const nuevos = arrDespues.filter(p =>
      p && !p.entregado && !arrAntes.find(a => a.id === p.id)
    );

    for (const pedido of nuevos) {
      const bids = [
        pedido.bidones20 > 0 ? `${pedido.bidones20}×20L` : "",
        pedido.bidones12 > 0 ? `${pedido.bidones12}×12L` : "",
      ].filter(Boolean).join(" ");
      await sendPush(
        "📦 Nuevo pedido",
        `${pedido.nombre || "Cliente"}${bids ? " — " + bids : ""}`
      );
    }
  }
);

// ── TRIGGER 2: Nueva venta ──────────────────────────────────────────────────
exports.onNuevaVenta = onValueWritten(
  { ref: "/barretwater/history_v5", region: "us-central1" },
  async (event) => {
    const antes   = event.data.before.val();
    const despues = event.data.after.val();
    if (!despues) return;

    const diasAntes   = antes   ? Object.values(antes)   : [];
    const diasDespues = despues ? Object.values(despues) : [];

    const hoy        = new Date().toISOString().slice(0, 10);
    const diaAntes   = diasAntes.find(d => d.date === hoy);
    const diaDespues = diasDespues.find(d => d.date === hoy);
    if (!diaDespues?.ventas) return;

    const ventasAntes   = diaAntes?.ventas  ? Object.values(diaAntes.ventas)  : [];
    const ventasDespues = diaDespues.ventas ? Object.values(diaDespues.ventas): [];

    const nuevas = ventasDespues.filter(v =>
      v && !ventasAntes.find(a => a.id === v.id)
    );

    for (const venta of nuevas) {
      if (venta.nota?.startsWith("Cobro fiado")) continue;
      const items = [
        venta.u20 > 0 ? `${venta.u20}×20L` : "",
        venta.u12 > 0 ? `${venta.u12}×12L` : "",
      ].filter(Boolean).join(" ");
      await sendPush(
        "💰 Nueva venta",
        `${venta.nombre || ""}${items ? " — " + items : ""} | $${venta.total || 0}`
      );
    }
  }
);

// ── TRIGGER 3: Cierre de caja ───────────────────────────────────────────────
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
      await sendPush(
        "🔒 Caja cerrada",
        `Día ${nuevoCierre.date} — $${nuevoCierre.totalDia || 0} total`
      );
    }
  }
);

