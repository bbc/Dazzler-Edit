import React from "react";
import RefreshIcon from "@material-ui/icons/Refresh";
import Button from "@material-ui/core/Button";

export default function RefreshAndNotifications({
    buttonClass, 
    onRefresh = function() {
        console.log("refresh clicked");
    }
}) {
    return <Button
        onClick={() => {
            onRefresh();
        }}
        variant="contained"
        color="primary"
        size="small"
        className={buttonClass}
        startIcon={<RefreshIcon />}
        >&nbsp;</Button>;
}