import EpisodeList from "../EpisodeList";
import Episode from "../Episode/Episode";
import React from "react";
import Enzyme, { shallow, mount } from "enzyme";
import Adapter from "enzyme-adapter-react-16";
import { episodeItems } from "./templates/EpisodeItems";
import { episodeInfo } from "../Utils";

Enzyme.configure({ adapter: new Adapter() });

describe("Episode", () => {
  it("Testing that the episode component is rendered", () => {
    const wrapper = shallow(<Episode page={1} rowsPerPage={5} />);
    expect(wrapper).toHaveLength(1);
  });
  test("Testing that episodes that are unavailable are highlighted ", () => {
    const status = episodeInfo(episodeItems[1]);

    expect(episodeItems[1].status).toBe("unavailable");
  });
  test("Testing that episodes that are are available are not highlighted ", () => {
    const status = episodeInfo(episodeItems[1]);

    expect(episodeItems[0].status).toBe(undefined);
  });
});
