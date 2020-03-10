const axios = require("axios");
const querystring = require("querystring");

async function addClips(schedule_items, clip_pids) {
  const r = await request("programmes", {
    pid: clip_pids,
    mixin: "ancestor_titles"
  });
  const clips = r.data.nitro.results.items;
  for (let i = 0; i < schedule_items.length; i++) {
    const pid = schedule_items[i].version[0].version_of[0].link[0].$.pid;
    for (let j = 0; j < clips.length; j++) {
      if (clips[j].pid === pid) {
        schedule_items[i]["clip"] = [clips[j]];
      }
    }
  }
}

function request(feed, query) {
  let url =
    `http://programmes.api.bbc.com/nitro/api/${feed}/?api_key=${process.env.NITRO_KEY}&` +
    querystring.stringify(query);
  console.log(url);
  return axios({
    url: url,
    method: "get",
    timeout: 8000,
    headers: {
      Accept: "application/json"
    }
  });
}

module.exports = {
  request: request,
  addClips: addClips
};
