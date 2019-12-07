import React from "react";
import SingleSchedule from "../SingleSchedule/SingleSchedule";
import Date from "../Date/Date";
import moment from "moment";
import axios from "axios";
import { thisExpression } from "@babel/types";

var count = -2;
var dateIndex = 0;
var text = "Today's ";
const tvaStart =
  '<TVAMain xmlns="urn:tva:metadata:2007" xmlns:mpeg7="urn:tva:mpeg7:2005" xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance" xml:lang="en-GB" xsi:schemaLocation="urn:tva:metadata:2007 tva_metadata_3-1_v141.xsd">\n  <ProgramDescription>\n';
const tvaEnd = "  </ProgramDescription>\n</TVAMain>";
var scheduleItems = [[]];
var myPreRenderedItems = [[]];
var URLPrefix = "";
var insertPosition;

//checking if running locally
if (process.env.NODE_ENV === "development") {
  URLPrefix = "http://localhost:8080";
}

//setting active session

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
    this.loopContent = this.loopContent.bind(this);
    this.getItem = this.getItem.bind(this);
    this.getScheduleItemTitle = this.getScheduleItemTitle.bind(this);
    this.sortData = this.sortData.bind(this);

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
    };
  }

  componentDidMount() {
    try {
      this.setState({ serviceIDRef: this.props.service.serviceIDRef });
      scheduleItems = [[]];
      myPreRenderedItems = [[]];
      if (sessionStorage.getItem("data") != null) {
        var data = JSON.parse(sessionStorage.getItem("data"));
        data[dateIndex].map((item, index) => {
          return myPreRenderedItems[dateIndex].push(
            <SingleSchedule
              getItem={this.getItem}
              title={item.props.title}
              startTime={item.props.startTime}
              duration={item.props.duration}
              deleteItem={this.props.deleteItem}
              date={moment(item.props.startTime)}
              id={item.props.id}
              live={item.props.live}
              insertionType={item.props.insertionType}
            />
          );
        });
        scheduleItems = JSON.parse(sessionStorage.getItem("scheduleItems"));
      }
      if (sessionStorage.getItem("activeSession") === undefined) {
        axios
          .get(
            `${URLPrefix}/api/v1/schedule?sid=${this.props.service.sid}&date=${moment.utc().format("YYYY-MM-DD")}`
          )
          .then(response => {
            response.data.item.forEach((item, index) => {
              const broadcast = item.broadcast[0];
	      const published_time = broadcast.published_time[0].$;
              let obj = {
                title: this.getScheduleItemTitle(item, index),
                startTime: moment(published_time.start),
                duration: moment.duration(published_time.duration).toISOString(),
                id: index,
                live: broadcast.live[0].$.value,
                versionCrid: item.version[0].crid[0].$.uri
              };

              myPreRenderedItems[dateIndex].push(
                <SingleSchedule
                  getItem={this.getItem}
                  title={obj.title}
                  startTime={moment(obj.startTime).format("HH:mm:ss")}
                  duration={obj.duration}
                  deleteItem={this.props.deleteItem}
                  date={moment(obj.startTime)}
                  id={obj.id}
                  live={obj.live}
                  isLive={obj.live}
                  insertionType={obj.insertionType}
                />
              );

              scheduleItems[0].push(obj);
            });

            this.setState({
              preRenderedItem: myPreRenderedItems
            });
            sessionStorage.setItem("activeSession", 1);
            // sessionStorage.setItem("data", JSON.stringify(myPreRenderedItems));
          })
          .catch(e => {
            console.log(e);
          });
      }

      sessionStorage.setItem("ScheduleItems", scheduleItems);

      // scheduleItems = JSON.parse(sessionStorage.getItem("scheduleItems"));

      this.setState({
        preRenderedItem: myPreRenderedItems
      });

      if (this.props.addedLoop) {
        this.loopContent();
      }
    } catch (error) {
      console.log(error);
    }
  }

  sortData = () => {
    try {
      scheduleItems[dateIndex].sort((a, b) => {
        return moment(a.startTime) - moment(b.startTime);
      });
      myPreRenderedItems[dateIndex].sort((a, b) => {
        return moment(a.props.date) - moment(b.props.date);
      });
    } catch (error) {}
  };
  getScheduleItemTitle = (item, index) => {
    if (item.hasOwnProperty("episode")) {
      let title = item.episode.title;
      if (title == null) {
        title = item.episode.presentation_title;
      }
      return title;
    } else if (item.hasOwnProperty("clip")) {
      return item.clip.title;
    } else {
      return "Loaded From Schedule " + index;
    }
  };
  getItem(startTime, chosen) {
    try {
      for (let i = 0; i < myPreRenderedItems[dateIndex].length; i++) {
        var item = myPreRenderedItems[dateIndex][i];
        // (startTime == item.props.id && chosen != true)
        if (chosen || startTime !== item.props.startTime) {
          myPreRenderedItems[dateIndex][i] = (
            <SingleSchedule
              getItem={this.getItem}
              title={item.props.title}
              startTime={item.props.startTime}
              duration={item.props.duration}
              deleteItem={this.props.deleteItem}
              id={item.props.id}
              live={item.props.live}
              isLive={item.props.live}
              date={item.props.date}
              insertionType={item.props.insertionType}
              selected={""}
            />
          );
        } else {
          myPreRenderedItems[dateIndex][i] = (
            <SingleSchedule
              getItem={this.getItem}
              title={item.props.title}
              startTime={item.props.startTime}
              duration={item.props.duration}
              deleteItem={this.props.deleteItem}
              id={item.props.id}
              date={item.props.date}
              live={item.props.live}
              isLive={item.props.live}
              insertionType={item.props.insertionType}
              chosen={true}
              selected={"chosen"}
              // insertionType={"chosen"}
            />
          );
          insertPosition = i;
        }
        this.setState({ preRenderedItem: myPreRenderedItems });
      }
    } catch (error) {}
  }

  savePlaylist() {
    try {
      const data = scheduleItems[dateIndex];
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

      let tva =
        tvaStart +
        "    <ProgramLocationTable>\n" +
        `      <Schedule start="${start.format()}" end="${end.format()}" serviceIDRef="${this.props.service.serviceIDRef}">`;
      for (let i = 0; i < data.length; i++) {
        tva += this.makeScheduleEvent( this.props.service.serviceIDRef, data[i], i, end);
      }
      tva += "\n      </Schedule>\n    </ProgramLocationTable>\n" + tvaEnd;
      console.log(tva);

      axios({
        method: "post",
        url: URLPrefix + "/api/v1/tva",
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
    } catch (error) {}
  }

  makeScheduleEvent(serviceIDRef, broadcast, index, end) {
    let duration = null;
    if (index === scheduleItems[dateIndex].length - 1) {
      duration = broadcast.duration;
    } else {
      var time = moment(
        myPreRenderedItems[dateIndex][index].props.startTime.toString(),
        "HH:mm:ss"
      );
      var nextStart = moment(
        myPreRenderedItems[dateIndex][index + 1].props.startTime.toString(),
        "HH:mm:ss"
      );
      var calculatedDuration = moment.duration(nextStart.diff(time));
      duration = calculatedDuration.toISOString();
    }
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
            <PublishedDuration>${duration}</PublishedDuration>
            <Live value="${broadcast.live === "live" ? true : false}"/>
            <Repeat value="${false}"/>
            <Free value="true"/>
        </ScheduleEvent>
      `;
  }

  previousDay = CDate => {
    /**
     *
     *
     *
     *
     *
     */
    dateIndex -= 1;
    if (dateIndex < 0) {
      text = "Previous ";
    }
    // text = moment(CDate).isAfter(moment()) ? "Future " : "Previous ";

    if (moment(CDate).format("LL") === moment().format("LL")) {
      text = "Today's ";
    }
    this.setState({ scheduleDate: moment(CDate) });
    this.props.onDateChange(moment(CDate));
  };
  nextDay = CDate => {
    dateIndex += 1;
    text = moment(CDate).isBefore(moment()) ? "Previous " : "Future ";

    if (moment(CDate).format("LL") === moment().format("LL")) {
      text = "Today's ";
    }
    this.setState({ scheduleDate: moment(CDate) });
    this.props.onDateChange(moment(CDate));
  };

  pasteContent() {
    sessionStorage.setItem("ScheduleItems", JSON.stringify(scheduleItems));
    let scratchpadItems = JSON.parse(JSON.stringify(this.props.pasted));
    for (let i = 0; i < scratchpadItems.length; i++) {
      this.addItemPosition(scratchpadItems[i]);

      if (
        moment(scratchpadItems[i].startTime).format("YYYY-MM-DD") >
        this.state.scheduleDate.format("YYYY-MM-DD")
      ) {
        if (scheduleItems[dateIndex + 1] === undefined) {
          scheduleItems[dateIndex + 1] = [];
          myPreRenderedItems[dateIndex + 1] = [];
        }

        scheduleItems[dateIndex + 1].push(scratchpadItems[i]);

        myPreRenderedItems[dateIndex + 1].push(
          <SingleSchedule
            getItem={this.getItem}
            title={scratchpadItems[i].title}
            startTime={moment(scratchpadItems[i].startTime).format("HH:mm:ss")}
            date={moment(scratchpadItems[i].startTime)}
            duration={scratchpadItems[i].duration}
            deleteItem={this.props.deleteItem}
            id={scratchpadItems[i].id}
            live={scratchpadItems[i].live}
            insertionType={scratchpadItems[i].insertionType}
          />
        );
      } else {
        scheduleItems[dateIndex].push(scratchpadItems[i]);

        myPreRenderedItems[dateIndex].push(
          <SingleSchedule
            getItem={this.getItem}
            title={scratchpadItems[i].title}
            startTime={moment(scratchpadItems[i].startTime).format("HH:mm:ss")}
            date={moment(scratchpadItems[i].startTime)}
            duration={scratchpadItems[i].duration}
            deleteItem={this.props.deleteItem}
            id={scratchpadItems[i].id}
            live={scratchpadItems[i].live}
            insertionType={scratchpadItems[i].insertionType}
          />
        );
      }
    }

    this.setState({ status: "Save Playlist" });

    this.setState({
      preRenderedItem: myPreRenderedItems
    });
  }

  addItemPosition(item, recalculate) {
    try {
      if (scheduleItems[dateIndex] === undefined) {
        scheduleItems[dateIndex] = [];
      }

      if (insertPosition !== undefined && !item.isLive) {
        const lastItem = scheduleItems[dateIndex][insertPosition];

        try {
          item.startTime = moment(lastItem.startTime).add(
            moment.duration(lastItem.duration)
          );
        } catch (error) {
          console.log(error);
        }
      } else if (item.isLive) {
        insertPosition = undefined;
        item.live = "live";
        item.startTime = moment(item.title.substring(18, 38));
        // item.duration = item.duration;
        console.log('addItemPosition', item);
      } else {
        if (
          scheduleItems[dateIndex].length === 0 ||
          scheduleItems[dateIndex][0] === item
        ) {
          var dateTime = moment()
            .add(dateIndex, "d")
            .add(6, "m");
          item.startTime = dateTime;
          console.log(item.startTime);
          // item.id = 0;
        } else {
          if (recalculate !== undefined) {
            recalculate =
              scheduleItems[dateIndex][recalculate - 1] === undefined
                ? scheduleItems[dateIndex].length - 1
                : recalculate - 1;
            const lastItem = scheduleItems[dateIndex][recalculate];
            item.startTime = moment(lastItem.startTime).add(
              moment.duration(lastItem.duration)
            );

            // item.id = recalculate
          } else {
            var index = scheduleItems[dateIndex + 1] === undefined ? 0 : 1;
            const lastItem =
              scheduleItems[dateIndex + index][
                scheduleItems[dateIndex + index].length - 1
              ];
            item.startTime = moment(lastItem.startTime).add(
              moment.duration(lastItem.duration)
            );
            console.log(lastItem);
            console.log(lastItem.startTime);
            console.log(
              scheduleItems[dateIndex + index][
                scheduleItems[dateIndex + index].length - 1
              ]
            );
            console.log(item.startTime);
            // item.id = scheduleItems.length;
          }
        }
      }
      item.id = count += 1;
    } catch (error) {}
  }
  addScheduleItem(updateItem, position) {
    try {
      let items = [];

      if (updateItem === undefined) {
        updateItem = this.props.item;
      }

      console.log(updateItem);

      this.addItemPosition(updateItem);

      if (insertPosition === undefined) {
        if (
          moment(updateItem.startTime).format("YYYY-MM-DD") >
            this.state.scheduleDate.format("YYYY-MM-DD") &&
          updateItem.live === undefined
        ) {
          if (scheduleItems[dateIndex + 1] === undefined) {
            scheduleItems[dateIndex + 1] = [];
            myPreRenderedItems[dateIndex + 1] = [];
          }

          scheduleItems[dateIndex + 1].push(updateItem);

          items.push(
            <SingleSchedule
              getItem={this.getItem}
              title={updateItem.title}
              startTime={moment(updateItem.startTime).format("HH:mm:ss")}
              date={moment(updateItem.startTime)}
              duration={updateItem.duration}
              deleteItem={this.props.deleteItem}
              id={updateItem.id}
              live={updateItem.live}
              insertionType={updateItem.insertionType}
            />
          );

          myPreRenderedItems[dateIndex + 1] = myPreRenderedItems[
            dateIndex + 1
          ].concat(items);
          console.log(myPreRenderedItems);
          this.setState({
            preRenderedItem: myPreRenderedItems
          });
        } else {
          scheduleItems[dateIndex].push(updateItem);
          items.push(
            <SingleSchedule
              getItem={this.getItem}
              title={updateItem.title}
              startTime={moment(updateItem.startTime).format("HH:mm:ss")}
              date={moment(updateItem.startTime)}
              duration={updateItem.duration}
              deleteItem={this.props.deleteItem}
              id={updateItem.id}
              live={updateItem.live}
              insertionType={updateItem.insertionType}
            />
          );
          if (myPreRenderedItems[dateIndex] === undefined) {
            myPreRenderedItems[dateIndex] = [];
          }

          myPreRenderedItems[dateIndex] = myPreRenderedItems[dateIndex].concat(
            items
          );
          // this.setState({
          //   preRenderedItem: myPreRenderedItems
          // });
        }
        this.setState({
          preRenderedItem: myPreRenderedItems
        });
        if (updateItem.isLive) {
          this.sortData();
          myPreRenderedItems[dateIndex].forEach((item, index) => {
            if (item.props.live !== undefined) {
              position = index + 1;
              myPreRenderedItems[dateIndex].splice(
                index + 1,
                myPreRenderedItems[dateIndex].length
              );
            }
          });

          this.recalculateStartTimes(position);
        }
      } else {
        var element = myPreRenderedItems[dateIndex][insertPosition].props;
        myPreRenderedItems[dateIndex][insertPosition] = (
          <SingleSchedule
            getItem={this.getItem}
            title={element.title}
            startTime={element.startTime}
            date={moment(element.date)}
            duration={element.duration}
            deleteItem={this.props.deleteItem}
            id={element.id}
            live={element.live}
            insertionType={element.insertionType}
          />
        );
        for (
          let i = insertPosition + 1;
          i < myPreRenderedItems[dateIndex].length;
          i++
        ) {
          var item = myPreRenderedItems[dateIndex][i].props;

          myPreRenderedItems[dateIndex][i] = (
            <SingleSchedule
              getItem={this.getItem}
              title={item.title}
              startTime={moment(item.date)
                .add(moment.duration(updateItem.duration))
                .format("HH:mm:ss")}
              date={moment(item.date).add(moment.duration(updateItem.duration))}
              duration={item.duration}
              deleteItem={this.props.deleteItem}
              id={item.id}
              live={item.live}
              insertionType={item.insertionType}
            />
          );

          scheduleItems[dateIndex][i].startTime = moment(item.date).add(
            moment.duration(updateItem.duration)
          );
          if (i === myPreRenderedItems[dateIndex].length - 1) {
            myPreRenderedItems[dateIndex].push(
              <SingleSchedule
                getItem={this.getItem}
                title={updateItem.title}
                startTime={moment(updateItem.startTime).format("HH:mm:ss")}
                date={moment(updateItem.startTime)}
                duration={updateItem.duration}
                deleteItem={this.props.deleteItem}
                id={updateItem.id}
                live={updateItem.live}
                insertionType={updateItem.insertionType}
              />
            );
            insertPosition = undefined;
            scheduleItems[dateIndex].push(updateItem);
            this.sortData();
            break;
          }
        }
        insertPosition = undefined;
        this.setState({ preRenderedItem: myPreRenderedItems });

        myPreRenderedItems[dateIndex].forEach(item => {
          console.log("BOOM", item.props.date);
        });
      }
    } catch (error) {}
  }

  recalculateStartTimes(position) {
    try {
      insertPosition = undefined;
      //recalculate everything or only after live
      console.log(myPreRenderedItems[dateIndex]);
      let items = [];

      for (let i = position; i < scheduleItems[dateIndex].length; i++) {
        this.addItemPosition(scheduleItems[dateIndex][i], i);
        items.push(
          <SingleSchedule
            getItem={this.getItem}
            title={scheduleItems[dateIndex][i].title}
            startTime={moment(scheduleItems[dateIndex][i].startTime).format(
              "HH:mm:ss"
            )}
            duration={scheduleItems[dateIndex][i].duration}
            deleteItem={this.props.deleteItem}
            date={moment(scheduleItems[dateIndex][i].startTime)}
            id={scheduleItems[dateIndex][i].id}
            live={scheduleItems[dateIndex][i].live}
            insertionType={scheduleItems[dateIndex][i].insertionType}
          />
        );
      }
      myPreRenderedItems[dateIndex] = myPreRenderedItems[dateIndex].concat(
        items
      );
      this.setState({ preRenderedItem: myPreRenderedItems });

      this.setState({ preRenderedItem: myPreRenderedItems.concat(items) });
      console.log("updated", myPreRenderedItems[dateIndex]);
      console.log(scheduleItems[dateIndex]);
    } catch (error) {}
  }
  deleteScheduleItems() {
    try {
      // var myPreRenderedItems = this.state.preRenderedItem;
      var position;

      for (var index = 0; index < scheduleItems[dateIndex].length; index++) {
        if (
          myPreRenderedItems[dateIndex][index].props.id === this.props.deleteId
        ) {
          position = index;
          scheduleItems[dateIndex].splice(index, 1);
          myPreRenderedItems[dateIndex].splice(
            index,
            myPreRenderedItems[dateIndex].length
          );
          this.recalculateStartTimes(position);
        }
      }
    } catch (error) {}
  }

  loopContent() {
    try {
      var start =
        moment(this.props.startLoop)._i[0] === undefined
          ? moment(this.props.startLoop)._i
          : moment(this.props.startLoop)._i[0];
      var end =
        moment(this.props.finishTime)._i[0] === undefined
          ? moment(this.props.finishTime)._i
          : moment(this.props.finishTime)._i[0];

      switch (true) {
        case this.props.loopedContent.length === 0:
          alert("Loop Empty");
          break;

        case moment(start).isAfter(moment(end)):
          alert("invalid Loop");
          break;

        default:
          scheduleItems[dateIndex].forEach((item, index) => {
            if (
              moment(item.startTime).isAfter(moment(start)) &&
              moment(item.startTime)
                .add(moment.duration(item.duration))
                .isBefore(moment(end))
            ) {
              scheduleItems[dateIndex] = scheduleItems[dateIndex].splice(
                index,
                1
              );
              myPreRenderedItems[dateIndex] = myPreRenderedItems[
                dateIndex
              ].splice(index, 1);
            }
          });

          if (!moment(start).isAfter(moment(end))) {
            var digit = 2;
            let loop = JSON.parse(JSON.stringify(this.props.loopedContent));

            loop.forEach((item, index) => {
              if (index === 0) {
                item.insertionType = "loopStart";
              } else if (index === loop.length - 1) {
                item.insertionType = "loopEnd";
              } else {
                item.insertionType = "midLoop";
              }
            });

            loop[0].startTime = moment(start);
            scheduleItems[dateIndex].push(loop[0]);
            myPreRenderedItems[dateIndex].push(
              <SingleSchedule
                getItem={this.getItem}
                title={loop[0].title}
                startTime={moment(loop[0].startTime).format("HH:mm:ss")}
                date={moment(loop[0].startTime)}
                duration={loop[0].duration}
                deleteItem={this.props.deleteItem}
                id={loop[0].id}
                live={loop[0].live}
                insertionType={loop[0].insertionType}
              />
            );

            loop.forEach((item, index) => {
              if (index > 0) {
                this.addScheduleItem(item);
              }
            });

            for (let i = 0; 1 < digit; i++) {
              // TODO check this for (let j = 0; j === j; j++) {
              for (let j = 0; j === i; j++) {
                if (
                  moment(loop[j].startTime).add(
                    moment
                      .duration(loop[j].duration)
                      .add(moment.duration(loop[j].duration))
                  ) < moment(end)
                ) {
                  var obj = JSON.parse(JSON.stringify(loop[j]));
                  this.addScheduleItem(obj);
                  loop = loop.concat(obj);
                } else {
                  digit = 1;
                  break;
                }
              }
            }
          } else {
            alert("invalid loop");
          }
      }
    } catch (error) {}
  }

  componentDidUpdate(prevProps) {
    try {
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
      if (scheduleItems[dateIndex] !== undefined) {
        if (scheduleItems[dateIndex].length > 0) {
          var item =
            scheduleItems[dateIndex][scheduleItems[dateIndex].length - 1];
          this.props.lastItem(
            moment(item.startTime).add(moment.duration(item.duration))
          );
        } else {
          this.props.lastItem(
            moment()
              .add(dateIndex, "d")
              .add(6, "m")
          );
        }
        sessionStorage.setItem("data", JSON.stringify(myPreRenderedItems));
        sessionStorage.setItem("scheduleItems", JSON.stringify(scheduleItems));
      }
    } catch (error) {}
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
          <h2>{text}Schedule</h2>
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
                  onClick={() => {this.pasteContent();}}
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
