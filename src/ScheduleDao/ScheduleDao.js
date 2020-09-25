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
  static fetchSchedule(sid, date, cb) {
    let formattedDate = moment(date).format("YYYY-MM-DD");
    axios
      .get(`${URLPrefix}/api/v2/schedule?sid=${sid}&date=${formattedDate}`)
      .then((response) => {
        console.log("response is", response);
        let schedule = [];
        if (response.data.items.length > 0) {
          response.data.items.forEach((item, index) => {
            console.log("fetch item is ", item);
            const asset = {
              startTime: item.start,
              title: item.title,
              duration: item.version.duration,
              vpid: item.version.pid, //broadcast - broadcast of // version object  - version of  [version0.$.pid]
              versionCrid: item.broadcast_of.crid,
              insertionType: item.live ? "live" : "",
              live: item.live,
              pid: item.version.version_of,
              entityType: item.version.entity_type,
            };
            if (item.live) {
              asset.source = item.stream;
            }

            console.log("asset is,", asset);

            schedule.push({
              title: asset.title,
              startTime: moment(asset.startTime),
              duration: asset.duration,
              insertionType: asset.insertionType,
              asset: asset,
            });
            console.log("schedule is ", schedule);
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
      entityType: "live",
      startTime: start,
      title: "Live programme at " + start.format("HH:mm:ss") + " local",
      duration: duration.toISOString(),
      captureChannel: window.service.sid,
      pics_raw_data: window.service.sid,
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

  static savableItem(item) {
    return item.insertionType !== "sentinel" && item.insertionType !== "gap";
  }

  static createBroadcastItem(item) {
    console.log("cb item is ", item);
    const finish = moment(item.startTime).add(moment.duration(item.duration));
    const newItem = {
      title: item.title,
      start: item.startTime,
      end: finish,
      live: item.asset.live,
      broadcast_of: {
        pid: item.asset.vpid,
        crid: item.asset.versionCrid,
      },
      version: {
        pid: item.asset.vpid,
        version_of: item.asset.pid,
        duration: item.asset.duration,
        entity_type: item.asset.entityType,
      },
    };
    if (item.asset.live) {
      newItem.source = item.asset.pics_raw_data;
    }
    console.log("new item is ", newItem);

    return newItem;
  }

  static saveSchedule(serviceIDRef, data, date, sid, cb, err) {
    // Get end time and remove sentinels and gaps
    // ES6 const items = data.flatMap((e) => savableItem(e) ? s3Broadcast(e) : []);
    const items = data
      .filter((item) => ScheduleDao.savableItem(item))
      .map((item) => ScheduleDao.createBroadcastItem(item));
    const obj = {
      scheduleSource: "Dazzler",
      sid: sid,
      serviceIDRef: serviceIDRef,
      start: moment(date).toISOString(),
      end: moment(date).add(1, "day").toISOString(),
      items,
    };
    console.log("saving this", obj);
    try {
      axios({
        method: "post",
        url: `${URLPrefix}/api/v2/schedule?sid=${sid}`,
        data: obj,
      })
        .then((response) => {
          cb();
        })
        .catch((error) => {
          err(error);
        });
      ScheduleDao.episodeBackfillCheck(items);
    } catch (error) {
      console.log(error);
    }
  }
  /*Method checks to see if episode asset exists in s3 bucket
   when playlist saved. If episode missing, backfill process
   begins.
   */
  static episodeBackfillCheck(data) {
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
}

export const fetchSchedule = ScheduleDao.fetchSchedule;
export const fetchWebcasts = ScheduleDao.fetchWebcasts;
export const saveSchedule = ScheduleDao.saveSchedule;
export const getLanguages = ScheduleDao.getLanguages;
export default ScheduleDao;
