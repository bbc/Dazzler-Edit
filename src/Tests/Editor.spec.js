import React from "react";
import * as enzyme from "enzyme";
import Adapter from "enzyme-adapter-react-16";
import { shallow, mount } from "enzyme";
import Editor from "../Editor/Editor";
import Button from "../Button";
enzyme.configure({ adapter: new Adapter() });

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
});
