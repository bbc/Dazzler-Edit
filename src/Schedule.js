import React from 'react';
import SingleSchedule from './SingleSchedule';
import moment from 'moment'
import axios from 'axios'



var test = [];
var url = "https://iqvp3l4nzg.execute-api.eu-west-1.amazonaws.com/live/broadcasts?sid=bbc_marathi_tv&start="
class Schedule extends React.Component {
  constructor(props){
  
    super(props)
}
  state = {
    scheduleArray: [],
    text: null
  };

  componentDidMount(){
    this.savePlaylist = this.savePlaylist.bind(this);
    
  }


    savePlaylist(){
      var start = moment().utcOffset(0);
      var newStart = moment().utcOffset(0);
      start.set({hour:0,minute:0,second:0,millisecond:0})
      var end =  moment.utc(this.props.data[this.props.data.length - 1].startTime, "HH:mm:ss").add(moment.duration(this.props.data[this.props.data.length - 1].duration)._milliseconds, 'milliseconds').format()
     
      console.log('START', start)
      console.log('end', end)
      for(let i =0; i < this.props.data.length; i++){
           newStart.set({hour:this.props.data[i].startTime.charAt(0) + this.props.data[i].startTime.charAt(1),
            minute:this.props.data[i].startTime.charAt(3) + this.props.data[i].startTime.charAt(4),
            second:this.props.data[i].startTime.charAt(6) + this.props.data[i].startTime.charAt(7)})
           test.push( {
              "broadcast_of": this.props.data[i].versionPid,
              "start": newStart.format(),
              "duration": this.props.data[i].duration,
              "live": this.props.data[i].isLive,
              "repeat": false
            },)
            
          
     }
     console.log('TEST', test)
     console.log('START', start.format())
     console.log('NEWSTART', newStart.format())

  axios({
    method: 'post',
    url: "https://iqvp3l4nzg.execute-api.eu-west-1.amazonaws.com/live/broadcasts?sid=bbc_marathi_tv&start="
    + start.format() + '&end=' + end,
    headers: {
      'Content-Type': 'application/json'
    },
    data: test
    })
    .then(function (response) {
        console.log(response);
    })
    .catch(function (error) {
        console.log(error);
    });

  }
    render() {
      var videos = [];
      
      
      for(let i =0; i < this.props.data.length; i++){
      
       videos.push( <SingleSchedule title={this.props.data[i].title} startTime = {this.props.data[i].startTime}
       duration={this.props.data[i].duration} deleteItem = {this.props.deleteItem} id = {this.props.data[i].id} />)
       
      }
    
     
      return (
      
        <div>
          <center><h2>{this.props.text}Schedule</h2></center>
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