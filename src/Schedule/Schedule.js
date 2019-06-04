import React from 'react';
import SingleSchedule from '../SingleSchedule/SingleSchedule';
import moment from 'moment'
import axios from 'axios'

var count = -2;
var loadedContent = [];
var scheduleContent = [];
var test = [];
var videos = []; 
var newState = null; 
var start = moment().utcOffset(0);
var newStart = moment().utcOffset(0);
start.set({hour:0,minute:0,second:0,millisecond:0})

class Schedule extends React.Component {

  state = {
    spinner: false,
    text: null,
    refresh: 2,
    data: [],
    savePlaylist: "ui right floated small primary labeled icon button",
    status: "Save Playlist",
    index: null
  };

  componentDidMount(){
  
    var count = -2;
    this.savePlaylist = this.savePlaylist.bind(this);
    this.pasteContent = this.pasteContent.bind(this);    
    this.deleteItem = this.deleteItem.bind(this); 
    this.getCrid = this.getCrid.bind(this);  
    for(let i = 0; i < videos.length; i++) {
       videos[i] =  <SingleSchedule fetchTime = {this.props.fetchTime} title={loadedContent[i].title} startTime = {loadedContent[i].startTime}
        duration={loadedContent[i].duration} deleteItem = {this.deleteItem} id = {loadedContent[i].id} flag = {false} live={loadedContent[i].live} />
        var newState = null;
        this.setState({index : null})
    }
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
      if(videos.length > 0){
      test  = [];
     var end =  moment.utc(loadedContent[loadedContent.length - 1].startTime, "HH:mm:ss").add(moment.duration(loadedContent[loadedContent.length - 1].duration)._milliseconds, 'milliseconds').format()
     
      for(let i = 0; i < loadedContent.length; i++){
           newStart.set({hour:videos[i].props.startTime.charAt(0) + videos[i].props.startTime.charAt(1),
            minute:videos[i].props.startTime.charAt(3) + videos[i].props.startTime.charAt(4),
            second:videos[i].props.startTime.charAt(6) + videos[i].props.startTime.charAt(7)})
            var payLoad = {
              "start": newStart.format(),
              "duration": moment.duration(videos[i].props.duration).toIsoString(),
              "live": videos[i].props.live === 'live' ? true: false,
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
    
  this.setState({savePlaylist: "ui right floated primary loading button"})
     
  axios({
    method: 'post',
    url: "https://iqvp3l4nzg.execute-api.eu-west-1.amazonaws.com/live/broadcasts?sid=bbc_marathi_tv&start="
    + start.format() + '&end=' + end,
    headers: {
      'Content-Type': 'application/json'
    },
    data: test,
   
    })
    .then(response => {
     this.setState({savePlaylist: "ui right floated positive button active"})
     this.setState({status: 'Playlist Saved'})
    })
    .catch(error => {
      this.setState({savePlaylist: 'ui right floated small primary labeled icon button'})
      this.setState({status: "Save Playlist"})
      alert('Error Saving Playlist')
    });
    
  }
    }
  pasteContent(content){
    for(let i = 0; i < content.length; i++){

      if(content[i].isLive === false && loadedContent.length === 0){
        content[i].startTime = moment.utc("00:00", "HH:mm:ss").format("HH:mm:ss");
        content[i].id = count += 1;
        loadedContent.push(content[i]);
      }else if (content[i].isLive === true ){
        content[i].live = 'live'
        content[i].id = count += 1;
        loadedContent.push(content[i]);
    }else{
        
        content[i].startTime = moment.utc(loadedContent[loadedContent.length - 1].startTime, "HH:mm:ss").add(moment.duration(loadedContent[loadedContent.length - 1].duration)._milliseconds, 'milliseconds').format("HH:mm:ss");
        content[i].id = count += 1;
        loadedContent.push(content[i])
      }
      
     videos.push( <SingleSchedule fetchTime = {this.props.fetchTime} title={loadedContent[loadedContent.length - 1].title} startTime = {loadedContent[loadedContent.length - 1].startTime}
     duration={loadedContent[loadedContent.length - 1].duration} deleteItem = {this.deleteItem} id = {loadedContent[loadedContent.length - 1].id} live={loadedContent[loadedContent.length - 1].live} />)
    }
    // for(let i = 0; i< loadedContent.length; i++){
      
    //   loadedContent[i].startTime = videos[i].props.startTime
 
    // }

    this.setState({savePlaylist: "ui right floated small primary labeled icon button"})
    this.setState({status: "Save Playlist"})
}
  deleteItem(id){

      videos.map((item, idx) => {
        if(item.props.startTime === id){
          videos[idx] = <SingleSchedule fetchTime = {this.props.fetchTime} deleteItem = {this.deleteItem} style = "blankScheduleItem" duration={loadedContent[idx].duration} id = {loadedContent[idx].id} />
          this.forceUpdate();
          return;
          
        }
    });
    videos.map((item, idx) => {
      if(item.props.id === id){
        videos.splice(idx, videos.length)
        loadedContent.splice(idx, 1)
        for(let i = idx; i < loadedContent.length; i++){
          if(i === 0){
            loadedContent[i].startTime = moment.utc("00:00", "HH:mm:ss").format("HH:mm:ss");
        }else if(loadedContent[i].isLive === true){
          
        }else{
          loadedContent[i].startTime = moment.utc(loadedContent[i - 1].startTime, "HH:mm:ss").add(moment.duration(loadedContent[i - 1].duration)._milliseconds, 'milliseconds').format("HH:mm:ss");
        }
          videos.push( <SingleSchedule fetchTime = {this.props.fetchTime} title={loadedContent[i].title} startTime = {loadedContent[i].startTime}
            duration={loadedContent[i].duration} deleteItem = {this.deleteItem} id = {loadedContent[i].id} live={loadedContent[i].live} />)
        }
        this.setState({refresh: 1})
      } 
  });
  }
  componentDidUpdate(prevProps){  

    if(prevProps.clipTime !== this.props.clipTime){
    for(let i = 0; i < videos.length; i++) {
      if(videos[i].props.id === this.props.clipTime && videos[i].props.flag !== true && videos[i].props.isLive !== true){

        if(videos[i].props.style === 'blankScheduleItem'){
          videos[i] = <SingleSchedule flag = {true} fetchTime = {this.props.fetchTime} deleteItem = {this.deleteItem} style = "blankScheduleItem" duration={loadedContent[i].duration} id = {loadedContent[i].id} />
          var newState = i;
          this.setState({index : i})
        }else{
     
       videos[i] =  <SingleSchedule fetchTime = {this.props.fetchTime} title={loadedContent[i].title} startTime = {loadedContent[i].startTime}
        duration={loadedContent[i].duration} deleteItem = {this.deleteItem} id = {loadedContent[i].id} flag = {true} border="border_bottom"/>
        var newState = i;
        this.setState({index : i})
        }
        
      }else {
        videos[i] =  <SingleSchedule fetchTime = {this.props.fetchTime} title={loadedContent[i].title} startTime = {loadedContent[i].startTime}
        duration={loadedContent[i].duration} deleteItem = {this.deleteItem} id = {loadedContent[i].id} flag = {false} />
      }
    }
    }else{
      var newState = null;
    }
    if(prevProps.dataLength !== this.props.dataLength){
     
// why is dataLength different to data.length??
 
      scheduleContent = this.props.data;
      
      // this.props.data.length === ? scheduleContent = loadedContent : scheduleContent = this.props.data

      for(let i = prevProps.dataLength; i < this.props.dataLength; i++){
        
       if(scheduleContent[i].isLive === false && videos.length === 0){
         scheduleContent[i].startTime = moment.utc("00:00", "HH:mm:ss").format("HH:mm:ss");
         scheduleContent[i].id = count += 1;
         loadedContent.push(scheduleContent[i]);
         this.setState({savePlaylist: "ui right floated small primary labeled icon button"})
         this.setState({status: "Save Playlist"})
    

       }else if(scheduleContent[i].isLive === true && videos.length !== 0){
            if(moment(loadedContent[loadedContent.length - 1].startTime, "HH:mm:ss").
            add(moment.duration(loadedContent[loadedContent.length - 1].duration)._milliseconds, 'milliseconds').format("HH:mm:ss")
            > scheduleContent[i].startTime){
              //highlight on the actual listing.
              alert('Warning! Programme at ' + loadedContent[loadedContent.length - 1].startTime +  " will be cut short because of the Live Programme")
             
            }else if(moment(loadedContent[loadedContent.length - 1].startTime, "HH:mm:ss").
            add(moment.duration(loadedContent[loadedContent.length - 1].duration)._milliseconds, 'milliseconds').format("HH:mm:ss")
            < scheduleContent[i].startTime){
              alert('Warning! You have a gap in the schedule before the start of the LIVE programme')
            }
            scheduleContent[i].id = count += 1;
            scheduleContent[i].live = 'live'
            loadedContent.push(scheduleContent[i]);
            this.setState({savePlaylist: "ui right floated small primary labeled icon button"})
            this.setState({status: "Save Playlist"})
       }
       
       else{
         if(scheduleContent[i].isLive === true && videos.length === 0){
          scheduleContent[i].id = count += 1;
          scheduleContent[i].live = 'live'
          loadedContent.push(scheduleContent[i]);
          this.setState({savePlaylist: "ui right floated small primary labeled icon button"})
          this.setState({status: "Save Playlist"})
         }else{
         scheduleContent[i].startTime = moment.utc(loadedContent[loadedContent.length - 1].startTime, "HH:mm:ss").add(moment.duration(loadedContent[loadedContent.length - 1].duration)._milliseconds, 'milliseconds').format("HH:mm:ss");
         scheduleContent[i].id = count += 1;
         scheduleContent.style = 'live'
         loadedContent.push(scheduleContent[i]);
         this.setState({savePlaylist: "ui right floated small primary labeled icon button"})
         this.setState({status: "Save Playlist"})
         }
       }
       
       if(newState !== null){
         var currentStartTime = moment(loadedContent[this.state.index].startTime, "HH:mm:ss").add(moment.duration(loadedContent[this.state.index].duration)._milliseconds, 'milliseconds').format("HH:mm:ss");
        //  var newTime = (moment.duration(loadedContent[loadedContent.length - 1].duration)._milliseconds, 'milliseconds').format("HH:mm:ss");
          
         if(loadedContent[this.state.index + 1].isLive === true &&
          moment(currentStartTime, "HH:mm:ss").add(moment.duration(loadedContent[loadedContent.length - 1].duration)._milliseconds, 'milliseconds').format("HH:mm:ss") 
          < loadedContent[this.state.index + 1].startTime)
              {
                
              loadedContent.pop()
              videos.splice(this.state.index, 0, <SingleSchedule fetchTime = {this.props.fetchTime} title={loadedContent[loadedContent.length - 1].title} startTime = {loadedContent[loadedContent.length - 1].startTime}
              duration={loadedContent[loadedContent.length - 1].duration} deleteItem = {this.deleteItem} id = {loadedContent[loadedContent.length - 1].id}/>)
              loadedContent.splice(this.state.index, 0, scheduleContent[i]);
              videos.splice(this.state.index, videos.length)
              for(let j = this.state.index; j < loadedContent.length; j++){
                if(j == 0){
                loadedContent[j].startTime = moment.utc("00:00", "HH:mm:ss").format("HH:mm:ss");
                loadedContent[j].id = count+=1;
                }
                else if(loadedContent[j].isLive === true){
                  loadedContent[j].live = 'live'
                }
                else{
                loadedContent[j].startTime = moment.utc(loadedContent[j - 1].startTime, "HH:mm:ss").add(moment.duration(loadedContent[j - 1].duration)._milliseconds, 'milliseconds').format("HH:mm:ss");
                loadedContent[j].id = count+=1;
                }
                this.props.data.map((item, idx) => {
                  if(item.title === loadedContent[j].title){
                    if(item.available_versions !== undefined){
                    loadedContent[j].duration = item.available_versions.version[0].duration
                    }else{
                      loadedContent[j].duration = item.duration
                    }
                  }
              });
    
                videos.push( <SingleSchedule fetchTime = {this.props.fetchTime} title={loadedContent[j].title} startTime = {loadedContent[j].startTime}
                duration={loadedContent[j].duration} deleteItem = {this.deleteItem} id = {loadedContent[j].id} live = {loadedContent[j].live}/>)
              }
          }else if (loadedContent[this.state.index + 1].isLive === true &&
            moment(currentStartTime, "HH:mm:ss").add(moment.duration(loadedContent[loadedContent.length - 1].duration)._milliseconds, 'milliseconds').format("HH:mm:ss") 
          > loadedContent[this.state.index + 1].startTime)
            {
             
              alert("Cannot move the live show, please review your changes")
              loadedContent.pop()
              break
          }else{
          loadedContent.pop()
         videos.splice(this.state.index, 0, <SingleSchedule fetchTime = {this.props.fetchTime} title={loadedContent[loadedContent.length - 1].title} startTime = {loadedContent[loadedContent.length - 1].startTime}
          duration={loadedContent[loadedContent.length - 1].duration} deleteItem = {this.deleteItem} id = {loadedContent[loadedContent.length - 1].id}/>)
          loadedContent.splice(this.state.index, 0, scheduleContent[i]);
          videos.splice(this.state.index, videos.length)
          for(let j = this.state.index; j < loadedContent.length; j++){
            if(j == 0){
            loadedContent[j].startTime = moment.utc("00:00", "HH:mm:ss").format("HH:mm:ss");
            loadedContent[j].id = count+=1;
            }
            else if(loadedContent[j].isLive === true){
              
            }
            else{
            loadedContent[j].startTime = moment.utc(loadedContent[j - 1].startTime, "HH:mm:ss").add(moment.duration(loadedContent[j - 1].duration)._milliseconds, 'milliseconds').format("HH:mm:ss");
            loadedContent[j].id = count+=1;
            }
            this.props.data.map((item, idx) => {
              if(item.title === loadedContent[j].title){
                if(item.available_versions !== undefined){
                loadedContent[j].duration = item.available_versions.version[0].duration
                }else{
                  loadedContent[j].duration = item.duration
                }
              }
          });

            videos.push( <SingleSchedule fetchTime = {this.props.fetchTime} title={loadedContent[j].title} startTime = {loadedContent[j].startTime}
            duration={loadedContent[j].duration} deleteItem = {this.deleteItem} id = {loadedContent[j].id} live = {loadedContent[j].live} />)
          }
        }
         }else{
           
      videos.push(<SingleSchedule fetchTime = {this.props.fetchTime} title={loadedContent[loadedContent.length - 1].title} startTime = {loadedContent[loadedContent.length - 1].startTime}
      duration={loadedContent[loadedContent.length - 1].duration} deleteItem = {this.deleteItem} id = {loadedContent[loadedContent.length - 1].id} live={loadedContent[loadedContent.length - 1].live} />)
       } 
      }
    }
}
    render() { 
      console.log('videos', videos)
     return (

        <div>
            
            <div className = 'dateContainer'><h2>{this.props.text}Schedule</h2></div>
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
                <div className={this.state.savePlaylist} onClick={this.savePlaylist}>
                  {this.state.status}
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