const moment = require("moment");
require("moment-duration-format");
const axios = require("axios");
const https = require("https");
const aws = require("aws-sdk");
const auth = require("./auth");
const notifications = require("./notifications");

const s3 = new aws.S3({ apiVersion: "2006-03-01" });

let config;
let configV2;
let ax;
let host;

if (process.env.ES_HOST) {
  host = process.env.ES_HOST;
} else {
  host = "localhost:8443";
}
ax = axios.create({
  httpsAgent: new https.Agent({
    rejectUnauthorized: false,
  }),
});

function availableQuery(mid, after, before, search) {
  let filter;
  if (search !== "") {
    filter = { match: { "pips.episode.title.$": search } };
  }
  return {
    bool: {
      must: [
        { match: { "pips.master_brand_for.master_brand.mid": mid } },
        filter,
        {
          range: {
            "sonata.episode.availabilities.av_pv13_pa4.start": {
              lt: after,
            },
          },
        },
        {
          bool: {
            should: [
              {
                bool: {
                  must_not: [
                    {
                      exists: {
                        field: "sonata.episode.availabilities.av_pv13_pa4.end",
                      },
                    },
                  ],
                },
              },
              {
                range: {
                  "sonata.episode.availabilities.av_pv13_pa4.end": {
                    gte: before,
                  },
                },
              },
            ],
          },
        },
      ],
    },
  };
}

function unavailableQuery(mid, after, before, search) {
  let filter;
  if (search !== "") {
    filter = { match_phrase: { "pips.episode.title.$": search } };
  }
  return {
    bool: {
      must: [
        {
          match: {
            "pips.episode.master_brand.link.mid": mid,
          },
        },
        filter,
        {
          bool: {
            should: [
              {
                exists: {
                  field: "sonata.episode.availabilities.upcoming.start",
                },
              },
              {
                exists: {
                  field: "sonata.episode.availabilities.av_pv10_pa4.start",
                },
              },
            ],
          },
        },
        {
          bool: {
            should: [
              {
                range: {
                  "sonata.episode.availabilities.upcoming.end": {
                    gte: "now+1d",
                  },
                },
              },
              {
                range: {
                  "sonata.episode.availabilities.av_pv10_pa4.end": {
                    gte: "now+1d",
                  },
                },
              },
            ],
          },
        },
        {
          bool: {
            must_not: [
              {
                exists: {
                  field:
                    "sonata.episode.availabilities.av_pv10_pa4.actual_start",
                },
              },
            ],
          },
        },
      ],
    },
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
    headers: { "Content-Type": "application/json" },
  };
  const _source = [
    "pips.episode.pid",
    "sonata.episode.aggregatedTitle",
    "sonata.episode.release_date.date",
    "pips.programme_availability.available_versions.available_version",
    "sonata.episode.availabilities.av_pv13_pa4",
  ];
  const sid = req.query.sid || config.default_sid;
  const mid = config[sid].mid;
  const size = req.query.page_size || 20;
  let from = 0;
  if (req.query.page) {
    from = size * (req.query.page - 1);
  }
  const after = req.query.from || "1970-01-01T00:00:00Z";
  const before = req.query.to || moment.utc().add(1, "y");
  const a = req.query.availability || "available";
  const search = req.query.search;
  console.log("from", after, "to", before);
  const data = { _source, from, size };
  if (a === "available") {
    data.query = availableQuery(mid, after, before, search);
  } else {
    data.query = unavailableQuery(mid, after, before, search);
  }

  console.log(JSON.stringify(data, 2));
  if (req.query.sort) {
    let sortDirection = "desc";
    if (req.query.sort_direction === "ascending") {
      sortDirection = "asc";
    }
    const sortMap = {
      release_date: "sonata.episode.release_date.date",
      title: "sonata.episode.aggregatedTitle.keyword",
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
      const versions =
        hit._source.pips.programme_availability.available_versions
          .available_version;
      const version = versions[0].version; // TODO pick a version
      const duration = moment.duration(version.duration.$);

      const availability = {
        planned_start: se.availabilities
          ? se.availabilities.av_pv13_pa4.start
          : versions[0].availabilities.ondemand[0].availability.start,
        expected_start: se.availabilities
          ? moment
              .utc(se.availabilities.av_pv13_pa4.start)
              .add(duration)
              .add(10, "m")
              .format()
          : moment
              .utc(versions[0].availabilities.ondemand[0].availability.start)
              .add(duration)
              .add(10, "m")
              .format(),
      };
      if (se.availabilities && se.availabilities.av_pv13_pa4.actual_start) {
        availability.actual_start = se.availabilities.av_pv13_pa4.actual_start;
      }
      if (se.availabilities && se.availabilities.av_pv13_pa4.end) {
        availability.end = se.availabilities.av_pv13_pa4.end;
      }
      const item = {
        entityType: "episode",
        release_date: se.release_date.date,
        title: se.aggregatedTitle,
        pid: hit._source.pips.episode.pid,
        vpid: version.pid,
        versionCrid: version.crid.uri,
        duration: duration.toISOString(),
        availability,
      };
      items.push(item);
    });
    res.json({
      page_size: req.query.page_size,
      page: req.query.page,
      total: result.hits.total,
      items,
    });
  } catch (e) {
    console.log(e);
    res.status(404).send("error");
  }
};

const clip = async (req, res) => {
  const params = {
    headers: { "Content-Type": "application/json" },
  };
  const _source = ["pips"];
  const sid = req.query.sid || config.default_sid;
  const size = req.query.page_size || 20;
  let from = 0;
  if (req.query.page) {
    from = size * (req.query.page - 1);
  }
  let filter;
  if (req.query.search !== "") {
    filter = { match: { "pips.clip.title.$": req.query.search } };
  }
  const query = {
    bool: {
      must: [
        {
          exists: {
            field:
              "pips.programme_availability.available_versions.available_version",
          },
        },
        filter,
        { match: { "pips.clip.languages.language.$": config[sid].language } },
      ],
    },
  };
  const data = { _source, from, size, query };
  if (req.query.sort) {
    var sortDirection = "desc";
    if (req.query.sort_direction === "ascending") {
      sortDirection = "asc";
    }
  }

  const sortMap = {
    pid: "pips.clip.pid",
    title: "pips.title_hierarchy.titles.title.$.keyword",
  };

  const sort = {};
  sort[sortMap[req.query.sort]] = sortDirection;
  data.sort = [sort];

  try {
    const answer = await ax.post(`https://${host}/clip/_search`, data, params);
    const result = answer.data.hits.hits;
    const total = answer.data.hits.total;
    let items = {};
    items.clips = result.map((hit) => hit._source.pips);
    items.total = total;
    res.json(items);
  } catch (e) {
    console.log(e);
    res.status(404).send("error");
  }
};

const saveEmergencyPlayList = async function (req, res) {
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
      ContentType: "application/json",
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
};

const subscribe = async function (req, res) {
  const sid = req.query.sid || config.default_sid;
  try {
    notifications.addSubscription(sid, JSON.parse(req.body));
    res.send("saved");
  } catch (e) {
    console.log("error ", e);
    res.status(404).send("error");
  }
};

const languageServices = async function (req, res) {
  try {
    res.json(configV2);
  } catch (error) {
    res.status(404).send("error");
  }
};

module.exports = {
  init(app, configObject, configObject2) {
    config = configObject;
    configV2 = configObject2;
    // app.get("/api/v2/user", user);
    // app.get("/api/v2/schedule", schedule);
    // app.get("/api/v2/broadcast", broadcast);
    // app.get("/api/v2/webcast", webcast);
    // app.get("/api/v2/loop", loop);
    // app.get("/api/v2/special", special);
    app.get("/api/v2/languageservices", languageServices);
    app.get("/api/v2/clip", clip);
    app.get("/api/v2/episode", episode);
    app.post("/api/v2/loop", saveEmergencyPlayList);

    // app.put("/api/v2/loop", loop);
    // app.post("/api/v2/tva", tva);
    app.post("/api/v2/subscribe", subscribe);
  },
};
