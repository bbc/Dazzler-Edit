// https://github.com/bbc/sample-cloud-apps/nodejs-helloworld/src/helloworld/server.js
const auth = require("./auth");
const pid2crid = require("./pid2crid");
const nitro = require("./nitro");
const spw = require("./spw");
const pips = require("./pips");
const aws = require("aws-sdk");
const s3 = new aws.S3({
  apiVersion: "2006-03-01"
});

let config;

const user = function(req, res) {
  if (req.header("sslclientcertsubject")) {
    const subject = parseSSLsubject(req);
    let r = {
      email: subject.emailAddress,
      auth: auth(subject.emailAddress)
    };
    if (subject.hasOwnProperty("CN")) {
      r.name = subject.CN;
    }
    res.json(r);
  } else {
    res.json({
      name: "anonymous",
      auth: true
    });
  }
}

const schedule = async (req, res) => {
  try {
    const sid = req.query.sid || config.default_sid;
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
    res.json({
      total: s.length,
      item: s,
      sid: sid,
      date: date
    });
  } catch (e) {
    res.json({
      total: 0
    });
  }
}

const broadcast = async (req, res) => {
  let q = {
    sid: req.query.sid || config.default_sid,
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
}

const webcast =async (req, res) => {
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
}

const special = async (req, res) => {
  let q = {
    group: config[req.query.sid].specials_collection
  };
  await getClip(q, req.query, res);
}

const clip = async (req, res) => {
  const sid = req.query.sid || config.default_sid;
  const q = {};
  if (req.query.sort) {
    q.sort = req.query.sort;
    if (req.query.sort_direction) {
      q.sort_direction = req.query.sort_direction;
    } else {
      q.sort_direction = 'descending';
    }
  }
  if (req.query.type) {
    if (req.query.type === "web") {
      q.tag_name = config[sid].clip_language;
    } else {
      q.master_brand = config[sid].mid;
    }
  } else {
    q.tag_name = config[sid].clip_language;
  }
  await getClip(q, req.query, res);
}

async function getClip(q, query, res) {
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
    if (clips.items) {
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
    }
  } catch (e) {
    console.log(e);
    res.status(404).send("Not found"); // TODO use proper error message
  }
}

const episode = async (req, res, next) => {
  const sid = req.query.sid || config.default_sid;
  let q = {
    mixin: ["images", "available_versions"],
    entity_type: "episode"
  };
  if (req.query.sort) {
    q.sort = req.query.sort;
    if (req.query.sort_direction) {
      q.sort_direction = req.query.sort_direction;
    } else {
      q.sort_direction = 'descending';
    }
  }
  q.master_brand = config[sid].mid;
  if (req.query.pid) {
    q.pid = req.query.pid;
  }
  if (req.query.page) {
    q.page = req.query.page;
  }
  if (req.query.page_size) {
    q.page_size = req.query.page_size;
  }
  if (req.query.availability) {
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
}

const loop = async function(req, res) {
  let user = "dazzler"; // assume local
  if (req.header("sslclientcertsubject")) {
    const subject = parseSSLsubject(req);
    user = subject.emailAddress;
  }
  if (auth(user)) {
    const sid = req.query.sid || config.default_sid;
    var params = {
      Body: req.body,
      Bucket: process.env.BUCKET,
      Key: `${sid}/emergency-playlist.json`
    };
    try {
      await s3.putObject(params).promise();
      res.send("saved");
    } catch (e) {
      console.log("error ", e);
      res.status(404).send("error");
    }
  } else {
    const message = user + " is not authorised to save schedules";
    console.log(message);
    res.status(403).send(message);
  }
}

const tva = async (req, res) => {
  const sid = req.query.sid || config.default_sid;

  if (req.body.includes(`serviceIDRef="${config[sid].serviceIDRef}"`)) {
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
    console.log("Hindi only please");
    res.status(403).send("Hindi only please");
  }
}

// we assume only IBMS schedules webcasts so pid2crid can work
function add_crids_to_webcast(results) {
  if (results && results.total > 0) {
    for (let i = 0; i < results.items.length; i++) {
      const w = results.items[i].window_of;
      for (let j = 0; j < w.length; j++) {
        w[j].crid = pid2crid.crid(w[j].pid);
      }
    }
  }
  return results;
}

async function get_version_pid2crid_map(pids) {
  let map = {};
  if (pids.length > 0) {
    const response = await nitro.request("versions", {
      pid: pids
    });
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

module.exports = {
  init(app, configObject) {
    config = configObject;
    app.get("/api/v1/user", user);
    app.get("/api/v1/schedule", schedule);
    app.get("/api/v1/broadcast", broadcast);
    app.get("/api/v1/webcast", webcast);
    app.get("/api/v1/loop", loop);
    app.get("/api/v1/special", special);
    app.get("/api/v1/clip", clip);
    app.get("/api/v1/episode", episode);
    app.post("/api/v1/loop", loop);
    app.post("/api/v1/tva", tva);
  }
}