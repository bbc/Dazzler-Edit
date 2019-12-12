import React from "react";
import moment from "moment";
import Date from "../Date/Date";
import {fetchSchedule} from "../ScheduleDao/ScheduleDao";

/*
<SchedulePicker enabled=true|false sid="" scheduleDate="" onDateChange=""
*/

class SchedulePicker extends React.Component {
    constructor(props) {
        super(props);
        this.previousDay = this.previousDay.bind(this);
        this.nextDay = this.nextDay.bind(this);    
        this.state = {
            scheduleDate:moment.utc().format("YYYY-MM-DD")
        };
    }
    
    componentDidMount() {
      this.setState({scheduleDate:this.props.scheduleDate});
      this.loadSchedule(moment(this.state.scheduleDate));
    }

    componentDidUpdate(prevProps) {
      if(this.state.scheduleDate !== prevProps.scheduleDate) {
        this.setState({scheduleDate:this.props.scheduleDate});
      }
    }

    previousDay() {
      this.loadSchedule(moment(this.props.scheduleDate).subtract(1, 'days'));
    }
  
    nextDay() {
      this.loadSchedule(moment(this.props.scheduleDate).add(1, 'days'));
    }
  
    loadSchedule(scheduleDate) {
      const date = scheduleDate.format("YYYY-MM-DD");
      if(this.props.enabled === false) {
        console.log('save or discard changes before leaving');
        return;
      }
      const This = this;
        try {
          fetchSchedule(
            this.props.sid,
            date,
            function(schedule) {
              This.props.onDateChange(date, schedule);
            }
          );
        } catch (error) {
          console.log(error);
        }
    }
  
    render() {
      const date = moment(this.props.scheduleDate);  
      return (
      <div>
          <Date
            scheduleDate={moment(date).format('LL')}
            previousDay={this.previousDay}
            nextDay={this.nextDay}
          />
      </div>
      );
    }
}
export default SchedulePicker;
    