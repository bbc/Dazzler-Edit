import moment from "moment";
class Utils {
  static episodeInfo = (item) => {
    try {
      if (!item.availability.actual_start) {
        item.status = "unavailable";
        return [
          "grey",
          `Expected ${moment(item.availability.expected_start).format(
            "DD/MM/YY"
          )} at ${moment(item.availability.expected_start).format(
            "HH:MM:SS"
          )} `,
        ];
      } else {
        item.status = "";
        return ["", `PID = ${item.pid}`];
      }
    } catch (error) {}
  };
}

export const episodeInfo = Utils.episodeInfo;
export default Utils;

class Group {
  constructor(obj) {
    this.data = [];
    if (typeof obj[Symbol.iterator] === "function") {
      for (let x of obj) {
        if (x.asset.vpid && !JSON.stringify(this.data).includes(x.asset.vpid)) {
          this.data.push(x);
        }
      }
    }
  }

  get size() {
    return this.data.length;
  }
}
export const groupSet = Group;
