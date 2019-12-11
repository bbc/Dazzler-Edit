import React from "react";
import PropTypes from "prop-types";
import ScheduleItem from "../ScheduleItem/ScheduleItem";
import moment from "moment";

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
    this.state = {
      //selectedItem: 0
    };
  }

  handleClick = (index) => {
    console.log('handleClick', index);
    //this.setState({selectedItem: index});
    if(this.props.onRowSelected) this.props.onRowSelected(index);
  }

  handleDelete = (index) => {
    console.log('handleDelete', index);
    this.props.onDelete(index); // TODO can we use this directly?
  }

  componentDidMount() {
    //this.setState({selectedItem: this.props.data.length-1 });
  }

  componentDidUpdate(prevProps) {
    if(this.props.lastUpdated !== prevProps.lastUpdated) {
      //this.setState({selectedItem: this.props.data.length-1 });
    }
  }

  render() {
    let selectedItem = this.props.row;
    if(selectedItem === -1) {
      // put at first gap
       for(let i=0; i<this.props.data.length; i++) {
        if( this.props.data[i].insertionType === 'gap') {
          selectedItem = i;
          break;
        }
      }
      if(this.props.onRowSelected) this.props.onRowSelected(selectedItem);
    }
    return (
      <table className="ui compact celled definition table">
        <thead>
          <tr>
            <th></th>
            <th>Start</th>
            <th>Title</th>
            <th>Duration </th>
            <th>Action</th>
          </tr>
        </thead>
        <tbody>
        {this.props.data.map((item, index) =>
          <ScheduleItem
            index={index}
            live={item.live}
            insertionType={item.insertionType}
            selected={selectedItem === index}
            startTime={moment(item.startTime).format("HH:mm:ss")}
            title={item.title}
            duration={item.duration}
            onClick={this.handleClick}
            onDelete={this.handleDelete}
          />
        )}
        </tbody>
      </table>
    );
  }
}

ScheduleView.propTypes = {
  data: PropTypes.object.isRequired,
  onDelete: PropTypes.object.isRequired,
  onRowSelected: PropTypes.object.isRequired
};

export default ScheduleView;
