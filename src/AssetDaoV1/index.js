import axios from "axios";
import moment from "moment";

const URLPrefix =
  process.env.NODE_ENV === "development" ? "http://localhost:8080" : "";

class AssetDao {
  static get(path, params, cb) {
    axios
      .get(`${URLPrefix}/api/v1/${path}`, { params })
      .then((response) => {
        const items = [];
        if (response.data.items) {
          response.data.items.forEach((clip) => {
            items.push(this.clip2Item(clip));
          });
        }
        cb(items, response.data.total);
      })
      .catch((e) => {
        console.log(e);
      });
  }

  static getClips(sid, type, page, rowsPerPage, sort, direction, cb, search) {
    var sort_direction = direction === "desc" ? "descending" : "ascending";
    const params = {
      sid,
      type,
      sort,
      sort_direction,
      page,
      page_size: rowsPerPage,
      search: search,
    };
    this.get("clip", params, cb);
  }

  static getSpecials(sid, page, rowsPerPage, cb) {
    console.log("special", sid, page, rowsPerPage);
    this.get("special", { sid, page, page_size: rowsPerPage }, cb);
  }

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
        response.data.items.forEach((episode) => {
          const version = episode.available_versions.version[0]; // TODO pick a version
          items.push({
            title: episode.title || episode.presentation_title,
            pid: episode.pid,
            release_date: episode.release_date,
            duration: moment.duration(version.duration).toISOString(),
            live: false,
            insertionType: "",
            versionCrid: version.crid,
            vpid: version.pid,
            entityType: "episode",
          });
        });
        cb(items, response.data.total);
      })
      .catch((e) => {
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
      vpid: version.pid,
      entityType: "clip",
    };
  }

  static getLoop() {}
}
export default AssetDao;
