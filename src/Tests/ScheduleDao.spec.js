import configv2 from "./templates/ScheduleObjectItems";
import axios from "axios";


import {
  fetchSchedule,
  fetchSchedulev2,
  saveSchedule,
  saveS3Schedule,
  saveScheduleV2,
  getLanguages,
} from "../ScheduleDao/ScheduleDao";

describe("ScheduleDao", () => {
  let languageList;
  let configObj;
  let returnedObject = {
    data: configV2
  }

  test("Should fetch all available langauges", done => {
    jest.mock('axios');
    axios.get.mockResolvedValue(returnedObject);
    function callback(response){
      languageList = Object.keys(response);
      configObj = response;
      expect(languageList).toBe(["s"]);
      done();
    }
    getLanguages(response)

  })

    
    
    