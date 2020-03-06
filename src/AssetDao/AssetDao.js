import axios from "axios";
import moment from "moment";

const URLPrefix =
  process.env.NODE_ENV === "development" ? "http://localhost:8080" : "";

class AssetDao {
  static getClips(sid, type, page, rowsPerPage, cb) {
    axios
      .get(
        `${URLPrefix}/api/v1/clip?sid=${sid}&type=${type}&page=${page +
          1}&page_size=${rowsPerPage}`
      )
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

  static getEpisodes(
    sid,
    availability,
    page,
    rowsPerPage,
    cb,
    sort,
    sort_direction
  ) {
    var sort_direction = sort_direction == "desc" ? "descending" : "ascending";
    const url = `${URLPrefix}/api/v1/episode?sid=${sid}&page=${page}&page_size=${rowsPerPage}&availability=${availability}&sort=${sort}&sort_direction=${sort_direction}`;
    axios
      .get(url)
      .then(cb)
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
    const item = this.clip2Item(episode);
    if (!item.title) {
      item.title = episode.presentation_title;
    }
    return item;
  }

  static getLoop() {}
}
export default AssetDao;
