import React from 'react';
import moment from 'moment';



const SingleItemClip = (props) => {
    const { handleClick } = props;
    const { title, pid, startTime } = props.item;
    
    var date1 = new Date();
    var date2 = new Date(props.item.updated_time.split('T')[0]);
    var timeDiff = Math.abs(date2.getTime() - date1.getTime());
  
    var diffDays = Math.ceil(timeDiff / (1000 * 3600 * 24) - 1); 
    // if(diffDays < 1){
    //     var diffDays = Math.ceil(timeDiff / (1000 * 3600 * 24) - 1); 
    // }
   
    return (

        <tr>
           
            <td className="collapsing">
           
            <input type="checkbox"/> <label></label>
           
            </td>
            <td>{title}</td>
            <td>{moment.duration(props.item.available_versions.version[0].duration)._data.minutes} minutes {moment.duration(props.item.available_versions.version[0].duration)._data.seconds} seconds</td>
            
            <td>{diffDays} days ago</td>
            <td>{pid}</td>
            <td>{props.item.available_versions.version.length}</td>
            <td><button className="Add" onClick = {() => {handleClick(pid)}}>add</button>
            </td>
        </tr>
       
    );

}

export default SingleItemClip;



