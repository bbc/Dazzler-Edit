import React from "react";
import SingleSchedule from "../SingleSchedule/SingleSchedule";
import Date from "../Date/Date";
import moment from "moment";
import axios from "axios";

var live = 0;
var count = -2;
var dateIndex = 0;
const tvaStart =
  '<TVAMain xmlns="urn:tva:metadata:2007" xmlns:mpeg7="urn:tva:mpeg7:2005" xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance" xml:lang="en-GB" xsi:schemaLocation="urn:tva:metadata:2007 tva_metadata_3-1_v141.xsd">\n  <ProgramDescription>\n';
const tvaEnd = "  </ProgramDescription>\n</TVAMain>";
var scheduleItems = [[]];
var text = '';
var myPreRenderedItems = [[]];

class Schedule extends React.Component {
  constructor(props) {
    super(props);
    this.savePlaylist = this.savePlaylist.bind(this);
    this.pasteContent = this.pasteContent.bind(this);
    this.makeScheduleEvent = this.makeScheduleEvent.bind(this);
    this.addScheduleItem = this.addScheduleItem.bind(this);
    this.deleteScheduleItems = this.deleteScheduleItems.bind(this);
    this.addItemPosition = this.addItemPosition.bind(this);
    this.nextDay = this.nextDay.bind(this);
    this.previousDay = this.previousDay.bind(this);


    this.state = {
      spinner: false,
      text: null,
      serviceIDRef: null,
      refresh: 2,
      data: [],
      savePlaylist: "ui right floated small primary labeled icon button",
      status: "Save Playlist",
      index: null,
      preRenderedItem: [[]],
      scheduleDate: moment()
      .add(0, "d")
      .format("LL"),
    };
  }
  componentDidMount() {
   
    let items = [];
    this.setState({ serviceIDRef: this.props.serviceIDRef });
    // if (sessionStorage.getItem("data") != null && myPreRenderedItems == null) {
    //   var item = JSON.parse(sessionStorage.getItem("data"));
    //   console.log(item)
    //   var scheduleData = JSON.parse(sessionStorage.getItem("data"));

    //   for(let i = 0; i < item.length; i++){
    //      for(let j = 0; j < item[i].length; j++){
    //       items.push(
    //         <SingleSchedule
    //           fetchTime={this.props.fetchTime}
    //           title={item[i][j].props.title}
    //           startTime={item[i][j].props.startTime}
    //           duration={item[i][j].props.duration}
    //           deleteItem={this.props.deleteItem}
    //           id={item[i][j].props.id}
    //           live={item[i][j].props.live}
    //         />
    //       )
         
    //     }
    //     myPreRenderedItems[i] = myPreRenderedItems.concat(items)
    //   }

    //   for(let i = 0; i < scheduleData.length; i++){
    //     for(let j = 0; j < scheduleData[i].length; j++){
    //       scheduleItems[i].push(scheduleData[j])
    //    }
    //  }

    //   this.setState({
    //     preRenderedItem: myPreRenderedItems
    //   });
    // }

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

  previousDay = CDate => {
    dateIndex -= 1;
    if(dateIndex < 0){dateIndex = 0};
    text = moment(CDate).isAfter(moment()) ? "Future " : "Previous ";

    
    if (moment(CDate).format("LL") === moment().format("LL")) {
      text = "Today's ";
    } 
    this.setState({scheduleDate: CDate})
  };
  nextDay = (CDate) => {
    dateIndex +=1;
    text = moment(CDate).isBefore(moment()) ? "Previous " : "Future ";

    if (moment(CDate).format("LL") === moment().format("LL")) {
      text = "Today's ";
    }
      this.setState({scheduleDate: CDate})    
  }
 
  pasteContent() {

    let scratchpadItems = JSON.parse(JSON.stringify(this.props.pasted));
    let items = [];
    for (let i = 0; i < scratchpadItems.length; i++) {
      this.addItemPosition(scratchpadItems[i]);
      scheduleItems[dateIndex].push(scratchpadItems[i])
      items.push(
        <SingleSchedule
          fetchTime={this.props.fetchTime}
          title={scratchpadItems[i].title}
          key={i}
          startTime={moment(scratchpadItems[i].startTime).format("HH:mm:ss")}
          duration={scratchpadItems[i].duration}
          deleteItem={this.props.deleteItem}
          id={scratchpadItems[i].id}
          live={scratchpadItems[i].live}
        />
      );
    }
    alert(5)
    this.setState({ serviceIDRef: this.props.serviceIDRef });
    this.setState({ status: "Save Playlist" });
    alert(6)
    myPreRenderedItems[dateIndex] = myPreRenderedItems[dateIndex].concat(items)
  this.setState({
    preRenderedItem: myPreRenderedItems
  });
  }
  
  addItemPosition(item, recalculate) {
    
    if (scheduleItems[dateIndex] == undefined){ scheduleItems[dateIndex] = [];}

    if (item.isLive) {
      item.live = "live";
      // item.id = `Live ${live+=1}`;
      
    } else {

         if (scheduleItems[dateIndex].length === 0 || scheduleItems[dateIndex] == item) {

        var dateTime = moment().add(dateIndex, "d");
        dateTime.set({hour:0,minute:0,second:0,millisecond:0})
        item.startTime = dateTime
        console.log(item.startTime)
        // item.id = 0;
        
      } else {
       
        if (recalculate !== undefined) {
           recalculate =
            scheduleItems[dateIndex][recalculate - 1] === undefined
              ? scheduleItems[dateIndex].length - 1
              : recalculate - 1;
          const lastItem = scheduleItems[dateIndex][recalculate];
          item.startTime = moment(lastItem.startTime)
            .add(moment.duration(lastItem.duration));

            // item.id = recalculate
        } else {
          var index = scheduleItems[dateIndex + 1] == undefined ? 0 : 1
          const lastItem = scheduleItems[dateIndex + index][scheduleItems[dateIndex + index].length - 1];
          item.startTime = moment(lastItem.startTime)
            .add(moment.duration(lastItem.duration));
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

    if( moment(updateItem.startTime).format("YYYY-MM-DD") > moment(this.state.scheduleDate).format("YYYY-MM-DD")){
      alert("its after")
    
      if(scheduleItems[dateIndex + 1] == undefined){
         alert("added"); scheduleItems[dateIndex + 1] = [];  myPreRenderedItems[dateIndex + 1] = [];
        };

      scheduleItems[dateIndex + 1].push(updateItem)  
      
      items.push(
        <SingleSchedule
          fetchTime={this.props.fetchTime}
          title={updateItem.title}
          startTime={moment(updateItem.startTime).format("HH:mm:ss")}
          date={moment(updateItem.startTime)}
          duration={updateItem.duration}
          deleteItem={this.props.deleteItem}
          id={updateItem.id}
          live={updateItem.live}
        />
      );
     
      myPreRenderedItems[dateIndex + 1] = myPreRenderedItems[dateIndex + 1].concat(items)
      console.log(myPreRenderedItems)
    this.setState({
      preRenderedItem: myPreRenderedItems
    });

    }else{
      
    scheduleItems[dateIndex].push(updateItem);
    items.push(
      <SingleSchedule
        fetchTime={this.props.fetchTime}
        title={updateItem.title}
        startTime={moment(updateItem.startTime).format("HH:mm:ss")}
        date={moment(updateItem.startTime)}
        duration={updateItem.duration}
        deleteItem={this.props.deleteItem}
        id={updateItem.id}
        live={updateItem.live}
      />
    );

    myPreRenderedItems[dateIndex] = myPreRenderedItems[dateIndex].concat(items)
    this.setState({
      preRenderedItem: myPreRenderedItems
    });
    console.log(JSON.parse(sessionStorage.getItem("data")));

  }
  }
  deleteScheduleItems() {

    // var myPreRenderedItems = this.state.preRenderedItem;
    let items = [];


    for (var index = 0; index < scheduleItems[dateIndex].length; index++) {
      if (this.state.preRenderedItem[dateIndex][index].props.id === this.props.deleteId) {
        
        scheduleItems[dateIndex].splice(index, 1);
        myPreRenderedItems[dateIndex].splice(index, myPreRenderedItems[dateIndex].length);
        for (let i = index; i < scheduleItems[dateIndex].length; i++) {
          this.addItemPosition(scheduleItems[dateIndex][i], i);
          items.push(
            <SingleSchedule
              fetchTime={this.props.fetchTime}
              title={scheduleItems[dateIndex][i].title}
              startTime={moment(scheduleItems[dateIndex][i].startTime).format("HH:mm:ss")}
              duration={scheduleItems[dateIndex][i].duration}
              deleteItem={this.props.deleteItem}
              id={scheduleItems[dateIndex][i].id}
              live={scheduleItems[dateIndex][i].live}
            />
          );
        } 
        myPreRenderedItems[dateIndex] = myPreRenderedItems[dateIndex].concat(items)
        this.setState({ preRenderedItem: myPreRenderedItems});

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

  }

  render() {
    return (

      <div>
              <Date
      nextDay={this.nextDay}
      previousDay={this.previousDay}
      scheduleDate={this.state.scheduleDate}
    />
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

          <tbody>{this.state.preRenderedItem[dateIndex]}</tbody>
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
              </th>
            </tr>
          </tfoot>
        </table>
      </div>
    );
  }
}
export default Schedule;
