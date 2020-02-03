import ScheduleObject from "../ScheduleObject";
import {
  loopItems,
  clipsAndLiveItem,
  endOfScheduleItems,
  singleItemLoop,
  ItemsWithOverlap
} from "./templates/items";
import moment from "moment";

describe("ScheduleObject", () => {
  test("Should add item at the chosen index", () => {
    let myScheduleObject = new ScheduleObject(
      "bbc_marathi_tv",
      moment("2019-12-08")
    );
    myScheduleObject.addFloating(1, [
      { duration: "PT5M", insertionType: "midLoop" }
    ]);

    //expect the new item to be added
    expect(myScheduleObject.items.length).toBe(4);
    // expect the gap to be before the last item
    expect(myScheduleObject.items[2].title).toBe("gap");
    //expect the duration to be 5 minutes less then what it was before
    expect(myScheduleObject.items[2].duration).toBe("PT23H55M");
    //expect the duration of the new item to be 5 minutes
    expect(myScheduleObject.items[1].duration).toBe("PT5M");
    //expect new item to have the insertion type of midloop
    expect(myScheduleObject.items[1].insertionType).toBe("midLoop");
    //expect new item to have a start time of 00:05:00
    expect(moment(myScheduleObject.items[1].startTime).toISOString()).toBe(
      "2019-12-08T00:00:00.000Z"
    );
    //expect the two sentinels to be at the beginning and end
    expect(myScheduleObject.items[0].insertionType).toBe("sentinel");
    expect(
      myScheduleObject.items[myScheduleObject.items.length - 1].insertionType
    ).toBe("sentinel");
  });

  test("Should add item with a gap before live", () => {
    let myScheduleObject = new ScheduleObject(
      "bbc_marathi_tv",
      moment("2019-12-08"),
      [
        {
          title: "Dummy start",
          duration: "PT0S",
          startTime: moment("2019-12-08T00:00:00Z"),
          insertionType: "sentinel"
        },
        {
          title: "gap",
          startTime: moment("2019-12-08T00:00:00Z"),
          duration: "PT20H32M15S",
          insertionType: "gap"
        },
        {
          title: "BBC विश्व",
          startTime: moment("2019-12-08T20:32:15Z"),
          duration: "PT20M",
          insertionType: "live"
        },
        {
          title: "प्राचीन बॉक्सिंग जोरात",
          startTime: moment("2019-12-08T20:52:15Z"),
          duration: "PT2M11S",
          insertionType: ""
        },
        {
          title: "gap",
          startTime: moment("2019-12-08T20:54:26Z"),
          duration: "PT3H5M34S",
          insertionType: "gap"
        },
        {
          title: "Dummy end",
          duration: "PT0S",
          startTime: moment("2019-12-09T00:00:00Z"),
          insertionType: "sentinel"
        }
      ]
    );
    myScheduleObject.addFloating(1, [
      {
        title: "test",
        live: false,
        duration: "PT5M",
        insertionType: "midLoop"
      }
    ]);

    const expected = [
      {
        title: "Dummy start",
        duration: "PT0S",
        //startTime: moment("2019-12-08T00:00:00Z"),
        insertionType: "sentinel"
      },
      {
        title: "test",
        //startTime: moment("2019-12-08T00:00:00Z"),
        duration: "PT5M",
        insertionType: "midLoop"
      },
      {
        title: "gap",
        //startTime: moment("2019-12-08T00:05:00Z"),
        duration: "PT20H27M15S",
        insertionType: "gap"
      },
      {
        title: "BBC विश्व",
        //startTime: moment("2019-12-08T20:32:15Z"),
        duration: "PT20M",
        insertionType: "live"
      },
      {
        title: "प्राचीन बॉक्सिंग जोरात",
        //startTime: moment("2019-12-08T20:52:15Z"),
        duration: "PT2M11S",
        insertionType: ""
      },
      {
        title: "gap",
        //startTime: moment("2019-12-08T20:54:26Z"),
        duration: "PT3H5M34S",
        insertionType: "gap"
      },
      {
        title: "Dummy end",
        duration: "PT0S",
        //startTime: moment("2019-12-09T00:00:00Z"),
        insertionType: "sentinel"
      }
    ];

    //expect the new item to be added

    expect(myScheduleObject.items[0].insertionType).toBe("sentinel");
    expect(myScheduleObject.items[1].insertionType).toBe("midLoop");
    expect(myScheduleObject.items[2].insertionType).toBe("gap");
    expect(myScheduleObject.items[3].insertionType).toBe("live");
    expect(myScheduleObject.items[4].insertionType).toBe("");
    expect(myScheduleObject.items[5].insertionType).toBe("gap");
    expect(myScheduleObject.items[6].insertionType).toBe("sentinel");
    expect(myScheduleObject.items.length).toBe(expected.length);
    expect(myScheduleObject.items).toMatchObject(expected);
  });

  test("Should add items to empty schedule with unique start times", () => {
    let myScheduleObject = new ScheduleObject(
      "bbc_marathi_tv",
      moment("2019-12-08")
    );
    myScheduleObject.addFloating(1, [
      {
        title: "test",
        duration: "PT5M",
        insertionType: "loopStart"
      },
      {
        title: "test",
        duration: "PT5M",
        insertionType: "midLoop"
      },
      {
        title: "test",
        duration: "PT5M",
        insertionType: "loopEnd"
      }
    ]);

    const expected = [
      {
        title: "Dummy Start",
        duration: "PT0S",
        //startTime: moment("2019-12-08T00:00:00Z"),
        insertionType: "sentinel"
      },
      {
        title: "test",
        //startTime: moment("2019-12-08T00:00:00Z"),
        duration: "PT5M",
        insertionType: "loopStart"
      },
      {
        title: "test",
        //startTime: moment("2019-12-08T00:05:00Z"),
        duration: "PT5M",
        insertionType: "midLoop"
      },
      {
        title: "test",
        //startTime: moment("2019-12-08T00:10:00Z"),
        duration: "PT5M",
        insertionType: "loopEnd"
      },
      {
        title: "gap",
        //startTime: moment("2019-12-08T00:15:00Z"),
        duration: "PT23H45M",
        insertionType: "gap"
      },
      {
        title: "Dummy End",
        duration: "PT0S",
        //startTime: moment("2019-12-09T00:00:00Z"),
        insertionType: "sentinel"
      }
    ];

    //expect the new item to be added

    const items = myScheduleObject.items;

    expect(items[0].insertionType).toBe("sentinel");
    expect(items[1].insertionType).toBe("loopStart");
    expect(items[2].insertionType).toBe("midLoop");
    expect(items[3].insertionType).toBe("loopEnd");
    expect(items[4].insertionType).toBe("gap");
    expect(items[5].insertionType).toBe("sentinel");
    expect(items.length).toBe(expected.length);

    expect(items[1].startTime.utc().format()).toBe("2019-12-08T00:00:00Z");
    expect(items[2].startTime.utc().format()).toBe("2019-12-08T00:05:00Z");
    expect(items[3].startTime.utc().format()).toBe("2019-12-08T00:10:00Z");
    expect(items[4].startTime.utc().format()).toBe("2019-12-08T00:15:00Z");

    expect(myScheduleObject.items).toMatchObject(expected);
  });

  test("Should add items to non-empty schedule with unique start times", () => {
    let myScheduleObject = new ScheduleObject(
      "bbc_marathi_tv",
      moment("2019-12-08")
    );
    const test_item = {
      title: "test",
      duration: "PT1M",
      insertionType: ""
    };
    myScheduleObject.addFloating(1, test_item);
    const test_item2 = {
      title: "test 2",
      duration: "PT1M",
      insertionType: ""
    };
    myScheduleObject.addFloating(2, test_item2);

    const expected = [
      {
        title: "Dummy Start",
        duration: "PT0S",
        //startTime: moment("2019-12-08T00:00:00Z"),
        insertionType: "sentinel"
      },
      {
        title: "test",
        //startTime: moment("2019-12-08T00:00:00Z"),
        duration: "PT1M",
        insertionType: ""
      },
      {
        title: "test 2",
        //startTime: moment("2019-12-08T00:01:00Z"),
        duration: "PT1M",
        insertionType: ""
      },
      {
        title: "gap",
        //startTime: moment("2019-12-08T00:02:00Z"),
        duration: "PT23H58M",
        insertionType: "gap"
      },
      {
        title: "Dummy End",
        duration: "PT0S",
        //startTime: moment("2019-12-09T00:00:00Z"),
        insertionType: "sentinel"
      }
    ];

    //expect the new item to be added

    const items = myScheduleObject.items;

    expect(items[0].insertionType).toBe("sentinel");
    expect(items[1].insertionType).toBe("");
    expect(items[2].insertionType).toBe("");
    expect(items[3].insertionType).toBe("gap");
    expect(items[4].insertionType).toBe("sentinel");
    expect(items.length).toBe(expected.length);

    expect(items[1].startTime.utc().format()).toBe("2019-12-08T00:00:00Z");
    expect(items[2].startTime.utc().format()).toBe("2019-12-08T00:01:00Z");
    expect(items[3].startTime.utc().format()).toBe("2019-12-08T00:02:00Z");

    expect(myScheduleObject.items).toMatchObject(expected);
  });

  test("Should delete all occurences of clip in schedule", () => {
    let myScheduleObject = new ScheduleObject(
      "bbc_marathi_tv",
      moment("2020-01-21"),
      loopItems
    );

    let index = 1;
    let pid = myScheduleObject.items[index].asset.pid;
    myScheduleObject.deleteAllOccurencesClosingGap(pid);

    //Our new items list should be less than our previous item list
    expect(myScheduleObject.items.length).toBeLessThan(loopItems.length);
    //The removed pid should not appear in new item list
    expect(JSON.stringify(myScheduleObject.items).includes(pid)).toBeFalsy();
    expect(JSON.stringify(myScheduleObject.items)).toEqual(
      expect.not.stringContaining(pid)
    );
  });

  test("System should not delete all occurences of live items", () => {
    let myScheduleObject = new ScheduleObject(
      "bbc_marathi_tv",
      moment("2020-01-21"),
      loopItems
    );

    let index = 8;
    let pid = myScheduleObject.items[index].asset.pid;
    myScheduleObject.deleteAllOccurencesClosingGap(pid);

    //Our new items list should be the same length as our previous item list
    expect(myScheduleObject.items.length).toEqual(loopItems.length);
    //The live item pid should appear in the item list
    expect(JSON.stringify(myScheduleObject.items).includes(pid)).toBeTruthy();
    expect(JSON.stringify(myScheduleObject.items)).toEqual(
      expect.stringContaining(pid)
    );
  });

  test("System should correctly add overlap before start of live", () => {
    let myScheduleObject = new ScheduleObject(
      "bbc_marathi_tv",
      moment("2020-01-27"),
      clipsAndLiveItem
    );

    const itemToAdd = {
      title: "ItemToAdd",
      duration: "PT6M51S",
      live: false,
      insertionType: "",
      versionCrid: "crid://bbc.co.uk/p/229911861",
      pid: "p080y6c2",
      vpid: "p080yh9m"
    };

    let index = 4;

    myScheduleObject.addFloating(index, itemToAdd);

    //Check that we have an insertionType of overlap before the live
    expect(myScheduleObject.items[index].insertionType).toEqual("overlap");
    //Check that system truncates the overlap
    expect(
      myScheduleObject.items[index].duration <
        myScheduleObject.items[index].asset.duration
    ).toBeTruthy(); //Need a better way to compare durations
  });
  test("System should correctly calculate overlap before the end of the day's schedule", () => {
    let myScheduleObject = new ScheduleObject(
      "bbc_marathi_tv",
      moment("2020-01-27"),
      endOfScheduleItems
    );

    let index = 2;

    const itemToAdd = {
      title: "ItemToAdd",
      duration: "PT6M51S",
      live: false,
      insertionType: "",
      versionCrid: "crid://bbc.co.uk/p/229911861",
      pid: "p080y6c2",
      vpid: "p080yh9m"
    };

    myScheduleObject.addFloating(index, itemToAdd);

    expect(myScheduleObject.items[index].insertionType).toEqual("overlap");
    //Check that system truncates the overlap
    expect(
      myScheduleObject.items[index].duration <
        myScheduleObject.items[index].asset.duration
    ).toBeTruthy(); //Need a better way to compare durations

    //Check that the system recalculates schedule when overlapping item is deleted.
  });

  test("System should correctly recalculate schedule when overlapping item is deleted", () => {
    let myScheduleObject = new ScheduleObject(
      "bbc_marathi_tv",
      moment("2020-01-27"),
      ItemsWithOverlap
    );

    //index of overlap item
    const index = 5;
    const originalLength = myScheduleObject.items.length;

    console.log("PID", myScheduleObject.items[5].asset.pid);
    myScheduleObject.deleteItemClosingGap(index);

    //Insertion type should change from overlap to gap at the specified index
    expect(myScheduleObject.items[index].insertionType).toEqual("gap");
    expect(myScheduleObject.items[index].title).toEqual("gap");
    //expect item length to be the same since overlapping item has been replaced with a gap
    expect(originalLength).toEqual(myScheduleObject.items.length);
  });

  test("System should correctly recalculate schedule when an item is deleted and the overlap remains but is shorter", () => {
    let myScheduleObject = new ScheduleObject(
      "bbc_marathi_tv",
      moment("2020-01-27"),
      ItemsWithOverlap
    );
    const index = 1;
    const originalLength = myScheduleObject.items.length;

    let newDuration = moment
      .duration(myScheduleObject.items[5].duration)
      .add(moment.duration(myScheduleObject.items[1].duration));

    myScheduleObject.deleteItemClosingGap(index);
    //Our overlapped item duration should be its original duration plus the duration of the recently deleted item
    expect(myScheduleObject.items[4].duration).toBe(newDuration.toISOString());
    //Expect overlapped item to retain insertiontype status of 'overlap'
    expect(myScheduleObject.items[4].insertionType).toBe("overlap");
    //Length should be 1 less since item has been deleted
    expect(originalLength).toBeGreaterThan(myScheduleObject.items.length);
  });

  test("System should clear the schedule when all occurences of an item, in a single item loop is deleted ", () => {
    let myScheduleObject = new ScheduleObject(
      "bbc_marathi_tv",
      moment("2020-01-27"),
      singleItemLoop
    );

    let index = 1;
    let pid = myScheduleObject.items[index].asset.pid;

    myScheduleObject.deleteAllOccurencesClosingGap(pid);

    // Only the sentinels should remain
    expect(myScheduleObject.items.length).toEqual(3);
    //There is no overlap so the duration should remain the same
    expect(myScheduleObject.items[0].title).toEqual("Dummy Start");
  });
});
