import React from "react";
import SingleSchedule from "../SingleSchedule/SingleSchedule";
import moment from "moment";
import axios from "axios";

var live = 0;
var count = -2;
const tvaStart =
  '<TVAMain xmlns="urn:tva:metadata:2007" xmlns:mpeg7="urn:tva:mpeg7:2005" xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance" xml:lang="en-GB" xsi:schemaLocation="urn:tva:metadata:2007 tva_metadata_3-1_v141.xsd">\n  <ProgramDescription>\n';
const tvaEnd = "  </ProgramDescription>\n</TVAMain>";
var scheduleItems = [];

class Schedule extends React.Component {
  constructor(props) {
    super(props);
    this.savePlaylist = this.savePlaylist.bind(this);
    this.pasteContent = this.pasteContent.bind(this);
    this.makeScheduleEvent = this.makeScheduleEvent.bind(this);
    this.addScheduleItem = this.addScheduleItem.bind(this);
    this.deleteScheduleItems = this.deleteScheduleItems.bind(this);
    this.addItemPosition = this.addItemPosition.bind(this);

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
    let items = [];
    this.setState({ serviceIDRef: this.props.serviceIDRef });
    if (sessionStorage.getItem("data") != null) {
      JSON.parse(sessionStorage.getItem("data")).map((item, index) => {
        return items.push(
          <SingleSchedule
            fetchTime={this.props.fetchTime}
            title={item.props.title}
            startTime={item.props.startTime}
            duration={item.props.duration}
            deleteItem={this.props.deleteItem}
            id={item.props.id}
            live={item.props.live}
          />
        );
      });
      scheduleItems = JSON.parse(sessionStorage.getItem("scheduleItems"));
      this.setState({
        preRenderedItem: this.state.preRenderedItem.concat(items)
      });
    }

  }

  savePlaylist() {
    const data = scheduleItems;
    if (data.length === 0) {
      console.log("nothing to save - button should be disabled");
      return;
    }

    this.setState({
      savePlaylist: "ui right floated primary loading button"
    });

    const first = data[0];
    const last = data[data.length - 1];

    const start = moment.utc(first.startTime, "HH:mm:ss");
    const end = moment
      .utc(last.startTime, "HH:mm:ss")
      .add(moment.duration(last.duration));

    let tva =tvaStart +
        "    <ProgramLocationTable>\n" +
        `      <Schedule start="${start.format()}" end="${end.format()}" serviceIDRef="${
          this.props.serviceIDRef
        }">`;
    for (let i = 0; i < data.length; i++) {
      tva += this.makeScheduleEvent(this.props.serviceIDRef, data[i]);
    }
    tva += "\n      </Schedule>\n    </ProgramLocationTable>\n" + tvaEnd;
    console.log(tva);

    axios({
      method: "post",
      url: "http://localhost:8080/api/v1/tva",
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
    const startDateTime = moment.utc(broadcast.startTime, "HH:mm:ss");

    let imi = "imi:dazzler:" + serviceIDRef + "/" + startDateTime.unix();

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

  pasteContent() {
    let scratchpadItems = JSON.parse(JSON.stringify(this.props.pasted));
    // // var scratchpadItems = this.props.pasted.slice()
    // let b = JSON.parse(JSON.stringify(a));
    let items = [];
    for (let i = 0; i < scratchpadItems.length; i++) {
      this.addItemPosition(scratchpadItems[i]);
      scheduleItems.push(scratchpadItems[i])
      items.push(
        <SingleSchedule
          fetchTime={this.props.fetchTime}
          title={scratchpadItems[i].title}
          startTime={scratchpadItems[i].startTime}
          duration={scratchpadItems[i].duration}
          deleteItem={this.props.deleteItem}
          id={scratchpadItems[i].id}
          live={scratchpadItems[i].live}
        />
      );
    }
    this.setState({ serviceIDRef: this.props.serviceIDRef });
    this.setState({ status: "Save Playlist" });
    this.setState({ preRenderedItem: this.state.preRenderedItem.concat(items) });
  }
  
  addItemPosition(item, recalculate) {
    if (item.isLive) {
      item.live = "live";
      // item.id = `Live ${live+=1}`;
      
    } else {
      if (scheduleItems.length === 0 || scheduleItems[0] == item) {

        item.startTime = moment.utc("00:00", "HH:mm:ss").format("HH:mm:ss");
        // item.id = 0;
        
      } else {
        if (recalculate !== undefined) {
           recalculate =
            scheduleItems[recalculate - 1] === undefined
              ? scheduleItems.length - 1
              : recalculate - 1;
          const lastItem = scheduleItems[recalculate];
          item.startTime = moment
            .utc(lastItem.startTime, "HH:mm:ss")
            .add(moment.duration(lastItem.duration))
            .format("HH:mm:ss");
            // item.id = recalculate
        } else {
          
          const lastItem = scheduleItems[scheduleItems.length - 1];
          item.startTime = moment
            .utc(lastItem.startTime, "HH:mm:ss")
            .add(moment.duration(lastItem.duration))
            .format("HH:mm:ss");
            // item.id = scheduleItems.length;

        }
      }
    }
      item.id = count+=1;
  }


  addScheduleItem(updateItem) {
    let items = [];
    if (updateItem === undefined) {
      updateItem = this.props.item;
    }
    this.addItemPosition(updateItem);
    scheduleItems.push(updateItem);
    items.push(
      <SingleSchedule
        fetchTime={this.props.fetchTime}
        title={updateItem.title}
        startTime={updateItem.startTime}
        duration={updateItem.duration}
        deleteItem={this.props.deleteItem}
        id={updateItem.id}
        live={updateItem.live}
      />
    );
    this.setState({
      preRenderedItem: this.state.preRenderedItem.concat(items)
    });
    console.log(JSON.parse(sessionStorage.getItem("data")));

  }

  deleteScheduleItems() {

    var myPreRenderedItems = this.state.preRenderedItem;
    let items = [];


    for (var index = 0; index < scheduleItems.length; index++) {
      if (this.state.preRenderedItem[index].props.id === this.props.deleteId) {
  
        scheduleItems.splice(index, 1);
        myPreRenderedItems.splice(index, myPreRenderedItems.length);
        for (let i = index; i < scheduleItems.length; i++) {
          console.log(scheduleItems)
          console.log(scheduleItems[i])
          console.log(i)
          this.addItemPosition(scheduleItems[i], i);
          items.push(
            <SingleSchedule
              fetchTime={this.props.fetchTime}
              title={scheduleItems[i].title}
              startTime={scheduleItems[i].startTime}
              duration={scheduleItems[i].duration}
              deleteItem={this.props.deleteItem}
              id={scheduleItems[i].id}
              live={scheduleItems[i].live}
            />
          );
        } 
        this.setState({ preRenderedItem: myPreRenderedItems.concat(items) });

        break;
      }
    }

  }

  componentDidUpdate(prevProps) {

    switch (true) {
      case prevProps.item !== this.props.item && this.props.added:
        this.addScheduleItem();
        break;
      case prevProps.deleteId !== this.props.deleteId && !this.props.added:
     
        this.deleteScheduleItems();
        break;

      default:
        break;
    }
    sessionStorage.setItem("data", JSON.stringify(this.state.preRenderedItem));
    sessionStorage.setItem("scheduleItems", JSON.stringify(scheduleItems));
    this.state.preRenderedItem.map(item => console.log("bob " + item.id));
  }

  render() {
    scheduleItems.map((item)=>{
      console.log("SI " + item.id)
    })

    this.state.preRenderedItem.map((item)=>{
      console.log("PRI " + item.props.id)
    })
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
                    this.pasteContent();
                  }}
                >
                  Paste
                </div>
                <div
                  className="ui left floated small primary labeled icon button">
                  Loop
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
