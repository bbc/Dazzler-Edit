import axios from "axios";
import moment from "moment";

const URLPrefix =
  process.env.NODE_ENV === "development" ? "http://localhost:8080" : "";

class AssetDao {
  static getClips(sid, type, page, rowsPerPage, sort, direction, cb) {
    var sort_direction = direction === "desc" ? "descending" : "ascending";
    const url = `${URLPrefix}/api/v1/clip?sid=${sid}&type=${type}&page=${page +
      1}&page_size=${rowsPerPage}&sort=${sort}&sort_direction=${sort_direction}`;
    axios
      .get(url)
      .then(cb)
      .catch(e => {
        console.log(e);
      });
  }

  static getSpecials(sid, page, rowsPerPage, cb) {
    axios
      .get(
        `${URLPrefix}/api/v1/special?sid=${sid}&page=${page +
          1}&page_size=${rowsPerPage}`
      )
      .then(cb)
      .catch(e => {
        console.log(e);
      });
  }

  // The EpisodeList class uses the following fields:
  //    pid, insertionType, title, presentation_title, release_date, 
  //    available_versions.version[0].duration
  //
  // downstream processors use the item type which has the following fields:
  //
  //    pid, vpid, versionCrid, insertionType, live, duration, title
  //
  //    so we just need to add release_date and we can use items everywhere

  static getEpisodes(
    sid,
    availability,
    page,
    rowsPerPage,
    sort,
    direction,
    cb
  ) {
    var sort_direction = direction === "desc" ? "descending" : "ascending";
    const url = `${URLPrefix}/api/v1/episode?sid=${sid}&page=${page}&page_size=${rowsPerPage}&availability=${availability}&sort=${sort}&sort_direction=${sort_direction}`;
    axios
      .get(url)
      .then((response) => {
        const items = [];
        response.data.items.forEach((item) => {
          items.push(this.episode2Item(item));
        });
        cb(items, response.data.total);
      })
      .catch(e => {
        console.log(url);
        console.log(e);
      });
  }

  static clip2Item(clip) {
    const version = clip.available_versions.version[0]; // TODO pick a version
    return {
      title: clip.title,
      duration: moment.duration(version.duration).toISOString(),
      live: false,
      insertionType: "",
      versionCrid: version.crid,
      pid: clip.pid,
      vpid: version.pid
    };
  }

  static episode2Item(episode) {
    const version = episode.available_versions.version[0]; // TODO pick a version
    return {
      title: episode.title || episode.presentation_title,
      duration: moment.duration(version.duration).toISOString(),
      live: false,
      insertionType: "",
      versionCrid: version.crid,
      pid: episode.pid,
      vpid: version.pid
    };
  }

  static getLoop() {}
}
export default AssetDao;
