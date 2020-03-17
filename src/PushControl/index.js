import React, { useState } from "react";
import PlatformDao from "../PlatformDao/PlatformDao";

const key = 'BNm_5z3qCw3y7z95GGirbBCZa3EdsmvDNF5uHVyNBqSKXssc6-abBE6XKUvR_B18JTOeTI8gqH1YTuRky8TCyYU';

function isPushNotificationSupported() {
    return "serviceWorker" in navigator && "PushManager" in window;
}

export default function PushControl() {

    const [pushState, setPushState] = useState(Notification.permission);
    const [userSubscription, setUserSubscription] = useState(undefined);

    const askPermission = () => {
        console.log('request permission', pushState);
        console.log('current permission is', Notification.permission);
        Notification.requestPermission().then(consent => {
            console.log('consent is', consent);
            if (consent === "granted") {
                setPushState('ready');
                console.log('sw ready');
            } else {
                setPushState('permanently disabled');
            }
        });
    };

    const onClickSendSubscriptionToPushServer = () => {
        // console.log('sending subscription to pushServer');
        PlatformDao.subscribe(userSubscription, (response) => {
            // console.log(response);
            if (response.data === 'saved') {
                setPushState('active');
            } else {
                setPushState('failed');
            }
        });
    };

    const disable = () => {
        console.log('disable push');
    };

    if (!isPushNotificationSupported()) {
        return '';
    }

    if (pushState === 'granted') {
        console.log('going to call register');
        navigator.serviceWorker.register("/notifications_sw.js", { scope: "/" })
            .then((reg) => {
                setPushState('checking');
                console.log('sw registered');
            })
            .catch((err) => {
                console.log('error from register', err);
            });
    }

    if (pushState === 'checking') {
        console.log('waiting for ready');
        console.log('calling subscribe');
        navigator.serviceWorker.ready
            .then((sw) => {
                console.log('sw ready response', sw);
                if (sw.active && sw.pushManager) {
                    sw.pushManager.subscribe({
                        userVisibleOnly: true,
                        applicationServerKey: key
                    })
                    .then((subscription) => {
                        // console.log('subscription successful', subscription);
                        setUserSubscription(subscription);
                        setPushState('ready');
                    })
                    .catch((err) => {
                        console.error(err.message, "name:", err.name, "code:", err.code);
                    });
                }
            })
            .catch((e) => {
                console.log('error calling ready', e);
            });
    }

    switch (pushState) {
        case 'default':
            return <span className="tooltip">
                <i className={'ban icon'} />
                <span className="tooltiptext">unregistered</span>
            </span>;
        case 'granted':
            return <span className="tooltip">
                <i className={'alarm icon'} />
                <span className="tooltiptext">click to enable notifications</span>
            </span>;
        case 'checking':
            return <span className="tooltip">
                <i className={'ban icon'} onClick={askPermission} />
                <span className="tooltiptext">click to enable notifications</span>
            </span>;
        case 'ready':
            return <span className="tooltip">
                <i className="exchange icon" onClick={onClickSendSubscriptionToPushServer} />
                <span className="tooltiptext">send to server</span>
            </span>;
        case 'active':
            return <span className="tooltip">
                <i className="alarm icon" />
                <span className="tooltiptext">active</span>
            </span>;
        case 'failed':
                return <span className="tooltip">
                    <i className="ban icon" />
                    <span className="tooltiptext">failed</span>
                </span>;
            default:
            return <span className="tooltip">
                <i className="alarm icon" onClick={disable} />
                <span className="tooltiptext">subscribe</span>
            </span>;
    }

}