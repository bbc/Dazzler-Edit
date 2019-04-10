import React from 'react';
import SingleSchedule from '../SingleSchedule/SingleSchedule';
import moment from 'moment'
import axios from 'axios'
import Arrow from '@material-ui/icons/ArrowRightAlt';

var count = -2;
var loadedContent = [];
var scheduleContent = [];
var updateCounter = -1;
var test = [];
var reduce = 0;
var videos = [];  
var vids = [];
var start = moment().utcOffset(0);
var newStart = moment().utcOffset(0);
start.set({hour:0,minute:0,second:0,millisecond:0})
var finish = moment().set({hour:23,minute:59,second:59,millisecond:59}).utcOffset(0).format();


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
    this.getCrid = this.getCrid.bind(this);
    
  }

  getCrid(item) {
    var idType = '';
    item.identifiers.identifier.forEach(id => {
      
      if(id.type === 'crid'){
        idType = id.$
      }
    })
   return idType;
  }
    savePlaylist(){
      test  = [];
     var end =  moment.utc(loadedContent[loadedContent.length - 1].startTime, "HH:mm:ss").add(moment.duration(loadedContent[loadedContent.length - 1].duration)._milliseconds, 'milliseconds').format()
     
      for(let i =0; i < loadedContent.length; i++){
           newStart.set({hour:loadedContent[i].startTime.charAt(0) + loadedContent[i].startTime.charAt(1),
            minute:loadedContent[i].startTime.charAt(3) + loadedContent[i].startTime.charAt(4),
            second:loadedContent[i].startTime.charAt(6) + loadedContent[i].startTime.charAt(7)})
           test.push( {
              "broadcast_of": loadedContent[i].versionPid,
              "broadcast_of_crid": this.getCrid(loadedContent[i]),
              "start": newStart.format(),
              "duration": loadedContent[i].duration,
              "live": loadedContent[i].isLive, 
              //"entity_type": "clip" (when its an episode it will have episode in there, if clip it will be CLIP)
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
    videos.pop()
      for(let i = 0; i < content.length; i++){

        if(content[i].isLive === false && loadedContent.length === 0){
          content[i].startTime = moment.utc("00:00", "HH:mm:ss").format("HH:mm:ss");
          content[i].id = count += 1;
          loadedContent.push(content[i]);
         
          
        }else if (content[i].isLive === true ){
          content[i].id = count += 1;
          loadedContent.push(content[i]);
        
        
        
      }else{
          
          content[i].startTime = moment.utc(loadedContent[loadedContent.length - 1].startTime, "HH:mm:ss").add(moment.duration(loadedContent[loadedContent.length - 1].duration)._milliseconds, 'milliseconds').format("HH:mm:ss");
          content[i].id = count += 1;
          loadedContent.push(content[i])

        }
        
       videos.push( <SingleSchedule title={loadedContent[loadedContent.length - 1].title} startTime = {loadedContent[loadedContent.length - 1].startTime}
       duration={loadedContent[loadedContent.length - 1].duration} deleteItem = {this.props.deleteItem} id = {loadedContent[loadedContent.length - 1].id} />)
       
      }
      videos.push( <SingleSchedule select="Chosen" />)
      this.setState({refresh: 1})
      
  }
  componentDidUpdate(prevProps){  
    
    if(prevProps.dataLength !== (this.props.dataLength - reduce)){
      updateCounter++;
       videos.pop()
      

      scheduleContent = this.props.data;
      
      console.log("update counter - reduce", updateCounter - 1)
      console.log("props length", this.props.dataLength)
      console.log("props length + reduce", this.props.dataLength - reduce)
      console.log("loaded COntent", loadedContent)
      console.log('updateCounter', updateCounter)
      console.log('pp del', prevProps.dataLength - reduce)

      for(let i = updateCounter; i < (this.props.dataLength - reduce); i++){
        
       if(scheduleContent[i].isLive === false && videos.length === 0){
         scheduleContent[i].startTime = moment.utc("00:00", "HH:mm:ss").format("HH:mm:ss");
         scheduleContent[i].id = count += 1;
         loadedContent.push(scheduleContent[i]);
         this.setState({refresh: 1})
        
  
       }else if(scheduleContent[i].isLive === true){
        scheduleContent[i].id = count += 1;
        loadedContent.push(scheduleContent[i]);
        this.setState({refresh: 1})
       }
       
       else{
        
         scheduleContent[i].startTime = moment.utc(loadedContent[loadedContent.length - 1].startTime, "HH:mm:ss").add(moment.duration(scheduleContent[i - 1].duration)._milliseconds, 'milliseconds').format("HH:mm:ss");
         scheduleContent[i].id = count += 1;
         loadedContent.push(scheduleContent[i]);
         this.setState({refresh: 1})
       }
       
      videos.push( <SingleSchedule title={loadedContent[loadedContent.length - 1].title} startTime = {loadedContent[loadedContent.length - 1].startTime}
      duration={loadedContent[loadedContent.length - 1].duration} deleteItem = {this.props.deleteItem} id = {loadedContent [loadedContent.length - 1].id} />)
      
     }

    videos.push( <SingleSchedule select="Chosen" />)
     
    }
    
   if (this.props.remove !== prevProps.remove) {

  
    for(let i = 0; i < loadedContent.length; i++){

      if(loadedContent[i].id  === this.props.remove){
        videos = [];
        loadedContent.splice(i, 1)
        updateCounter--;
        reduce++;
        this.setState({refresh: 1})
      }
    }
    if(loadedContent.length > 0){
  
      loadedContent[0].startTime = moment.utc("00:00", "HH:mm:ss").format("HH:mm:ss");
    

      videos.push( <SingleSchedule title={loadedContent[0].title} startTime = {loadedContent[0].startTime}
        duration={loadedContent[0].duration} deleteItem = {this.props.deleteItem} id = {loadedContent[0].id} />)
        
        }
        for(let i = 1; i < loadedContent.length; i++){
          
          if(loadedContent[i].isLive !== true){
            loadedContent[i].startTime = moment.utc(loadedContent[i - 1].startTime, "HH:mm:ss").add(moment.duration(loadedContent[i - 1].duration)._milliseconds, 'milliseconds').format("HH:mm:ss");
            videos.push( <SingleSchedule title={loadedContent[i].title} startTime = {loadedContent[i].startTime}
              duration={loadedContent[i].duration} deleteItem = {this.props.deleteItem} id = {loadedContent [i].id} />)
              
              this.setState({refresh: 1})
          }
    
   }
   videos.push( <SingleSchedule select="Chosen" />)

  }
  }
    render() { 
   console.log(loadedContent)

     return (
       
      
        <div>
            
          <center><h2>{this.props.text}Schedule</h2></center>
          <table className="ui compact celled definition table">
        <thead>
            <tr>
            <th>Select</th>
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
              <th colSpan="6">
        
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