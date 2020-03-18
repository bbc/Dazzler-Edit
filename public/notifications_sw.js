/* eslint-disable no-restricted-globals */
/* eslint-disable no-undef */
async function addToPage(payload) {
  
  let windowClients = await clients.matchAll({ type: 'window', includeUncontrolled: true });
  let client = undefined;
  for (let i = 0; i < windowClients.length; i++) {
    client = windowClients[i];
    if (client) {
      client.postMessage(payload);
    }
  }
  
}

self.addEventListener('install', event => {
  console.log('SW installing…');
});

self.addEventListener('activate', event => {
  console.log('SW now ready to handle notifications!');
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