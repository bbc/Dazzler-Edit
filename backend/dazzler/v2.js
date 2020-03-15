const axios = require("axios");
const https = require("https");
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
      'https://localhost:8443/episode/_search',
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

module.exports = {
  init(app, configObject) {
    config = configObject;
    // app.get("/api/v1/user", user);
    // app.get("/api/v1/schedule", schedule);
    // app.get("/api/v1/broadcast", broadcast);
    // app.get("/api/v1/webcast", webcast);
    // app.get("/api/v1/loop", loop);
    // app.get("/api/v1/special", special);
    // app.get("/api/v1/clip", clip);
    app.get("/api/v1/episode", episode);
    // app.post("/api/v1/loop", loop);
    // app.post("/api/v1/tva", tva);
  }
}