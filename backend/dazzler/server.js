
// https://github.com/bbc/sample-cloud-apps/nodejs-helloworld/src/helloworld/server.js
const auth = require("./auth");
const express = require("express");
const fs = require("fs");
const parseString = require("xml2js").parseString;
const querystring = require("querystring");
const Big = require("big-integer");
const http = require("http");
const https = require("https");
const bodyParser = require("body-parser");
const configuration = require('../../config/env.json');
const app = express();

const config = {
  bbc_marathi_tv: {
    mid: "bbc_marathi_tv",
    specials_collection: "p0715nv4",
    live_brand: "w13xttvl",
    clip_language: "marathi",
    webcast_channels: ["world_service_stream_05","world_service_stream_06","world_service_stream_07","world_service_stream_08"]
  }
};

process.env = configuration

//app.use(bodyParser.raw({ type: '*/*' }));
app.use(bodyParser.text({ type: "*/*" }));

app.use(express.static(__dirname+"/../edit"));

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
        res.json(r);
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
  if(req.query.hasOwnProperty('brand')) {
    q.descendants_of =  req.query.brand;
  }
  if(req.query.hasOwnProperty('sid')) {
    q.descendants_of =  config[req.query.sid].live_brand;
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
      for(let i=0; i<clips.items.length; i++) {
        const version = clips.items[i].available_versions.version;
        for(let j=0; j<version.length; j++) {
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
          for(let i=0; i<clips.items.length; i++) {
            const version = clips.items[i].available_versions.version;
            for(let j=0; j<version.length; j++) {
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
    availability: "available"
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

app.post("/api/v1/tva", function(req, res) {
  if (req.body.includes('serviceIDRef="TVMAR01')) {
    if (req.header("sslclientcertsubject")) {
      const subject = parseSSLsubject(req);
      if (auth(subject.emailAddress)) {
        postTVA(req.body, res);
      } else {
        console.log(subject.emailAddress +" is not authorised to save schedules");
        res.status(403).send(subject.emailAddress +" is not authorised to save schedules");
      }
    } else {
      console.log("missing authentification header");
      res.status(403).send("missing authentification header");
    }
  } else {
    console.log("Marathi only please");
    res.status(403).send("Marathi only please");
  }
});

function postTVA(data, res) {
  var options = {
    hostname: "api.live.bbc.co.uk",
    path: "/pips/import/tva/",
    method: "POST",
    key: fs.readFileSync(process.env.KEY),
    cert: fs.readFileSync(process.env.CERT),
    passphrase: process.env.PASSPHRASE,
    headers: {
      "Content-Type": "application/xml",
      "Content-Length": Buffer.byteLength(data)
    }
  };
  console.log(options);
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
      if (response.statusCode == 404) {
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
      response.on("error", err => console.log(err));
    });
    request.on("error", err => console.log("1", err));
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
      for(let j=0; j < items[i].available_versions.version.length; j++) {
        let version = items[i].available_versions.version[j];
        version.crid = pid2crid(version.pid);
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

// We do the "listen" call in index.js - making this module easier to test
module.exports.app = app;
