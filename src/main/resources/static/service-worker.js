// 🚀 UNI-EATS PWA SERVICE WORKER AVANZADO v2.0
// Caché estratégico, notificaciones push y funcionalidad offline

const CACHE_NAME = 'uni-eats-v1.0';
const STATIC_CACHE = 'uni-eats-static-v1.0';
const DYNAMIC_CACHE = 'uni-eats-dynamic-v1.0';

// Recursos críticos para cachear inmediatamente
const STATIC_ASSETS = [
  '/',
  '/css/tailwind.min.css',
  '/js/vendedor.js',
  '/js/comprador.js',
  '/js/utils/logger.js',
  '/js/utils/icons.js',
  '/js/utils/performance.js',
  '/js/utils/components.js',
  '/js/utils/init.js',
  '/img/logo-placeholder.svg',
  '/img/placeholder.svg',
  '/img/icons/icon-192x192.svg',
  '/img/icons/icon-512x512.svg',
  '/manifest.json'
];

// URLs de API que cachear temporalmente
const API_CACHE_PATTERNS = [
  '/api/vendedor/dashboard',
  '/api/comprador/tiendas',
  '/api/vendedor/productos'
];

// 📦 INSTALACIÓN - Cachear recursos críticos
self.addEventListener('install', (event) => {
  console.log('🔧 SW: Instalando Uni-Eats PWA v2.0');
  
  event.waitUntil(
    caches.open(STATIC_CACHE)
      .then(cache => {
        console.log('📦 SW: Cacheando recursos estáticos');
        return cache.addAll(STATIC_ASSETS);
      })
      .then(() => {
        console.log('✅ SW: Recursos estáticos cacheados');
        self.skipWaiting(); // Activar inmediatamente
      })
      .catch(error => {
        console.error('❌ SW: Error cacheando recursos:', error);
      })
  );
});

// 🚀 ACTIVACIÓN - Limpiar caché antiguo
self.addEventListener('activate', (event) => {
  console.log('🚀 SW: Activando Uni-Eats PWA');
  
  event.waitUntil(
    caches.keys()
      .then(cacheNames => {
        return Promise.all(
          cacheNames.map(cacheName => {
            // Eliminar cachés antiguos
            if (cacheName !== STATIC_CACHE && 
                cacheName !== DYNAMIC_CACHE && 
                cacheName !== CACHE_NAME) {
              console.log('🗑️ SW: Eliminando caché antiguo:', cacheName);
              return caches.delete(cacheName);
            }
          })
        );
      })
      .then(() => {
        console.log('✅ SW: Activación completa');
        return clients.claim(); // Tomar control inmediatamente
      })
  );
});

// 🌐 ESTRATEGIA DE CACHÉ INTELIGENTE
self.addEventListener('fetch', (event) => {
  const { request } = event;
  const url = new URL(request.url);
  
  // No interceptar requests externas
  if (url.origin !== location.origin) {
    return;
  }
  
  // Estrategia según tipo de recurso
  if (isStaticAsset(request)) {
    event.respondWith(cacheFirst(request));
  } else if (isAPIRequest(request)) {
    event.respondWith(networkFirst(request));
  } else if (isHTMLRequest(request)) {
    event.respondWith(staleWhileRevalidate(request));
  } else {
    event.respondWith(networkFirst(request));
  }
});

// 🔄 ESTRATEGIAS DE CACHÉ

// Cache First - Para recursos estáticos
async function cacheFirst(request) {
  try {
    const cachedResponse = await caches.match(request);
    if (cachedResponse) {
      return cachedResponse;
    }
    
    const networkResponse = await fetch(request);
    const cache = await caches.open(STATIC_CACHE);
    cache.put(request, networkResponse.clone());
    return networkResponse;
  } catch (error) {
    console.warn('SW: Cache first failed for', request.url);
    return new Response('Resource unavailable', { 
      status: 503, 
      statusText: 'Service Unavailable' 
    });
  }
}

// Network First - Para APIs (datos frescos)
async function networkFirst(request) {
  try {
    const networkResponse = await fetch(request);
    
    // Solo cachear respuestas exitosas de API
    if (isAPIRequest(request) && networkResponse.ok) {
      const cache = await caches.open(DYNAMIC_CACHE);
      cache.put(request, networkResponse.clone());
    }
    
    return networkResponse;
  } catch (error) {
    // Si falla la red, intentar caché
    const cachedResponse = await caches.match(request);
    if (cachedResponse) {
      console.log('SW: Sirviendo desde caché (offline):', request.url);
      return cachedResponse;
    }
    
    // Si no hay caché, respuesta de error
    return new Response(JSON.stringify({
      error: 'Sin conexión',
      message: 'No se puede acceder al recurso sin conexión'
    }), {
      status: 503,
      statusText: 'Service Unavailable',
      headers: { 'Content-Type': 'application/json' }
    });
  }
}

// Stale While Revalidate - Para HTML (balance performance/frescura)
async function staleWhileRevalidate(request) {
  const cache = await caches.open(DYNAMIC_CACHE);
  const cachedResponse = await cache.match(request);
  
  const fetchPromise = fetch(request).then(networkResponse => {
    cache.put(request, networkResponse.clone());
    return networkResponse;
  });
  
  return cachedResponse || fetchPromise;
}

// 🔍 FUNCIONES DE UTILIDAD

function isStaticAsset(request) {
  return request.url.includes('/css/') || 
         request.url.includes('/js/') || 
         request.url.includes('/img/') ||
         request.url.includes('manifest.json');
}

function isAPIRequest(request) {
  return request.url.includes('/api/') || 
         API_CACHE_PATTERNS.some(pattern => request.url.includes(pattern));
}

function isHTMLRequest(request) {
  return request.headers.get('accept')?.includes('text/html');
}

// 🔔 NOTIFICACIONES PUSH
self.addEventListener('push', (event) => {
  console.log('🔔 SW: Notificación push recibida');
  
  const options = {
    body: 'Tienes nuevas actualizaciones en Uni-Eats',
    icon: '/img/icons/icon-192x192.svg',
    badge: '/img/icons/icon-192x192.svg',
    data: { url: '/' },
    actions: [
      {
        action: 'open',
        title: 'Abrir App'
      },
      {
        action: 'close',
        title: 'Cerrar'
      }
    ]
  };
  
  if (event.data) {
    try {
      const pushData = event.data.json();
      options.body = pushData.message || options.body;
      options.data = pushData.data || options.data;
    } catch (error) {
      console.warn('SW: Error parsing push data:', error);
    }
  }
  
  event.waitUntil(
    self.registration.showNotification('Uni-Eats', options)
  );
});

// 👆 CLICK EN NOTIFICACIÓN
self.addEventListener('notificationclick', (event) => {
  console.log('👆 SW: Click en notificación');
  
  event.notification.close();
  
  if (event.action === 'close') {
    return;
  }
  
  const urlToOpen = event.notification.data?.url || '/';
  
  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true })
      .then(clientList => {
        // Si ya hay una ventana abierta, enfocarla
        for (const client of clientList) {
          if (client.url.includes(urlToOpen) && 'focus' in client) {
            return client.focus();
          }
        }
        
        // Si no, abrir nueva ventana
        if (clients.openWindow) {
          return clients.openWindow(urlToOpen);
        }
      })
  );
});

// 🔄 SINCRONIZACIÓN EN BACKGROUND
self.addEventListener('sync', (event) => {
  console.log('🔄 SW: Sync en background:', event.tag);
  
  if (event.tag === 'pedidos-pendientes') {
    event.waitUntil(sincronizarPedidosPendientes());
  }
});

// Función para sincronizar pedidos cuando vuelva la conexión
async function sincronizarPedidosPendientes() {
  try {
    // Aquí implementaremos la lógica para enviar pedidos guardados offline
    console.log('🔄 SW: Sincronizando pedidos pendientes...');
    // TODO: Implementar sincronización de pedidos offline
  } catch (error) {
    console.error('❌ SW: Error sincronizando pedidos:', error);
  }
}

// 📨 MENSAJES DESDE LA APP
self.addEventListener('message', (event) => {
  console.log('📨 SW: Mensaje recibido:', event.data);
  
  if (event.data && event.data.type === 'SKIP_WAITING') {
    self.skipWaiting();
  }
});

// 🔗 NAVEGACIÓN PARA PWA STANDALONE
self.addEventListener('fetch', (event) => {
  // Interceptar navegación y garantizar que siempre use el scope de la PWA
  if (event.request.mode === 'navigate') {
    console.log('🔗 SW: Navegación interceptada:', event.request.url);
    
    // Si es una navegación externa, redirigir al scope de la PWA
    const url = new URL(event.request.url);
    if (url.origin === self.location.origin) {
      // Asegurar que siempre navegue dentro del scope de la PWA
      event.respondWith(
        fetch(event.request)
          .then(response => {
            // Agregar headers para PWA standalone
            if (response.headers.get('content-type')?.includes('text/html')) {
              const modifiedResponse = new Response(response.body, {
                status: response.status,
                statusText: response.statusText,
                headers: {
                  ...response.headers,
                  'X-PWA-Mode': 'standalone'
                }
              });
              return modifiedResponse;
            }
            return response;
          })
          .catch(() => {
            // Si no hay conexión, servir página offline
            return caches.match('/') || new Response('Uni-Eats - Sin conexión');
          })
      );
    }
  }
});

console.log('✅ SW: Uni-Eats PWA Service Worker v2.0 cargado');

// 🎯 FUNCIONES ESPECÍFICAS PARA PWA STANDALONE
// Detectar si la app se abrió en modo standalone
self.addEventListener('activate', (event) => {
  console.log('🚀 SW: Activando PWA standalone features');
  
  event.waitUntil(
    clients.matchAll({ type: 'window' }).then(clients => {
      clients.forEach(client => {
        // Notificar a la app que está en modo PWA
        client.postMessage({
          type: 'PWA_ACTIVATED',
          mode: 'standalone'
        });
      });
    })
  );
});