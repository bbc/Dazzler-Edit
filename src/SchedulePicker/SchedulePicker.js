import React from "react";
import moment from "moment";
import Date from "../Date/Date";

/*
<SchedulePicker enabled=true|false sid="" scheduleDate="" onDateChange=""
*/

class SchedulePicker extends React.Component {
  constructor(props) {
    super(props);
    this.previousDay = this.previousDay.bind(this);
    this.nextDay = this.nextDay.bind(this);
    this.state = {
      scheduleDate: moment.utc().format("YYYY-MM-DD"),
    };
  }

  componentDidMount() {
    this.setState({ scheduleDate: this.props.scheduleDate });
    this.props.onDateChange(this.props.scheduleDate);
  }

  componentDidUpdate(prevProps) {
    if (this.state.scheduleDate !== prevProps.scheduleDate) {
      this.setState({ scheduleDate: this.props.scheduleDate });
    }
  }

  previousDay() {
    this.props.onDateChange(
      moment(this.props.scheduleDate).subtract(1, "days")
    );
  }

  nextDay() {
    this.props.onDateChange(moment(this.props.scheduleDate).add(1, "days"));
  }

  render() {
    const date = moment(this.props.scheduleDate);
    return (
      <div>
        <Date
          scheduleDate={moment(date).format("LL")}
          previousDay={this.previousDay}
          nextDay={this.nextDay}
          enabled={this.props.enabled}
          handleFrom={this.props.handleFrom}
          handleTo={this.props.handleTo}
          handleDayTo={this.props.handleDayTo}
          handleDayFrom={this.props.handleDayFrom}
          from={this.props.from}
          to={this.props.to}
        />
      </div>
    );
  }
}
export default SchedulePicker;
