import React from "react";
import SingleSchedule from "../SingleSchedule/SingleSchedule";
import axios from "axios";
import moment from "moment";

var returnedData = [];
var videos = [];
var prev;
var current = moment().utcOffset(0);
current.toISOString();
class NextSchedule extends React.Component {
 constructor(props){
  super(props);
  this.state = {
    broadcast: []
  };
 }
  componentDidMount() {
    alert(this.props.updatedItems.length)
    prev = moment(this.props.scheduleDate).isBefore(current.format())
      ? 1
      : null;
    var end = moment(this.props.scheduleDate)
      .set({ hour: 23, minute: 59, second: 59, millisecond: 59 })
      .utcOffset(0)
      .format();

      console.log(this.props.updatedItems)
      this.props.updatedItems.map((item, index)=>{
        videos.push(
                  <SingleSchedule
                  title={item.title}
                  startTime={moment(item.startTime).format("HH:mm:ss")}
                  duration={item.duration}
                  id={item.id}
                  />
                );

      })
      this.setState({broadcast: 1})
    // axios
    //   .get(
    //     "/api/v1/broadcast?sid=" + this.props.sid +
    //       "&start=" + this.props.scheduleDate +
    //       "&end=" + end
    //   )
    //   .then(response => {
    //     returnedData = response.data.items;
    //     for (let i = 0; i < returnedData.length; i++) {
    //       videos.push(
    //         <SingleSchedule
    //           title="From Broadcast"
    //           startTime={moment(returnedData[i].published_time.start).format(
    //             "HH:mm:ss"
    //           )}
    //           duration={returnedData[i].published_time.duration}
    //           prev={prev}
    //         />
    //       );
    //     }
    //     this.setState({
    //       broadcast: [...this.state.broadcast, videos]
    //     });
    //   })
      // .catch(e => {
      //   console.log(e);
      // });
  }
  componentDidUpdate(prevProps) {
    videos.splice(0, videos.length);

    this.props.updatedItems.map((item, index)=>{
      videos.push(
                <SingleSchedule
                title={item.title}
                startTime={moment(item.startTime).format("HH:mm:ss")}
                duration={item.duration}
                id={item.id}
                />
              );

    })

    // if (this.props.scheduleDate !== prevProps.scheduleDate) {
    //   prev = moment(this.props.scheduleDate).isBefore(current.format())
    //     ? 1
    //     : null;

    //   //alert('not the same')

    //   var end = moment(this.props.scheduleDate)
    //     .set({ hour: 23, minute: 59, second: 59, millisecond: 59 })
    //     .utcOffset(0)
    //     .format();
    //   axios
    //     .get(
    //       "/api/v1/broadcast?sid=" + this.props.sid +
    //         "&start=" + this.props.scheduleDate +
    //         "&end=" + end
    //     )
    //     .then(response => {
    //       returnedData = response.data.items;
    //       for (let i = 0; i < returnedData.length; i++) {
    //         videos.push(
    //           <SingleSchedule
    //             title="From Broadcast"
    //             startTime={moment(returnedData[i].published_time.start).format(
    //               "HH:mm:ss"
    //             )}
    //             duration={returnedData[i].published_time.duration}
    //             prev={prev}
    //           />
    //         );
    //       }
    //       this.setState({
    //         broadcast: [...this.state.broadcast, videos]
    //       });
    //     })
    //     .catch(e => {
    //       console.log(e);
    //     });
    // }
  }

  render() {
    return (
      <div>
        <center>
          <h2>{this.props.text} Schedule</h2>
        </center>
        <table className="ui compact celled definition table">
          <thead>
            <tr>
              <th></th>
              <th>Start</th>
              <th>Title</th>
              <th>Duration </th>
              <th>Action</th>
            </tr>
          </thead>

          <tbody>{videos}</tbody>
          <tfoot className="full-width">
            <tr>
              <th></th>
              <th colSpan="5">
                <div
                  className="ui right floated small primary labeled icon button"
                  onClick={this.savePlaylist}
                >
                  Save Playlist
                </div>
              </th>
            </tr>
          </tfoot>
        </table>
      </div>
    );
  }
}
export default NextSchedule;

