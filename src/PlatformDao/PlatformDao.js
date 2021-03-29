import axios from "axios";

const URLPrefix =
  process.env.NODE_ENV === "development" ? "http://localhost:8080" : "";

class PlatformDao {
  static getUser(sid, cb) {
    axios
      .get(`${URLPrefix}/api/v2/user`, { params: { sid: sid}})
      .then((response) => cb(response.data))
      .catch((e) => {
        console.log(e);
      });
  }

  static subscribe(userSubscription, cb) {
    axios
      .post(`${URLPrefix}/api/v2/subscribe`, userSubscription)
      .then((response) => cb(response))
      .catch((e) => {
        console.log(e);
      });
  }
}
export default PlatformDao;
