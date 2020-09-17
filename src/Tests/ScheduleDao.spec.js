import axios from "axios";

import { fetchSchedule, getLanguages } from "../ScheduleDao/ScheduleDao";
import {
  configV2,
  schedulev2,
  webcastResponse,
} from "./templates/ScheduleDaoItems";
jest.mock("axios");
describe("ScheduleDao", () => {
  test("testing getLanguages method fetches the list of all available languages", (done) => {
    let languageList;
    let configObj;

    let obj = {
      data: configV2,
    };
    axios.get.mockResolvedValue(obj);
    function callBack(response) {
      languageList = Object.keys(response);
      configObj = response;
      expect(languageList).toStrictEqual(["Hindi", "Marathi", "Swahili"]);
      done();
    }
    getLanguages(callBack);
  });
  test("testing fetchSchedulev2 method fetches the current schedule", (done) => {
    let obj = {
      data: {
        total: schedulev2.items.length,
        item: schedulev2.items,
        sid: schedulev2.sid,
        date: schedulev2.date,
      },
    };
    const sid = "bbc_marathi_tv";
    const date = "2020-08-06";
    function callback(data) {
      console.log(data);
      expect(data.items[0].insertionType).toEqual("sentinel");
      expect(data.items[1].insertionType).toEqual("gap");
      done();
    }
    axios.get.mockResolvedValue(obj);
    fetchSchedule(sid, date, callback);
  });
});
