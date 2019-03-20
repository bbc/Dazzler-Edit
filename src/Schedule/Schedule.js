import React from 'react';
import SingleSchedule from '../SingleSchedule/SingleSchedule';
import moment from 'moment'
import axios from 'axios'

var count = -2;
var loadedContent = [];
var scheduleContent = [];
var test = [];
var videos = [];  
var vids = [];
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
    refresh: 2,
    data: []
  };

  componentDidMount(){
    var count = -2;
    this.savePlaylist = this.savePlaylist.bind(this);
    this.pasteContent = this.pasteContent.bind(this);    
    this.setState({data: this.props.data})
    
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
    // data: test
    })
    .then(function (response) {
        console.log(response);
    })
    .catch(function (error) {
        console.log(error);
    });

  }

  pasteContent(content){

       
      for(let i =0; i < content.length; i++){

        if(content[i].isLive === false && loadedContent.length === 0){
          content[0].startTime = moment.utc("00:00", "HH:mm:ss").format("HH:mm:ss");
          content[i].id = count += 1;
          loadedContent.push(content[0]);
         
          
        }else{
          content[i].startTime = moment.utc(loadedContent[loadedContent.length - 1].startTime, "HH:mm:ss").add(moment.duration(loadedContent[loadedContent.length - 1].duration)._milliseconds, 'milliseconds').format("HH:mm:ss");
          content[i].id = count += 1;
          loadedContent.push(content[i])

        }
        
       videos.push( <SingleSchedule title={loadedContent[i].title} startTime = {loadedContent[i].startTime}
       duration={loadedContent[i].duration} deleteItem = {this.props.deleteItem} id = {loadedContent[i].id} />)
       
      }
      this.setState({refresh: 1})
      
  }
  componentDidUpdate(prevProps){
  
    if(prevProps.dataLength !== this.props.dataLength){
      

      scheduleContent = this.props.data;
      

      for(let i = prevProps.dataLength || 0; i < this.props.data.length; i++){
  
       if(scheduleContent[i].isLive === false && videos.length === 0){
         scheduleContent[0].startTime = moment.utc("00:00", "HH:mm:ss").format("HH:mm:ss");
         scheduleContent[i].id = count += 1;
    
        
  
       }else{
         scheduleContent[i].startTime = moment.utc(scheduleContent[i - 1].startTime, "HH:mm:ss").add(moment.duration(scheduleContent[i - 1].duration)._milliseconds, 'milliseconds').format("HH:mm:ss");
         scheduleContent[i].id = count += 1;


       }
       
      videos.push( <SingleSchedule title={scheduleContent[i].title} startTime = {scheduleContent[i].startTime}
      duration={scheduleContent[i].duration} deleteItem = {this.props.deleteItem} id = {scheduleContent[i].id} />)
      
     }
     this.setState({refresh: 1})
    }
    
   if (this.props.remove !== prevProps.remove) {
   
    for(let i = 0; i < videos.length; i++){

      if(videos[i].props.id === this.props.remove){
        var content = <SingleSchedule title="" startTime = ""
        duration={videos[i].props.duration} deleteItem = {this.props.deleteItem} id = {videos[i].props.id} style='tableStyle' />
        
        videos[i] = content;
         this.setState({refresh: 1})
      }
    }
    
   }


  }
    render() { 
   

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