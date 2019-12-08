// https://github.com/bbc/sample-cloud-apps/nodejs-helloworld/src/helloworld/server.js
const auth = require("./auth");
const express = require("express");
const axios = require("axios");
const fs = require("fs");
const parseString = require("xml2js").parseString;
const xml2js = require('xml2js-es6-promise');
const querystring = require("querystring");
const Big = require("big-integer");
const https = require("https");
const bodyParser = require("body-parser");
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
    res.json({ auth: false });
  }
});

function onlyName(name) {
  return name.split(':')[1]
} 

app.get("/api/v1/schedule", async (req, res) => {
  try {
    const sid = req.query.sid;
    const date = req.query.date;
    let url = `https://programmes.api.bbc.com/schedule?api_key=${process.env.SPW_KEY}&sid=${sid}&date=${date}`
    console.log(url);
    let r = await axios({
      url: url,
      method: 'get',
      timeout: 8000,
      key: fs.readFileSync(process.env.KEY),
      cert: fs.readFileSync(process.env.CERT),
      passphrase: process.env.PASSPHRASE,
      headers: { 'Accept': 'application/xml', }
    });
    const schedule = (await xml2js(r.data, {tagNameProcessors:[onlyName]})).schedule;
    const s = schedule.item;
    let pids = [];
    for (let i = 0; i < s.length; i++) {
      const link = s[i].version[0].version_of[0].link[0].$;
      if (link.rel === 'pips-meta:clip') {
        pids.push(link.pid);
      }
    }
    if(pids.length > 0) {
        await addClips(s, pids);
    }
    // work around circular dependencies
    let o = {};
    for(let key of Object.keys(schedule)) {
        o[key] = schedule[key];
    }
    res.json({"total":s.length, item:s, sid:sid, date:date});
  } catch(e) {
    res.json({"total":0});
  }
});

async function addClips(schedule_items, clip_pids) {
  const r = await nitroRequest("programmes", { pid: clip_pids, mixin: "ancestor_titles" })
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
  try{
    console.log('broadcast', q);
    const r = await nitroRequest("schedules", q);
    res.json(r.data.nitro.results);
  } catch(e) {
    res.status(404).send("Not found") // TODO use proper error message
  }
});

app.get("/api/v1/webcast", async (req, res) => {
  console.log('webcast', req.query);
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
    if(!q.hasOwnProperty("descendants_of")) {
        q.descendants_of = config[req.query.sid].live_brand;
    }
  }
  if (req.query.hasOwnProperty("page")) {
    q.page = req.query.page;
  }
  if (req.query.hasOwnProperty("page_size")) {
    q.page_size = req.query.page_size;
  }
  try{
    const r = await nitroRequest("schedules", q);
    res.json(add_crids_to_webcast(r.data.nitro.results));
  } catch(e) {
    res.status(404).send("Not found") // TODO use proper error message
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
  if (req.query.hasOwnProperty("type")) {
    if (req.query.type === "web") {
      q.tag_name = config[req.query.sid].clip_language;
    } else {
      q.master_brand = config[req.query.sid].mid;
    }
  } else {
    q.tag_name = config[req.query.sid].clip_language;
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
    let response = await nitroRequest("programmes", q);
    let clips = response.data.nitro.results;
    for (let i = 0; i < clips.items.length; i++) {
      if (clips.items[i].available_versions.hasOwnProperty("version")) {
        const version = clips.items[i].available_versions.version;
        for (let j = 0; j < version.length; j++) {
          pids.push(version[j].pid);
        }
      }
    }
    response = await nitroRequest("versions", { pid: pids });
    const items = response.data.nitro.results.items;
    let map = new Map();
    for (let i = 0; i < items.length; i++) {
      const ids = items[i].identifiers.identifier;
      for (let j = 0; j < ids.length; j++) {
        if (ids[j].type === "crid") {
          map.set(items[i].pid, ids[j].$);
        }
      }
    }
    for (let i = 0; i < clips.items.length; i++) {
      if (clips.items[i].available_versions.hasOwnProperty("version")) {
        const version = clips.items[i].available_versions.version;
        for (let j = 0; j < version.length; j++) {
          version[j].crid = map.get(version[j].pid);
        }
     }
    }
    res.json(clips);
  } catch(e) {
    res.status(404).send("Not found") // TODO use proper error message
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
    q.availability = req.query.availability;;
    try {
      let items = [];
      const available_episodes = await get_episodes(q);
      if(available_episodes.total>0) {
        items = available_episodes.items;
      }
      res.json({
        page_size: q.page_size,
        page: q.page,
        total: items.length,
        items: items
      });
    } catch (e) {
      console.log(JSON.stringify(e));
      res.status(404).send("error");
    }
  }
  else {
    try {
      let items = [];
      q.availability = "available";
      const available_episodes = await get_episodes(q);
      if(available_episodes.total>0) {
        items = items.concat(available_episodes.items);
      }
      q.availability = "PT24H";
      const future_episodes = await get_episodes(q);
      if(future_episodes.total>0) {
        items = items.concat(future_episodes.items);
      }
      res.json({
        page_size: q.page_size,
        page: q.page,
        total: items.length,
        items: items
      });
    } catch (e) {
      console.log(JSON.stringify(e));
      res.status(404).send("error");
    }
  }
});

async function get_episodes(q) {
    let url = `http://programmes.api.bbc.com/nitro/api/programmes/?api_key=${process.env.NITRO_KEY}&` + querystring.stringify(q);
    console.log(url);
    let res = await axios({
      url: url,
      method: "get",
      timeout: 8000,
      headers: { Accept: "application/json" }
    });
    if (res.status !== 200) {
      // test for status you want, etc
      console.log(res.status);
    }
    return res.data.nitro.results;
}

app.put("/api/v1/loop", async (req, res, next) => {
  let user = "dazzler"; // assume local
  if (req.header("sslclientcertsubject")) {
    const subject = parseSSLsubject(req);
    user = subject.emailAddress;
  }
  if (auth(user)) {
    const collection_pid = config[req.query.sid].loop_collection;
    const members = JSON.parse(req.body);
    try {
      await clearCollection(collection_pid);
      await setCollectionMembers(collection_pid, members);
      res.json({ pid: collection_pid, members: members });
    } catch (e) {
      // this will eventually be handled by our error handling middleware
      next(e);
    }
  } else {
    const message = user + " is not authorised to save the loop";
    console.log(message);
    res.status(403).send(message);
  }
});

app.post("/api/v1/tva", function(req, res) {
  if (req.body.includes('serviceIDRef="TVMAR01')) {
    let user = "dazzler"; // assume local
    if (req.header("sslclientcertsubject")) {
      const subject = parseSSLsubject(req);
      user = subject.emailAddress;
    }
    if (auth(user)) {
      postTVA(req.body, res);
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

async function clearCollection(pid) {
  var config = {
    key: fs.readFileSync(process.env.KEY),
    cert: fs.readFileSync(process.env.CERT),
    passphrase: process.env.PASSPHRASE
  };
  const members = await getCollectionMembers(pid);
  for (let i = 0; i < members.length; i++) {
    await axios.delete(
      `https://api.live.bbc.co.uk/pips/api/v1/membership/pid.${members[i]}`,
      config
    );
  }
}

async function getCollectionMembers(pid) {
  var config = {
    key: fs.readFileSync(process.env.KEY),
    cert: fs.readFileSync(process.env.CERT),
    passphrase: process.env.PASSPHRASE
  };
  const membersXml = await axios.get(
    `https://api.test.bbc.co.uk/pips/api/v1/collection/pid.${pid}/group_of/`,
    config
  );
  const members = await xml2json(membersXml);
  const membership = members.pips.results[0].membership;
  /* this is good if we need the positions but we only use the results for delete
  let r = [];
  for(let i=0; i<membership.length; i++) {
          const pid = membership[i].$.pid;
          const position = membership[i].position[0]
          r[position] = pid;
  }
  return r.filter(function (el) { return el != null; });
  */
  return Array.from(membership, x => x.$.pid);
}

async function setCollectionMembers(pid, data) {
  for (let i = 0; i < data.length; i++) {
    await createMembership(pid, data[i], i + 1);
  }
}

async function createMembership(collection, member, position) {
  const xml = `<pips xmlns="http://ns.webservices.bbc.co.uk/2006/02/pips" xmlns:pips-meta="http://ns.webservices.bbc.co.uk/2006/02/pips-meta" xmlns:xsd="http://www.w3.org/2001/XMLSchema-datatypes" release="219">
  <membership>
    <partner>
      <link rel="pips-meta:partner" pid="s0000001"/>
    </partner>
    <ids/>
    <group>
      <link rel="pips-meta:collection" pid="${collection}"/>
    </group>
    <member>
      <link rel="pips-meta:clip" pid="${member}"/>
    </member>
    <position>${position}</position>
    <title></title>
    <synopses/>
    <links/>
  </membership>
</pips>`;
  return await postPIPS(xml);
}

async function postPIPS(object_type, data) {
  var config = {
    key: fs.readFileSync(process.env.KEY),
    cert: fs.readFileSync(process.env.CERT),
    passphrase: process.env.PASSPHRASE,
    headers: { "Content-Type": "text/xml" }
  };

  return await axios.post(
    `https://api.live.bbc.co.uk/pips/api/v1/${object_type}/`,
    data,
    config
  );
}

function postTVA(data, res) {
  var options = {
    path: "/pips/import/tva/",
    host: "api.live.bbc.co.uk",
    method: "POST",
    key: fs.readFileSync(process.env.KEY),
    cert: fs.readFileSync(process.env.CERT),
    passphrase: process.env.PASSPHRASE,
    headers: {
      "Content-Type": "application/xml",
      "Content-Length": Buffer.byteLength(data)
    }
  };

  //checking if we are one the corporate wireless network
  // defaultGateway.v4().then(result => {
  //   if (require('../../src/config/env.json') && result.gateway == process.env.DEFAULT_GATEWAY){
  //     options.path = "https://" + options.host + options.path;
  //     options.host = process.env.HOST;
  //     options.port = process.env.PORT;
  //   }
  // });
  options.agent = new https.Agent(options);
  var req = https.request(options, function(post_res) {
    var body = "";
    post_res.setEncoding("utf8");
    post_res.on("data", chunk => {
      body += chunk;
    });
    post_res.on("end", () => {
      try {
        parseString(body, function(err, result) {
          if (err) {
            res.status(404).send(err);
          } else {
            res.json(result);
          }
        });
      } catch (e) {
        res.status(404).send(e);
      }
    });
  });
  // post the data
  req.write(data);
  req.end();
}

function nitroRequest(feed, query) {
    let url = `http://programmes.api.bbc.com/nitro/api/${feed}/?api_key=${process.env.NITRO_KEY}&`+querystring.stringify(query);
    console.log(url);
    return axios({
      url: url,
      method: 'get',
      timeout: 8000,
      headers: {
          'Accept': 'application/json',
      }
    });
}

const pidchars = "0123456789bcdfghjklmnpqrstvwxyz";
const pidbase = pidchars.length;

function pid2crid(pid) {
  var n = Big(0);
  for (var i = 1; i < pid.length; i++) {
    const c = pid.charAt(i);
    const p = pidchars.indexOf(c);
    n = n.times(pidbase).plus(p);
  }
  return `crid://bbc.co.uk/${pid.substring(0, 1)}/${n}`;
}

function add_crids_to_webcast(items) {
  if (items != null && items.total > 0) {
    for (let i = 0; i < items.length; i++) {
      const pid = items[i].window_of[0].pid;
      items[i].window_of[0].crid = pid2crid(pid);
    }
  }
  return items;
}

function add_crids_to_episodes(items) {
  if (items != null) {
    for (let i = 0; i < items.length; i++) {
      if (items[i].available_versions.hasOwnProperty("version")) {
        for (let j = 0; j < items[i].available_versions.version.length; j++) {
          let version = items[i].available_versions.version[j];
          version.crid = pid2crid(version.pid);
        }
      }
    }
  }
  return items;
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

async function xml2json(xml) {
  return new Promise((resolve, reject) => {
    parseString(xml, function(err, json) {
      if (err) reject(err);
      else resolve(json);
    });
  });
}

// We do the "listen" call in index.js - making this module easier to test
module.exports.app = app;
