const CACHE_NAME = "measurements-pwa-v7";

const ASSETS = [
  "./",
  "./index.html",
  "./styles.css",
  "./pdf-lib.min.js",
  "./app.js",
  "./manifest.json",
  "./service-worker.js"
  "./fontkit.umd.min.js",
  "./Roboto-Regular.ttf",
  "./Manasco.otf",

];

// Установка — кешируем файлы
self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll(ASSETS);
    })
  );
  self.skipWaiting();
});

// Активация — удаляем старые кеши
self.addEventListener("activate", (event) => {
  event.waitUntil(
    (async () => {
      const keys = await caches.keys();
      await Promise.all(
        keys.map((key) => {
          if (key !== CACHE_NAME) {
            return caches.delete(key);
          }
        })
      );
      await self.clients.claim();
    })()
  );
});

// Перехват запросов
self.addEventListener("fetch", (event) => {
  if (event.request.method !== "GET") return;

  event.respondWith(
    caches.match(event.request).then((cached) => {
      return (
        cached ||
        fetch(event.request).catch(() => {
          return new Response("Offline", {
            status: 503,
            statusText: "Offline",
          });
        })
      );
    })
  );
});
