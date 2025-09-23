// Service Worker para Uni-Eats PWA
// Maneja notificaciones push y funciones básicas de PWA

self.addEventListener('install', (event) => {
  console.log('🔧 Service Worker instalado para Uni-Eats');
  self.skipWaiting(); // Activar inmediatamente
});

self.addEventListener('activate', (event) => {
  console.log('🚀 Service Worker activado');
  event.waitUntil(clients.claim()); // Tomar control inmediatamente
});

self.addEventListener('fetch', (event) => {
  // Solo interceptar requests específicas, no todas
  const url = new URL(event.request.url);
  
  // No interceptar requests externas como via.placeholder.com
  if (url.origin !== location.origin) {
    return; // Dejar que el navegador maneje requests externas
  }
  
  // Para requests internas, usar la red normalmente
  event.respondWith(
    fetch(event.request).catch(error => {
      console.warn('SW: Fetch failed for', event.request.url, error);
      // Return a simple response for failed requests
      return new Response('Resource not available', { 
        status: 503,
        statusText: 'Service Unavailable' 
      });
    })
  );
});

// 🔔 Manejar notificaciones push
self.addEventListener('notificationclick', (event) => {
  console.log('👆 Notificación clickeada:', event);
  
  event.notification.close();
  
  const action = event.action;
  const data = event.notification.data || {};
  
  event.waitUntil(
    clients.matchAll({ type: 'window' }).then((clientList) => {
      // Si hay una ventana abierta de la app, enfocarla
      for (const client of clientList) {
        if (client.url.includes('/estudiante_dashboard') && 'focus' in client) {
          return client.focus().then(() => {
            // Enviar mensaje a la app para navegar a pedidos
            if (data.pedidoId) {
              client.postMessage({
                type: 'NAVIGATE_TO_PEDIDOS',
                pedidoId: data.pedidoId
              });
            }
          });
        }
      }
      
      // Si no hay ventana abierta, abrir una nueva
      if (clients.openWindow) {
        return clients.openWindow('/estudiante_dashboard?view=misPedidos');
      }
    })
  );
});

// Manejar cierre de notificaciones
self.addEventListener('notificationclose', (event) => {
  console.log('❌ Notificación cerrada:', event.notification.tag);
});

// Mensajes desde la aplicación principal
self.addEventListener('message', (event) => {
  console.log('📨 Mensaje recibido en SW:', event.data);
  
  if (event.data && event.data.type === 'SKIP_WAITING') {
    self.skipWaiting();
  }
});