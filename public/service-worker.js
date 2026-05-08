// ─────────────────────────────────────────────────────────────────────────────
// BARRET WATER — Service Worker con FCM Push Support
// ─────────────────────────────────────────────────────────────────────────────
importScripts("https://www.gstatic.com/firebasejs/10.12.0/firebase-app-compat.js");
importScripts("https://www.gstatic.com/firebasejs/10.12.0/firebase-messaging-compat.js");
 
// ── REEMPLAZÁ ESTOS VALORES con los de tu proyecto Firebase ──
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
 
// ── CACHE ──
const CACHE_NAME = "barret-water-v2";
const urlsToCache = ["/", "/index.html"];
 
self.addEventListener("install", event => {
  event.waitUntil(
    caches.open(CACHE_NAME).then(cache => cache.addAll(urlsToCache))
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
 
self.addEventListener("fetch", event => {
  event.respondWith(
    fetch(event.request).catch(() => caches.match(event.request))
  );
});
 
// ── PUSH CON APP CERRADA (background) ──
messaging.onBackgroundMessage(payload => {
  const { title, body, icon } = payload.notification || {};
  self.registration.showNotification(title || "Barret Water", {
    body:  body  || "",
    icon:  icon  || "/icon-192.png",
    badge: "/icon-192.png",
    vibrate: [200, 100, 200],
    data: payload.data || {},
  });
});
 
// ── CLICK EN LA NOTIFICACION → abre la app ──
self.addEventListener("notificationclick", event => {
  event.notification.close();
  event.waitUntil(
    clients.matchAll({ type: "window", includeUncontrolled: true }).then(clientList => {
      for (const client of clientList) {
        if (client.url.includes(self.location.origin) && "focus" in client)
          return client.focus();
      }
      return clients.openWindow("/");
    })
  );
});
 
