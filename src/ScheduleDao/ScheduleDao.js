import moment from "moment";
import axios from "axios";
import ScheduleObject from "../ScheduleObject"

const URLPrefix = (process.env.NODE_ENV === "development")?"http://localhost:8080":"";

class ScheduleDao {

  static getTitle(item, index) {
    let title = null;
    if (item.hasOwnProperty("clip")) {
      const clip = item.clip[0];
      title = clip.title;
      if (title == null) {
        title = clip.presentation_title;
      }
    } else if (item.hasOwnProperty("episode")) {
      const episode = item.episode[0];
      title = episode.title;
      if (title == null) {
        title = episode.presentation_title;
      }
    }
    if (title == null) {
      title = "Loaded From Schedule " + index;
    }
    return title;
  }

  static fetchSchedule1(sid, date, cb) {    
    const sched = new ScheduleObject(sid, date);
    cb(sched.items);
  }

  static fetchSchedule(sid, date, cb) {
    console.log('fetchSchedule', sid, date);
  axios
    .get(
      `${URLPrefix}/api/v1/schedule?sid=${sid}&date=${date}`
    )
    .then(response => {
      let schedule = [];
      if(response.data.total>0) {
        response.data.item.forEach((item, index) => {
          const broadcast = item.broadcast[0];
          const published_time = broadcast.published_time[0].$;
          const obj = {
            title: ScheduleDao.getTitle(item, index),
            startTime: moment(published_time.start),
            duration: moment.duration(published_time.duration).toISOString(),
            live: broadcast.live[0].$.value==="true",
            versionCrid: item.version[0].crid[0].$.uri,
            insertionType: '' // blank when loaded from PIPS
          };
          schedule.push(obj);
        });
      }
      const sched = new ScheduleObject(sid, date);
      sched.addFixed(schedule);
      sched.addGaps();
      sched.sort();
      cb(sched.items);
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
        if(data.insertionType === 'gap') continue;
        if(data.insertionType === 'sentinel') continue;
        tva += this.makeScheduleEvent( serviceIDRef, data, i, data.length);
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

  static makeScheduleEvent(serviceIDRef, data, index, length) {
    const broadcast = data[index];
    let duration = null;
    if (index === length - 1) {
      duration = broadcast.duration;
    } else {
      const start = broadcast.startTime;
      const nextStart = moment(data[index+1].startTime);
      var calculatedDuration = moment.duration(nextStart.diff(start));
      duration = calculatedDuration.toISOString();
    }
    const startDateTime = moment.utc(broadcast.startTime);
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
            <PublishedStartTime>${startDateTime.utc().format()}</PublishedStartTime>
            <PublishedDuration>${duration}</PublishedDuration>
            <Live value="${broadcast.live === "live" ? true : false}"/>
            <Repeat value="${false}"/>
            <Free value="true"/>
        </ScheduleEvent>
      `;
  }

}
export const fetchSchedule = ScheduleDao.fetchSchedule;
export const saveSchedule = ScheduleDao.saveSchedule;
export default ScheduleDao;
