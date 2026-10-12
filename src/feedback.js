// Feedback de UI: vibración + sonidos con Web Audio (sin archivos de audio).
// Vibración: Android/PWA. iOS no soporta vibración, pero sí audio.
import { local } from "./utils";

let _ctx = null;
let _enabled = local.get("feedback", true) !== false;

function getCtx() {
  if (!_ctx) {
    const AC = window.AudioContext || window.webkitAudioContext;
    if (AC) _ctx = new AC();
  }
  // iOS/Chrome suspenden el audio hasta que hay un gesto del usuario.
  if (_ctx && _ctx.state === "suspended") _ctx.resume().catch(() => {});
  return _ctx;
}

function tone(freq, dur, type = "sine", vol = 0.07, delay = 0) {
  if (!_enabled) return;
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
  if (!_enabled) return;
  try { navigator.vibrate?.(pattern); } catch (_) {}
}

export const feedback = {
  isEnabled: () => _enabled,
  setEnabled(v) { _enabled = !!v; local.set("feedback", _enabled); },

  tap() { vib(6); tone(660, 0.055, "sine", 0.055); },
  success() { vib(10); tone(700, 0.07, "sine", 0.07); tone(900, 0.1, "sine", 0.065, 0.08); },
  error() { vib([25, 40, 25]); tone(320, 0.12, "triangle", 0.065); tone(240, 0.1, "triangle", 0.05, 0.13); },
  warning() { vib(18); tone(500, 0.09, "triangle", 0.06); tone(420, 0.09, "triangle", 0.05, 0.11); },
  // Venta registrada — triple tono ascendente
  cashier() { vib([8, 20, 8]); tone(660, 0.06, "sine", 0.07); tone(820, 0.06, "sine", 0.065, 0.07); tone(1000, 0.1, "sine", 0.06, 0.14); },
  // Persona que ingresa
  door() { vib(12); tone(520, 0.05, "square", 0.04); },
  // Persona que sale / corrección
  doorUndo() { vib([6, 20, 6]); tone(380, 0.07, "triangle", 0.05); },
  // Aforo completo
  full() { vib([60, 40, 60, 40, 120]); tone(880, 0.12, "sawtooth", 0.05); tone(660, 0.12, "sawtooth", 0.05, 0.14); tone(880, 0.2, "sawtooth", 0.05, 0.28); },
};
