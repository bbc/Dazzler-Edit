import axios from "axios";
import moment from "moment";

const URLPrefix =
  process.env.NODE_ENV === "development" ? "http://localhost:8080" : "";

class AssetDao {
  static getClips(sid, type, page, rowsPerPage, sort, direction, cb, search) {
    var sort_direction = direction === "desc" ? "descending" : "ascending";
    const url = `${URLPrefix}/api/v2/clip`;
    const params = {
      sid,
      type,
      page: page + 1,
      page_size: rowsPerPage,
      sort,
      sort_direction,
      search: search,
    };

    axios
      .get(url, { params })
      .then((response) => {
        const items = [];
        response.data.clips.forEach((clip) => {
          items.push(this.clip2Item(clip));
        });
        cb(items, response.data.total);
      })
      .catch((e) => {
        console.log(e);
      });
  }

  static getSpecials(sid, page, rowsPerPage, cb) {
    axios
      .get(
        `${URLPrefix}/api/v1/special?sid=${sid}&page=${
          page + 1
        }&page_size=${rowsPerPage}`
      )
      .then((response) => {
        const items = [];
        response.data.items.forEach((clip) => {
          items.push(this.clip2Item(clip));
        });
        cb(items, response.data.total);
      })
      .catch((e) => {
        console.log(e);
      });
  }

  static getEpisodes(
    sid,
    availability,
    mustBeAvailableBy,
    mustBeAvailableUntil,
    page,
    rowsPerPage,
    sort,
    direction,
    cb,
    search
  ) {
    var sort_direction = direction === "desc" ? "descending" : "ascending";
    const url = `${URLPrefix}/api/v2/episode`;
    const params = {
      sid,
      page,
      sort,
      sort_direction,
      page_size: rowsPerPage,
      from: mustBeAvailableBy,
      to: mustBeAvailableUntil,
      availability: availability,
      search: search,
    };
    console.log("episode", params);
    axios
      .get(url, { params })
      .then((response) => {
        console.log("episode DAO", response);
        const items = [];
        response.data.items.forEach((episode) => {
          items.push({
            duration: moment.duration(episode.duration).toISOString(),
            pid: episode.pid,
            release_date: episode.release_date,
            title: episode.title,
            versionCrid: episode.versionCrid,
            vpid: episode.vpid,
            live: false,
            insertionType: "",
            entityType: "episode",
            availability: episode.availability,
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
    const version =
      clip.programme_availability.available_versions.available_version[0]
        .version; // TODO pick a version

    return {
      title: clip.clip.title.$,
      duration: moment.duration(version.duration.$).toISOString(),
      live: false,
      insertionType: "",
      versionCrid: version.crid.uri,
      pid: clip.clip.pid,
      vpid: version.pid,
      entityType: "clip",
      last_modified: clip.clip.last_modified,
    };
  }

  static getLoop() {}
}
export default AssetDao;
