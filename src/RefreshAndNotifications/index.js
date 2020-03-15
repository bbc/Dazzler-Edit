import { React, useState } from "react";
import RefreshIcon from "@material-ui/icons/Refresh";
import Button from "@material-ui/core/Button";
import usePushNotifications from "../usePushNotifications";

export default function RefreshAndNotifications(buttonClass) {
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
    
    const [refresh, setRefresh] = useState(0);

    return <Button
        onClick={() => {
            setRefresh(refresh+1);
        }}
        variant="contained"
        color="primary"
        size="small"
        className={buttonClass}
        startIcon={<RefreshIcon />}
    ></Button>;
}