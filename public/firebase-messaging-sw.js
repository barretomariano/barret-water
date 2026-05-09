// ─────────────────────────────────────────────────────────────────────────────
// BARRET WATER — firebase-messaging-sw.js v4
// FCM (Android/Chrome) + Web Push nativo (iOS PWA)
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

// ── CACHE offline básico ───────────────────────────────────────────────────────
const CACHE_NAME = "barret-water-v4";
const PRECACHE   = ["/", "/index.html"];

self.addEventListener("install", event => {
  event.waitUntil(
    caches.open(CACHE_NAME).then(cache =>
      Promise.allSettled(PRECACHE.map(url => cache.add(url).catch(() => {})))
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

// Network-first, fallback a cache
self.addEventListener("fetch", event => {
  if (event.request.method !== "GET") return;
  if (event.request.url.includes("firebaseio.com")) return;
  if (event.request.url.includes("googleapis.com")) return;
  event.respondWith(
    fetch(event.request)
      .then(response => {
        if (response && response.status === 200 && response.type === "basic") {
          const clone = response.clone();
          caches.open(CACHE_NAME).then(cache => cache.put(event.request, clone));
        }
        return response;
      })
      .catch(() => caches.match(event.request))
  );
});

// ── Web Push nativo (iOS PWA) ──────────────────────────────────────────────────
// iOS no usa FCM — recibe los pushes por el evento estándar "push".
// El payload viene como JSON: { title, body, icon }
self.addEventListener("push", event => {
  if (!event.data) return;
  let data = {};
  try { data = event.data.json(); } catch { data = { title: event.data.text() }; }

  const title = data.title || "Barret Water 💧";
  const body  = data.body  || "";

  event.waitUntil(
    self.registration.showNotification(title, {
      body,
      icon:     data.icon || "/icon-192.png",
      badge:    "/icon-192.png",
      tag:      "bw-ios-push",
      renotify: true,
      vibrate:  [200, 100, 200],
      data:     { url: data.url || "/" },
    })
  );
});

// ── FCM background (Android/Chrome — app cerrada) ─────────────────────────────
messaging.onBackgroundMessage(payload => {
  const notif = payload.notification || {};
  const data  = payload.data || {};
  const title = notif.title || data.title || "Barret Water 💧";
  const body  = notif.body  || data.body  || "";

  self.registration.showNotification(title, {
    body,
    icon:     notif.icon || "/icon-192.png",
    badge:    "/icon-192.png",
    tag:      "bw-notif",
    renotify: true,
    vibrate:  [200, 100, 200],
    data:     { url: data.url || "/" },
  });
});

// ── Click en notificación → foca o abre la app ────────────────────────────────
self.addEventListener("notificationclick", event => {
  event.notification.close();
  const url = (event.notification.data && event.notification.data.url) || "/";
  event.waitUntil(
    clients.matchAll({ type: "window", includeUncontrolled: true }).then(list => {
      for (const client of list) {
        if (client.url.startsWith(self.location.origin) && "focus" in client)
          return client.focus();
      }
      return clients.openWindow(url);
    })
  );
});

// ── Notificaciones desde la app abierta (postMessage) ─────────────────────────
self.addEventListener("message", event => {
  if (!event.data) return;
  if (event.data.type === "SHOW_NOTIFICATION") {
    const { title, body, icon, tag, url } = event.data;
    self.registration.showNotification(title || "Barret Water 💧", {
      body:     body || "",
      icon:     icon || "/icon-192.png",
      badge:    "/icon-192.png",
      tag:      tag  || "bw-foreground",
      renotify: true,
      vibrate:  [100, 50, 100],
      data:     { url: url || "/" },
    });
  }
  if (event.data.type === "SKIP_WAITING") self.skipWaiting();
});
