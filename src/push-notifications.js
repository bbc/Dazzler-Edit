
const pushServerPublicKey = process.env.VAPID_PUBLIC_KEY;

/**
 * checks if Push notification and service workers are supported by your browser
 */
function isPushNotificationSupported() {
  return "serviceWorker" in navigator && "PushManager" in window;
}

/**
 * asks user consent to receive push notifications and returns the response of the user, one of granted, default, denied
 */
async function askUserPermission() {
  return await Notification.requestPermission();
}
/**
 * shows a notification
 */
function sendNotification() {
  navigator.serviceWorker.ready.then(function(serviceWorker) {
    serviceWorker.showNotification("hello", {});
  });
}

/**
 *
 */
function registerServiceWorker() {
  return navigator.serviceWorker.register("/notifications_sw.js");
}

/**
 *
 * using the registered service worker creates a push notification subscription and returns it
 *
 */
async function createNotificationSubscription() {
  //wait for service worker installation to be ready
  const serviceWorkerRegistration = await navigator.serviceWorker.ready;
  // subscribe and return the subscription
  console.log('sw is ready');
  try {
     const pushSubscription = await serviceWorkerRegistration.pushManager.subscribe({
      userVisibleOnly: true,
      applicationServerKey: pushServerPublicKey
    });  
    console.log(pushSubscription.endpoint);
    return pushSubscription;
  } catch (e) {
    console.log('error subscribing', e);
  }
}

/*

navigator.serviceWorker.ready.then(
  function(serviceWorkerRegistration) {
    var options = {
      userVisibleOnly: true,
      applicationServerKey: applicationServerKey
    };
    serviceWorkerRegistration.pushManager.subscribe(options).then(
      function(pushSubscription) {
        console.log(pushSubscription.endpoint);
      }, function(error) {
        console.log(error);
      }
    );
  });
*/

/**
 * returns the subscription if present or nothing
 */
function getUserSubscription() {
  //wait for service worker installation to be ready, and then
  return navigator.serviceWorker.ready
    .then(function(serviceWorker) {
      return serviceWorker.pushManager.getSubscription();
    })
    .then(function(pushSubscription) {
      return pushSubscription;
    });
}

export {
  isPushNotificationSupported,
  askUserPermission,
  registerServiceWorker,
  sendNotification,
  createNotificationSubscription,
  getUserSubscription
};
