const moment = require("moment");
require("moment-duration-format");
const axios = require("axios");
const https = require("https");
const aws = require("aws-sdk");
const auth = require("./auth");
const notifications = require("./notifications");

const s3 = new aws.S3({ apiVersion: "2006-03-01" });

let config;
let ax;
let host;

if (process.env.ES_HOST) {
  host = process.env.ES_HOST;
} else {
  host = 'localhost:8443';
}
ax = axios.create({
  httpsAgent: new https.Agent({
    rejectUnauthorized: false
  })
});

function availableQuery(mid, after, before) {
  return {
    "bool": {
      "must": [
        { "match": { "pips.master_brand_for.master_brand.mid": mid } },
        {
          "range": {
            "sonata.episode.availabilities.av_pv13_pa4.start": {
              "lt": after
            }
          }
        },
        {
          "bool": {
            "should": [
              {
                "bool": { "must_not": [
                  { "exists": {"field": "sonata.episode.availabilities.av_pv13_pa4.end"}}
                ] }
              },
              {
                "range": {
                  "sonata.episode.availabilities.av_pv13_pa4.end": {
                    "gte": before
                  }
                }      
              }
            ]
          }
        }
      ]
    }
  };
}

function unavailableQuery(mid, after, before) {
  return {
    "bool": {
      "must": [
        { "match": { "pips.master_brand_for.master_brand.mid": mid } },
        {
          "bool": { "must_not": [
            { "exists": {"field": "sonata.episode.availabilities.av_pv13_pa4.actual_start"}}
          ] }
        },
        {
          "range": {
            "sonata.episode.availabilities.av_pv13_pa4.start": {
              "lt": after
            }
          }
        },
        {
          "bool": {
            "should": [
              {
                "bool": { "must_not": [
                  { "exists": {"field": "sonata.episode.availabilities.av_pv13_pa4.end"}}
                ] }
              },
              {
                "range": {
                  "sonata.episode.availabilities.av_pv13_pa4.end": {
                    "gte": before
                  }
                }      
              }
            ]
          }
        }
      ]
    }
  };
}
/*
 parameters from v1:
 sort title|release_date
 sort_direction descending|ascending
 sid bbc_hindi_tv|bbc_marathi_tv
 pid
 page 1..
 page_size n
 from ISO8601
 to ISO8601
*/
const episode = async (req, res) => {
  const params = {
    headers: { "Content-Type": "application/json" }
  };
  const _source = [
    "pips.episode.pid",
    "sonata.episode.aggregatedTitle",
    "sonata.episode.release_date.date",
    "pips.programme_availability.available_versions.available_version",
    "sonata.episode.availabilities.av_pv13_pa4"
  ];
  const sid = req.query.sid || config.default_sid;
  const mid = config[sid].mid;
  const size = req.query.page_size || 20;
  let from = 0;
  if (req.query.page) {
    from = size * (req.query.page - 1);
  }
  const after = req.query.from || '1970-01-01T00:00:00Z';
  const before = req.query.to || moment.utc().add(1, 'y');
  const a = req.query.availability || 'available';
  console.log('from', after,'to', before);
  const data = { _source, from, size };
  if (a==='available') {
    data.query = availableQuery(mid, after, before);
  } else {
    data.query = unavailableQuery(mid, after, before);
  }
  console.log(JSON.stringify(data, 2));
  if (req.query.sort) {
    let sortDirection = 'desc';
    if (req.query.sort_direction === 'ascending') {
      sortDirection = 'asc';
    }
    const sortMap = {
      "release_date": "sonata.episode.release_date.date",
    "title": "sonata.episode.aggregatedTitle.keyword"
    };
    const sort = {};
    sort[sortMap[req.query.sort]] = sortDirection;
    data.sort = [sort];
  }
  try {
    const answer = await ax.post(
      `https://${host}/episode/_search`,
      data,
      params
    );
    const result = answer.data;
    const items = [];
    result.hits.hits.forEach((hit) => {
      const se = hit._source.sonata.episode;
      const versions = hit._source.pips.programme_availability.available_versions.available_version;
      const version = versions[0].version; // TODO pick a version
      const duration = moment.duration(version.duration.$);
      const availability = {
          planned_start: se.availabilities.av_pv13_pa4.start,
          expected_start: moment.utc(se.availabilities.av_pv13_pa4.start).add(duration).add(10, 'm').format()
      };
      if (se.availabilities.av_pv13_pa4.actual_start) {
        availability.actual_start = se.availabilities.av_pv13_pa4.actual_start;
      }
      if (se.availabilities.av_pv13_pa4.end) {
        availability.end = se.availabilities.av_pv13_pa4.end;
      }
      const item = {
        entityType: 'episode',
        release_date: se.release_date.date,
        title: se.aggregatedTitle,
        pid: hit._source.pips.episode.pid,
        vpid: version.pid,
        versionCrid: version.crid.uri,
        duration: duration.toISOString(),
        availability
      };
      items.push(item);
    });
    res.json({
      page_size: req.query.page_size,
      page: req.query.page,
      total: result.hits.total,
      items
    });
  } catch (e) {
    console.log(e);
    res.status(404).send("error");
  }
};

const saveEmergencyPlayList = async function(req, res) {
  let user = "dazzler"; // assume local
  if (req.header("sslclientcertsubject")) {
    const subject = auth.parseSSLsubject(req);
    user = subject.emailAddress;
  }
  if (auth.isAuthorised(user)) {
    const sid = req.query.sid || config.default_sid;
    var params = {
      Body: req.body,
      Bucket: process.env.BUCKET,
      Key: `${sid}/emergency-playlist.json`,
      ContentType: 'application/json'
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

const subscribe = async function(req, res) {
  const sid = req.query.sid || config.default_sid;
  try {
    notifications.addSubscription(sid, JSON.parse(req.body));
    res.send("saved");
  } catch (e) {
    console.log("error ", e);
    res.status(404).send("error");
  }
}

module.exports = {
  init(app, configObject) {
    config = configObject;
    // app.get("/api/v2/user", user);
    // app.get("/api/v2/schedule", schedule);
    // app.get("/api/v2/broadcast", broadcast);
    // app.get("/api/v2/webcast", webcast);
    // app.get("/api/v2/loop", loop);
    // app.get("/api/v2/special", special);
    // app.get("/api/v2/clip", clip);
    app.get("/api/v2/episode", episode);
    app.post("/api/v2/loop", saveEmergencyPlayList);
    // app.put("/api/v2/loop", loop);
    // app.post("/api/v2/tva", tva);
    app.post("/api/v2/subscribe", subscribe);
  }
}
