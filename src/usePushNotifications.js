import { useState, useEffect } from "react";
import PlatformDao from "./PlatformDao/PlatformDao";

function isPushNotificationSupported() {
  return "serviceWorker" in navigator && "PushManager" in window;
}

// first thing to do: check if the push notifications are supported by the browser
const pushNotificationSupported = isPushNotificationSupported();

export default function usePushNotifications() {
  const [userConsent, setSuserConsent] = useState(Notification.permission);
  //to manage the user consent: Notification.permission is a JavaScript native function that return the current state of the permission
  //We initialize the userConsent with that value
  const [userSubscription, setUserSubscription] = useState(null);
  //to manage the use push notification subscription
  const [pushServerSubscriptionId, setPushServerSubscriptionId] = useState();
  //to manage the push server subscription
  const [error, setError] = useState(null);
  //to manage errors
  const [loading, setLoading] = useState(true);
  //to manage async actions

 function subscribe(pushManager) {
    setLoading(true);
    setError(false);
    console.log('calling subscribe');
    pushManager.subscribe({
      userVisibleOnly: true,
      applicationServerKey: process.env.VAPID_PUBLIC_KEY
    })
    .then((subscription) => {
      console.log('subscription successful', subscription);
        setUserSubscription(subscription);
        setLoading(false);
    })
    .catch((err) => {
        console.error(err.message, "name:", err.name, "code:", err.code);
        setError(err);
        setLoading(false);
    });
  }

  useEffect(() => {
    if (pushNotificationSupported) {
      setLoading(true);
      setError(false);
      navigator.serviceWorker.register("/notifications_sw.js", {scope: "/"})
        .then((reg) => {
          console.log('registered', reg);  
          if(reg.active) {
            console.log('zzz active', reg);
          } else {
            console.log('not active');
            reg.addEventListener("activate", (e) => {
              console.log('xx', e);
            });
          }
        })
        .catch((e) => {
          console.log(e);
          setLoading(false);
        });
    }
  }, [userSubscription]);

  //if the push notifications are supported, registers the service worker
  //this effect runs only the first render

  useEffect(() => {
    setLoading(true);
    setError(false);
    navigator.serviceWorker.ready
      .then((serviceWorker) => {
        serviceWorker.pushManager.getSubscription()
        .then((x) => {
          setUserSubscription(x);
          setLoading(false);  
        })
        .catch((e) => {
          console.log(e);
        });
      })
      .then(function(pushSubscription) {
        return pushSubscription;
      });
  }, []);

  /**
   * define a click handler that asks the user permission,
   * it uses the setSuserConsent state, to set the consent of the user
   * If the user denies the consent, an error is created with the setError hook
   */
  const onClickAskUserPermission = () => {
    setLoading(true);
    setError(false);
    Notification.requestPermission().then(consent => {
      setSuserConsent(consent);
      if (consent !== "granted") {
        setError({
          name: "Consent denied",
          message: "You denied the consent to receive notifications",
          code: 0
        });
      }
      setLoading(false);
    });
  };
  //

  /**
   * define a click handler that sends the push subscription to the push server.
   * Once the subscription is created on the server, it saves the id using the hook setPushServerSubscriptionId
   */
  const onClickSendSubscriptionToPushServer = () => {
    setLoading(true);
    setError(false);
    PlatformDao.subscribe(userSubscription, (response) => {
      console.log(response);
      setPushServerSubscriptionId(response);
      setLoading(false);
    });
  };

  /**
   * returns all the stuff needed by a Component
   */
  return {
    onClickAskUserPermission,
    onClickSendSubscriptionToPushServer,
    pushServerSubscriptionId,
    userConsent,
    pushNotificationSupported,
    userSubscription,
    error,
    loading
  };
}