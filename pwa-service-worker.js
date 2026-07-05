// 0e3773f-1783237819741 is replaced at build time (see vite.config.js) so every deploy gets a
// unique cache name and the SW auto-updates / purges old caches. In dev the placeholder
// stays literal, which is a perfectly valid constant string.
const CACHE_NAME = 'daggerheart-gm-0e3773f-1783237819741'

// Minimal precache: just the shell entry. Hashed assets are cached opportunistically
// on first fetch (their names change every build, so they can't be listed statically).
const PRECACHE_URLS = ['./', './index.html']

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      // Individual puts so one failure can't abort the whole precache (addAll is atomic).
      .then((cache) => Promise.allSettled(PRECACHE_URLS.map((url) => cache.add(url))))
      .then(() => self.skipWaiting())
  )
})

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys()
      .then((names) => Promise.all(names.filter((n) => n !== CACHE_NAME).map((n) => caches.delete(n))))
      .then(() => self.clients.claim())
  )
})

self.addEventListener('fetch', (event) => {
  const { request } = event
  if (request.method !== 'GET') return
  if (!request.url.startsWith(self.location.origin)) return

  // Navigation / HTML: network-first so a fresh index.html (and its meta/script tags)
  // always wins when online; fall back to cache only when offline.
  const isHTML = request.mode === 'navigate' ||
    (request.headers.get('accept') || '').includes('text/html')

  if (isHTML) {
    event.respondWith(
      fetch(request)
        .then((response) => {
          const copy = response.clone()
          caches.open(CACHE_NAME).then((cache) => cache.put(request, copy))
          return response
        })
        .catch(() => caches.match(request).then((c) => c || caches.match('./index.html')))
    )
    return
  }

  // Everything else (hashed assets, data): cache-first, populate on miss.
  event.respondWith(
    caches.match(request).then((cached) => {
      if (cached) return cached
      return fetch(request).then((response) => {
        if (response && response.status === 200 && response.type === 'basic') {
          const copy = response.clone()
          caches.open(CACHE_NAME).then((cache) => cache.put(request, copy))
        }
        return response
      })
    })
  )
})

self.addEventListener('message', (event) => {
  if (event.data && event.data.type === 'SKIP_WAITING') {
    self.skipWaiting()
  }
})
