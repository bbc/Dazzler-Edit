import axios from "axios";
const URLPrefix =
  process.env.NODE_ENV === "development" ? "http://localhost:8080" : "";
class LoopDao {
  static backupPlaylist(loopItems, sid, cb) {
    const url = `${URLPrefix}/api/v2/loop`;
    axios({
      method: "post",
      url: url + `?sid=${sid}`,
      data: loopItems,
    })
      .then((response) => {
        cb();
      })
      .catch((error) => {
        console.error(error);
        console.log(error);
      });
  }
}

export const backupPlaylist = LoopDao.backupPlaylist;
