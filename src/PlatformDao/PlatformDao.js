import axios from "axios";

const URLPrefix =
  process.env.NODE_ENV === "development" ? "http://localhost:8080" : "";

class PlatformDao {
  static getUser() {
    return new Promise((resolve, reject) => {
      axios
        .get(`${URLPrefix}/api/v2/user`)
        .then((response) => {
          resolve(response.data);
        })
        // .then((response) => cb(response.data))
        .catch((e) => {
          console.log(e);
          reject(e);
        });
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
