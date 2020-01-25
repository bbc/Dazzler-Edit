import PlatformDao from "../PlatformDao/PlatformDao.js";
import moment from "moment";

describe("ScheduleObject", () => {
  test("platformDAO", () => {
    PlatformDao.getUser({ name: "anonymous", auth: true });
  });
});
