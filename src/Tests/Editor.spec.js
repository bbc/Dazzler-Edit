import React from "react";
import * as enzyme from "enzyme";
import Adapter from "enzyme-adapter-react-16";
enzyme.configure({ adapter: new Adapter() });
import { shallow, mount, render } from "enzyme";
import Editor from "../Editor/Editor";
import ScheduleObject from "../ScheduleObject";
import moment from "moment";
import Button from "../Button";

describe("< Editor />", () => {
  test("Testing that the <Editor /> component is rendered", () => {
    const component = shallow(<Editor />);
    expect(component).toHaveLength(1);
  });

  test("left menu opens when clicked", () => {
    const wrapper = mount(<Editor />);
    const openMenu = wrapper;

    openMenu.simulate("click");
    expect(wrapper.state().open).toEqual(true);
  });
  test("should toggle second button’s disabled state when clicking on first button", () => {
    const wrapper = shallow(<Button />);
    const firstButton = wrapper.find("button").at(0);

    firstButton.simulate("click");
    expect(wrapper.state().disabled).toEqual(true);
  });

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
});
