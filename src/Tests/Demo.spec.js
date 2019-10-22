import React from "react";
import * as enzyme from "enzyme";
import Adapter from "enzyme-adapter-react-16";
enzyme.configure({ adapter: new Adapter() });
import { shallow, mount, render } from "enzyme";
import Demo from "../Demo/Demo";
import moment from "moment";
import Button from "../Button";

describe("< Demo />", () => {
  test("Testing that the <Demo /> component is rendered", () => {
    const component = shallow(<Demo />);
    expect(component).toHaveLength(1);
  });

  test("left menu opens when clicked", () => {
    const wrapper = mount(<Demo />);
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
});
