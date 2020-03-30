class Utils {
  static episodeInfo = item => {
    try {
      if (!item.availability.actual_start) {
        item.status = "unavailable";
        return ["grey", `Expected ${item.availability.expected_start}`];
      } else {
        item.status = "";
        return ["", `PID = ${item.pid}`];
      }
    } catch (error) {}
  };
}

export const episodeInfo = Utils.episodeInfo;
export default Utils;
