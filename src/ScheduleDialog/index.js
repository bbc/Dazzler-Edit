import React, { useState } from "react";
import Button from "@material-ui/core/Button";
import Dialog from "@material-ui/core/Dialog";
import DialogActions from "@material-ui/core/DialogActions";
import DialogContent from "@material-ui/core/DialogContent";
import DialogTitle from "@material-ui/core/DialogTitle";
import Radio from "@material-ui/core/Radio";
import RadioGroup from "@material-ui/core/RadioGroup";
import FormControlLabel from "@material-ui/core/FormControlLabel";

export default function ScheduleDialog({open, title, count, index, onOccurenceDelete, onClose}) {
    const [value, setValue] = useState("deleteAll");
    return (
    <Dialog
    open={open}
    aria-labelledby="alert-dialog-title"
    aria-describedby="alert-dialog-description"
  >
    <DialogTitle id="alert-dialog-title">{title}</DialogTitle>
    <DialogContent>
      <RadioGroup
        aria-label="items"
        name="items1"
        value={value}
        onChange={(event) => setValue(event.target.value)}
      >
        <FormControlLabel
          value="deleteAll"
          control={<Radio />}
          label={`Delete all ${count} occurences`}
        />
        <FormControlLabel
          value="deleteAllPrev"
          control={<Radio />}
          label="Delete this and all previous"
        />
        <FormControlLabel
          value="deleteAllNext"
          control={<Radio />}
          label="Delete this and all subsequent"
        />
      </RadioGroup>
    </DialogContent>
    <DialogContent>Are you sure?</DialogContent>
    <DialogActions>
      <Button
        onClick={() => {onClose(); onOccurenceDelete(index, value)}}
        color="primary"
        autoFocus
      >
        Yes
      </Button>
      <Button onClick={onClose} color="primary">No</Button>
    </DialogActions>
  </Dialog>    
    );
}