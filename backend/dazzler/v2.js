const moment = require("moment");
require("moment-duration-format");
const axios = require("axios");
const https = require("https");
const aws = require("aws-sdk");
const auth = require("./authv2");
const spw = require("./spw");
const pips = require("./pips");
const notifications = require("./notifications");
const ChannelDAO = require("./ChannelsDAO");
//const { resolve } = require("path");
//node wont read ~\.aws\config     ???????
aws.config.update({ region: "eu-west-1" });

const s3 = new aws.S3({ apiVersion: "2006-03-01" });
const sqs = new aws.SQS({ apiVersion: "2012-11-05" });

let config;
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
    filter = {
      match: {
        "pips.episode.title.$": {
          query: search,
          operator: "and",
          analyzer: "search",
          fuzziness: "2",
          max_expansions: "1",
        },
      },
    };
  }
  return {
    bool: {
      must: [
        { match: { "pips.master_brand_for.master_brand.mid": mid } },
        filter,
        {
          range: {
            "sonata.episode.availabilities.av_pv10_pa4.start": {
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
                        field: "sonata.episode.availabilities.av_pv10_pa4.end",
                      },
                    },
                  ],
                },
              },
              {
                range: {
                  "sonata.episode.availabilities.av_pv10_pa4.end": {
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
    "sonata.episode.availabilities.av_pv10_pa4",
    "pips.episode.crid.uri",
  ];
  const sid = req.query.sid || config.default_sid;
  const mid = config[sid].mid;
  const size = req.query.page_size || 20;
  let from = 0;
  if (req.query.page) {
    from = size * req.query.page;
  }
  const after = req.query.from || "1970-01-01T00:00:00Z";
  const before = req.query.to || moment.utc().add(1, "y");
  const a = req.query.availability || "available";
  const search = req.query.search;
  const data = { _source, from, size };
  if (a === "available") {
    data.query = availableQuery(mid, after, before, search);
  } else {
    data.query = unavailableQuery(mid, after, before, search);
  }
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
          ? se.availabilities.av_pv10_pa4.start
          : versions[0].availabilities.ondemand[0].availability.start,
        expected_start: se.availabilities
          ? moment
              .utc(se.availabilities.av_pv10_pa4.start)
              .add(duration)
              .add(10, "m")
              .format()
          : moment
              .utc(versions[0].availabilities.ondemand[0].availability.start)
              .add(duration)
              .add(10, "m")
              .format(),
      };

      if (se.availabilities && se.availabilities.av_pv10_pa4.actual_start) {
        availability.actual_start = se.availabilities.av_pv10_pa4.actual_start;
      }
      if (se.availabilities && se.availabilities.av_pv10_pa4.end) {
        availability.end = se.availabilities.av_pv10_pa4.end;
      }

      const item = {
        entityType: "episode",
        title: se.aggregatedTitle,
        pid: hit._source.pips.episode.pid,

        vpid: version.pid,
        duration: duration.toISOString(),
        availability,
      };
      if (se.release_date) {
        item.release_date = se.release_date.date;
        item.uri = hit._source.pips.episode.crid.uri;
        item.versionCrid = version.crid.uri;
      }
      items.push(item);
    });
    res.json({
      page_size: req.query.page_size,
      page: req.query.page,
      total: result.hits.total,
      items,
    });
  } catch (e) {
    res.status(404).send("error");
  }
};

/*
  if clip_brand is set then use that
  otherwise if clip_language is set then use that 
  otherwise all the clips in Alexandria?
*/
const clip = async (req, res) => {
  try {
    const params = {
      headers: { "Content-Type": "application/json" },
    };
    const _source = ["pips"];
    const sid = req.query.sid || config.default_sid;
    const cfg = config[sid];
    const size = req.query.page_size || 20;
    let from = 0;
    if (req.query.page) {
      from = size * req.query.page;
    }

    const must = [
        {
          exists: {
            field:
              "pips.programme_availability.available_versions.available_version",
          },
        },
        { match: { "pips.clip.media_type.value": "audio_video" } },
    ];

    if (req.query.search !== "") {
      must.push({
        match: {
          "pips.clip.title.$": {
            query: req.query.search,
            operator: "and",
            analyzer: "search",
            fuzziness: "2",
            max_expansions: "1",
          },
        },
      });
    }

    if (cfg.clip_brand) {
      must.push({ "terms": { "pips.clip.clip_of.link.pid": cfg.clip_brand } });
    } else if (cfg.language) {
      must.push({ match: { "pips.clip.languages.language.$": cfg.language } });
    }

    const query = { bool: { must } };
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
      const answer = await ax.post(
        `https://${host}/clip/_search`,
        data,
        params
      );
      const result = answer.data.hits.hits;
      const total = answer.data.hits.total;
      let items = {};
      items.clips = result.map((hit) => hit._source.pips);
      items.total = total;
      res.json(items);
    } catch (e) {
      console.log(e);
      console.log("detect - axios error");
      res.status(404).send("error");
    }
  } catch (error) {
    console.log("detect error in clip");
    console.log("error");
    console.log(error);
  }
};

const saveEmergencyPlayList = async function (req, res) {
  try {
    const user = auth.isAuthorised(req, config);
    if (user) {
      const sid = req.query.sid;
      var params = {
        Body: req.body,
        Bucket: config[sid].schedule_bucket,
        Key: `${sid}/emergency-playlist.json`,
        ContentType: "application/json",
      };
      try {
        await s3.putObject(params).promise();
        res.send("saved");
      } catch (e) {
        console.log("detect - error ", e);
        res.status(404).send("error");
      }
    } else {
      const message = user + " is not authorised to save schedules";
      console.log(message);
      res.status(403).send(message);
    }
  } catch (error) {
    console.log(error);
    console.log("detect - save emergency playlist error");
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
    const cd = new ChannelDAO();
    cd.getChannels().then((i) => {
      res.json(i);
    });
  } catch (error) {
    console.log("detect - language service error");
    res.status(404).send("error");
  }
};

const queryepisode = async function (req, res) {
  try {
    let episodes = JSON.parse(req.body);
    let sid = req.query.sid;

    var s3params = {
      Bucket: config[sid].schedule_bucket,
    };
    episodes.forEach((item, index) => {
      s3params.Key = `${item.asset.vpid}.mp4`;
      s3.headObject(s3params, function (err, data) {
        if (err) {
          if (err.message === null) {
            sendSQSMessage(item);
          } else {
            console.error(err);
          }
        } else {
          //success
          console.log('queryepisode', data);
        }
      });
    });
  } catch (error) {
    console.error(error);
  }
};

const sendSQSMessage = async function (item) {
  try {
    const sqsparams = {
      QueueUrl: process.env.ASSET_PUBLISH_QUEUE,
    };
    const uri = await getEpisodeUri(item);
    sqsparams.MessageBody = JSON.stringify({
      content_version_id: `pips-pid-${item.asset.vpid}`,
      profile_id: process.env.ProfileId,
      uri: uri,
      event_name: "INSERT",
    });
    sqs.sendMessage(sqsparams, function (err, data) {
      if (err) {
        console.log(err, err.stack);
      } else {
        console.log(data);
      }
    });
  } catch (error) {
    console.log(error);
    console.log("detect - in send sqs error");
  }
};

const getEpisodeUri = async function (item) {
  console.log("detect in getepisode uri");
  const params = {
    headers: { "Content-Type": "application/json" },
  };
  const _source = [
    "pips.programme_availability.available_versions.available_version.availabilities.ondemand.filepath.uri",
  ];

  const query = {
    match: {
      "pips.episode.pid": item.asset.pid,
    },
  };

  const data = { _source, query };

  try {
    const answer = await ax.post(
      `https://${host}/episode/_search`,
      data,
      params
    );

    const result =
      answer.data.hits.hits[0]._source.pips.programme_availability
        .available_versions.available_version[0].availabilities.ondemand;
    if (
      !result ||
      !JSON.stringify(result).includes("av_pv13_pa4") ||
      !JSON.stringify(result).includes("av_pv10_pa4")
    ) {
      throw new Error(
        "Not found in Elastic Search or pv13 and pv10 URI doesn't exist"
      );
    }

    let wantedURI = result.filter((ondemand) =>
      ondemand.filepath.uri.includes("av_pv10_pa4")
    )[0].filepath.uri;
    return wantedURI;
  } catch (error) {
    console.error(error);
  }
};

const s3Save = async (req, res) => {
  const user = auth.isAuthorised(req, config);
  if (user) {
    const sid = req.query.sid;
    var params = {
      Body: req.body,
      Bucket: config[sid].schedule_bucket,
      Key: `${sid}/schedule/${req.query.date}-schedule.json`,
      ContentType: "application/json",
    };
    try {
      await s3.putObject(params).promise();
      res.send("Schedule Saved");
      console.log("schedule saved");
    } catch (e) {
      console.log("error ", e);
      console.log("detect - error saving schedule");
      res.status(500).send("error");
    }
  } else {
    const message = user + " is not authorised to save schedules";
    console.log(message);
    res.status(403).send(message);
  }
};

const schedulev2 = async (req, res) => {
  try {
    const sid = req.query.sid || config.default_sid;
    const date = req.query.date;

    var params = {
      Bucket: config[sid].schedule_bucket,
      Key: `${sid}/schedule/${date}-schedule.json`,
    };
    const s = await s3.getObject(params).promise();
    const data = JSON.parse(s.Body.toString("utf8"));

    console.log("detect - waiting");
    await res.json({
      total: data.items.length,
      item: data.items,
      sid: sid,
      date: date,
    });
    console.log("detect - received");
  } catch (e) {
    console.log("detect - error getting schedulev2");
    res.json({
      total: 0,
    });
  }
};

/*
  sample schedule in flight:
  {       
    "scheduleSource": "Dazzler",
    "sid": "bbc_hindi_tv",
    "serviceIDRef": "TVHIND01",
    "start": "2020-09-17T00:00:00.000Z",
    "end": "2020-09-18T00:00:00.000Z",
    "items": [ ... ]
  }
  writing a schedule can be items for part of a day, reading is always 24 hours
  sample clip/episode schedule item
  {
      "title": "BBC DUNIYA SHOW",
      "start": "2020-09-18T00:00:00.000Z",
      "end": "2020-09-18T00:18:00.000Z",
      "live": false,
      "broadcast_of": { "pid": "p08rt28m", "crid": "crid..." },
      "version": {
        "pid": "p08rt28m",
        "version_of": "p08rt28k",
        "duration": "PT18M",
        "entity_type": "clip"
      }
  }
  sample live schedule item
  {
      "title": "BBC DUNIYA SHOW",
      "start": "2020-09-18T00:00:00.000Z",
      "end": "2020-09-18T00:18:00.000Z",
      "live": true,
      "broadcast_of": { "pid": "p08rt28m", "crid": "crid..." },
      "source": "world_service_stream_08"
  }
*/

const getScheduleFromS3 = async (sid, date) => {
  const key = `${sid}/schedule/${date}-schedule.json`;
  try {
    const s = await s3
      .getObject({
        Bucket: config[sid].schedule_bucket,
        Key: key,
      })
      .promise();
    return JSON.parse(s.Body.toString("utf8"));
  } catch (e) {
    console.log(e);
  }
  return {
    scheduleSource: "Dazzler",
    sid,
    serviceIDRef: config[sid].serviceIDRef,
    start: `${date}T00:00:00.000Z`,
    end: moment.utc(date).add(1, "days").format,
    items: [],
  };
};

const saveOneDayOfScheduleToS3 = async (sid, date, data) => {
  var params = {
    Body: JSON.stringify(data),
    Bucket: config[sid].schedule_bucket,
    Key: `${sid}/schedule/${date}-schedule.json`,
    ContentType: "application/json",
  };
  try {
    await s3.putObject(params).promise();
    const message = "Schedule Saved";
    console.log(message);
    return data;
  } catch (e) {
    console.log("error ", e);
  }
};

//update start and end in this schedule from the old
const mergeOneDayOfScheduleToS3 = async (sid, date, data) => {
  // const first = data.items[0].start;
  // const last = data.items[data.items.length - 1].end;
  // const existing = await getScheduleFromS3(sid, date);
  // const before = existing.items.filter((item) => item.end < first);
  // const after = existing.items.filter((item) => item.start > last);
  // const schedule = { ...data, items: [...before, ...data.items, ...after] };
  return saveOneDayOfScheduleToS3(sid, date, data);
};

const saveScheduleToS3 = async (data) => {
  try {
    console.log("detect - in save schedule to s3");
    const sid = data.sid;
    const start = moment.utc(data.start).startOf("day").format();
    const end = moment(start).add(1, "days").format();
    const date = moment.utc(start).format("YYYY-MM-DD");
    if (data.items.length === 0) {
      console.log(`empty schedule for ${sid} on ${date}, nothing saved`);
      return saveOneDayOfScheduleToS3(sid, date, data);
    }
    const first = data.items[0].start;
    const last = data.items[data.items.length - 1].end;
    if (first === start && last === end) {
      // full day schedule
      console.log("one day");
      return saveOneDayOfScheduleToS3(sid, date, data);
    }
    if (last > end) {
      // more than one day
      console.log("more than one day");
      const day = moment.utc(date);
      const lastday = moment.utc(last).startOf("day");
      while (day <= lastday) {
        const d = day.format("YYYY-MM-DD");
        const items = data.items.filter((item) => item.start.startsWith(d));
        await mergeOneDayOfScheduleToS3(sid, d, {
          ...data,
          start: items[0].start,
          end: items[items.length - 1].end,
          items,
        });
        day.add(1, "days");
      }
    } else {
      // partial - we need to merge this with the current schedule, if it exists
      console.log("merge schedule");
      return mergeOneDayOfScheduleToS3(sid, date, data);
    }
  } catch (error) {
    console.log("detect - save schedule to s3 error");
    console.log(error);
  }
};

const getScheduleFromSPW = async (sid, date) => {
  let schedule = [];
  try {
    schedule = await spw.request(sid, date);

    let items = schedule.item.filter((item) => {
      const pt = item.broadcast[0].published_time[0].$;
      if (pt) {
        return pt.start.startsWith(date);
      }
      return false;
    });
    items = items.map((item) => {
      const broadcast = item.broadcast[0];
      const version = item.version[0];
      const common = {
        title: broadcast.title[0],
        start: broadcast.published_time[0].$.start,
        end: broadcast.published_time[0].$.end,
        live: broadcast.live === "true",
        broadcast_of: {
          pid: broadcast.broadcast_of[0].link[0].$.pid,
          crid: version.crid[0].$.uri,
        },
      };
      if (common.live) {
        return {
          ...common,
          source: broadcast.pics_raw_data,
        };
      }
      return {
        ...common,
        version: {
          pid: version.$.pid,
          version_of: version.version_of[0].link[0].$.pid,
          duration: moment.duration(version.duration[0]).toString(),
          entity_type: version.version_of[0].link[0].$.rel.replace(
            "pips-meta:",
            ""
          ),
        },
      };
    });
    const r = {
      scheduleSource: "PIPS",
      sid,
      serviceIDRef: schedule.service[0].$.bds_service_ref,
      start: items[0].start,
      end: items[items.length - 1].end,
      items,
    };
    return r;
  } catch (e) {
    console.log(e);
    return {
      total: 0,
      items: [],
    };
  }
};

const tvaScheduleEvent = (serviceIDRef, item) => {
  const duration = item.version.duration;
  const startDateTime = moment.utc(item.start);
  let imi = "imi:dazzler:" + serviceIDRef + "/" + startDateTime.unix();
  return ` 
      <ScheduleEvent>
        <Program crid="${item.broadcast_of.crid}"/>
          <BroadcasterRawData>${
            item.live ? item.source : ""
          }</BroadcasterRawData>
          <InstanceMetadataId>${imi}</InstanceMetadataId>
          <InstanceDescription>
            <AVAttributes>
              <AudioAttributes><MixType href="urn:mpeg:mpeg7:cs:AudioPresentationCS:2001:3"><Name>Stereo</Name></MixType></AudioAttributes>
              <VideoAttributes><AspectRatio>16:9</AspectRatio><Color type="color"/></VideoAttributes>
            </AVAttributes>
            <Title>${item.title}</Title>
          </InstanceDescription>
          <PublishedStartTime>${startDateTime
            .utc()
            .format()}</PublishedStartTime>
          <PublishedDuration>${duration}</PublishedDuration>
          <Live value="${item.live ? "true" : "false"}"/>
          <Repeat value="${item.live ? "false" : "true"}"/>
          <Free value="true"/>
      </ScheduleEvent>
    `;
};

const tvaSchedule = ({ serviceIDRef, start, end, items }) => {
  let tva =
    '<TVAMain xmlns="urn:tva:metadata:2007" xmlns:mpeg7="urn:tva:mpeg7:2005" xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance" xml:lang="en-GB" xsi:schemaLocation="urn:tva:metadata:2007 tva_metadata_3-1_v141.xsd">';
  tva += "<ProgramDescription><ProgramLocationTable>";
  tva += `<Schedule start="${start}" end="${end}" serviceIDRef="${serviceIDRef}">`;
  for (let i = 0; i < items.length; i++) {
    tva += tvaScheduleEvent(serviceIDRef, items[i]);
  }
  tva += "</Schedule></ProgramLocationTable></ProgramDescription></TVAMain>";
  return tva;
};

const saveScheduleAsTVA = async (data) => {
  const tva = tvaSchedule(data);
  const r = await pips.postTVA(tva);
  return r.data;
};

const getSchedule = async (req, res) => {
  const sid = req.query.sid || config.default_sid;
  const date = req.query.date;
  const source = process.env.SCHEDULE_SOURCE || "s3";
  let r;
  if (source === "pips") {
    r = await getScheduleFromSPW(sid, date);
  } else {
    r = await getScheduleFromS3(sid, date);
  }
  res.json(r);
};

const saveSchedule = async (req, res) => {
  const user = auth.isAuthorised(req, config);
  if (user) {
    const destination = process.env.SCHEDULE_DESTINATION || "s3";
    let response;
    if (destination === "pips") {
      response = saveScheduleAsTVA(JSON.parse(req.body));
    } else {
      response = saveScheduleToS3(JSON.parse(req.body));
    }
    if (response) {
      res.json(response);
    } else {
      res.status(500).send("error");
    }
  } else {
    const sid = req.query.sid;
    const message = `${user} is not authorised to save ${sid} schedules`;
    console.log(message);
    res.status(403).send(message);
  }
};

const user = async (req, res) => {
  if (req.header("bbc-pp-oidc-id-token-email")) {
    const email = req.header("bbc-pp-oidc-id-token-email");
    res.json({
      name: auth.getName(email),
      auth: auth.isAuthorised(req, config) === email,
      email: email,
    });
  } else {
    res.json({
      name: "Anonymous",
      auth: true,
    });
  }
};

module.exports = {
  init(app, configObject) {
    config = configObject;
    app.get("/api/v2/user", user);
    app.get("/api/v2/languageservices", languageServices);
    app.get("/api/v2/clip", clip);
    app.get("/api/v2/episode", episode);
    app.post("/api/v2/loop", saveEmergencyPlayList);
    app.post("/api/v2/queryepisode", queryepisode);
    app.get("/api/v2/schedulev2", schedulev2);

    app.get("/api/v2/schedule", getSchedule);
    app.post("/api/v2/schedule", saveSchedule);

    // app.put("/api/v2/loop", loop);
    app.post("/api/v2/s3save", s3Save);
    app.post("/api/v2/subscribe", subscribe);
  },
};
