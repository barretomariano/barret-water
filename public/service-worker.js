// ─────────────────────────────────────────────────────────────────────────────
// BARRET WATER — Service Worker v3
// PWA + FCM Push (app abierta Y cerrada)
// ─────────────────────────────────────────────────────────────────────────────
 
// ── WORKBOX MANIFEST INJECTION (obligatorio para CRA + react-app-rewired PWA)
// react-scripts inyecta automáticamente la lista de archivos a cachear aquí.
// SIN ESTA LÍNEA el build falla con "Can't find self.__WB_MANIFEST".
// eslint-disable-next-line no-restricted-globals
const WB_MANIFEST = self.__WB_MANIFEST;
 
// ─────────────────────────────────────────────────────────────────────────────
// FIREBASE (compat SDK — única versión que funciona en SW sin bundler)
// ─────────────────────────────────────────────────────────────────────────────
importScripts("https://www.gstatic.com/firebasejs/10.12.0/firebase-app-compat.js");
importScripts("https://www.gstatic.com/firebasejs/10.12.0/firebase-messaging-compat.js");
 
firebase.initializeApp({
  apiKey:            "AIzaSyAlxZ1FVhsfNEnYpamiQkQ9152rl65N-zQ",
  authDomain:        "barretwater.firebaseapp.com",
  databaseURL:       "https://barretwater-default-rtdb.firebaseio.com",
  projectId:         "barretwater",
  storageBucket:     "barretwater.firebasestorage.app",
  messagingSenderId: "268110919054",
  appId:             "1:268110919054:web:67018d89c9c8da0f11e0df",
});
 
const messaging = firebase.messaging();
 
// ─────────────────────────────────────────────────────────────────────────────
// CACHE — offline básico
// ─────────────────────────────────────────────────────────────────────────────
const CACHE_NAME = "barret-water-v3";
const PRECACHE   = ["/", "/index.html"];
 
// Usamos el manifest de Workbox si está disponible, o el mínimo manual
const urlsToCache = WB_MANIFEST
  ? [...PRECACHE, ...WB_MANIFEST.map(e => (typeof e === "string" ? e : e.url))]
  : PRECACHE;
 
self.addEventListener("install", event => {
  event.waitUntil(
    caches.open(CACHE_NAME).then(cache =>
      // addAll puede fallar si algún asset no existe todavía; ignoramos errores individuales
      Promise.allSettled(urlsToCache.map(url => cache.add(url).catch(() => {})))
    )
  );
  self.skipWaiting();
});
 
self.addEventListener("activate", event => {
  event.waitUntil(
    caches.keys().then(keys =>
      Promise.all(keys.filter(k => k !== CACHE_NAME).map(k => caches.delete(k)))
    )
  );
  self.clients.claim();
});
 
// Estrategia: Network-first → fallback a cache (así siempre ve datos frescos)
self.addEventListener("fetch", event => {
  // Solo interceptar GET, ignorar extensiones de Firebase
  if (event.request.method !== "GET") return;
  if (event.request.url.includes("firebaseio.com")) return;
  if (event.request.url.includes("googleapis.com")) return;
 
  event.respondWith(
    fetch(event.request)
      .then(response => {
        // Guardar copia en cache si es OK
        if (response && response.status === 200 && response.type === "basic") {
          const clone = response.clone();
          caches.open(CACHE_NAME).then(cache => cache.put(event.request, clone));
        }
        return response;
      })
      .catch(() => caches.match(event.request))
  );
});
 
// ─────────────────────────────────────────────────────────────────────────────
// FCM — NOTIFICACIONES CON APP CERRADA (background)
// ─────────────────────────────────────────────────────────────────────────────
// Este handler se activa SOLO cuando la app está cerrada o en segundo plano.
// Cuando está abierta, el handler en App.jsx (onMessage) toma el control.
messaging.onBackgroundMessage(payload => {
  console.log("[SW] Background message recibido:", payload);
 
  const notif    = payload.notification || {};
  const data     = payload.data || {};
  const title    = notif.title || data.title || "Barret Water 💧";
  const body     = notif.body  || data.body  || "";
  const icon     = notif.icon  || "/icon-192.png";
  const tag      = data.tag   || "barret-water-notif";
  const url      = data.url   || "/";
 
  return self.registration.showNotification(title, {
    body,
    icon,
    badge:   "/icon-192.png",
    tag,                        // agrupa notifs del mismo tipo (no stackea spam)
    renotify: true,
    vibrate: [200, 100, 200],
    data: { url, ...data },
  });
});
 
// ─────────────────────────────────────────────────────────────────────────────
// CLICK EN NOTIFICACIÓN → foca tab existente o abre nueva
// ─────────────────────────────────────────────────────────────────────────────
self.addEventListener("notificationclick", event => {
  event.notification.close();
  const targetUrl = (event.notification.data && event.notification.data.url) || "/";
 
  event.waitUntil(
    clients
      .matchAll({ type: "window", includeUncontrolled: true })
      .then(clientList => {
        // Si ya hay un tab de la app abierto, focarlo
        for (const client of clientList) {
          if (client.url.startsWith(self.location.origin) && "focus" in client) {
            return client.focus();
          }
        }
        // Si no, abrir uno nuevo
        return clients.openWindow(targetUrl);
      })
  );
});
 
// ─────────────────────────────────────────────────────────────────────────────
// MENSAJE DESDE LA APP → notificación mientras la app está abierta
// (postMessage desde App.jsx vía navigator.serviceWorker.controller.postMessage)
// ─────────────────────────────────────────────────────────────────────────────
self.addEventListener("message", event => {
  if (!event.data) return;
 
  if (event.data.type === "SHOW_NOTIFICATION") {
    const { title, body, icon, tag, url } = event.data;
    self.registration.showNotification(title || "Barret Water 💧", {
      body:    body   || "",
      icon:    icon   || "/icon-192.png",
      badge:   "/icon-192.png",
      tag:     tag    || "bw-foreground",
      renotify: true,
      vibrate: [100, 50, 100],
      data:    { url: url || "/" },
    });
  }
 
  if (event.data.type === "SKIP_WAITING") {
    self.skipWaiting();
  }
});
