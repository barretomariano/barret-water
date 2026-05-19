// UI Feedback: vibración + sonidos Web Audio API
// Funciona sin archivos de audio. Vibración disponible en Android/PWA.
// En iOS la vibración no está soportada pero el audio sí.

let _ctx = null;
function getCtx() {
  if (!_ctx) {
    const AC = window.AudioContext || window.webkitAudioContext;
    if (AC) _ctx = new AC();
  }
  return _ctx;
}

function tone(freq, dur, type = "sine", vol = 0.07, delay = 0) {
  try {
    const ctx = getCtx();
    if (!ctx) return;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.type = type;
    osc.frequency.setValueAtTime(freq, ctx.currentTime + delay);
    gain.gain.setValueAtTime(0, ctx.currentTime + delay);
    gain.gain.linearRampToValueAtTime(vol, ctx.currentTime + delay + 0.01);
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + delay + dur);
    osc.start(ctx.currentTime + delay);
    osc.stop(ctx.currentTime + delay + dur + 0.02);
  } catch (_) {}
}

function vib(pattern) {
  try { navigator.vibrate?.(pattern); } catch (_) {}
}

export const feedback = {
  // Tap suave — navegación, checkboxes
  tap() {
    vib(6);
    tone(660, 0.055, "sine", 0.055);
  },

  // Éxito — confirmación, guardado
  success() {
    vib(10);
    tone(700, 0.07, "sine", 0.07);
    tone(900, 0.1, "sine", 0.065, 0.08);
  },

  // Error / eliminación
  error() {
    vib([25, 40, 25]);
    tone(320, 0.12, "triangle", 0.065);
    tone(240, 0.1, "triangle", 0.05, 0.13);
  },

  // Advertencia
  warning() {
    vib(18);
    tone(500, 0.09, "triangle", 0.06);
    tone(420, 0.09, "triangle", 0.05, 0.11);
  },

  // Registro de venta / caja — triple tono ascendente
  cashier() {
    vib([8, 20, 8]);
    tone(660, 0.06, "sine", 0.07);
    tone(820, 0.06, "sine", 0.065, 0.07);
    tone(1000, 0.1, "sine", 0.06, 0.14);
  },

  // Entrega de pedido
  delivery() {
    vib([10, 15, 10]);
    tone(750, 0.08, "sine", 0.065);
    tone(950, 0.12, "sine", 0.06, 0.09);
  },
};
