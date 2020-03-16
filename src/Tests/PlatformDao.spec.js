import PlatformDao from "../PlatformDao/PlatformDao.js";

describe("ScheduleObject", () => {
  test("platformDAO", () => {
    PlatformDao.getUser({ name: "anonymous", auth: true });
  });
});
