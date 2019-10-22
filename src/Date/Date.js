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
    return (
      <div className="dateContainer">
        {/* <button
          className="ui icon button"
          onClick={() => {
            this.props.previousDay(this.handleOtherClick(7));
          }}
        >
          <i className="angle double left icon"></i>
        </button> */}

        <button
          className="ui icon button"
          onClick={() => {
            this.props.previousDay(this.handleOtherClick(1));
          }}
        >
          <i className="left arrow icon"></i>
        </button>
        {this.props.scheduleDate}
        <button
          className="ui icon button"
          onClick={() => {
            this.props.nextDay(this.handleClick(1));
          }}
        >
          <i className="right arrow icon"></i>
        </button>
        {/* <button
          className="ui icon button"
          onClick={() => {
            this.props.nextDay(this.handleClick(7));
          }}
        >
          <i className="angle double right icon"></i>
        </button> */}
      </div>
    );
  }
}

export default Date;
