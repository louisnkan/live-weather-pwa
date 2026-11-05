const CACHE_NAME = "atmos-weather-v1";

const APP_FILES = [
  "./",
  "./index.html",
  "./manifest.json",
  "./icon.png"
];

// INSTALL SERVICE WORKER
self.addEventListener("install", event => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => cache.addAll(APP_FILES))
      .then(() => self.skipWaiting())
  );
});

// ACTIVATE SERVICE WORKER
self.addEventListener("activate", event => {
  event.waitUntil(
    caches.keys().then(keys => {
      return Promise.all(
        keys
          .filter(key => key !== CACHE_NAME)
          .map(key => caches.delete(key))
      );
    }).then(() => self.clients.claim())
  );
});

// CACHE APPLICATION INTERFACE
self.addEventListener("fetch", event => {

  const request = event.request;
  const url = new URL(request.url);

  if (request.method !== "GET") return;

  // API requests always go to the network.
  if (
    url.hostname.includes("open-meteo.com") ||
    url.hostname.includes("nominatim.openstreetmap.org")
  ) {
    return;
  }

  // Only handle requests from this application.
  if (url.origin !== self.location.origin) return;

  event.respondWith(
    caches.match(request).then(cachedResponse => {

      const networkRequest = fetch(request).then(response => {

        if (response && response.ok) {
          const responseCopy = response.clone();

          caches.open(CACHE_NAME).then(cache => {
            cache.put(request, responseCopy);
          });
        }

        return response;

      });

      return cachedResponse || networkRequest;

    }).catch(() => {

      if (request.mode === "navigate") {
        return caches.match("./index.html");
      }

    })
  );

});
