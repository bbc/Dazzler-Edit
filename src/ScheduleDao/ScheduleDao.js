import moment from "moment";
import axios from "axios";
import ScheduleObject from "../ScheduleObject"

const URLPrefix = (process.env.NODE_ENV === "development") ? "http://localhost:8080" : "";

class ScheduleDao {

  static getTitle(item, index) {
    let title = '';
    if (item.hasOwnProperty("clip")) {
      const clip = item.clip[0];
      if (clip.title) {
        title = clip.title;
      }
    } else if (item.hasOwnProperty("episode")) {
      const episode = item.episode[0];
      if (episode.title[0]) {
        title = episode.title[0];
      }
      else {
        if (item.hasOwnProperty("brand")) {
          title = item.brand[0].title[0]+' ';
        }
        title += episode.presentation_title[0];
      }
    }
    if (title === '') {
      title = "Loaded From Schedule " + index;
    }
    return title;
  }

  static fetchSchedule1(sid, date, cb) {
    cb(new ScheduleObject(sid, date));
  }

  static fetchSchedule(sid, date, cb) {
    //console.log('fetchSchedule', sid, date.format());
    axios
      .get(
        `${URLPrefix}/api/v1/schedule?sid=${sid}&date=${date.utc().format('YYYY-MM-DD')}`
      )
      .then(response => {
        let schedule = [];
        if (response.data.total > 0) {
          response.data.item.forEach((item, index) => {
            const broadcast = item.broadcast[0];
            const published_time = broadcast.published_time[0].$;
            const live = broadcast.live[0].$.value === "true";
            const asset = {
              title: ScheduleDao.getTitle(item, index),
              duration: moment.duration(published_time.duration).toISOString(),
              versionPid: item.version[0].pid,
              versionCrid: item.version[0].crid[0].$.uri,
              insertionType: live ? "live" : ""
            };
            schedule.push({
              title: asset.title,
              startTime: moment(published_time.start),
              duration: asset.duration,
              insertionType: asset.insertionType,
              asset: asset
            });
          });
        }
        const sched = new ScheduleObject(sid, date);
        sched.addFixed(schedule);
        sched.addGaps();
        sched.sort();
        cb(sched);
      })
      .catch(e => {
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
      title: "Live programme at " + start.format("HH:mm:ss"),
      duration: duration.toISOString(),
      captureChannel: window.service.sid,
      insertionType: "live"
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
      .get(`${URLPrefix}/api/v1/webcast?sid=${sid}&start=${start}&end=${end}&page=${page+1}&page_size=${rowsPerPage}`)
      .then(response => {
        const schedule = [];
        if (response.data.total > 0) {
          response.data.items.forEach((window) => {
            schedule.push(ScheduleDao.window2Item(window));
          });
        }
        cb(schedule, response.data.total);
      })
      .catch(e => {
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
    const tvaStart = '<TVAMain xmlns="urn:tva:metadata:2007" xmlns:mpeg7="urn:tva:mpeg7:2005" xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance" xml:lang="en-GB" xsi:schemaLocation="urn:tva:metadata:2007 tva_metadata_3-1_v141.xsd">\n  <ProgramDescription>\n';
    const tvaEnd = "  </ProgramDescription>\n</TVAMain>";

    let tva =
      tvaStart +
      "    <ProgramLocationTable>\n" +
      `      <Schedule start="${start.utc().format()}" end="${end.utc().format()}" serviceIDRef="${serviceIDRef}">`;
    for (let i = 0; i < data.length; i++) {
      if (data[i].insertionType === 'gap') continue;
      if (data[i].insertionType === 'sentinel') continue;
      tva += ScheduleDao.makeScheduleEvent(serviceIDRef, data[i]);
    }
    tva += "\n      </Schedule>\n    </ProgramLocationTable>\n" + tvaEnd;
    console.log(tva);

    axios({
      method: "post",
      url: URLPrefix + "/api/v1/tva",
      data: tva
    })
      .then(response => {
        cb(response);
      })
      .catch(error => {
        err(error);
      });
  } catch (error) {
    err();
  }
}

  static makeScheduleEvent(serviceIDRef, broadcast) {
  const duration = broadcast.duration;
  const startDateTime = moment.utc(broadcast.startTime);
  let imi = "imi:dazzler:" + serviceIDRef + "/" + startDateTime.unix();

  return ` 
        <ScheduleEvent>
          <Program crid="${broadcast.asset.versionCrid}"/>
            <BroadcasterRawData>${broadcast.asset.captureChannel?broadcast.captureChannel:''}</BroadcasterRawData>
            <InstanceMetadataId>${imi}</InstanceMetadataId>
            <InstanceDescription>
              <AVAttributes>
                <AudioAttributes><MixType href="urn:mpeg:mpeg7:cs:AudioPresentationCS:2001:3"><Name>Stereo</Name></MixType></AudioAttributes>
                <VideoAttributes><AspectRatio>16:9</AspectRatio><Color type="color"/></VideoAttributes>
              </AVAttributes>
              <Title>${broadcast.title}</Title>
            </InstanceDescription>
            <PublishedStartTime>${startDateTime.utc().format()}</PublishedStartTime>
            <PublishedDuration>${duration}</PublishedDuration>
            <Live value="${broadcast.asset.live?'true':'false'}"/>
            <Repeat value="false"/>
            <Free value="true"/>
        </ScheduleEvent>
      `;
}

}
export const fetchSchedule = ScheduleDao.fetchSchedule;
export const fetchWebcasts = ScheduleDao.fetchWebcasts;
export const saveSchedule = ScheduleDao.saveSchedule;
export default ScheduleDao;
