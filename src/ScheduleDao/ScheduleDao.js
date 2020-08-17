import moment from "moment";
import axios from "axios";
import ScheduleObject from "../ScheduleObject";
import { groupSet } from "../Utils";

const URLPrefix =
  process.env.NODE_ENV === "development" ? "http://localhost:8080" : "";

class ScheduleDao {
  static getLanguages(cb) {
    try {
      let url = `${URLPrefix}/api/v2/languageservices`;
      axios.get(url).then((response) => {
        cb(response.data);
      });
    } catch (error) {
      console.log(error);
    }
  }
  static getTitle(item, index) {
    let title = "";
    console.log("item is", item);
    if (item.hasOwnProperty("clip")) {
      const clip = item.clip[0];

      if (clip.title) {
        title = clip.title;
      }
    } else if (item.hasOwnProperty("episode")) {
      const episode = item.episode[0];
      if (episode.title[0]) {
        title = episode.title[0];
      } else {
        if (item.hasOwnProperty("brand")) {
          title = item.brand[0].title[0] + " ";
        }
        title += episode.presentation_title[0];
      }
    } else {
      title = item.broadcast[0].title[0];
    }
    // if (title === "") {
    //   title = "Loaded From Schedule " + index;
    // }
    return title;
  }

  static fetchSchedule1(sid, date, cb) {
    cb(new ScheduleObject(sid, date));
  }

  static fetchSchedule(sid, date, cb) {
    //console.log('fetchSchedule', sid, date.format());
    axios
      .get(
        `${URLPrefix}/api/v1/schedule?sid=${sid}&date=${date
          .utc()
          .startOf("day")
          .format("YYYY-MM-DD")}`
      )
      .then((response) => {
        let schedule = [];
        if (response.data.total > 0) {
          response.data.item.forEach((item, index) => {
            if (
              // moment(date).format("DD-MM-YYYY") ===
              // moment(item.broadcast[0].published_time[0].$.start).format(
              //   "DD-MM-YYYY"
              // )
              1 == 1
            ) {
              const broadcast = item.broadcast[0];
              const published_time = broadcast.published_time[0].$;
              const live = broadcast.live[0].$.value === "true";
              const asset = {
                title: ScheduleDao.getTitle(item, index),
                duration: moment
                  .duration(published_time.duration)
                  .toISOString(),
                versionPid: item.version[0].$.pid, //broadcast - broadcast of // version object  - version of  [version0.$.pid]
                versionCrid: item.version[0].crid[0].$.uri,
                insertionType: live ? "live" : "",
                pid: item.version[0].version_of[0].link[0].$.pid,
              };
              schedule.push({
                title: asset.title,
                startTime: moment(published_time.start),
                duration: asset.duration,
                insertionType: asset.insertionType,
                asset: asset,
              });
            }
          });
        }
        const sched = new ScheduleObject(sid, date);
        sched.addFixed(schedule);
        sched.addGaps();
        sched.sort();
        cb(sched);
      })
      .catch((e) => {
        console.log(e);
      });
  }

  static fetchSchedulev2(sid, date, cb) {
    let formattedDate = moment(date).format("YYYY-MM-DD");
    axios
      .get(`${URLPrefix}/api/v2/schedulev2?sid=${sid}&date=${formattedDate}`)
      .then((response) => {
        let schedule = [];
        if (response.data.total > 0) {
          response.data.item.forEach((item, index) => {
            {
              const asset = {
                startTime: item.startTime,
                title: item.asset.title,
                duration: item.asset.duration,
                versionPid: item.asset.vpid, //broadcast - broadcast of // version object  - version of  [version0.$.pid]
                versionCrid: item.asset.versionCrid,
                insertionType: item.asset.live ? "live" : "",
                live: item.asset.live,
                pid: item.asset.pid,
                entityType: item.asset.entity_type,
              };

              schedule.push({
                title: asset.title,
                startTime: moment(asset.startTime),
                duration: asset.duration,
                insertionType: asset.insertionType,
                asset: asset,
              });
            }
          });
        }
        const sched = new ScheduleObject(sid, date);
        sched.addFixed(schedule);
        sched.addGaps();
        sched.sort();
        cb(sched);
      })
      .catch((e) => {
        console.log(e);
      });
  }
  static window2Item(window) {
    const start = moment(window.scheduled_time.start);
    const end = moment(window.scheduled_time.end);
    const duration = moment.duration(moment(end).diff(start));
    const item = {
      live: true,
      startTime: start,
      title: "Live programme at " + start.format("HH:mm:ss") + " local",
      duration: duration.toISOString(),
      captureChannel: window.service.sid,
      insertionType: "live",
    };
    for (let i = 0; i < window.window_of.length; i++) {
      switch (window.window_of[i].result_type) {
        case "version":
          item.versionPid = window.window_of[i].pid;
          item.versionCrid = window.window_of[i].crid;
          break;
        case "episode":
          item.pid = window.window_of[i].pid;
          item.crid = window.window_of[i].crid;
          break;
        default: // DO Nothing
      }
    }
    return item;
  }

  static fetchWebcasts(sid, start, end, page, rowsPerPage, cb) {
    console.log("aa", start);

    axios
      .get(
        `${URLPrefix}/api/v1/webcast?sid=${sid}&start=${start}&end=${end}&page=${
          page + 1
        }&page_size=${rowsPerPage}`
      )
      .then((response) => {
        console.log("BOOOM RESPONSE", JSON.stringify(response));
        const schedule = [];
        if (response.data.total > 0) {
          response.data.items.forEach((window) => {
            schedule.push(ScheduleDao.window2Item(window));
          });
        }
        cb(schedule, response.data.total);
      })
      .catch((e) => {
        console.log(e);
      });
  }
  static saveSchedule(serviceIDRef, data, cb, err) {
    try {
      const first = data[0];
      const last = data[data.length - 1];

      const start = moment.utc(first.startTime, "HH:mm:ss");
      const end = moment
        .utc(last.startTime, "HH:mm:ss")
        .add(moment.duration(last.duration));
      const tvaStart =
        '<TVAMain xmlns="urn:tva:metadata:2007" xmlns:mpeg7="urn:tva:mpeg7:2005" xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance" xml:lang="en-GB" xsi:schemaLocation="urn:tva:metadata:2007 tva_metadata_3-1_v141.xsd">\n  <ProgramDescription>\n';
      const tvaEnd = "  </ProgramDescription>\n</TVAMain>";

      let tva =
        tvaStart +
        "    <ProgramLocationTable>\n" +
        `      <Schedule start="${start
          .utc()
          .format()}" end="${end
          .utc()
          .format()}" serviceIDRef="${serviceIDRef}">`;
      for (let i = 0; i < data.length; i++) {
        if (data[i].insertionType === "gap") continue;
        if (data[i].insertionType === "sentinel") continue;
        tva += ScheduleDao.makeScheduleEvent(serviceIDRef, data[i]);
      }
      tva += "\n      </Schedule>\n    </ProgramLocationTable>\n" + tvaEnd;
      console.log("tva", tva);

      axios({
        method: "post",
        url: URLPrefix + "/api/v1/tva",
        data: tva,
      })
        .then((response) => {
          cb(response);
        })
        .catch((error) => {
          err(error);
        });
      ScheduleDao.episodeCheck(data);
    } catch (error) {
      err();
    }
  }

  static saveS3Schedule(serviceIDRef, data, date, sid, cb, err) {
    let formattedDate = moment(date).format("YYYY-MM-DD");
    let obj = {
      scheduleSource: "Dazzler",
      serviceIDRef: serviceIDRef,
      date: formattedDate,
      items: [],
    };
    try {
      //Get end time and remove sentinels and gaps
      let s3Data = data.filter((e) => {
        if (e.insertionType !== "sentinel" && e.insertionType !== "gap") {
          var finish = moment(e.startTime).add(moment.duration(e.duration));
          e.end = finish.toISOString();
          return e;
        }
      });
      obj.items = s3Data;

      axios({
        method: "post",
        url: `${URLPrefix}/api/v2/s3save?sid=${sid}&date=${formattedDate}`,
        data: obj,
      })
        .then((response) => {
          cb();
        })
        .catch((error) => {
          err(error);
        });
      ScheduleDao.episodeCheck(s3Data);
    } catch (error) {
      console.log(error);
    }
  }

  static saveScheduleV2(serviceIDRef, data, date, sid, cb, err) {
    let formattedDate = moment(date).format("YYYY-MM-DD");
    let obj = {
      serviceIDRef: serviceIDRef,
      date: formattedDate,
      items: [],
    };
    try {
      data.map((item) => {
        if (item.insertionType !== "sentinel" && item.insertionType !== "gap") {
          obj.items.push({
            broadcast: [
              {
                live: [
                  {
                    $: {
                      value: item.asset.live,
                    },
                  },
                ],
                published_time: [
                  {
                    $: {
                      duration: moment
                        .duration(item.asset.duration)
                        .format("hh:mm:ss"),
                      start: moment(item.startTime).toISOString(),
                      end: moment(item.startTime)
                        .add(moment.duration(item.asset.duration))
                        .toISOString(),
                    },
                  },
                ],
              },
            ],
            version: [
              {
                crid: [
                  {
                    $: {
                      uri: item.asset.versionCrid,
                    },
                  },
                ],
                $: {
                  pid: item.asset.pid,
                },
                entity_type: item.asset.entityType,
                version_of: [
                  {
                    link: [
                      {
                        $: {
                          pid: item.asset.pid,
                        },
                      },
                    ],
                  },
                ],
                title: [item.asset.title],
              },
            ],
          });
        }
      });

      axios({
        method: "post",
        url: URLPrefix + `/api/v2/s3save?sid=${sid}&date=${formattedDate}`,
        data: obj,
      })
        .then((response) => {
          cb(response);
        })
        .catch((error) => {
          err(error);
        });
    } catch (error) {
      console.log(error);
    }
  }
  static episodeCheck(data) {
    try {
      //Filtering episodes and then extracting vpid
      let episode = new groupSet(
        data.filter((item) => {
          if (
            !item.asset ||
            !item.asset.availability ||
            !item.asset.availability.actual_start
          ) {
            return false;
          } else {
            return item.asset.entityType === "episode";
          }
        })
      );
      if (episode.size > 0) {
        axios({
          method: "post",
          url: URLPrefix + "/api/v2/queryepisode",
          data: Array.from(episode.data),
        }).catch((error) => {
          console.error(error);
        });
      }
    } catch (error) {
      console.error("FAILURE", error);
    }
  }
  static makeScheduleEvent(serviceIDRef, broadcast) {
    const duration = broadcast.duration;
    const startDateTime = moment.utc(broadcast.startTime);
    let imi = "imi:dazzler:" + serviceIDRef + "/" + startDateTime.unix();

    return ` 
        <ScheduleEvent>
          <Program crid="${broadcast.asset.versionCrid}"/>
            <BroadcasterRawData>${
              broadcast.asset.captureChannel
                ? broadcast.asset.captureChannel
                : ""
            }</BroadcasterRawData>
            <InstanceMetadataId>${imi}</InstanceMetadataId>
            <InstanceDescription>
              <AVAttributes>
                <AudioAttributes><MixType href="urn:mpeg:mpeg7:cs:AudioPresentationCS:2001:3"><Name>Stereo</Name></MixType></AudioAttributes>
                <VideoAttributes><AspectRatio>16:9</AspectRatio><Color type="color"/></VideoAttributes>
              </AVAttributes>
              <Title>${broadcast.title}</Title>
            </InstanceDescription>
            <PublishedStartTime>${startDateTime
              .utc()
              .format()}</PublishedStartTime>
            <PublishedDuration>${duration}</PublishedDuration>
            <Live value="${broadcast.asset.live ? "true" : "false"}"/>
            <Repeat value="false"/>
            <Free value="true"/>
        </ScheduleEvent>
      `;
  }
}
export const fetchSchedule = ScheduleDao.fetchSchedule;
export const fetchSchedulev2 = ScheduleDao.fetchSchedulev2;
export const fetchWebcasts = ScheduleDao.fetchWebcasts;
export const saveSchedule = ScheduleDao.saveSchedule;
export const saveS3Schedule = ScheduleDao.saveS3Schedule;
export const saveScheduleV2 = ScheduleDao.saveScheduleV2;
export const getLanguages = ScheduleDao.getLanguages;
export default ScheduleDao;
