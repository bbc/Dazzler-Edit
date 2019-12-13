
  import ScheduleObject from "../ScheduleObject";
  import moment from "moment";
  
  describe("ScheduleObject", () => {

  test("Should add item at the chosen index", () => {
    debugger;
    let myScheduleObject = new ScheduleObject(
      "bbc_marathi_tv",
      moment().format("YYYY-MM-DD")
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
      moment().format("YYYY-MM-DD") + "T00:00:00.000Z"
    );
    //expect the two sentinels to be at the beginning and end
    expect(myScheduleObject.items[0].insertionType).toBe("sentinel");
    expect(
      myScheduleObject.items[myScheduleObject.items.length - 1].insertionType
    ).toBe("sentinel");
  });

  test("Should add item with a gap before live", () => {
    debugger;
    let myScheduleObject = new ScheduleObject(
      "bbc_marathi_tv",
      moment().format("YYYY-MM-DD"),
      [
        {
          title: "Dummy start",
          duration: "PT0S",
          startTime: moment("2019-12-08T00:00:00Z"),
          live: false,
          insertionType: "sentinel"
        },
        {
          title: "gap",
          startTime: moment("2019-12-08T00:00:00Z"),
          duration: "PT20H32M15S",
          live: false,
          insertionType: "gap"
        },
        {
          title: "BBC विश्व",
          startTime: moment("2019-12-08T20:32:15Z"),
          duration: "PT20M",
          live: true,
          insertionType: ""
        },
        {
          title: "प्राचीन बॉक्सिंग जोरात",
          startTime: moment("2019-12-08T20:52:15Z"),
          duration: "PT2M11S",
          live: false,
          insertionType: ""
        },
        {
          title: "gap",
          startTime: moment("2019-12-08T20:54:26Z"),
          duration: "PT3H5M34S",
          live: false,
          insertionType: "gap"
        },
        {
          title: "Dummy end",
          duration: "PT0S",
          startTime: moment("2019-12-09T00:00:00Z"),
          live: false,
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
        live: false,
        insertionType: "sentinel"
      },
      {
        title: "test",
        //startTime: moment("2019-12-08T00:00:00Z"),
        duration: "PT5M",
        live: false,
        insertionType: "midLoop"
      },
      {
        title: "gap",
        //startTime: moment("2019-12-08T00:05:00Z"),
        duration: "PT20H27M15S",
        live: false,
        insertionType: "gap"
      },
      {
        title: "BBC विश्व",
        //startTime: moment("2019-12-08T20:32:15Z"),
        duration: "PT20M",
        live: true,
        insertionType: ""
      },
      {
        title: "प्राचीन बॉक्सिंग जोरात",
        //startTime: moment("2019-12-08T20:52:15Z"),
        duration: "PT2M11S",
        live: false,
        insertionType: ""
      },
      {
        title: "gap",
        //startTime: moment("2019-12-08T20:54:26Z"),
        duration: "PT3H5M34S",
        live: false,
        insertionType: "gap"
      },
      {
        title: "Dummy end",
        duration: "PT0S",
        //startTime: moment("2019-12-09T00:00:00Z"),
        live: false,
        insertionType: "sentinel"
      }
    ];

    //expect the new item to be added

    expect(myScheduleObject.items[0].insertionType).toBe('sentinel');
    expect(myScheduleObject.items[1].insertionType).toBe('midLoop');
    expect(myScheduleObject.items[2].insertionType).toBe('gap');
    expect(myScheduleObject.items[3].insertionType).toBe('');
    expect(myScheduleObject.items[4].insertionType).toBe('');
    expect(myScheduleObject.items[5].insertionType).toBe('gap');
    expect(myScheduleObject.items[6].insertionType).toBe('sentinel');
    expect(myScheduleObject.items.length).toBe(expected.length);
    expect(myScheduleObject.items).toMatchObject(expected);    
  });

});