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
  // Por ahora, no hacemos nada con las peticiones, solo las dejamos pasar.
  event.respondWith(fetch(event.request));
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