import React from "react";
import SingleSchedule from "../SingleSchedule/SingleSchedule";
import moment from "moment";
import axios from "axios";
import { isTaggedTemplateExpression } from "typescript";

var count = -2;
const tvaStart = "<TVAMain xmlns=\"urn:tva:metadata:2007\" xmlns:mpeg7=\"urn:tva:mpeg7:2005\" xmlns:xsi=\"http://www.w3.org/2001/XMLSchema-instance\" xml:lang=\"en-GB\" xsi:schemaLocation=\"urn:tva:metadata:2007 tva_metadata_3-1_v141.xsd\">\n  <ProgramDescription>\n";
const tvaEnd = "  </ProgramDescription>\n</TVAMain>";
var items = [];


class Schedule extends React.Component {

  constructor(props) {
    super(props);
    this.savePlaylist = this.savePlaylist.bind(this);
    this.pasteContent = this.pasteContent.bind(this);
    this.deleteItem = this.deleteItem.bind(this);
    this.makeScheduleEvent = this.makeScheduleEvent.bind(this);
    this.addScheduleItem = this.addScheduleItem.bind(this);
    this.deleteScheduleItems = this.deleteScheduleItems.bind(this);

    this.state = {
      spinner: false,
      text: null,
      serviceIDRef: null,
      refresh: 2,
      data: [],
      savePlaylist: "ui right floated small primary labeled icon button",
      status: "Save Playlist",
      index: null,
      preRenderedItem: []
    };
  }
  componentDidMount() {
    for (let i = 0; i < this.props.data.length; i++) {
      
      items.push(
        <SingleSchedule
          fetchTime={this.props.fetchTime}
          title={this.props.data[i].title}
          startTime={this.props.data[i].startTime}
          duration={this.props.data[i].duration}
          deleteItem={this.deleteItem}
          id={this.props.data[i].id}
          flag={false}
          live={this.props.data[i].live}
        />
      );
    }
    this.setState({ index: null});
    this.setState({ serviceIDRef: this.props.serviceIDRef });
    this.setState({ data: this.state.data.concat(this.props.data) })
    this.setState({ preRenderedItem: items })
  }

  savePlaylist() {

    const data = this.state.data;

    if(data.length === 0) {
      console.log('nothing to save - button should be disabled');
      return;
    }

    this.setState({
      savePlaylist: "ui right floated primary loading button"
    });

    const first = data[0];
    const last = data[data.length - 1];

    const start = moment.utc(first.startTime, "HH:mm:ss")
    const end = moment
      .utc(last.startTime, "HH:mm:ss")
      .add(moment.duration(last.duration));
  
    let tva = tvaStart + 
    "    <ProgramLocationTable>\n" +
    `      <Schedule start="${start.format()}" end="${end.format()}" serviceIDRef="${this.props.serviceIDRef}">`;
    for (let i = 0; i < data.length; i++) {
      tva += this.makeScheduleEvent(this.props.serviceIDRef, data[i]);
    }
    tva += "\n      </Schedule>\n    </ProgramLocationTable>\n" +
      tvaEnd;
    console.log(tva);

    axios({
      method: "post",
      url: "/api/v1/tva",
      data: tva
    })
    .then(response => {
      this.setState({
        savePlaylist: "ui right floated positive button active"
      });
      this.setState({ status: "Playlist Saved" });
    })
    .catch(error => {
      this.setState({
        savePlaylist: "ui right floated small primary labeled icon button"
      });
      this.setState({ status: "Save Playlist" });
      alert("Error Saving Playlist");
    });
  }

  makeScheduleEvent(serviceIDRef, broadcast) {

    const startDateTime = moment.utc(broadcast.startTime, "HH:mm:ss")

    let imi = "imi:dazzler:"+serviceIDRef+"/"+startDateTime.unix();

    // TODO put capture channel into the broadcast somewhere

    return ` 
        <ScheduleEvent>
          <Program crid="${broadcast.versionCrid}"/>
            <InstanceMetadataId>${imi}</InstanceMetadataId>
            <InstanceDescription>
              <AVAttributes>
                <AudioAttributes><MixType href="urn:mpeg:mpeg7:cs:AudioPresentationCS:2001:3"><Name>Stereo</Name></MixType></AudioAttributes>
                <VideoAttributes><AspectRatio>16:9</AspectRatio><Color type="color"/></VideoAttributes>
              </AVAttributes>
            </InstanceDescription>
            <PublishedStartTime>${startDateTime.format()}</PublishedStartTime>
            <PublishedDuration>${broadcast.duration}</PublishedDuration>
            <Live value="${broadcast.live === "live" ? true : false}"/>
            <Repeat value="${false}"/>
            <Free value="true"/>
        </ScheduleEvent>
      `;
  }

  addItemPosition(item) {
    if (item.isLive) {
      item.live = "live";
    }
    else {
      if(this.state.data.length === 0) {
        item.startTime = moment
        .utc("00:00", "HH:mm:ss")
        .format("HH:mm:ss");
      }
      else {
        const lastItem = this.state.data[this.state.data.length-1];
        item.startTime = moment
        .utc(lastItem.startTime, "HH:mm:ss")
        .add(
          moment.duration(lastItem.duration)
        )
        .format("HH:mm:ss");
      }
    }
    item.id = count += 1;
  }

  pasteContent(content) {
    let items = [];
    for (let i = 0; i < content.length; i++) {
      this.addItemPosition(content[i]);

      items.push(
        <SingleSchedule
          fetchTime={this.props.fetchTime}
          title={content[i].title}
          startTime={content[i].startTime}
          duration={content[i].duration}
          deleteItem={this.deleteItem}
          id={content[i].id}
          live={content[i].live}
        />
      );
      }
    this.setState({ serviceIDRef: this.props.serviceIDRef });
    this.setState({ status: "Save Playlist" });
    this.setState({ data: this.state.data.concat(content) })
    this.setState({ preRenderedItem: items })
  }

  addScheduleItem(prevPropsLength){
    let items = []
    this.setState({ data: this.state.data.concat(this.props.data) })
    // this.props.data.length === ? scheduleContent = newData : scheduleContent = this.props.data

    let newData = [];
    let lastEndTime = '';

    for (let i = prevPropsLength; i < this.props.length; i++) {
      this.addItemPosition(this.props.data[i]);
      newData.push(this.props.data[i]);
      //setting the end time
      i >= 1 ? lastEndTime = moment
      .utc(this.props.data[i - 1].startTime, "HH:mm:ss")
      .add(
        moment.duration(this.props.data[i - 1].duration)
      )
      .format("HH:mm:ss"): lastEndTime = false;
      
      items.push(
        <SingleSchedule
          fetchTime={this.props.fetchTime}
          title={this.props.data[i].title}
          startTime={this.props.data[i].startTime}
          duration={this.props.data[i].duration}
          deleteItem={this.props.deleteItem}
          id={this.props.data[i].id}
          live={this.props.data[i].live}
        />
      );
        if ( lastEndTime > this.props.data[i].startTime ) {

            //highlight on the actual listing.
            alert(
              "Warning! Programme at " +
                newData[newData.length - 1].startTime +
                " will be cut short because of the Live Programme"
            );
          } else if (lastEndTime < this.props.data[i].startTime) {
            alert(
              "Warning! You have a gap in the schedule before the start of the LIVE programme"
            );
          }          
    }
   
    this.setState({ preRenderedItem: this.state.preRenderedItem.concat(items) })
    this.setState({ data: this.state.data.concat(this.props.data) })
  }
  deleteScheduleItems(){
    this.props.data.map((item, index) => {
      if (item.startTime == this.props.deleteId){
          // this.props.data.splice(index, 1)
          console.log("deletedID is " + this.props.deleteId)
          console.log("deletedID for this.props.data " + this.props.data[index].startTime)
          // console.log("deletedID for items " + items[index].startTime)
          console.log("items is ", items)
          console.log("deletedID for this.state.data " + this.state.data[index].startTime)
          }
      })
      }


  


  componentDidUpdate(prevProps) {
    let items = [];
    switch(true) {

      case prevProps.length < this.props.length:
          this.addScheduleItem(prevProps.length)
          break;
    
      case prevProps.deleteId !== this.props.deleteId:
          this.deleteScheduleItems()
        break
    }

    // if (prevProps.clipTime !== this.props.clipTime) {
    //   for (let i = 0; i < this.props.data.length; i++) {
    //     if (
    //       this.props.data[i].id === this.props.clipTime &&
    //       this.props.data[i].flag !== true &&
    //       this.props.data[i].isLive !== true
    //     ) {
    //       if (this.props.data[i].style === "blankScheduleItem") {
    //         items.push(
    //           <SingleSchedule
    //             flag={true}
    //             fetchTime={this.props.fetchTime}
    //             deleteItem={this.deleteItem}
    //             style="blankScheduleItem"
    //             duration={this.props.data[i].duration}
    //             id={this.props.data[i].id}
    //           />
    //         );
    //         this.setState({ index: i });
    //       } else {
    //         items.push(
    //           <SingleSchedule
    //             fetchTime={this.props.fetchTime}
    //             title={this.props.data[i].title}
    //             startTime={this.props.data[i].startTime}
    //             duration={this.props.data[i].duration}
    //             deleteItem={this.deleteItem}
    //             id={this.props.data[i].id}
    //             flag={true}
    //             border="border_bottom"
    //           />
    //         );
    //         this.setState({ index: i });
    //       }
    //     } else {
    //       items.push(
    //         <SingleSchedule
    //           fetchTime={this.props.fetchTime}
    //           title={this.props.data[i].title}
    //           startTime={this.props.data[i].startTime}
    //           duration={this.props.data[i].duration}
    //           deleteItem={this.deleteItem}
    //           id={this.props.data[i].id}
    //           flag={false}
    //         />
    //       );
    //     }
    //   }
    // }
    // if (prevProps.length < this.props.length) {
    //     this.addScheduleItem(prevProps.length)
    // }else if (prevProps.length > this.props.length){
    //       this.props.data.map((item, index) => {
    //         if(item.startTime == item.clipTime){
    //           alert(this.props.clipTime);
    //         }
    //       });
    // }

        
        
      // }
    
      //   if (false !== null) { // TODO
      //     var currentStartTime = moment(
      //       newData[this.state.index].startTime,
      //       "HH:mm:ss"
      //     )
      //     .add(
      //       moment.duration(newData[this.state.index].duration)                
      //     )
      //     .format("HH:mm:ss");
      //     //  var newTime = (moment.duration(newData[newData.length - 1].duration)._milliseconds, 'milliseconds').format("HH:mm:ss");

      //     if (
      //       newData[this.state.index + 1].isLive === true &&
      //       moment(currentStartTime, "HH:mm:ss")
      //         .add(
      //           moment.duration(
      //             newData[newData.length - 1].duration
      //           )
      //         )
      //         .format("HH:mm:ss") <
      //         newData[this.state.index + 1].startTime
      //     ) {
      //       newData.pop();
      //       items.splice(
      //         this.state.index,
      //         0,
      //         <SingleSchedule
      //           fetchTime={this.props.fetchTime}
      //           title={newData[newData.length - 1].title}
      //           startTime={newData[newData.length - 1].startTime}
      //           duration={newData[newData.length - 1].duration}
      //           deleteItem={this.deleteItem}
      //           id={newData[newData.length - 1].id}
      //         />
      //       );
      //       newData.splice(this.state.index, 0, this.props.data[i]);
      //       items.splice(this.state.index, items.length);
      //       for (let j = this.state.index; j < newData.length; j++) {
      //         if (j === 0) {
      //           newData[j].startTime = moment
      //             .utc("00:00", "HH:mm:ss")
      //             .format("HH:mm:ss");
      //           newData[j].id = count += 1;
      //         } else if (newData[j].isLive === true) {
      //           newData[j].live = "live";
      //         } else {
      //           newData[j].startTime = moment
      //             .utc(newData[j - 1].startTime, "HH:mm:ss")
      //             .add(
      //               moment.duration(newData[j - 1].duration)
      //             )
      //             .format("HH:mm:ss");
      //           newData[j].id = count += 1;
      //         }
      //         this.props.data.map((item, idx) => {
      //           if (item.title === newData[j].title) {
      //             if (item.available_versions !== undefined) {
      //               newData[j].duration =
      //                 item.available_versions.version[0].duration;
      //             } else {
      //               newData[j].duration = item.duration;
      //             }
      //           }
      //         });

      //         items.push(
      //           <SingleSchedule
      //             fetchTime={this.props.fetchTime}
      //             title={newData[j].title}
      //             startTime={newData[j].startTime}
      //             duration={newData[j].duration}
      //             deleteItem={this.deleteItem}
      //             id={newData[j].id}
      //             live={newData[j].live}
      //           />
      //         );
      //       }
      //     } else if (
      //       newData[this.state.index + 1].isLive === true &&
      //       moment(currentStartTime, "HH:mm:ss")
      //         .add(
      //           moment.duration(
      //             newData[newData.length - 1].duration
      //           )._milliseconds,
      //           "milliseconds"
      //         )
      //         .format("HH:mm:ss") >
      //         newData[this.state.index + 1].startTime
      //     ) {
      //       alert("Cannot move the live show, please review your changes");
      //       newData.pop();
      //       break;
      //     } else {
      //       newData.pop();
      //       items.splice(
      //         this.state.index,
      //         0,
      //         <SingleSchedule
      //           fetchTime={this.props.fetchTime}
      //           title={newData[newData.length - 1].title}
      //           startTime={newData[newData.length - 1].startTime}
      //           duration={newData[newData.length - 1].duration}
      //           deleteItem={this.deleteItem}
      //           id={newData[newData.length - 1].id}
      //         />
      //       );
      //       newData.splice(this.state.index, 0, this.props.data[i]);
      //       items.splice(this.state.index, items.length);
      //       for (let j = this.state.index; j < newData.length; j++) {
      //         if (j === 0) {
      //           newData[j].startTime = moment
      //             .utc("00:00", "HH:mm:ss")
      //             .format("HH:mm:ss");
      //           newData[j].id = count += 1;
      //         } else if (newData[j].isLive === true) {
      //           // DO nothing ???
      //         } else {
      //           newData[j].startTime = moment
      //             .utc(newData[j - 1].startTime, "HH:mm:ss")
      //             .add(
      //               moment.duration(newData[j - 1].duration)                     
      //             )
      //             .format("HH:mm:ss");
      //           newData[j].id = count += 1;
      //         }
      //         this.props.data.map((item, idx) => {
      //           if (item.title === newData[j].title) {
      //             if (item.available_versions !== undefined) {
      //               newData[j].duration =
      //                 item.available_versions.version[0].duration;
      //             } else {
      //               newData[j].duration = item.duration;
      //             }
      //           }
      //         });

      //         items.push(
      //           <SingleSchedule
      //             fetchTime={this.props.fetchTime}
      //             title={newData[j].title}
      //             startTime={newData[j].startTime}
      //             duration={newData[j].duration}
      //             deleteItem={this.deleteItem}
      //             id={newData[j].id}
      //             live={newData[j].live}
      //           />
      //         );
      //       }
      //     }
      //   } else {
      //     items.push(
      //       <SingleSchedule
      //         fetchTime={this.props.fetchTime}
      //         title={newData[newData.length - 1].title}
      //         startTime={newData[newData.length - 1].startTime}
      //         duration={newData[newData.length - 1].duration}
      //         deleteItem={this.deleteItem}
      //         id={newData[newData.length - 1].id}
      //         live={newData[newData.length - 1].live}
      //       />
      //     );
      //   }
      // }
      // this.setState({
      //   savePlaylist: "ui right floated small primary labeled icon button"
      // });
      // this.setState({ status: "Save Playlist" });
      // this.setState({ serviceIDRef: this.props.serviceIDRef });
      // this.setState({ data: this.state.data.concat(this.props.data) })
      // this.setState({ preRenderedItem: this.state.preRenderedItem.concat(items) })
      // }
    }

  deleteItem(id) {
    // TODO - 
    // 1) remove one item
    // 2) recalculate all start times
  }

  render() {
    return (
      <div>
        <div className="dateContainer">
          <h2>{this.props.text}Schedule</h2>
        </div>
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

          <tbody>{this.state.preRenderedItem}</tbody>
          <tfoot className="full-width">
            <tr>
              <th></th>
              <th colSpan="6">
                <div
                  className={this.state.savePlaylist}
                  onClick={this.savePlaylist}
                >
                  {this.state.status}
                </div>
                <div
                  className="ui left floated small primary labeled icon button"
                  onClick={() => {
                    this.pasteContent(this.props.pasted);
                  }}
                >
                  Paste
                </div>
              </th>
            </tr>
          </tfoot>
        </table>
      </div>
    );
  }
}
export default Schedule;
