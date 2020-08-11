import axios from "axios";
import {
  fetchSchedule,
  fetchSchedulev2,
  saveSchedule,
  saveS3Schedule,
  saveScheduleV2,
  getLanguages,
} from "../ScheduleDao/ScheduleDao";
import { configV2 } from "./templates/ScheduleDaoItems";
import { config } from "aws-sdk";
jest.mock("axios");
describe("ScheduleDao", () => {
  test("testing getLanguages fetches the list of languages", (done) => {
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
    let fetchLanguages = getLanguages(callBack);

    console.log("bang");
  });
});
