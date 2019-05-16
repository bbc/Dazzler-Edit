import React, { Fragment } from 'react';
import moment from 'moment';
import Arrow from '@material-ui/icons/ArrowRightAlt';

class SingleSchedule extends React.Component {

    timeFormat(){
    if(moment.duration(this.props.duration)._data.seconds.toString().length === 1){
        return "0" + (moment.duration(this.props.duration)._data.seconds)
      } else {
        return (moment.duration(this.props.duration)._data.seconds)
      }
  }

  componentDidUpdate(prevProps){  
    if(prevProps.flag !== this.props.flag){
         this.forceUpdate();
    }


  }
    render() {
        if(this.props.prev === 1){
            var additional = null;
       }else if (this.props.prev !== 1 && this.props.style !== undefined) {
            additional = 
            <td><button className="Add" onClick={() => this.props.deleteItem(this.props.id)}>Delete</button>
            </td>;
        }else{
            additional = 
            <td><button className="Add" onClick={() => this.props.deleteItem(this.props.startTime)}>Delete</button> 
            </td>;
        }
  
return (
    <Fragment>
        <tr className = {this.props.border}>
        <td onClick={() => this.props.fetchTime(this.props.id)}> {this.props.flag === true ? <Arrow /> : null }</td>
        <td className="collapsing" className = {this.props.style}>
        <input type="checkbox"/> <label></label>
        </td>
        <td className = {this.props.style}>{this.props.startTime}</td>
        <td className = {this.props.style}>{this.props.title}</td>
        <td className = {this.props.style}>{moment.duration(this.props.duration)._data.minutes}:{this.timeFormat()}</td>
        {additional}
    </tr>
    </Fragment>
);
}
}
export default SingleSchedule;