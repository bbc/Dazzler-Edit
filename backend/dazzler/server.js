// https://github.com/bbc/sample-cloud-apps/nodejs-helloworld/src/helloworld/server.js
const auth = require("./auth");
const express = require("express");
const axios = require("axios");
const fs = require("fs");
const parseString = require("xml2js").parseString;
const querystring = require("querystring");
const Big = require("big-integer");
const http = require("http");
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
    loop_collection: process.env.LOOP_PID,
    specials_collection: process.env.SPECIALS_PID,
    live_brand: process.env.LIVE_BRAND_PID,
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

app.get("/api/v1/schedule", function(req, res) {
  SpwRequest(req.query.sid, req.query.date).then(
    r => {
      if (r) {
        const s = r["p:schedule"]["p:item"];
        let promises = [];
        for (let i = 0; i < s.length; i++) {
          if (s[i].hasOwnProperty("p:episode")) {
            continue;
          }
          const pid =
            s[i]["p:version"][0]["p:version_of"][0]["p:link"][0].$.pid;
          promises.push(
            nitroRequest("programmes", { pid: pid, mixin: "ancestor_titles" })
          );
        }
        Promise.all(promises).then(function(results) {
          addClips(s, results);
          res.json(r);
        });
      } else {
        res.status(404).send("Not found"); // TODO use proper error message
      }
    },
    err => {
      console.log(err);
      res.status(404).send("Not found"); // TODO use proper error message
    }
  );
});

app.get("/api/v1/broadcast", function(req, res) {
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
  nitroRequest("schedules", q).then(
    r => res.json(r.nitro.results),
    err => res.status(404).send("Not found") // TODO use proper error message
  );
});

app.get("/api/v1/webcast", function(req, res) {
  let q = {
    start_from: req.query.start,
    start_to: req.query.end
  };
  if (req.query.hasOwnProperty("brand")) {
    q.descendants_of = req.query.brand;
  }
  if (req.query.hasOwnProperty("sid")) {
    q.descendants_of = config[req.query.sid].live_brand;
    q.sid = config[req.query.sid].webcast_channels;
  }
  if (req.query.hasOwnProperty("page")) {
    q.page = req.query.page;
  }
  if (req.query.hasOwnProperty("page_size")) {
    q.page_size = req.query.page_size;
  }
  nitroRequest("schedules", q).then(
    r => res.json(add_crids_to_webcast(r.nitro.results)),
    err => res.status(404).send("Not found") // TODO use proper error message
  );
});
// http://programmes.api.bbc.com/nitro/api/programmes?api_key=XXX&page_size=100&sort=group_position&sort_direction=ascending&group=p0510sbc

app.get("/api/v1/loop", function(req, res) {
  let q = {
    group: config[req.query.sid].loop_collection,
    sort: "group_position",
    sort_direction: "ascending"
  };
  clip(q, req.query, res);
});

app.get("/api/v1/special", function(req, res) {
  let q = {
    group: config[req.query.sid].specials_collection
  };
  clip(q, req.query, res);
});

app.get("/api/v1/clip", function(req, res) {
  let q = {
    tag_name: config[req.query.sid].clip_language
  };
  clip(q, req.query, res);
});

function addClips(schedule_items, clips) {
  for (let i = 0; i < schedule_items.length; i++) {
    const pid =
      schedule_items[i]["p:version"][0]["p:version_of"][0]["p:link"][0].$.pid;
    for (let j = 0; j < clips.items.length; j++) {
      if (clips.hasOwnProperty("items")) {
        if (clips.items[j].pid === pid) {
          schedule_items[i]["p:clip"] = clips.items[j];
        }
      }
    }
  }
}

function clip(q, query, res) {
  if (query.hasOwnProperty("page")) {
    q.page = query.page;
  }
  if (query.hasOwnProperty("page_size")) {
    q.page_size = query.page_size;
  }
  q.mixin = ["images", "available_versions"];
  q.entity_type = "clip";
  nitroRequest("programmes", q).then(
    r => {
      let pids = [];
      let clips = r.nitro.results;
      for (let i = 0; i < clips.items.length; i++) {
        const version = clips.items[i].available_versions.version;
        for (let j = 0; j < version.length; j++) {
          pids.push(version[j].pid);
        }
      }
      nitroRequest("versions", { pid: pids }).then(
        r => {
          const items = r.nitro.results.items;
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
            const version = clips.items[i].available_versions.version;
            for (let j = 0; j < version.length; j++) {
              version[j].crid = map.get(version[j].pid);
            }
          }
          res.json(clips);
        },
        err => res.status(404).send("Not found") // TODO use proper error message
      );
    },
    err => res.status(404).send("Not found") // TODO use proper error message
  );
}

app.get("/api/v1/episode", function(req, res) {
  let q = {
    mixin: ["images", "available_versions"],
    entity_type: "episode",
    sort: "release_date",
    sort_direction: "descending",
    duration: "short"
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
  nitroRequest("programmes", q).then(
    r => {
      add_crids_to_episodes(r.nitro.results.items);
      res.json(r.nitro.results);
    },
    err => res.status(404).send("Not found") // TODO use proper error message
  );
});

app.put("/api/v1/loop", async (req, res, next) => {
  let user = "dazzler"; // assume local
  if (process.env.environment) {
    // assume cosmos
    if (req.header("sslclientcertsubject")) {
      const subject = parseSSLsubject(req);
      user = subject.emailAddress;
    } else {
      console.log("missing authentification header");
      res.status(403).send("missing authentification header");
    }
  }
  if (auth(user)) {
    const collection_pid = config.bbc_marathi_tv.loop_collection;
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
    if (process.env.environment) {
      // assume cosmos
      if (req.header("sslclientcertsubject")) {
        const subject = parseSSLsubject(req);
        user = subject.emailAddress;
      } else {
        console.log("missing authentification header");
        res.status(403).send("missing authentification header");
      }
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

function SpwRequest(sid, date) {
  return new Promise((resolve, reject) => {
    var options = {
      host: "programmes.api.bbc.com",
      path: `/schedule?api_key=${process.env.SPW_KEY}&sid=${sid}&date=${date}`,
      key: fs.readFileSync(process.env.KEY),
      cert: fs.readFileSync(process.env.CERT),
      passphrase: process.env.PASSPHRASE,
      headers: {
        accept: "application/xml"
      }
    };

    var request = https.get(options, response => {
      if (response.statusCode === 404) {
        resolve(null);
        return;
      }

      if (response.statusCode < 200 || response.statusCode > 299) {
        console.log("Invalid status code: " + response.statusCode);
        reject(new Error("Invalid status code: " + response.statusCode));
        return;
      }

      var body = [];
      response.on("data", chunk => {
        body.push(chunk);
      });
      response.on("end", () => {
        try {
          parseString(Buffer.concat(body).toString(), function(err, result) {
            if (err) {
              reject(err);
            } else {
              resolve(result);
            }
          });
        } catch (e) {
          reject(new Error(e));
        }
      });
      response.on("error", err => reject(new Error(err)));
    });
    request.on("error", err => reject(new Error(err)));
  });
}

function nitroRequest(feed, query) {
  return new Promise((resolve, reject) => {
    var options = {
      host: "programmes.api.bbc.com",
      path:
        "/nitro/api/" +
        feed +
        "?api_key=" +
        process.env.NITRO_KEY +
        "&" +
        querystring.stringify(query),
      headers: {
        accept: "application/json"
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

    var request = http.get(options, response => {
      if (response.statusCode < 200 || response.statusCode > 299) {
        reject(new Error("Invalid status code: " + response.statusCode));
      }

      var data = "";
      response.on("data", chunk => {
        data += chunk;
      });
      response.on("end", () => {
        try {
          resolve(JSON.parse(data));
        } catch (e) {
          reject(new Error(e));
        }
      });
      response.on("error", err => reject(new Error(err)));
    });
    request.on("error", err => reject(new Error(err)));
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
  if (items != null) {
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
