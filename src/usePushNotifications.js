import { useState, useEffect } from "react";
import PlatformDao from "./PlatformDao/PlatformDao";

import {
  isPushNotificationSupported,
  askUserPermission,
  getUserSubscription
} from "./push-notifications";

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

  useEffect(() => {
    if (pushNotificationSupported) {
      setLoading(true);
      setError(false);
      navigator.serviceWorker.register("/notifications_sw.js", {scope: "/"})
        .then((reg) => {
          setLoading(false);
          var serviceWorker;
          if (reg.installing) {
            serviceWorker = reg.installing;
            console.log('Service worker installing');
          } else if (reg.waiting) {
            serviceWorker = reg.waiting;
            console.log('Service worker installed & waiting');
          } else if (reg.active) {
            serviceWorker = reg.active;
            console.log('Service worker active');
          }
          if (serviceWorker) {
            console.log("sw current state", serviceWorker.state);
            if (serviceWorker.state === "activated") {
              //If push subscription wasnt done yet have to do here
              console.log("sw already activated - Do whatever needed here");
            }
            serviceWorker.addEventListener("statechange", function (e) {
              console.log("sw statechange : ", e.target.state);
              if (e.target.state === "activated") {
                // use pushManager for subscribing here.
                console.log("Just now activated. now we can subscribe for push notification")
                setLoading(true);
                setError(false);
                serviceWorker.pushManager.subscribe({
                  userVisibleOnly: true,
                  applicationServerKey: process.env.VAPID_PUBLIC_KEY
                })
                .then((subscription) => {
                    setUserSubscription(subscription);
                    setLoading(false);
                })
                .catch((err) => {
                    console.error(err.message, "name:", err.name, "code:", err.code);
                    setError(err);
                    setLoading(false);
                });
              } else {
                console.log('sw state not activated');
              }
            });
          } else {
            console.log('SW problem, registration response is', reg);
          }
          console.log('sw registered')
          setLoading(false);
        })
        .catch((e) => {
          console.log(e);
          setLoading(false);
        });
    }
  }, []);

  /*
    .then(
    function (reg) {
    },
    function (err) {
        console.error('unsuccessful registration with ', workerFileName, err);
    }
  */


  //if the push notifications are supported, registers the service worker
  //this effect runs only the first render

  useEffect(() => {
    setLoading(true);
    setError(false);
    const getExistingSubscription = async () => {
      const existingSubscription = await getUserSubscription();
      setUserSubscription(existingSubscription);
      setLoading(false);
    };
    getExistingSubscription();
  }, []);
  //Retrieve if there is any push notification subscription for the registered service worker
  // this use effect runs only in the first render

  /**
   * define a click handler that asks the user permission,
   * it uses the setSuserConsent state, to set the consent of the user
   * If the user denies the consent, an error is created with the setError hook
   */
  const onClickAskUserPermission = () => {
    setLoading(true);
    setError(false);
    askUserPermission().then(consent => {
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