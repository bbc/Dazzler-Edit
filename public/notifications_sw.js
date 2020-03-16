/* eslint-disable no-restricted-globals */
/* eslint-disable no-undef */
async function addToPage(payload) {
  let windowClients = await clients.matchAll({ type: 'window', includeUncontrolled: true });
  let client = undefined;
  for (let i = 0; i < windowClients.length; i++) {
    client = windowClients[i];
    break; // what if there is more than one? add to each?
  }
  if (client) {
    client.postMessage(payload);
  }
}

self.addEventListener('install', event => {
  console.log('SW installing…');

  // cache a cat SVG
  event.waitUntil(
    caches.open('static-v1').then(cache => cache.add('/favicon.ico'))
  );
});

self.addEventListener('activate', event => {
  console.log('SW now ready to handle notifications!');
});

/* 
self.addEventListener('fetch', event => {
  const url = new URL(event.request.url);

  // serve the cat SVG from the cache if the request is
  // same-origin and the path is '/dog.svg'
  if (url.origin == location.origin && url.pathname === '/dog.svg') {
    event.respondWith(caches.match('/cat.svg'));
  }
});

*/

self.addEventListener('push', event => {
  const payload = JSON.parse(event.data.text());
  const notify = async () => {
    await addToPage(payload);
    self.registration.showNotification('Dazzler', {
      body: payload.msg
    });
  };
  event.waitUntil(notify());
});