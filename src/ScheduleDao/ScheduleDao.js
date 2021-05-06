import moment from "moment";
import axios from "axios";
import ScheduleObject from "../ScheduleObject";

const URLPrefix =
  process.env.NODE_ENV === "development" ? "http://localhost:8080" : "";

class ScheduleDao {
  static getLanguages(cb) {
    try {
      let url = `${URLPrefix}/api/v2/languageservices`;
      axios.get(url).then((response) => {
        console.log("we have", response);
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
    console.log("SSsid is ", sid);
    let formattedDate = moment(date).format("YYYY-MM-DD");
    axios
      .get(`${URLPrefix}/api/v2/schedule?sid=${sid}&date=${formattedDate}`)
      .then((response) => {
        console.log("response is", response);
        let schedule = [];
        if (response.data.items.length > 0) {
          response.data.items.forEach((item, index) => {
            console.log("fetched item is ", item);
            const asset = {
              startTime: item.start,
              title: item.title,
              duration: item.version.duration,
              versionPid: item.version.pid, //broadcast - broadcast of // version object  - version of  [version0.$.pid]
              versionCrid: item.broadcast_of.crid,
              insertionType: item.live ? "live" : "",
              live: item.live,
              pid: item.version.version_of,
              entityType: item.version.entity_type,
            };
            if (item.live) {
              asset.source = item.source;
            }

            console.log("asset is,", asset);

            schedule.push({
              title: asset.title,
              startTime: moment(asset.startTime),
              duration: asset.duration,
              insertionType: asset.insertionType,
              source: item.source || "",
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
      source: window.service.sid,
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

  /* 
  {
  "title": "Live programme at 15:30:00 local",
  "startTime": {
    "_isAMomentObject": true,
    "_i": "2021-05-06T14:30:00Z",
    "_d": "2021-05-06T14:30:00.000Z",
    "_isValid": true
  },
  "duration": "PT28M",
  "insertionType": "live",
  "asset": {
    "live": true,
    "entityType": "live",
    "startTime": {
      "_isAMomentObject": true,
      "_i": "2021-05-06T14:30:00Z",
      "_d": "2021-05-06T14:30:00.000Z",
      "_isValid": true
    },
    "title": "Live programme at 15:30:00 local",
    "duration": "PT28M",
    "captureChannel": "world_service_stream_06",
    "pics_raw_data": "world_service_stream_06",
    "insertionType": "live",
    "versionPid": "w1msj10325b0s69",
    "versionCrid": "crid://bbc.co.uk/w/40006083211620311400",
    "pid": "w172xtmg19rfyjf",
    "crid": "crid://bbc.co.uk/w/30005629911620311400"
  }
}
  */

  static createBroadcastItem(item) {
    console.log("createBroadcastItem item is ", item);
    const finish = moment(item.startTime).add(moment.duration(item.duration));
    let entityType = item.asset.entityType;
    if (entityType === 'live') {
      entityType = 'episode';
    }
    const vpid = item.asset.versionPid || item.asset.vpid;
    const newItem = {
      title: item.title,
      start: item.startTime,
      end: finish,
      live: item.asset.live,
      source: item.captureChannel,
      broadcast_of: {
        pid: vpid,
        crid: item.asset.versionCrid,
      },
      version: {
        pid: vpid,
        version_of: item.asset.pid,
        duration: item.duration,
      },
      version_of: {
        pid: item.asset.pid,
        crid: item.asset.crid,
        entity_type: entityType,
      },
    };
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
    } catch (error) {
      console.log(error);
    }
  }
}

export const fetchSchedule = ScheduleDao.fetchSchedule;
export const fetchWebcasts = ScheduleDao.fetchWebcasts;
export const saveSchedule = ScheduleDao.saveSchedule;
export const getLanguages = ScheduleDao.getLanguages;
export default ScheduleDao;
