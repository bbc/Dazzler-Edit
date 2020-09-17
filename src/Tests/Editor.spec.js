import React from "react";
import * as enzyme from "enzyme";
import Adapter from "enzyme-adapter-react-16";
import { shallow, mount } from "enzyme";
import Editor from "../Editor/Editor";
enzyme.configure({ adapter: new Adapter() });

describe("< Editor />", () => {
  test("Testing that the <Editor /> component is rendered", () => {
    const component = shallow(<Editor />);
    expect(component).toHaveLength(1);
  });

  // test("sid changes when different language service chosen in dropdown", () => {
  //   const wrapper = mount(<Editor />);
  //   const openMenu = wrapper;
  //   openMenu.simulate("click");
  //   expect(wrapper.state().open).toEqual(true);
  // });

  //Test when you click button date is changed

  //Test that current point is selected

  //test that menu opens when you click it
});
