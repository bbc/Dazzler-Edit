import React, { Fragment } from "react";
import moment from "moment";
import "moment-duration-format";
import Arrow from "@material-ui/icons/ArrowRight";
import { Typography } from "@material-ui/core";
import Button from "@material-ui/core/Button";
import Dialog from "@material-ui/core/Dialog";
import DialogActions from "@material-ui/core/DialogActions";
import DialogContent from "@material-ui/core/DialogContent";
import DialogTitle from "@material-ui/core/DialogTitle";
import Radio from "@material-ui/core/Radio";
import RadioGroup from "@material-ui/core/RadioGroup";
import FormControlLabel from "@material-ui/core/FormControlLabel";

import "react-confirm-alert/src/react-confirm-alert.css";

/*
<ScheduleItem
index="1"
live="true"
insertionType="x"
selected="true"
startTime="10:22:00"
title="a clip"
duration="PT20S"
onClick="function(index)"
onDelete="function(index)"
/>
*/

class ScheduleItem extends React.Component {
  constructor(props) {
    super(props);
    this.handleClickOpen = this.handleClickOpen.bind(this);
    this.handleClose = this.handleClose.bind(this);

    this.state = {
      open: false,
      count: 0,
      value: "deleteAll"
    };
  }

  handleChange = event => {
    this.setState({ value: event.target.value });
  };
  handleClickOpen = () => {
    this.setState({ open: true });
  };

  handleClose = () => {
    this.setState({ open: false });
  };

  render() {
    console.log("!!!!", this.props.insertionType);
    let { open } = this.state;
    let rowStyle = this.props.insertionType;
    if (this.props.live === "true") rowStyle = "live";
    let arrowStyle = "bottomarrow";
    if (rowStyle === "gap") arrowStyle = "midarrow";
    let overlap = moment.duration();
    if (this.props.insertionType === "overlap") {
      overlap = moment
        .duration(this.props.asset_duration)
        .subtract(moment.duration(this.props.duration));
    }
    const isoString = moment(this.props.startTime).toISOString();
    const localTime = moment(isoString).format("HH:mm");
    const utcTime = moment.utc(this.props.startTime).format("HH:mm:ss");

    return (
      <Fragment>
        <tr className={rowStyle}>
          <td onClick={() => this.props.onClick(this.props.index)}>
            {this.props.selected ? <Arrow className={arrowStyle} /> : ""}
          </td>

          <td> {localTime}</td>

          <td onClick={() => this.props.onClick(this.props.index)}>
            {utcTime}
          </td>

          <td>
            {this.props.title}
            {this.props.insertionType === "overlap" ? (
              <Typography fontStyle="italic">
                (asset duration is &nbsp;
                {moment
                  .duration(this.props.asset_duration)
                  .format("HH:mm:ss", { trim: false })}
                ,{moment.duration(overlap).format("HH:mm:ss", { trim: false })}{" "}
                will be lost )
              </Typography>
            ) : (
              <Typography></Typography>
            )}
          </td>

          <td onClick={() => this.props.onClick(this.props.index)}>
            {moment
              .duration(this.props.duration)
              .format("HH:mm:ss", { trim: false })}
          </td>

          <td>
            {this.props.insertionType !== "" &&
            "gap,sentinel".includes(this.props.insertionType) ? (
              ""
            ) : (
              <button
                className="mini ui button"
                onClick={() => {
                  this.props.onDelete(this.props.index, this.state.value);
                }}
                onContextMenu={event => {
                  event.preventDefault();

                  if (this.props.insertionType !== "live") {
                    var tally = 0;
                    this.props.data.map(item => {
                      if (item.title === this.props.title) {
                        tally++;
                      }
                      return tally;
                    });
                    this.setState({ open: true, count: tally });
                  }
                }}
              >
                <i className="trash alternate outline icon"></i>
              </button>
            )}
          </td>
        </tr>
        <Dialog
          open={open}
          onClose={this.handleClose}
          aria-labelledby="alert-dialog-title"
          aria-describedby="alert-dialog-description"
        >
          <DialogTitle id="alert-dialog-title">{this.props.title}</DialogTitle>
          <DialogContent>
            <RadioGroup
              aria-label="items"
              name="items1"
              value={this.state.value}
              onChange={this.handleChange}
            >
              <FormControlLabel
                value="deleteAll"
                control={<Radio />}
                label={`Delete all ${this.state.count} occurences`}
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
              onClick={() => {
                this.props.onOccurenceDelete(
                  this.props.index,
                  this.state.value
                );
                this.setState({ open: false });
              }}
              color="primary"
              autoFocus
            >
              Yes
            </Button>
            <Button onClick={this.handleClose} color="primary">
              No
            </Button>
          </DialogActions>
        </Dialog>
      </Fragment>
    );
  }
}
export default ScheduleItem;
