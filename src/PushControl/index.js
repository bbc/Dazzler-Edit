import React from "react";
import usePushNotifications from "../usePushNotifications";

export default function PushControl() {

    const {
        userConsent,
        pushNotificationSupported,
        userSubscription,
        onClickAskUserPermission,
        onClickSendSubscriptionToPushServer,
        pushServerSubscriptionId,
        error,
        loading
    } = usePushNotifications();
    console.log('user consent', userConsent)
    console.log('pushServerSubscriptionId', pushServerSubscriptionId);
    console.log('userSubscription', userSubscription);
    if (error) {
        return (
            <section className="app-error">
                <h2>{error.name}</h2>
                <p>Error message : {error.message}</p>
                <p>Error code : {error.code}</p>
            </section>)
    }

    if (loading) {
        return <div>Loading, please stand by</div>;
    }

    /*
      notifications not possible => bell slash and tooltip, click disabled
      notifications possible but not enabled => bell slash and tooltip and click to enable
      notifications enabled => bell and tooltip and click to disable
    */
    let icon;
    let tooltip;
    if (pushNotificationSupported) {
        switch (userConsent) {
            case 'default':
                icon = 'ban icon';
                tooltip = 'click to enable notifications';
                break;
            case 'granted':
                icon = 'alarm icon';
                tooltip = 'click to disable notifications';
                break;
            case 'denied':
                icon = 'ban icon';
                tooltip = 'click to enable notifications';
                break;
            default:
                icon = 'alarm slash icon';
                tooltip = userConsent;
        }
    } else {
        icon = 'alarm slash icon';
        tooltip = "your browser doesn't support notifications";
    }

    return <span className="tooltip">
        <i className={icon} onClick={onClickAskUserPermission} />
        <i className="exchange icon" onClick={onClickSendSubscriptionToPushServer} />
        <span className="tooltiptext">{tooltip}</span>
    </span>;
}