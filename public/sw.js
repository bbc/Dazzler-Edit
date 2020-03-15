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

self.addEventListener('install', function(event) {
     /*
  event.waitUntil(
    caches.open(currentCacheName).then(function(cache) {
      return cache.addAll(arrayOfFilesToCache);
    })
  );
    */
   console.log('sw install');
});

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