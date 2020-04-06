import React from "react";
import PropTypes from "prop-types";
import ScheduleItem from "../ScheduleItem/ScheduleItem";
import moment from "moment";
// import moment from "moment";

/*
  <ScheduleView 
  onDelete={function} 
  onRowSelected={function}
  data={somedata} 
  lastUpdated="2019-12-09T10:00:00Z"
  />

  data = [{
    id: int
    startTime: ISO datetime
    title: string
    duration: ISO duration
    live: true|false
    insertionType: futureEpisode|loopStart|loopEnd|midLoop|<empty>
    onDelete="function(index)"
  }]
*/

class ScheduleView extends React.Component {
  constructor(props) {
    super(props);
    this.handleClick = this.handleClick.bind(this);
    this.handleDelete = this.handleDelete.bind(this);
    this.checkStatus = this.checkStatus.bind(this);
    this.state = {};
  }

  handleClick = (index) => {
    if (this.props.onRowSelected) this.props.onRowSelected(index);
  };

  handleDelete = (index) => {
    this.props.onDelete(index); // TODO can we use this directly?
  };

  /* if schedule time is before actual start, item becomes red
   */

  // checkStatus = item => {
  //   if (item.asset && item.asset.status == "unavailable") {
  //     if (
  //       moment(item.startTime).isAfter(
  //         moment(item.asset.availability.expected_start)
  //       )
  //     ) {
  //       item.insertionType = "unavailable";
  //       return "unavailable";
  //     } else {
  //       item.insertionType = "noStart";
  //       return "noStart";
  //     }
  //   }
  // };

  /* If schedule is not available and there is 30 mins left until schedule time,
  item becomes red*/
  checkStatus = (item) => {
    if (item.asset && item.asset.status == "unavailable") {
      if (moment(item.startTime).add(30, "minutes").isAfter(moment())) {
        item.insertionType = "unavailable";
        return "unavailable";
      } else {
        item.insertionType = "noStart";
        return "noStart";
      }
    } else {
      return item.insertionType;
    }
  };

  handleOccurenceDelete = (index, value) => {
    this.props.onOccurenceDelete(index, value); // TODO can we use this directly?
  };

  componentDidMount() {}

  componentDidUpdate(prevProps) {
    if (this.props.lastUpdated !== prevProps.lastUpdated) {
    }
  }

  render() {
    // let offset = moment().format().substring(19);
    let selectedItem = this.props.row;
    if (selectedItem === -1) {
      // put at first gap
      for (let i = 0; i < this.props.data.length; i++) {
        if (this.props.data[i].insertionType === "gap") {
          selectedItem = i;
          break;
        }
      }
      if (this.props.onRowSelected) this.props.onRowSelected(selectedItem);
    }
    return (
      <table className="ui compact celled definition table">
        <thead>
          <tr>
            <th></th>
            <th>Local</th>
            <th>Start</th>
            <th>Title</th>
            <th>Duration </th>
            <th>Action</th>
          </tr>
        </thead>
        <tbody>
          {this.props.data.map((item, index) => (
            <ScheduleItem
              key={item.insertionType + item.startTime.utc().format()}
              index={index}
              live={item.live}
              insertionType={this.checkStatus(item)}
              selected={selectedItem === index}
              startTime={item.startTime}
              title={item.title}
              duration={item.duration}
              asset_duration={item.asset ? item.asset.duration : ""}
              onClick={this.handleClick}
              onDelete={this.handleDelete}
              onOccurenceDelete={this.handleOccurenceDelete}
              data={this.props.data}
            />
          ))}
        </tbody>
      </table>
    );
  }
}

ScheduleView.propTypes = {
  data: PropTypes.array.isRequired,
  onDelete: PropTypes.func.isRequired,
  onRowSelected: PropTypes.func.isRequired,
};

export default ScheduleView;
