import React from "react";
import ScheduleView from "../ScheduleView/ScheduleView";
import {saveSchedule} from "../ScheduleDao/ScheduleDao";
import SchedulePicker from "../SchedulePicker/SchedulePicker";
import ScheduleToolbar from "../ScheduleToolbar/ScheduleToolbar";
import moment from "moment";

/*
  <Schedule
    scheduleDate
    sid
    serviceIDRef
    saveAllowed
    onDateChange
  />
*/
class Schedule extends React.Component {
  constructor(props) {
    super(props);
    this.savePlaylist = this.savePlaylist.bind(this);
    this.handleDelete = this.handleDelete.bind(this);
    this.handleDateChange = this.handleDateChange.bind(this);
    
    this.state = {
      scheduleDate: moment.utc().format("YYYY-MM-DD"),
      schedule: [],
      dirty: false
    };
  }

  componentDidMount() {
    console.log('Schedule', this.state);
  }

  componentDidUpdate(prevProps) {
    console.log('Schedule DidUpdate', this.state.scheduleDate, prevProps.scheduleDate);
    if(this.state.scheduleDate !== prevProps.scheduleDate) {
      console.log('date has changed');
    }
  }

  savePlaylist() {
    const data = this.state.schedule;
      if (data.length === 0) {
        console.log("nothing to save - button should be disabled");
        return;
      }

      // savePlaylist: "ui right floated primary loading button"
      this.setState({
        status: 'saving ...'
      });

      saveSchedule(this.props.serviceIDRef, data, function(){
        this.setState({
            savePlaylist: "ui right floated positive button active",
            status: "Saved"
          });
      }, function(){
        this.setState({
            savePlaylist: "ui right floated small primary labeled icon button",
            status: "Save Playlist"
          });
          alert("Error Saving Playlist");
      });
  }

  handleDelete(index) {
    console.log('Schedule delete', index);
    let schedule = this.state.schedule.splice(index,1);
    // TODO do we leave a gap or close it up?
    // lets close it up
    this.setState({
      schedule: this.deleteItemClosingGap(schedule, index)
    });
  }
  
  handleDateChange = (d, schedule) => {
    this.setState({ scheduleDate: d, schedule: schedule });
  };

  // TODO move these to a schedule data class
  deleteItemClosingGap(schedule, index) {
    const duration = moment.duration(schedule[index].duration);
    for(let i = index; i<schedule.length; i++) {
      if("gap,sentinel".includes(schedule[i].insertionType)) {
        break;
      }
      schedule[i].startTime.add(duration);
    }
    return schedule;
  }

  render() {
    console.log('render');
    return (
      <div>
        <SchedulePicker
          sid={this.props.sid}
          scheduleDate={this.state.scheduleDate} 
          onDateChange={this.handleDateChange}
        />
        <ScheduleView onDelete={this.handleDelete} data={this.state.schedule} lastUpdated=""/>
        <ScheduleToolbar saveAllowed={this.props.saveAllowed} onSaveClicked={this.savePlaylist}/>
      </div>
    );
  }
}
export default Schedule;
