import React from 'react';
import SingleSchedule from './SingleSchedule';
import axios from 'axios';
import moment from 'moment';

var returnedData = [];
var videos = [];

class NextSchedule extends React.Component {
  state = {
    broadcast: []
  };
  componentDidUpdate(prevProps){
    videos.splice(0, videos.length)
    if (this.props.scheduleDate !== prevProps.scheduleDate) {
   
    //alert('not the same')
    var end = moment(this.props.scheduleDate).set({hour:23,minute:59,second:59,millisecond:59}).utcOffset(0).format();
    axios.get('https://iqvp3l4nzg.execute-api.eu-west-1.amazonaws.com/live/broadcast?sid=bbc_marathi_tv&start=' +
    this.props.scheduleDate + "&end=" + end).then((response) => {
      returnedData = response.data
      console.log('https://iqvp3l4nzg.execute-api.eu-west-1.amazonaws.com/live/broadcast?sid=bbc_marathi_tv&start=' +
      this.props.scheduleDate + "&end=" + end)
      console.log(returnedData)
      for(let i =0; i < returnedData.length; i++){
        
       
        videos.push( <SingleSchedule title="From Broadcast" startTime = {returnedData[i].published_time.start}
        duration={returnedData[i].published_time.duration}  />)
     
       }
       this.setState({
        broadcast: [...this.state.broadcast, videos]
      })
  
     
    }).catch(e => {
       console.log(e);
    });
  }
  
  }


    render() { 
      return (
        <div>
          <center><h2>{this.props.text} Schedule</h2></center>
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
export default NextSchedule;            