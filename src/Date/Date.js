import React from "react";
import moment from "moment";


var current = 0;
class Date extends React.Component {
  constructor() {
    super();
    this.handleClick = this.handleClick.bind(this);
    this.handleOtherClick = this.handleOtherClick.bind(this);
  }

  handleClick(days) {
    current += days;
    return moment()
      .add(current, "d")
      .format("LL");
  }
  handleOtherClick(days) {
    current -= days;
    return moment()
      .add(current, "d")
      .format("LL");
  }

  render() {
    let arrow = "ui icon button primary disabled";
    if(this.props.enabled) {
      arrow = "ui icon button primary";
    }
    return (
      <div className="dateContainer">
        <button className={arrow} onClick={() => {
            this.props.previousDay(this.handleOtherClick(1));
          }}
        >
          <i className="left arrow icon"></i>
        </button>
        {this.props.scheduleDate} &nbsp;
        <button className={arrow} onClick={() => {
            this.props.nextDay(this.handleClick(1));
          }}
        >
          <i className="right arrow icon"></i>
        </button>
      </div>
    );
  }
}

export default Date;
