import axios from "axios";
const URLPrefix =
  process.env.NODE_ENV === "development" ? "http://localhost:8080" : "";
class LoopDao {
  static backupPlaylist(loopItems, cb) {
    axios({
      method: "post",
      url: URLPrefix + "/api/v1/loop",
      data: loopItems
    })
      .then(response => {
        cb();
      })
      .catch(error => {
        console.error(error);
        console.log(error);
      });
  }
}

export const backupPlaylist = LoopDao.backupPlaylist;
