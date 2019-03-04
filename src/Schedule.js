import React from 'react';
import SingleSchedule from './SingleSchedule';
import axios from 'axios';
import moment from 'moment';

var returnedData = [];


class Schedule extends React.Component {
  state = {
    broadcast: [],
  
  };
  componentDidUpdate() {
    
    var end = moment(this.props.scheduleDate).set({hour:23,minute:59,second:59,millisecond:59}).utcOffset(0).format();
    axios.get('https://iqvp3l4nzg.execute-api.eu-west-1.amazonaws.com/live/broadcast?sid=bbc_marathi_tv&start=' +
    this.props.scheduleDate + "&end=" + end).then((response) => {
      returnedData = response.data

      console.log(this.props.data, "DATA!")
      

      console.log("BResponse", returnedData)
      console.log("AXIOS", 'https://iqvp3l4nzg.execute-api.eu-west-1.amazonaws.com/live/broadcast?sid=bbc_marathi_tv&start=' +
      this.props.scheduleDate + "&end=" + end)
     
  
  
    }).catch(e => {
       console.log(e);
    });
  }


  
    
    savePlaylist (){
      

    this.setState({
      broadcast: [...this.setState.broadcast, returnedData]
    })
    //   for(let i =0; i < this.props.data.length; i++){

    //     var pid = this.props.data[i].versionPid
    //     var sid = "bbc_marathi_tv"  
    //     var start = this.props.data[i].startTime
    //     var length = moment.duration(this.props.data[i].duration)._data;
    //     var begin = moment().utcOffset(0);
    //     var duration = moment(length).format("HH:mm:ss")
    //     begin.set({hour: start.charAt(0) + start.charAt(1),minute: start.charAt(3) + start.charAt(4),second: start.charAt(6) + start.charAt(7)})
    //     begin.toISOString() 

    //     axios.post('https://iqvp3l4nzg.execute-api.eu-west-1.amazonaws.com/live/broadcast?sid=' + sid 
    //     + "&pid=" + pid + "&start=" + begin.format() + "&duration=" + duration).then((response) => {
    //       console.log('POST', response)
          
          
        
          
    //   }).catch(e => {
    //      console.log(e, "error!");
    //      console.log('https://iqvp3l4nzg.execute-api.eu-west-1.amazonaws.com/live/broadcast?sid=' + sid 
    //      + "&pid=" + pid + "&start=" + begin.format() + "&duration=" + duration)
         
         
        
    //   });

    // }

  }
    render() {
      var videos = [];
      var inBroadcast = [];
      
      if(returnedData.length > 0){
      for(let i =0; i < returnedData.length; i++){
       
        inBroadcast.push( <SingleSchedule title="From Broadcast" startTime = {returnedData[i].published_time.start}
        duration={returnedData[i].published_time.duration}  />)
        
       }
       
      }
      if(this.props.data.length > 0){
      for(let i =0; i < this.props.data.length; i++){
       
       videos.push( <SingleSchedule title={this.props.data[i].title} startTime = {this.props.data[i].startTime}
       duration={this.props.data[i].duration} deleteItem = {this.props.deleteItem} id = {this.props.data[i].id} />)
       
      }
    }
  //    videos.push(inBroadcast);
      return (
        <div>
          <center><h2>Today's Schedule</h2></center>
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
          {
            videos
          }
          {
            inBroadcast.pop()
            }

        </tbody>
          <tfoot className="full-width">
            <tr>
              <th></th>
              <th colSpan="5">
        
                <div className="ui right floated small primary labeled icon button" onClick={this.savePlaylist}>
                  Save Playlist 
                </div>
     
              </th>
            </tr>
          </tfoot>
        </table>
   </div>
      )
    }
     
}
export default Schedule;            