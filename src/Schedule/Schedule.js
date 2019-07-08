import React from "react";
import SingleSchedule from "../SingleSchedule/SingleSchedule";
import moment from "moment";
import axios from "axios";

var count = -2;
var loadedContent = [];
var scheduleContent = [];
const tvaStart = "<TVAMain xmlns=\"urn:tva:metadata:2007\" xmlns:mpeg7=\"urn:tva:mpeg7:2005\" xmlns:xsi=\"http://www.w3.org/2001/XMLSchema-instance\" xml:lang=\"en-GB\" xsi:schemaLocation=\"urn:tva:metadata:2007 tva_metadata_3-1_v141.xsd\"><ProgramDescription>";
const tvaEnd = "</ProgramDescription></TVAMain>";
var videos = [];

class Schedule extends React.Component {
  state = {
    spinner: false,
    text: null,
    serviceIDRef: null,
    refresh: 2,
    data: [],
    savePlaylist: "ui right floated small primary labeled icon button",
    status: "Save Playlist",
    index: null
  };

  componentDidMount() {
    this.savePlaylist = this.savePlaylist.bind(this);
    this.pasteContent = this.pasteContent.bind(this);
    this.deleteItem = this.deleteItem.bind(this);
    this.makeScheduleEvent = this.makeScheduleEvent.bind(this);
    for (let i = 0; i < videos.length; i++) {
      videos[i] = (
        <SingleSchedule
          fetchTime={this.props.fetchTime}
          title={loadedContent[i].title}
          startTime={loadedContent[i].startTime}
          duration={loadedContent[i].duration}
          deleteItem={this.deleteItem}
          id={loadedContent[i].id}
          flag={false}
          live={loadedContent[i].live}
        />
      );
      this.setState({ index: null });
    }
  }

  makeScheduleEvent(broadcast) {

    const startDateTime = moment.utc(broadcast.startTime, "HH:mm:ss")

    let imi = `imi:dazzler:${this.state.serviceIDRef}/{startDateTime.unix()}`;

    return ` 
        <ScheduleEvent>
          <Program crid="${broadcast.nCrid}"/>
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
      </ScheduleEvent>`;
  }

  savePlaylist() {

    if(loadedContent.length == 0) {
      console.log('nothing to save - button should be disabled');
      return;
    }

    this.setState({
      savePlaylist: "ui right floated primary loading button"
    });

    const first = loadedContent[0];
    const last = loadedContent[loadedContent.length - 1];

    const start = moment.utc(first.startTime, "HH:mm:ss")
    const end = moment
      .utc(last.startTime, "HH:mm:ss")
      .add(moment.duration(last.duration));
  
    let events = "";
    for (let i = 0; i < loadedContent.length; i++) {
      events += this.makeScheduleEvent(loadedContent[i]);
    }
  
    const scheduleStart = `<ProgramLocationTable><Schedule start="${start.format()}" end="${end.format()}" serviceIDRef="${this.state.serviceIDRef}">`;
    const scheduleEnd = "</Schedule></ProgramLocationTable>";

    axios({
      method: "post",
      url: "/api/v1/tva",
      data: tvaStart + scheduleStart + events + scheduleEnd + tvaEnd
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
  addItem(item) {
    if (item.isLive) {
      item.live = "live";
    }
    else {
      if(loadedContent.length === 0) {
        item.startTime = moment
        .utc("00:00", "HH:mm:ss")
        .format("HH:mm:ss");
      }
      else {
        item.startTime = moment
        .utc(loadedContent[loadedContent.length - 1].startTime, "HH:mm:ss")
        .add(
          moment.duration(loadedContent[loadedContent.length - 1].duration)
        )
        .format("HH:mm:ss");
      }
    }
    item.id = count += 1;
    loadedContent.push(item);

    videos.push(
      <SingleSchedule
        fetchTime={this.props.fetchTime}
        title={item.title}
        startTime={item.startTime}
        duration={item.duration}
        deleteItem={this.deleteItem}
        id={item.id}
        live={item.live}
      />
    );

  }
  pasteContent(content) {
    for (let i = 0; i < content.length; i++) {
      this.addItem(content[i]);
    }
    this.setState({
      savePlaylist: "ui right floated small primary labeled icon button"
    });
    this.setState({ status: "Save Playlist" });
  }
  deleteItem(id) {
    videos.map((item, idx) => {
      if (item.props.startTime === id) {
        videos[idx] = (
          <SingleSchedule
            fetchTime={this.props.fetchTime}
            deleteItem={this.deleteItem}
            style="blankScheduleItem"
            duration={loadedContent[idx].duration}
            id={loadedContent[idx].id}
          />
        );
        this.forceUpdate();
        return;
      }
    });
    videos.map((item, idx) => {
      if (item.props.id === id) {
        videos.splice(idx, videos.length);
        loadedContent.splice(idx, 1);
        for (let i = idx; i < loadedContent.length; i++) {
          if (i === 0) {
            loadedContent[i].startTime = moment
              .utc("00:00", "HH:mm:ss")
              .format("HH:mm:ss");
          } else if (loadedContent[i].isLive === true) {
          } else {
            loadedContent[i].startTime = moment
              .utc(loadedContent[i - 1].startTime, "HH:mm:ss")
              .add(
                moment.duration(loadedContent[i - 1].duration)._milliseconds,
                "milliseconds"
              )
              .format("HH:mm:ss");
          }
          videos.push(
            <SingleSchedule
              fetchTime={this.props.fetchTime}
              title={loadedContent[i].title}
              startTime={loadedContent[i].startTime}
              duration={loadedContent[i].duration}
              deleteItem={this.deleteItem}
              id={loadedContent[i].id}
              live={loadedContent[i].live}
            />
          );
        }
        this.setState({ refresh: 1 });
      }
    });
  }
  componentDidUpdate(prevProps) {
    if (prevProps.clipTime !== this.props.clipTime) {
      for (let i = 0; i < videos.length; i++) {
        if (
          videos[i].props.id === this.props.clipTime &&
          videos[i].props.flag !== true &&
          videos[i].props.isLive !== true
        ) {
          if (videos[i].props.style === "blankScheduleItem") {
            videos[i] = (
              <SingleSchedule
                flag={true}
                fetchTime={this.props.fetchTime}
                deleteItem={this.deleteItem}
                style="blankScheduleItem"
                duration={loadedContent[i].duration}
                id={loadedContent[i].id}
              />
            );
            var newState = i;
            this.setState({ index: i });
          } else {
            videos[i] = (
              <SingleSchedule
                fetchTime={this.props.fetchTime}
                title={loadedContent[i].title}
                startTime={loadedContent[i].startTime}
                duration={loadedContent[i].duration}
                deleteItem={this.deleteItem}
                id={loadedContent[i].id}
                flag={true}
                border="border_bottom"
              />
            );
            newState = i;
            this.setState({ index: i });
          }
        } else {
          videos[i] = (
            <SingleSchedule
              fetchTime={this.props.fetchTime}
              title={loadedContent[i].title}
              startTime={loadedContent[i].startTime}
              duration={loadedContent[i].duration}
              deleteItem={this.deleteItem}
              id={loadedContent[i].id}
              flag={false}
            />
          );
        }
      }
    }
    if (prevProps.dataLength !== this.props.dataLength) {
      // why is dataLength different to data.length??
      // TODO was it because you were both passing the schedule and the scratchpad?? Julian

      scheduleContent = this.props.data;

      this.setState({ serviceIDRef: this.props.serviceIDRef });

      // this.props.data.length === ? scheduleContent = loadedContent : scheduleContent = this.props.data

      for (let i = prevProps.dataLength; i < this.props.dataLength; i++) {

        this.addItem(scheduleContent[i]);
        /*
            if ( lastEndTime > item.startTime ) {
              //highlight on the actual listing.
              alert(
                "Warning! Programme at " +
                  loadedContent[loadedContent.length - 1].startTime +
                  " will be cut short because of the Live Programme"
              );
            } else if (lastEndTime < item.startTime) {
              alert(
                "Warning! You have a gap in the schedule before the start of the LIVE programme"
              );
            }          
          }
          else {
            item.startTime = lastEndTime;
          }
        }
        */

    
        if (newState !== null) {
          var currentStartTime = moment(
            loadedContent[this.state.index].startTime,
            "HH:mm:ss"
          )
          .add(
            moment.duration(loadedContent[this.state.index].duration)                
          )
          .format("HH:mm:ss");
          //  var newTime = (moment.duration(loadedContent[loadedContent.length - 1].duration)._milliseconds, 'milliseconds').format("HH:mm:ss");

          if (
            loadedContent[this.state.index + 1].isLive === true &&
            moment(currentStartTime, "HH:mm:ss")
              .add(
                moment.duration(
                  loadedContent[loadedContent.length - 1].duration
                )
              )
              .format("HH:mm:ss") <
              loadedContent[this.state.index + 1].startTime
          ) {
            loadedContent.pop();
            videos.splice(
              this.state.index,
              0,
              <SingleSchedule
                fetchTime={this.props.fetchTime}
                title={loadedContent[loadedContent.length - 1].title}
                startTime={loadedContent[loadedContent.length - 1].startTime}
                duration={loadedContent[loadedContent.length - 1].duration}
                deleteItem={this.deleteItem}
                id={loadedContent[loadedContent.length - 1].id}
              />
            );
            loadedContent.splice(this.state.index, 0, scheduleContent[i]);
            videos.splice(this.state.index, videos.length);
            for (let j = this.state.index; j < loadedContent.length; j++) {
              if (j == 0) {
                loadedContent[j].startTime = moment
                  .utc("00:00", "HH:mm:ss")
                  .format("HH:mm:ss");
                loadedContent[j].id = count += 1;
              } else if (loadedContent[j].isLive === true) {
                loadedContent[j].live = "live";
              } else {
                loadedContent[j].startTime = moment
                  .utc(loadedContent[j - 1].startTime, "HH:mm:ss")
                  .add(
                    moment.duration(loadedContent[j - 1].duration)
                      ._milliseconds,
                    "milliseconds"
                  )
                  .format("HH:mm:ss");
                loadedContent[j].id = count += 1;
              }
              this.props.data.map((item, idx) => {
                if (item.title === loadedContent[j].title) {
                  if (item.available_versions !== undefined) {
                    loadedContent[j].duration =
                      item.available_versions.version[0].duration;
                  } else {
                    loadedContent[j].duration = item.duration;
                  }
                }
              });

              videos.push(
                <SingleSchedule
                  fetchTime={this.props.fetchTime}
                  title={loadedContent[j].title}
                  startTime={loadedContent[j].startTime}
                  duration={loadedContent[j].duration}
                  deleteItem={this.deleteItem}
                  id={loadedContent[j].id}
                  live={loadedContent[j].live}
                />
              );
            }
          } else if (
            loadedContent[this.state.index + 1].isLive === true &&
            moment(currentStartTime, "HH:mm:ss")
              .add(
                moment.duration(
                  loadedContent[loadedContent.length - 1].duration
                )._milliseconds,
                "milliseconds"
              )
              .format("HH:mm:ss") >
              loadedContent[this.state.index + 1].startTime
          ) {
            alert("Cannot move the live show, please review your changes");
            loadedContent.pop();
            break;
          } else {
            loadedContent.pop();
            videos.splice(
              this.state.index,
              0,
              <SingleSchedule
                fetchTime={this.props.fetchTime}
                title={loadedContent[loadedContent.length - 1].title}
                startTime={loadedContent[loadedContent.length - 1].startTime}
                duration={loadedContent[loadedContent.length - 1].duration}
                deleteItem={this.deleteItem}
                id={loadedContent[loadedContent.length - 1].id}
              />
            );
            loadedContent.splice(this.state.index, 0, scheduleContent[i]);
            videos.splice(this.state.index, videos.length);
            for (let j = this.state.index; j < loadedContent.length; j++) {
              if (j == 0) {
                loadedContent[j].startTime = moment
                  .utc("00:00", "HH:mm:ss")
                  .format("HH:mm:ss");
                loadedContent[j].id = count += 1;
              } else if (loadedContent[j].isLive === true) {
              } else {
                loadedContent[j].startTime = moment
                  .utc(loadedContent[j - 1].startTime, "HH:mm:ss")
                  .add(
                    moment.duration(loadedContent[j - 1].duration)
                      ._milliseconds,
                    "milliseconds"
                  )
                  .format("HH:mm:ss");
                loadedContent[j].id = count += 1;
              }
              this.props.data.map((item, idx) => {
                if (item.title === loadedContent[j].title) {
                  if (item.available_versions !== undefined) {
                    loadedContent[j].duration =
                      item.available_versions.version[0].duration;
                  } else {
                    loadedContent[j].duration = item.duration;
                  }
                }
              });

              videos.push(
                <SingleSchedule
                  fetchTime={this.props.fetchTime}
                  title={loadedContent[j].title}
                  startTime={loadedContent[j].startTime}
                  duration={loadedContent[j].duration}
                  deleteItem={this.deleteItem}
                  id={loadedContent[j].id}
                  live={loadedContent[j].live}
                />
              );
            }
          }
        } else {
          videos.push(
            <SingleSchedule
              fetchTime={this.props.fetchTime}
              title={loadedContent[loadedContent.length - 1].title}
              startTime={loadedContent[loadedContent.length - 1].startTime}
              duration={loadedContent[loadedContent.length - 1].duration}
              deleteItem={this.deleteItem}
              id={loadedContent[loadedContent.length - 1].id}
              live={loadedContent[loadedContent.length - 1].live}
            />
          );
        }
      }
      this.setState({
        savePlaylist: "ui right floated small primary labeled icon button"
      });
      this.setState({ status: "Save Playlist" });
    }
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

          <tbody>{videos}</tbody>
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
