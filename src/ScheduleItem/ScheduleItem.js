import React, { Fragment } from "react";
import moment from "moment";
import "moment-duration-format";
import Arrow from "@material-ui/icons/ArrowRight";
import { Typography } from "@material-ui/core";

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
  render() {
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
                  this.props.onDelete(this.props.index);
                }}
                onContextMenu={() => {
                  if (
                    window.confirm(
                      "Are you sure you want to delete all occurences of " +
                        this.props.title
                    )
                  ) {
                    this.props.onOccurenceDelete(this.props.index);
                  } else {
                  }
                }}
              >
                <i className="trash alternate outline icon"></i>
              </button>
            )}
          </td>
        </tr>
      </Fragment>
    );
  }
}
export default ScheduleItem;
