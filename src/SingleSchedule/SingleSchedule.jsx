import React, { Fragment } from "react";
import moment from "moment";
import Arrow from "@material-ui/icons/ArrowRight";

var status;
class SingleSchedule extends React.Component {
  timeFormat() {
    if (
      moment.duration(this.props.duration)._data.seconds.toString().length === 1
    ) {
      return "0" + moment.duration(this.props.duration)._data.seconds;
    } else {
      return moment.duration(this.props.duration)._data.seconds;
    }
  }

  componentDidUpdate(prevProps) {
    if (prevProps.flag !== this.props.flag) {
      this.forceUpdate();
    }
  }
  render() {
    var deleteButton = (
      <td>
        <button
          className="mini ui button"
          onClick={() => this.props.deleteItem(this.props.id)}
        >
          <i class="trash alternate outline icon"></i>
        </button>
      </td>
    );

    return (
      <Fragment>
        <tr className={this.props.live}>
          <td
            className={"current"}
            onClick={() =>
              this.props.getItem(this.props.startTime, this.props.chosen)
            }
          >
            {" "}
            <div className="current">
              {this.props.selected == "chosen" ? (
                <Arrow className="arrow" fontSize="large" />
              ) : (
                ""
              )}
              {status}
            </div>
          </td>
          <td className="collapsing" className={this.props.insertionType}>
            <input type="checkbox" /> <label></label>
          </td>
          <td className={this.props.insertionType}>{this.props.startTime}</td>
          <td className={this.props.insertionType}>{this.props.title}</td>
          <td className={this.props.insertionType}>
            {moment.duration(this.props.duration)._data.minutes}:
            {this.timeFormat()}
          </td>
          {deleteButton}
        </tr>
      </Fragment>
    );
  }
}
export default SingleSchedule;
