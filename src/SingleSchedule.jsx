import React, { Fragment } from 'react';
import moment from 'moment';


class SingleSchedule extends React.Component {

        timeFormat(){

        if(moment.duration(this.props.duration)._data.seconds.toString().length === 1){
            return "0" + (moment.duration(this.props.duration)._data.seconds)
          } else {
            return (moment.duration(this.props.duration)._data.seconds)
          }

}
        render() {
     
    return (
        <Fragment>
            <tr>
           
           <td className="collapsing">
          
           <input type="checkbox"/> <label></label>
          
           </td>
           <td>{this.props.startTime}</td>
           <td>{this.props.title}</td>
           <td>{this.props.duration}</td> 
            <td><button className="Add" onClick={() => this.props.deleteItem(this.props.id)}>Delete</button>
           </td>
       </tr>
        </Fragment>
    );
}
}
export default SingleSchedule;





         


