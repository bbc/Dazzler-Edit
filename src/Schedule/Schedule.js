import React from 'react';
import SingleSchedule from '../SingleSchedule/SingleSchedule';
import moment from 'moment'
import axios from 'axios'

var count = -2;
var loadedContent = [];
var scheduleContent = [];
var test = [];
var videos = [];  
var start = moment().utcOffset(0);
var newStart = moment().utcOffset(0);
start.set({hour:0,minute:0,second:0,millisecond:0})

class Schedule extends React.Component {

  state = {
    scheduleArray: [],
    text: null,
    refresh: 2,
    data: [],
    savePlaylist: "Save",
    index: null
  };

  componentDidMount(){
    
    var count = -2;
    this.savePlaylist = this.savePlaylist.bind(this);
    // this.selector = this.selector.bind(this);
    this.pasteContent = this.pasteContent.bind(this);    
    this.deleteItem = this.deleteItem.bind(this); 
    this.getCrid = this.getCrid.bind(this);  
  }

  getCrid(item) {
    var idType;
    item.identifiers.identifier.forEach(id => {

      if(id.type === 'crid'){
        idType = id.$
      } 
    })
   return idType;
  }
    savePlaylist(){
      this.setState({savePlaylist: "Saving"});
      test  = [];
     var end =  moment.utc(loadedContent[loadedContent.length - 1].startTime, "HH:mm:ss").add(moment.duration(loadedContent[loadedContent.length - 1].duration)._milliseconds, 'milliseconds').format()
     
      for(let i =0; i < loadedContent.length; i++){
           newStart.set({hour:loadedContent[i].startTime.charAt(0) + loadedContent[i].startTime.charAt(1),
            minute:loadedContent[i].startTime.charAt(3) + loadedContent[i].startTime.charAt(4),
            second:loadedContent[i].startTime.charAt(6) + loadedContent[i].startTime.charAt(7)})
            var payLoad = {
              "start": newStart.format(),
              "duration": moment.duration(loadedContent[i].duration).toIsoString(),
              "live": loadedContent[i].isLive, 
              //"entity_type": "clip" (when its an episode it will have episode in there, if clip it will be CLIP)
              "repeat": false
            }
            if(loadedContent[i].item_type === "clip"){
              payLoad.broadcast_of = loadedContent[i].versionPid;
              payLoad.broadcast_of_crid = this.getCrid(loadedContent[i])
            }
            if(loadedContent[i].item_type === "window"){
              loadedContent[i].window_of.forEach(id => {

                if(id.result_type === 'version'){
                  payLoad.broadcast_of = id.pid
                }
              });
            }
           test.push(payLoad);
     }
    

  axios({
    method: 'post',
    url: "https://iqvp3l4nzg.execute-api.eu-west-1.amazonaws.com/live/broadcasts?sid=bbc_marathi_tv&start="
    + start.format() + '&end=' + end,
    headers: {
      'Content-Type': 'application/json'
    },
    data: test,
   
    })
    .then(function (response) {
        this.setState({savePlaylist: "Saved"});
        alert('Saved')
    })
    .catch(function (error) {
        // alert('Error Saving')
    });

  }
  // selector(startTime){
    
  //   this.setState({index : null})
  //   for(let i = 0; i < videos.length; i++) {
  //     if(videos[i].props.startTime === startTime && videos[i].props.flag !== true){
      
  //      videos[i] =  <SingleSchedule title={loadedContent[i].title} startTime = {loadedContent[i].startTime}
  //       duration={loadedContent[i].duration} deleteItem = {this.deleteItem} handleClick ={this.handleClick} id = {loadedContent[i].id} flag = {true} border="border_bottom"/>
  //       this.setState({index : i})
  //       break;
       
  //     }else {
  //       videos[i] =  <SingleSchedule title={loadedContent[i].title} startTime = {loadedContent[i].startTime}
  //       duration={loadedContent[i].duration} deleteItem = {this.deleteItem} handleClick ={this.handleClick} id = {loadedContent[i].id} flag = {false} />
  //     }
  //   }
  //    this.setState({refresh : 1}) 
    
  // }
  pasteContent(content){
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
        
       videos.push( <SingleSchedule selector = {this.props.selector} title={loadedContent[loadedContent.length - 1].title} startTime = {loadedContent[loadedContent.length - 1].startTime}
       duration={loadedContent[loadedContent.length - 1].duration} deleteItem = {this.deleteItem} id = {loadedContent[loadedContent.length - 1].id} />)
      }
      this.setState({refresh: 1})
  }
  deleteItem(id){

      videos.map((item, idx) => {
        if(item.props.startTime === id){
          videos[idx] = <SingleSchedule selector = {this.props.selector} deleteItem = {this.deleteItem} style = "blankScheduleItem" duration={loadedContent[idx].duration} id = {loadedContent[idx].id} />
          this.forceUpdate();
          return;
          
        }
    });
    videos.map((item, idx) => {
      if(item.props.id === id){
        videos.splice(idx, videos.length)
        loadedContent.splice(idx, 1)
        for(let i = idx; i < loadedContent.length; i++){
          if(idx > 0){ 
          loadedContent[i].startTime = moment.utc(loadedContent[i - 1].startTime, "HH:mm:ss").add(moment.duration(loadedContent[i - 1].duration)._milliseconds, 'milliseconds').format("HH:mm:ss");
          videos.push( <SingleSchedule selector = {this.props.selector} title={loadedContent[i].title} startTime = {loadedContent[i].startTime}
            duration={loadedContent[i].duration} deleteItem = {this.deleteItem} id = {loadedContent[i].id} />)
        }}
        this.setState({refresh: 1})
      } 
  });
  }
  componentDidUpdate(prevProps){  
  
    if(prevProps.dataLength !== this.props.dataLength){
     
// why is dataLength different to data.length??
 
      scheduleContent = this.props.data;
      

      for(let i = prevProps.dataLength; i < this.props.dataLength; i++){
        
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
       if(this.state.index !== null && loadedContent[this.state.index].isLive === false || undefined){
         
        videos.splice(this.state.index + 1, 0, <SingleSchedule title={loadedContent[loadedContent.length - 1].title} startTime = {loadedContent[loadedContent.length - 1].startTime}
         duration={loadedContent[loadedContent.length - 1].duration} deleteItem = {this.deleteItem} id = {loadedContent[loadedContent.length - 1].id} handleClick ={this.handleClick}/>)
        
         loadedContent.splice(this.state.index + 1, 0, scheduleContent[i]);
        }else{
          console.log(videos)
     videos.push( <SingleSchedule title={loadedContent[loadedContent.length - 1].title} startTime = {loadedContent[loadedContent.length - 1].startTime}
     duration={loadedContent[loadedContent.length - 1].duration} deleteItem = {this.deleteItem} id = {loadedContent[loadedContent.length - 1].id} handleClick ={this.handleClick} />)
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