// Service Worker voor Rooster App PWA
// Versie: wordt bij elke build vervangen door scripts/generate-sw-version.js
const APP_VERSION = 'mtwrhczf';
const CACHE_NAME = `rooster-app-v${APP_VERSION}`;

// Alleen bestanden die voor iedereen hetzelfde zijn en geen persoonsgegevens
// bevatten. Paginaʼs staan hier bewust niet bij: die zijn per gebruiker anders
// en mogen niet uit de cache komen. Zie de toelichting bij het fetch-event.
const urlsToCache = [
  '/manifest.json',
  '/logo_200x200.png',
];

// Wat we tonen als een paginanavigatie mislukt doordat het netwerk wegvalt.
// Een gecachte HTML-pagina zou hier niet werken: die is per gebruiker anders,
// en de server stuurt bezoekers afhankelijk van hun sessie door, waardoor
// cache.put een omgeleid antwoord zou weigeren.
const OFFLINE_HTML = `<!DOCTYPE html>
<html lang="nl">
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <title>Geen verbinding - Rooster App</title>
    <style>
      body { font-family: system-ui, sans-serif; background: #eff6ff; color: #1e3a8a;
             display: flex; align-items: center; justify-content: center;
             min-height: 100vh; margin: 0; padding: 1.5rem; text-align: center; }
      h1 { font-size: 1.25rem; margin-bottom: 0.5rem; }
      p { font-size: 0.9rem; line-height: 1.5; }
    </style>
  </head>
  <body>
    <div>
      <h1>Geen verbinding</h1>
      <p>De rooster app heeft internet nodig.<br />Probeer het opnieuw zodra je weer verbinding hebt.</p>
    </div>
  </body>
</html>`;

function offlineResponse() {
  return new Response(OFFLINE_HTML, {
    status: 503,
    headers: { 'Content-Type': 'text/html; charset=utf-8' },
  });
}

// Install event - cache resources
self.addEventListener('install', (event) => {
  console.log('Service Worker: Installing version', APP_VERSION);
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => cache.addAll(urlsToCache))
      .catch((error) => {
        console.error('Service Worker: Cache failed', error);
      })
  );
  // Force activate nieuwe service worker direct
  self.skipWaiting();
});

// Activate event - clean up old caches
self.addEventListener('activate', (event) => {
  console.log('Service Worker: Activating version', APP_VERSION);
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cacheName) => {
          // Verwijder alle oude caches die niet de huidige versie zijn
          if (cacheName !== CACHE_NAME && cacheName.startsWith('rooster-app-')) {
            console.log('Service Worker: Deleting old cache', cacheName);
            return caches.delete(cacheName);
          }
        })
      );
    }).then(() => {
      // Claim alle clients direct (zodat nieuwe SW direct actief wordt)
      return self.clients.claim();
    })
  );
});

self.addEventListener('fetch', (event) => {
  const request = event.request;

  if (request.method !== 'GET') {
    return;
  }

  const url = new URL(request.url);

  // Alleen verzoeken aan onze eigen origin behandelen.
  if (url.origin !== self.location.origin) {
    return;
  }

  // API-antwoorden en auth-verzoeken nooit cachen: die zijn per gebruiker
  // verschillend en soms maar kort geldig.
  if (url.pathname.startsWith('/api/') || url.pathname.startsWith('/auth/')) {
    return;
  }

  // Paginanavigaties gaan altijd eerst naar het netwerk. Zouden we ze cachen,
  // dan zou een volgende gebruiker op hetzelfde toestel het rooster van zijn
  // voorganger kunnen zien, en zou een uitgelogde gebruiker nog een ingelogde
  // pagina te zien krijgen. De cache dient hier alleen als offline-vangnet.
  if (request.mode === 'navigate') {
    event.respondWith(fetch(request).catch(() => offlineResponse()));
    return;
  }

  // Statische bestanden mogen wel uit de cache komen, met een
  // netwerkverversing op de achtergrond zodat ze niet verouderen.
  event.respondWith(
    caches.match(request).then((cachedResponse) => {
      if (cachedResponse) {
        fetch(request)
          .then((networkResponse) => {
            if (networkResponse && networkResponse.status === 200) {
              const responseToCache = networkResponse.clone();
              caches.open(CACHE_NAME).then((cache) => {
                cache.put(request, responseToCache);
              });
            }
          })
          .catch(() => {
            // Netwerk niet beschikbaar, cache blijft bruikbaar.
          });

        return cachedResponse;
      }

      return fetch(request).then((response) => {
        if (!response || response.status !== 200 || response.type !== 'basic') {
          return response;
        }

        const responseToCache = response.clone();
        caches.open(CACHE_NAME).then((cache) => {
          cache.put(request, responseToCache);
        });

        return response;
      });
    })
  );
});

// Message event - handle messages from client
self.addEventListener('message', (event) => {
  if (event.data && event.data.type === 'SKIP_WAITING') {
    self.skipWaiting();
  }
  if (event.data && event.data.type === 'GET_VERSION') {
    event.ports[0].postMessage({ version: APP_VERSION });
  }
});
