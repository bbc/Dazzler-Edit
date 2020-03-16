const axios = require("axios");
const https = require("https");
const aws = require("aws-sdk");
const auth = require("./auth");

const s3 = new aws.S3({ apiVersion: "2006-03-01" });

let config;

const ax = axios.create({
  httpsAgent: new https.Agent({
    rejectUnauthorized: false
  })
});

/*
 parameters from v1:
 sort title|release_date
 sort_direction descending|ascending
 sid bbc_hindi_tv|bbc_marathi_tv
 pid
 page 1..
 page_size n
 availability available|P1D
*/
const episode = async (req, res) => {
  const params = {
    headers: { "Content-Type": "application/json" }
  };
  const _source = [
    "pips.episode.pid",
    "sonata.episode.aggregatedTitle",
    "sonata.episode.release_date.date",
    "pips.programme_availability.available_versions.available_version"
  ];
  let mid = 'bbc_hindi_tv';
  if (req.query.sid) {
    mid = config[req.query.sid].mid;
  }
  let size = 20;
  if (req.query.page_size) {
    size = req.query.page_size;
  }
  let from = 0;
  if (req.query.page) {
    from = size * (req.query.page - 1);
  }
  let query;
  if (req.query.availability === 'available') {
    query = {
      "bool": {
        "must": [
          { "match": { "pips.master_brand_for.master_brand.mid": mid } },
          {
            "exists": { "field": "sonata.episode.availabilities.pc_streaming_concrete_combined_hd.actual_start" }
          },
          { 
            "bool": {
              "should": [
                {
                  "range": {
                    "sonata.episode.availabilities.pc_streaming_concrete_combined_hd.end": {
                      "gte": "now+1d"
                    }
                  }
                },
            {
            "bool": {
              "must_not": [
                {
                  "exists": {
                    "field": "sonata.episode.availabilities.pc_streaming_concrete_combined_hd.end"
                  }
                }
              ]
            }
            }
              ]
            }
          }
        ]
      }
    };
  } else {
    query = {
      "bool": {
        "must": [
          { "match": { "pips.master_brand_for.master_brand.mid": mid } },
          {
            "bool": {
              "must_not": [
                {
                  "exists": {
                    "field": "sonata.episode.availabilities.pc_streaming_concrete_combined_hd.actual_start"
                  }
                }
              ]
            }
          },          
          {
            "range": {
              "sonata.episode.release_date.date": {
                "gte": "now-1d",
                "lte": "now+2d"
              }
            }
        }
      ]
      }
    };
  }
  const data = { query, _source, from, size };
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
      `https://${process.env.ES_HOST}/episode/_search`,
      data,
      params
    );
    const result = answer.data;
    const items = [];
    result.hits.hits.forEach((hit) => {
      const versions = hit._source.pips.programme_availability.available_versions.available_version;
      const version = versions[0].version; // TODO pick a version
      const item = {
        release_date: hit._source.sonata.episode.release_date.date,
        title: hit._source.sonata.episode.aggregatedTitle,
        pid: hit._source.pips.episode.pid,
        vpid: version.pid,
        versionCrid: version.crid.uri,
        duration: version.duration.$
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

async function getSubscriptions() {
  const s = await s3.getObject({ Bucket: process.env.STATE_BUCKET, Key: 'subscriptions'}).promise();
  return JSON.parse(s.Body.toString("utf-8"));
}

async function putSubscription(subscription, sid) {
  const s = await s3.putObject({
    Bucket: process.env.STATE_BUCKET, 
    Key: 'subscriptions',

  }).promise();
}

/* here is the code from the PoC lambda for subscriptions

        if(entity.languages) {
          const lang = entity.languages.language[0].$;
          if(process.env.LANGUAGES.includes(lang)) {
            const payload = {
              msg: `new or changed ${entity_type} ${pid}`,
              pid: pid,
              entity_type: entity_type,
              entity: entity
            };
            console.log(`new or changed ${entity_type} ${pid}`);
            const subscriptions = await getSubscriptions();
            await send(subscriptions, payload, { TTL: 5 }, 0);
          }
        }


function send(subscriptions, payload, options) {
  console.log('send', subscriptions, payload, options);
  const payload_string = typeof (payload) === 'string' ? payload : JSON.stringify(payload)

  return new Promise((success) => {

    Promise.all(subscriptions.map((each_subscription) => {
      return webPush.sendNotification(each_subscription, payload_string, options);
    }))
      .then(function () {
        success(response(201, {}));
      }).catch(function (error) {
        console.log('ERROR>', error);
        success(response(500, { error: error }));
      });
  });
}

*/

const subscribe = async function(req, res) {
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
    // app.post("/api/v2/loop", loop);
    // app.put("/api/v2/loop", loop);
    // app.post("/api/v2/tva", tva);
    app.post("/api/v2/subscribe", subscribe);
  }
}