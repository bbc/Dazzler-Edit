import React, { Fragment } from "react";
import moment from "moment";
import 'moment-duration-format';
import Arrow from "@material-ui/icons/ArrowRight";

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
    if(this.props.live === "true") rowStyle = 'live';
    let arrowStyle = "bottomarrow";
    if(rowStyle === 'gap') arrowStyle = "midarrow";
    return (
      <Fragment>
        <tr className={rowStyle}>
          <td onClick={() => this.props.onClick(this.props.index)}>
              {this.props.selected? (
                <Arrow className={arrowStyle}/>
              ) : (
                ""
              )}
          </td>
          <td onClick={() => this.props.onClick(this.props.index)}>
            {this.props.startTime}
          </td>
          <td>{this.props.title}</td>
          <td onClick={() => this.props.onClick(this.props.index)}>
            {moment.duration(this.props.duration).format('HH:mm:ss')}
          </td>
        <td>
          {
            (this.props.insertionType!=='' && 'gap,sentinel'.includes(this.props.insertionType))?'':
            <button
            className="mini ui button"
            onClick={() => {this.props.onDelete(this.props.index)}}
            >
            <i className="trash alternate outline icon"></i>
            </button>
          }
        </td>
        </tr>
      </Fragment>
    );
  }

}
export default ScheduleItem;