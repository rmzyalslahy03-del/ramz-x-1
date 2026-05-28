// ==================== sw.js - Ramz-X PWA ====================
const CACHE_NAME = 'ramz-x-v2';
const ASSETS_TO_CACHE = [
  '/',
  '/index.html',
  '/home.html',
  '/inbox.html',
  '/explore.html',
  '/search.html',
  '/profile.html',
  '/public-profile.html',
  '/auth.html',
  '/create-post.html',
  '/group-chat.html',
  '/hashtag.html',
  '/common.js',
  '/notifications.js',
  '/notifications.css',
  '/audio-notifications.js',
  '/realtime-messaging.js',
  '/manifest.json',
  'https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.0.0-beta3/css/all.min.css',
  'https://fonts.googleapis.com/css2?family=Cairo:wght@400;500;600;700;800&display=swap',
  'https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2',
];

// ========== التثبيت ==========
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      console.log('✅ Service Worker: تثبيت الأصول');
      return cache.addAll(ASSETS_TO_CACHE);
    })
  );
  self.skipWaiting();
});

// ========== التفعيل ==========
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames
          .filter((name) => name !== CACHE_NAME)
          .map((name) => caches.delete(name))
      );
    })
  );
  self.clients.claim();
  console.log('✅ Service Worker: مُفعَّل');
});

// ========== الجلب (استراتيجية Cache First + Network Fallback) ==========
self.addEventListener('fetch', (event) => {
  // تجاهل طلبات Supabase API
  if (event.request.url.includes('supabase.co')) {
    return;
  }

  event.respondWith(
    caches.match(event.request).then((cachedResponse) => {
      if (cachedResponse) {
        return cachedResponse;
      }
      return fetch(event.request)
        .then((response) => {
          // تخزين الطلبات الناجحة فقط
          if (response.status === 200 && event.request.method === 'GET') {
            const responseClone = response.clone();
            caches.open(CACHE_NAME).then((cache) => {
              cache.put(event.request, responseClone);
            });
          }
          return response;
        })
        .catch(() => {
          // إذا فشل الاتصال، أرجع صفحة offline
          if (event.request.mode === 'navigate') {
            return caches.match('/index.html');
          }
        });
    })
  );
});

// ========== إشعارات Push (اختياري – يُفعل لاحقاً) ==========
self.addEventListener('push', (event) => {
  const data = event.data ? event.data.json() : {};
  const options = {
    body: data.body || 'لديك إشعار جديد',
    icon: '/icons/icon-192x192.png',
    badge: '/icons/icon-72x72.png',
    vibrate: [200, 100, 200],
    data: { url: data.url || '/' },
  };
  event.waitUntil(self.registration.showNotification(data.title || 'Ramz-X', options));
});

self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  event.waitUntil(clients.openWindow(event.notification.data.url || '/'));
});
