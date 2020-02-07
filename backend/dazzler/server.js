// https://github.com/bbc/sample-cloud-apps/nodejs-helloworld/src/helloworld/server.js
const auth = require("./auth");
const express = require("express");
const bodyParser = require("body-parser");
const pid2crid = require("./pid2crid");
const nitro = require("./nitro");
const spw = require("./spw");
const pips = require("./pips");

const app = express();
var configuration;

if (!process.env.AUTHORISED_USERS) {
  configuration = require("../../src/config/env.json");
  process.env = configuration;
}

const config = {
  bbc_marathi_tv: {
    mid: "bbc_marathi_tv",
    loop_collection: process.env.LOOP_COLLECTION.trim(),
    specials_collection: process.env.SPECIALS_COLLECTION.trim(),
    live_brand: process.env.LIVE_BRAND.trim(),
    clip_language: "marathi",
    webcast_channels: [
      "world_service_stream_05",
      "world_service_stream_06",
      "world_service_stream_07",
      "world_service_stream_08"
    ]
  }
};

app.use(bodyParser.text({ type: "*/*", limit: "500kb" }));

app.use(express.static(__dirname + "/../edit"));

// /status is used by ELB health checkers to assert that the service is running OK
app.get("/status", function(req, res) {
  res.send("OK");
});

app.get("/api/v1/user", function(req, res) {
  if (req.header("sslclientcertsubject")) {
    const subject = parseSSLsubject(req);
    let r = { email: subject.emailAddress, auth: auth(subject.emailAddress) };
    if (subject.hasOwnProperty("CN")) {
      r.name = subject.CN;
    }
    res.json(r);
  } else {
    res.json({ name: "anonymous", auth: false });
  }
});

app.get("/api/v1/schedule", async (req, res) => {
  try {
    const sid = req.query.sid;
    const date = req.query.date;
    const schedule = await spw.request(sid, date);
    const s = schedule.item;
    let pids = [];
    for (let i = 0; i < s.length; i++) {
      const link = s[i].version[0].version_of[0].link[0].$;
      if (link.rel === "pips-meta:clip") {
        pids.push(link.pid);
      }
    }
    if (pids.length > 0) {
      await nitro.addClips(s, pids);
    }
    // work around circular dependencies
    let o = {};
    for (let key of Object.keys(schedule)) {
      o[key] = schedule[key];
    }
    res.json({ total: s.length, item: s, sid: sid, date: date });
  } catch (e) {
    res.json({ total: 0 });
  }
});

app.get("/api/v1/broadcast", async (req, res) => {
  let q = {
    sid: req.query.sid,
    start_from: req.query.start,
    start_to: req.query.end
  };
  if (req.query.hasOwnProperty("page")) {
    q.page = req.query.page;
  }
  if (req.query.hasOwnProperty("page_size")) {
    q.page_size = req.query.page_size;
  }
  try {
    const r = await nitro.request("schedules", q);
    res.json(r.data.nitro.results);
  } catch (e) {
    res.status(404).send("Not found"); // TODO use proper error message
  }
});

app.get("/api/v1/webcast", async (req, res) => {
  let q = {};
  if (req.query.hasOwnProperty("start")) {
    q.start_from = req.query.start;
  }
  if (req.query.hasOwnProperty("end")) {
    q.start_to = req.query.end;
  }
  if (req.query.hasOwnProperty("brand")) {
    q.descendants_of = req.query.brand;
  }
  if (req.query.hasOwnProperty("sid")) {
    q.sid = config[req.query.sid].webcast_channels;
    if (!q.hasOwnProperty("descendants_of")) {
      q.descendants_of = config[req.query.sid].live_brand;
    }
  }
  if (req.query.hasOwnProperty("page")) {
    q.page = req.query.page;
  }
  if (req.query.hasOwnProperty("page_size")) {
    q.page_size = req.query.page_size;
  }
  try {
    const r = await nitro.request("schedules", q);
    res.json(add_crids_to_webcast(r.data.nitro.results));
  } catch (e) {
    res.status(404).send("Not found"); // TODO use proper error message
  }
});

app.get("/api/v1/loop", async (req, res) => {
  let q = {
    group: config[req.query.sid].loop_collection,
    sort: "group_position",
    sort_direction: "ascending"
  };
  await clip(q, req.query, res);
});

app.get("/api/v1/special", async (req, res) => {
  let q = {
    group: config[req.query.sid].specials_collection
  };
  await clip(q, req.query, res);
});

app.get("/api/v1/clip", async (req, res) => {
  let q = {};
  let sid = "bbc_marathi_tv";
  if (req.query.sid) {
    sid = req.query.sid;
  }
  if (req.query.hasOwnProperty("type")) {
    if (req.query.type === "web") {
      q.tag_name = config[sid].clip_language;
    } else {
      q.master_brand = config[sid].mid;
    }
  } else {
    q.tag_name = config[sid].clip_language;
  }
  await clip(q, req.query, res);
});

async function clip(q, query, res) {
  if (query.hasOwnProperty("page")) {
    q.page = query.page;
  }
  if (query.hasOwnProperty("page_size")) {
    q.page_size = query.page_size;
  }
  q.mixin = ["images", "available_versions"];
  q.entity_type = "clip";
  q.availability = "available";
  try {
    let pids = [];
    let response = await nitro.request("programmes", q);
    let clips = response.data.nitro.results;
    for (let i = 0; i < clips.items.length; i++) {
      if (clips.items[i].available_versions.hasOwnProperty("version")) {
        const version = clips.items[i].available_versions.version;
        for (let j = 0; j < version.length; j++) {
          pids.push(version[j].pid);
        }
      }
    }
    const map = await get_version_pid2crid_map(pids);
    console.log(map);
    for (let i = 0; i < clips.items.length; i++) {
      if (clips.items[i].available_versions.hasOwnProperty("version")) {
        const version = clips.items[i].available_versions.version;
        for (let j = 0; j < version.length; j++) {
          version[j].crid = map[version[j].pid];
        }
      }
    }
    res.json(clips);
  } catch (e) {
    console.log(e);
    res.status(404).send("Not found"); // TODO use proper error message
  }
}

app.get("/api/v1/episode", async (req, res, next) => {
  let q = {
    mixin: ["images", "available_versions"],
    entity_type: "episode"
  };
  if (req.query.hasOwnProperty("sid")) {
    q.master_brand = config[req.query.sid].mid;
  }
  if (req.query.hasOwnProperty("pid")) {
    q.pid = req.query.pid;
  }
  if (req.query.hasOwnProperty("page")) {
    q.page = req.query.page;
  }
  if (req.query.hasOwnProperty("page_size")) {
    q.page_size = req.query.page_size;
  }
  if (req.query.hasOwnProperty("availability")) {
    q.availability = req.query.availability;
  } else {
    q.availability = "available";
  }
  try {
    let items = [];
    const nres = await nitro.request("programmes", q);
    if (nres.status !== 200) {
      console.log(nres.status);
    }
    const available_episodes = add_version_crids_to_episodes(
      nres.data.nitro.results
    );
    if (available_episodes.total > 0) {
      items = available_episodes.items;
    }
    res.json({
      page_size: q.page_size,
      page: q.page,
      total: available_episodes.total,
      items: items
    });
  } catch (e) {
    console.log(e);
    res.status(404).send("error");
  }
});

app.post("/api/v1/loop", async function(req, res) {
  const aws = require("aws-sdk");
  const s3 = new aws.S3({ apiVersion: "2006-03-01" });
  var params = {
    Body: req.body,
    Bucket: "ws-dazzler-assets",
    Key: "Schedule/Schedule.json"
  };
  try {
    let s3Response = await s3.putObject(params).promise();
    res.send("saved");
  } catch (e) {
    console.log("error ", e);
    res.send("error");
  }
});

app.post("/api/v1/tva", async (req, res) => {
  if (req.body.includes('serviceIDRef="TVMAR01')) {
    let user = "dazzler"; // assume local
    if (req.header("sslclientcertsubject")) {
      const subject = parseSSLsubject(req);
      user = subject.emailAddress;
    }
    if (auth(user)) {
      const r = await pips.postTVA(req.body, res);
      res.json(r.data);
    } else {
      const message = user + " is not authorised to save schedules";
      console.log(message);
      res.status(403).send(message);
    }
  } else {
    console.log("Marathi only please");
    res.status(403).send("Marathi only please");
  }
});

// we assume only IBMS schedules webcasts so pid2crid can work
function add_crids_to_webcast(results) {
  if (results && results.total > 0) {
    for (let i = 0; i < results.items.length; i++) {
      const pid = results.items[i].window_of[0].pid;
      results.items[i].window_of[0].crid = pid2crid.crid(pid);
    }
  }
  return results;
}

async function get_version_pid2crid_map(pids) {
  let map = {};
  if (pids.length > 0) {
    const response = await nitro.request("versions", { pid: pids });
    const items = response.data.nitro.results.items;
    for (let i = 0; i < items.length; i++) {
      const ids = items[i].identifiers.identifier;
      for (let j = 0; j < ids.length; j++) {
        if (ids[j].type === "crid") {
          map[items[i].pid] = ids[j].$;
        }
      }
    }
  }
  return map;
}

// stand alone episodes created in Jupiter will have pids that pid2crid gets wrong
function add_version_crids_to_episodes(results) {
  let pids = [];
  let versions = [];
  if (results && results.total > 0) {
    for (let i = 0; i < results.items.length; i++) {
      if (results.items[i].available_versions.hasOwnProperty("version")) {
        for (
          let j = 0;
          j < results.items[i].available_versions.version.length;
          j++
        ) {
          let version = results.items[i].available_versions.version[j];
          if (version.pid.startsWith("w")) {
            version.crid = pid2crid.crid(version.pid);
          } else {
            pids.push(version.pid);
            versions.push(version);
          }
        }
      }
    }
  }
  const map = get_version_pid2crid_map(pids);
  versions.forEach(version => {
    version.crid = map[version.pid];
  });
  return results;
}

function parseSSLsubject(req) {
  var subject = req.header("sslclientcertsubject");
  var fields = subject.split(",");
  var data = {};
  for (var i = 0; i < fields.length; i++) {
    var [key, val] = fields[i].split("=");
    data[key] = val;
  }
  return data;
}

// We do the "listen" call in index.js - making this module easier to test
module.exports.app = app;
