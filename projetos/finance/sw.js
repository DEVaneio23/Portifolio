const CACHE_NAME = "financeiro-v1.7";
const urlsToCache = [
  "/",
  "/index.html",
  "/styles.css",
  "/script.js",
  "/manifest.json",
  "/vendor/jspdf.umd.min.js",
];

let offlineData = [];

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches
      .open(CACHE_NAME)
      .then((cache) =>
        Promise.allSettled(
          urlsToCache.map((url) => cache.add(url).catch(() => null))
        )
      )
      .then(() => self.skipWaiting())
  );
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    Promise.all([
      caches.keys().then((cacheNames) => {
        return Promise.all(
          cacheNames.map((cacheName) => {
            if (cacheName !== CACHE_NAME) {
              return caches.delete(cacheName);
            }
          })
        );
      }),
      self.clients.claim(),
    ])
  );
});

self.addEventListener("fetch", (event) => {
  const request = event.request;
  if (request.method !== "GET") return;

  const url = new URL(request.url);
  const isSameOrigin = url.origin === self.location.origin;

  if (!isSameOrigin) {
    const isCdnJsPdf =
      url.hostname.includes("cdnjs.cloudflare.com") &&
      url.pathname.includes("jspdf");

    if (isCdnJsPdf) {
      event.respondWith(
        fetch("/api/vendor/jspdf.js", { cache: "no-store" })
          .then((r) => r)
          .catch(() =>
            caches
              .match("/vendor/jspdf.umd.min.js", { ignoreSearch: true })
              .then((cached) => cached || fetch(request))
          )
      );
      return;
    }

    // Para demais terceiros, não interceptar: deixar o navegador lidar
    return;
  }

  // Para mesma origem: não reconstruir Request; buscar e atualizar cache quando possível
  event.respondWith(
    fetch(url.href, { cache: "no-store" })
      .then((response) => {
        if (response && response.status === 200) {
          const responseToCache = response.clone();
          caches.open(CACHE_NAME).then((cache) => {
            // Apenas cachear GET basic (mesma origem)
            if (responseToCache.type === "basic") {
              cache.put(request, responseToCache).catch(() => {});
            }
          });
        }
        return response;
      })
      .catch(() =>
        caches.match(request, { ignoreSearch: true }).then((cached) => {
          if (cached) return cached;
          if (request.url.includes("styles.css")) {
            return new Response("/* CSS Fallback */", {
              headers: {
                "Content-Type": "text/css",
                "Cache-Control": "no-cache, no-store, must-revalidate",
              },
            });
          }
          if (request.url.includes("script.js")) {
            return new Response("// JS Fallback", {
              headers: {
                "Content-Type": "application/javascript",
                "Cache-Control": "no-cache, no-store, must-revalidate",
              },
            });
          }
          return new Response("", { status: 504, statusText: "Offline" });
        })
      )
  );
});

self.addEventListener("sync", (event) => {
  if (event.tag === "background-sync") {
    event.waitUntil(doBackgroundSync());
  }
});

function doBackgroundSync() {
  return new Promise((resolve) => setTimeout(resolve, 2000));
}

self.addEventListener("message", (event) => {
  if (event.data && event.data.type === "STORE_OFFLINE_DATA") {
    offlineData.push(event.data.payload);
  }
  if (event.data && event.data.type === "SKIP_WAITING") {
    self.skipWaiting();
  }
});

self.addEventListener("push", (event) => {
  const options = {
    body: event.data ? event.data.text() : "Nova atualização disponível!",
    icon:
      "data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMTkyIiBoZWlnaHQ9IjE5MiIgdmlld0JveD0iMCAwIDE5MiAxOTIiIGZpbGw9Im5vbmUiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+CjxyZWN0IHdpZHRoPSIxOTIiIGhlaWdodD0iMTkyIiByeD0iMjQiIGZpbGw9InVybCgjZ3JhZGllbnQpIi8+CjxnIGZpbGw9IndoaXRlIj4KPHBhdGggZD0iTTk2IDQ4QzY5LjQ5IDQ4IDQ4IDY5LjQ5IDQ4IDk2czIxLjQ5IDQ4IDQ4IDQ4IDQ4LTIxLjQ5IDQ4LTQ4UzEyMi41MSA0OCA5NiA0OHptMCA4MGMtMTcuNjcgMC0zMi0xNC4zMy0zMi0zMnMxNC4zMy0zMiAzMi0zMiAzMiAxNC4zMyAzMiAzMi0xNC4zMyAzMi0zMiAzMnoiLz4KPHBhdGggZD0iTTE0NCA5Nkg0OGMtOC44NCAwLTE2IDcuMTYtMTYgMTZ2MzJjMCA4Ljg0IDcuMTYgMTYgMTYgMTZoOTZjOC44NCAwIDE2LTcuMTYgMTYtMTZ2LTMyYzAtOC44NC03LjE2LTE2LTE2LTE2eiIvPgo8L2c+CjxkZWZzPgo8bGluZWFyR3JhZGllbnQgaWQ9ImdyYWRpZW50IiB4MT0iMCIgeTE9IjAiIHgyPSIxIiB5Mj0iMSI+CjxzdG9wIG9mZnNldD0iMCUiIHN0b3AtY29sb3I9IiM2NjdlZWEiLz4KPHN0b3Agb2Zmc2V0PSIxMDAlIiBzdG9wLWNvbG9yPSIjNzY0YmEyIi8+CjwvbGluZWFyR3JhZGllbnQ+CjwvZGVmcz4KPC9zdmc+",
    badge:
      "data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMTkyIiBoZWlnaHQ9IjE5MiIgdmlld0JveD0iMCAwIDE5MiAxOTIiIGZpbGw9Im5vbmUiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+CjxyZWN0IHdpZHRoPSIxOTIiIGhlaWdodD0iMTkyIiByeD0iMjQiIGZpbGw9InVybCgjZ3JhZGllbnQpIi8+CjxnIGZpbGw9IndoaXRlIj4KPHBhdGggZD0iTTk2IDQ4QzY5LjQ5IDQ4IDQ4IDY5LjQ5IDQ4IDk2czIxLjQ5IDQ4IDQ4IDQ4IDQ4LTIxLjQ5IDQ4LTQ4UzEyMi41MSA0OCA5NiA0OHptMCA4MGMtMTcuNjcgMC0zMi0xNC4zMy0zMi0zMnMxNC4zMy0zMiAzMi0zMiAzMiAxNC4zMyAzMiAzMi0xNC4zMyAzMi0zMiAzMnoiLz4KPHBhdGggZD0iTTE0NCA5Nkg0OGMtOC44NCAwLTE2IDcuMTYtMTYgMTZ2MzJjMCA4Ljg0IDcuMTYgMTYgMTYgMTZoOTZjOC44NCAwIDE2LTcuMTYgMTYtMTZ2LTMyYzAtOC44NC03LjE2LTE2LTE2LTE2eiIvPgo8L2c+CjxkZWZzPgo8bGluZWFyR3JhZGllbnQgaWQ9ImdyYWRpZW50IiB4MT0iMCIgeTE9IjAiIHgyPSIxIiB5Mj0iMSI+CjxzdG9wIG9mZnNldD0iMCUiIHN0b3AtY29sb3I9IiM2NjdlZWEiLz4KPHN0b3Agb2Zmc2V0PSIxMDAlIiBzdG9wLWNvbG9yPSIjNzY0YmEyIi8+CjwvbGluZWFyR3JhZGllbnQ+CjwvZGVmcz4KPC9zdmc+",
    vibrate: [100, 50, 100],
    data: { dateOfArrival: Date.now(), primaryKey: 1 },
    actions: [
      {
        action: "explore",
        title: "Ver detalhes",
        icon:
          "data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMTkyIiBoZWlnaHQ9IjE5MiIgdmlld0JveD0iMCAwIDE5MiAxOTIiIGZpbGw9Im5vbmUiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+CjxyZWN0IHdpZHRoPSIxOTIiIGhlaWdodD0iMTkyIiByeD0iMjQiIGZpbGw9InVybCgjZ3JhZGllbnQpIi8+CjxnIGZpbGw9IndoaXRlIj4KPHBhdGggZD0iTTk2IDQ4QzY5LjQ5IDQ4IDQ4IDY5LjQ5IDQ4IDk2czIxLjQ5IDQ4IDQ4IDQ4IDQ4LTIxLjQ5IDQ4LTQ4UzEyMi41MSA0OCA5NiA0OHptMCA4MGMtMTcuNjcgMC0zMi0xNC4zMy0zMi0zMnMxNC4zMy0zMiAzMi0zMiAzMiAxNC4zMyAzMiAzMi0xNC4zMyAzMi0zMiAzMnoiLz4KPHBhdGggZD0iTTE0NCA5Nkg0OGMtOC44NCAwLTE2IDcuMTYtMTYgMTZ2MzJjMCA4Ljg0IDcuMTYgMTYgMTYgMTZoOTZjOC44NCAwIDE2LTcuMTYgMTYtMTZ2LTMyYzAtOC44NC03LjE2LTE2LTE2LTE2eiIvPgo8L2c+CjxkZWZzPgo8bGluZWFyR3JhZGllbnQgaWQ9ImdyYWRpZW50IiB4MT0iMCIgeTE9IjAiIHgyPSIxIiB5Mj0iMSI+CjxzdG9wIG9mZnNldD0iMCUiIHN0b3AtY29sb3I9IiM2NjdlZWEiLz4KPHN0b3Agb2Zmc2V0PSIxMDAlIiBzdG9wLWNvbG9yPSIjNzY0YmEyIi8+CjwvbGluZWFyR3JhZGllbnQ+CjwvZGVmcz4KPC9zdmc+",
      },
      {
        action: "close",
        title: "Fechar",
        icon:
          "data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMTkyIiBoZWlnaHQ9IjE5MiIgdmlld0JveD0iMCAwIDE5MiAxOTIiIGZpbGw9Im5vbmUiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+CjxyZWN0IHdpZHRoPSIxOTIiIGhlaWdodD0iMTkyIiByeD0iMjQiIGZpbGw9InVybCgjZ3JhZGllbnQpIi8+CjxnIGZpbGw9IndoaXRlIj4KPHBhdGggZD0iTTk2IDQ4QzY5LjQ5IDQ4IDQ4IDY5LjQ5IDQ4IDk2czIxLjQ5IDQ4IDQ4IDQ4IDQ4LTIxLjQ5IDQ4LTQ4UzEyMi41MSA0OCA5NiA0OHptMCA4MGMtMTcuNjcgMC0zMi0xNC4zMy0zMi0zMnMxNC4zMy0zMiAzMi0zMiAzMiAxNC4zMyAzMiAzMi0xNC4zMyAzMi0zMiAzMnoiLz4KPHBhdGggZD0iTTE0NCA5Nkg0OGMtOC44NCAwLTE2IDcuMTYtMTYgMTZ2MzJjMCA4Ljg0IDcuMTYgMTYgMTYgMTZoOTZjOC44NCAwIDE2LTcuMTYgMTYtMTZ2LTMyYzAtOC44NC03LjE2LTE2LTE2LTE2eiIvPgo8L2c+CjxkZWZzPgo8bGluZWFyR3JhZGllbnQgaWQ9ImdyYWRpZW50IiB4MT0iMCIgeTE9IjAiIHgyPSIxIiB5Mj0iMSI+CjxzdG9wIG9mZnNldD0iMCUiIHN0b3AtY29sb3I9IiM2NjdlZWEiLz4KPHN0b3Agb2Zmc2V0PSIxMDAlIiBzdG9wLWNvbG9yPSIjNzY0YmEyIi8+CjwvbGluZWFyR3JhZGllbnQ+CjwvZGVmcz4KPC9zdmc+",
      },
    ],
  };

  event.waitUntil(self.registration.showNotification("Dashboard Financeiro", options));
});

self.addEventListener("notificationclick", (event) => {
  event.notification.close();
  if (event.action === "explore") {
    event.waitUntil(clients.openWindow("/"));
  }
});
