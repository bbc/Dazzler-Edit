import React from 'react';
import SingleSchedule from '../SingleSchedule/SingleSchedule';
import moment from 'moment'
import axios from 'axios'

var loadedContent = [];
var test = [];
var videos = [];  
var start = moment().utcOffset(0);
var newStart = moment().utcOffset(0);
start.set({hour:0,minute:0,second:0,millisecond:0})
var finish = moment().set({hour:23,minute:59,second:59,millisecond:59}).utcOffset(0).format();
var returnedData = [];
var oldVideos = [];

class Schedule extends React.Component {

  state = {
    scheduleArray: [],
    text: null,
    refresh: 2
  };

  componentDidMount(){
    
    this.savePlaylist = this.savePlaylist.bind(this);
    this.pasteContent = this.pasteContent.bind(this);

    // axios.get('https://iqvp3l4nzg.execute-api.eu-west-1.amazonaws.com/live/broadcast?sid=bbc_marathi_tv&start=' +
    // start.format() + "&end=" + finish).then((response) => {
    //   returnedData = response.data
    //  console.log('https://iqvp3l4nzg.execute-api.eu-west-1.amazonaws.com/live/broadcast?sid=bbc_marathi_tv&start=' +
    //  start.format() + "&end=" + finish)
    //   for(let i =0; i < returnedData.length; i++){
        
       
    //     oldVideos.push( <SingleSchedule title="From Broadcast" startTime = {moment(returnedData[i].published_time.start).format("HH:mm:ss")}
    //     duration={returnedData[i].published_time.duration} />)
     
    //    }
    //    this.setState({
    //     broadcast: [...this.state.broadcast, oldVideos]
    //   })
  
     
    // }).catch(e => {
    //    console.log(e);
    // });

  }


    savePlaylist(){
     var end =  moment.utc(this.props.data[this.props.data.length - 1].startTime, "HH:mm:ss").add(moment.duration(this.props.data[this.props.data.length - 1].duration)._milliseconds, 'milliseconds').format()
     
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

  pasteContent(content){
    alert(loadedContent.length)
      for(let i =0; i < content.length; i++){

        if(i === 0 && content[i].isLive === false && loadedContent.length === 0){
          content[0].startTime = moment.utc("00:00", "HH:mm:ss").format("HH:mm:ss");
          loadedContent.push(content[0])
          
        }
        if(loadedContent.length > 0){
          content[i].startTime = moment.utc(loadedContent[loadedContent.length - 1].startTime, "HH:mm:ss").add(moment.duration(loadedContent[loadedContent.length - 1].duration)._milliseconds, 'milliseconds').format("HH:mm:ss");
          loadedContent.push(content[i])
          
        }

       videos.push( <SingleSchedule title={loadedContent[i].title} startTime = {loadedContent[i].startTime}
       duration={loadedContent[i].duration} deleteItem = {this.props.deleteItem} id = {loadedContent[i].id} />)
       
      }
      this.setState({refresh: 1})
      
  }
    render() {
      
      console.log('Videos', videos)
      
      // for(let i =0; i < this.props.data.length; i++){
      
      //  videos.push( <SingleSchedule title={this.props.data[i].title} startTime = {this.props.data[i].startTime}
      //  duration={this.props.data[i].duration} deleteItem = {this.props.deleteItem} id = {this.props.data[i].id} />)
       
      // }

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
          
             
                <div className="ui left floated small primary labeled icon button"  onClick  = { () => {this.pasteContent(this.props.pasted)} }   >
                  Paste  
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