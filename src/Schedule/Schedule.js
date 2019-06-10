import React from 'react';
import SingleSchedule from '../SingleSchedule/SingleSchedule';
import moment from 'moment'
import axios from 'axios'
import xml2js from 'xml2js'

var count = -2;
var loadedContent = [];
var scheduleContent = [];
var test;
var videos = []; 
var newState = null; 
var start = moment().utcOffset(0);
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
    this.makeScheduleEvent = this.makeScheduleEvent.bind(this); 
    for(let i = 0; i < videos.length; i++) {
       videos[i] =  <SingleSchedule fetchTime = {this.props.fetchTime} title={loadedContent[i].title} startTime = {loadedContent[i].startTime}
        duration={loadedContent[i].duration} deleteItem = {this.deleteItem} id = {loadedContent[i].id} flag = {false} live={loadedContent[i].live} />
        var newState = null;
        this.setState({index : null})
    }
  }


    makeScheduleEvent(broadcast){
     
     console.log('broadcast', broadcast.nCrid)
      start.set({hour:broadcast.startTime.charAt(0) + broadcast.startTime.charAt(1),
        minute:broadcast.startTime.charAt(3) + broadcast.startTime.charAt(4),
        second:broadcast.startTime.charAt(6) + broadcast.startTime.charAt(7)})
        var end =  moment.utc(loadedContent[loadedContent.length - 1].startTime, "HH:mm:ss").add(moment.duration(loadedContent[loadedContent.length - 1].duration)._milliseconds, 'milliseconds').format()

      let imi ="imi:dazzler/"+(Date.parse(start)/1000);
      console.log('test', imi)
      let startXML = 
     `<TVAMain xmlns="urn:tva:metadata:2007" xmlns:mpeg7="urn:tva:mpeg7:2005" xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance" 
      xml:lang="en-GB" xsi:schemaLocation="urn:tva:metadata:2007 tva_metadata_3-1_v141.xsd">
      <ProgramDescription>
      <ProgramLocationTable>`;
      var endXML = "</Schedule></ProgramLocationTable></ProgramDescription></TVAMain>";
      return `${startXML}  
      <Schedule start="${start.format()}" end="${end}" serviceIDRef="TVMAR01">
        <ScheduleEvent>
          <Program crid="${broadcast.nCrid}"/>
            <InstanceMetadataId>${imi}</InstanceMetadataId>
            <InstanceDescription>
              <AVAttributes>
                <AudioAttributes><MixType href="urn:mpeg:mpeg7:cs:AudioPresentationCS:2001:3"><Name>Stereo</Name></MixType></AudioAttributes>
                <VideoAttributes><AspectRatio>16:9</AspectRatio><Color type="color"/></VideoAttributes>
              </AVAttributes>
            </InstanceDescription>
            <PublishedStartTime>${start.format()}</PublishedStartTime>
            <PublishedDuration>${broadcast.duration}</PublishedDuration>
            <Live value="${ broadcast.live === 'live'? true: false}"/>
            <Repeat value="${false}"/>
            <Free value="true"/>
      </ScheduleEvent> ${endXML}`
      
    }
    savePlaylist(){
      
      if(videos.length > 0){
        test  = [];
        let pids = new Set();
        var end =  moment.utc(loadedContent[loadedContent.length - 1].startTime, "HH:mm:ss").add(moment.duration(loadedContent[loadedContent.length - 1].duration)._milliseconds, 'milliseconds').format()
       
        loadedContent.forEach(item => {
          
        if(item.available_versions !== undefined){
        pids.add(item.available_versions.version[0].pid)
        }else{
          pids.add(item.versionPid)
        }
        })
        pids.forEach(async (i1)=>loadedContent.forEach(async (i2, idx)=>{
          if(i2.available_versions !== undefined && i1 === i2.available_versions.version[0].pid){ 
            await axios.get(`https://programmes.api.bbc.com/nitro/api/versions?api_key=tT0EI8LEPIQntUM1msXEgYkZECRAkoFC&pid=${i1}`).then(async(response) => {
              return await response;
          }).then(async(response)=>{
            xml2js.parseString(response.data, function (err, result) {
              loadedContent[idx].nCrid = result.nitro.results[0].version[0].identifiers[0].identifier[0]._
              // alert(loadedContent[idx].nCrid)
              // console.log('BOOOOOM', result.nitro.results[0].version[0].identifiers[0].identifier[0]._)
              // console.log('boooom', i1)
              // console.log('boom', idx)
            }); 
            }).catch(e => {
               console.log('error', e);
               alert('error b')
            });
          }else if(i1 === i2.versionPid){
            loadedContent[idx].nCrid = loadedContent[idx].window_of[0].crid
          }
        }))
  
         
          // test.push(;
           console.log('TVA', test)
     
    
  this.setState({savePlaylist: "ui right floated primary loading button"})
  for(let i = 0; i < loadedContent.length; i++){
         
    test += this.makeScheduleEvent(loadedContent[i])
  axios({
    method: 'post',
    url: "https://iqvp3l4nzg.execute-api.eu-west-1.amazonaws.com/live/tva",
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
  }
  pasteContent(content){
    alert(loadedContent.length)
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
      if(loadedContent.length > 0){
      //  console.log('loaded Content', loadedContent[0].identifiers.identifier[0].$)
      // console.log('test start time', loadedContent[0].startTime.replace(/:/g, ','))
      console.log('testLoadedContent', loadedContent)
      
      }
      
      
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