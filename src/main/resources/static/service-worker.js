// Este es un Service Worker muy básico.
// Su única función por ahora es existir y registrar un evento 'fetch'
// para que el navegador nos considere una PWA instalable.

self.addEventListener('install', (event) => {
  console.log('Service Worker instalado.');
});

self.addEventListener('fetch', (event) => {
  // Por ahora, no hacemos nada con las peticiones, solo las dejamos pasar.
  // Pero tener este evento es un requisito para la PWA.
  event.respondWith(fetch(event.request));
});