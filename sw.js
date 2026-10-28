// ============================================
// SIMADES — Service Worker (PWA)
// Cache halaman & aset statis untuk akses offline dasar
// ============================================

const CACHE_NAME = 'simades-v1';
const ASSETS_TO_CACHE = [
  './',
  './index.html',
  './style.css',
  './app.js',
  './supabase.js',
  './manifest.json'
];

// Install: simpan aset ke cache
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll(ASSETS_TO_CACHE).catch((err) => {
        console.warn('[SW] Gagal cache beberapa aset:', err);
      });
    })
  );
  self.skipWaiting();
});

// Activate: hapus cache versi lama
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) => {
      return Promise.all(
        keys.map((key) => {
          if (key !== CACHE_NAME) {
            return caches.delete(key);
          }
        })
      );
    })
  );
  self.clients.claim();
});

// Fetch: strategi network-first, fallback ke cache
self.addEventListener('fetch', (event) => {
  // Jangan intercept request ke Supabase (selalu butuh data fresh)
  if (event.request.url.includes('supabase.co')) {
    return;
  }
  
  event.respondWith(
    fetch(event.request)
    .then((response) => {
      // Simpan versi terbaru ke cache
      const responseClone = response.clone();
      caches.open(CACHE_NAME).then((cache) => {
        cache.put(event.request, responseClone);
      });
      return response;
    })
    .catch(() => {
      // Offline: ambil dari cache
      return caches.match(event.request);
    })
  );
});