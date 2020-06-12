// https://github.com/bbc/sample-cloud-apps/nodejs-helloworld/src/helloworld/server.js
const express = require("express");
const bodyParser = require("body-parser");

const app = express();
var configuration;

if (!process.env.AUTHORISED_USERS) {
  configuration = require("../../src/config/env.json");
  process.env = configuration;
}

const config = {
  default_sid: "bbc_hindi_tv",
  bbc_hindi_tv: {
    serviceIDRef: "TVHIND01",
    name: "Hindi",
    mid: "bbc_hindi_tv",
    loop_collection: "p0845svx",
    specials_collection: "p0845sqf",
    live_brand: "w13xttlw",
    clip_language: "hindi",
    language_tag: "p0368zp7",
    language: "hi",
    webcast_channels: [
      "world_service_stream_05",
      "world_service_stream_06",
      "world_service_stream_07",
      "world_service_stream_08",
    ],
  },
  bbc_marathi_tv: {
    serviceIDRef: "TVMAR01",
    name: "Marathi",
    mid: "bbc_marathi_tv",
    loop_collection: "p0510sbc",
    specials_collection: "p0715nv4",
    live_brand: "w13xttvl",
    clip_language: "marathi",
    language_tag: "x",
    language: "mr",
    webcast_channels: [
      "world_service_stream_05",
      "world_service_stream_06",
      "world_service_stream_07",
      "world_service_stream_08",
    ],
  },
  bbc_swahili_tv: {
    serviceIDRef: "TVMAR01",
    name: "Swahili",
    mid: "bbc_swahili_tv",
    loop_collection: "x",
    specials_collection: "x",
    live_brand: "x",
    clip_language: "swahili",
    language_tag: "p0368zpn",
    language: "sw",
    webcast_channels: [
      "world_service_stream_05",
      "world_service_stream_06",
      "world_service_stream_07",
      "world_service_stream_08",
    ],
  },
};

const configV2 = {
  Hindi: {
    serviceIDRef: "TVHIND01",
    mid: "bbc_hindi_tv",
    sid: "bbc_hindi_tv",
    loop_collection: "p0845svx",
    specials_collection: "p0845sqf",
    live_brand: "w13xttlw",
    clip_language: "hindi",
    language_tag: "p0368zp7",
    language: "hi",
    webcast_channels: [
      "world_service_stream_05",
      "world_service_stream_06",
      "world_service_stream_07",
      "world_service_stream_08",
    ],
  },
  Marathi: {
    serviceIDRef: "TVMAR01",
    mid: "bbc_marathi_tv",
    sid: "bbc_marathi_tv",
    loop_collection: "p0510sbc",
    specials_collection: "p0715nv4",
    live_brand: "w13xttvl",
    clip_language: "marathi",
    language_tag: "x",
    language: "mr",
    webcast_channels: [
      "world_service_stream_05",
      "world_service_stream_06",
      "world_service_stream_07",
      "world_service_stream_08",
    ],
  },
  Swahili: {
    serviceIDRef: "TVMAR01",
    mid: "bbc_swahili_tv",
    sid: "bbc_swahili_tv",
    loop_collection: "p0510sbc",
    specials_collection: "p0715nv4",
    live_brand: "w13xttvl",
    clip_language: "swahili",
    language_tag: "p0368zpn",
    language: "sw",
    webcast_channels: [
      "world_service_stream_05",
      "world_service_stream_06",
      "world_service_stream_07",
      "world_service_stream_08",
    ],
  },
};

app.use(
  bodyParser.text({
    type: "*/*",
    limit: "500kb",
  })
);

app.use(express.static(__dirname + "/../edit"));

// /status is used by ELB health checkers to assert that the service is running OK
app.get("/status", function (req, res) {
  res.send("OK");
});

// We do the "listen" call in index.js - making this module easier to test
module.exports.app = app;
module.exports.config = config;
module.exports.configV2 = configV2;
