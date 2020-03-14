const axios = require("axios");
const https = require("https");
let config;

const ax = axios.create({
    httpsAgent: new https.Agent({  
      rejectUnauthorized: false
    })
  });

const episode = async (req, res) => {
    console.log(config);
    const params = {
        headers: { "Content-Type": "application/json" }
    };
    const query = {
        "bool": {
            "must": [
              {
                "exists": {"field": "sonata.episode.availabilities.pc_streaming_concrete_combined_hd.actual_start"}
              },
              {"match": { "pips.master_brand_for.master_brand.mid": "bbc_hindi_tv" }}
            ]
          }
    };
    const _source = ["pips.episode.pid", 
    "sonata.episode.aggregatedTitle",
    "pips.programme_availability.available_versions.available_version"
    ];
    try {
        const answer = await ax.post(
            'https://localhost:8443/episode/_search',
            { query, _source },
            params
        ); 
        console.log(answer.data); 
    const result = answer.data;
      res.json({
        page_size: req.query.page_size,
        page: req.query.page,
        total: result.hits.total,
        items: result.hits.hits
      });
    } catch (e) {
      console.log(e);
      res.status(404).send("error");
    }
};

module.exports = {
    init(app, configObject) {
        config = configObject;
        app.get("/api/v2/episode", episode);
    }
}