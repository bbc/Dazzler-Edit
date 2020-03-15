import React from "react";
import RefreshIcon from "@material-ui/icons/Refresh";
import Button from "@material-ui/core/Button";
import usePushNotifications from "../usePushNotifications";

export default function RefreshAndNotifications({
    buttonClass, 
    onRefresh = function() {
        console.log("refresh clicked");
    }
}) {
    
    const {
        userConsent,
        pushNotificationSupported,
        userSubscription,
        onClickAskUserPermission,
        onClickSusbribeToPushNotification,
        onClickSendSubscriptionToPushServer,
        pushServerSubscriptionId,
        error,
        loading
    } = usePushNotifications();
    
    return <Button
        onClick={() => {
            onRefresh();
        }}
        variant="contained"
        color="primary"
        size="small"
        className={buttonClass}
        startIcon={<RefreshIcon />}
    ></Button>;
}