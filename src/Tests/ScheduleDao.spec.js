/* eslint-disable no-template-curly-in-string */
import axios from "axios";
import { fetchSchedule, getLanguages } from "../ScheduleDao/ScheduleDao";
import {
  schedulev2,
  // webcastResponse,
} from "./templates/ScheduleDaoItems";

const sampleConfig = {
  "Hindi": {
      "MediaSelectorURL": "https://open.live.bbc.co.uk/mediaselector/6/select/version/2.0/mediaset/ws-clip-syndication-high/proto/https/vpid/",
      "outputs": [
          {
              "label": "${ChannelNamePrefix} ${sid} monitoring",
              "stream_name": "tst",
              "type": "rtmp_push",
              "url": "rtmp://a.rtmp.youtube.com/live2"
          },
          {
              "label": "${ChannelNamePrefix} ${sid} main",
              "stream_name": "gfh9-c2f9-er49-ck01",
              "type": "rtmp_push",
              "url": "rtmp://a.rtmp.youtube.com/live2"
          }
      ],
      "read_schedule_from": "s3",
      "Timezone": "Asia/Kolkata",
      "OutputURL": "rtmp://a.rtmp.youtube.com/live2",
      "webcast_channels": [
          "world_service_stream_05",
          "world_service_stream_06",
          "world_service_stream_07",
          "world_service_stream_08"
      ],
      "runState": "off",
      "save_schedule_to": "s3",
      "serviceIDRef": "TVHIND01",
      "APPWBucket": "public-bf7ec4ef6829c416",
      "ChannelNamePrefix": "DazzlerV3",
      "language": "hi",
      "monitoringURL": "rtmp://a.rtmp.youtube.com/live2",
      "edit_group": "80ca27a6-e448-4d65-8b7a-e414c0b5777b",
      "loop_collection": "p0845svx",
      "slateDuration": "00:01:37",
      "staticClip": "https://open.live.bbc.co.uk/mediaselector/6/redir/version/2.0/mediaset/ws-clip-syndication-high/proto/https/vpid/p07crj91.mp4",
      "RoleSessionName": "dazzler-service",
      "newestFixedEvent": "2021-03-10T20:40:42Z",
      "OutputStreamName": "gfh9-c2f9-er49-ck01",
      "s3Schedule": "true",
      "specials_collection": "p0845sqf",
      "Name": "Hindi",
      "EventsInNearlyFullSchedule": "500",
      "dazzlerAssetsURL": "s3://ws-dazzler-assets/",
      "slateVPID": "p08jbg0p",
      "quietHour": "2",
      "mid": "bbc_hindi_tv",
      "clip_language": "hindi",
      "RoleArn": "arn:aws:iam::746161738563:role/client-access-appw-cd-live",
      "language_tag": "p0368zp7",
      "chan_ids": [
          "3342950",
          "5911472"
      ],
      "SPWURL": "https://programmes.api.bbc.com/schedule?api_key=%s&sid=%s&date=%s",
      "sid": "bbc_hindi_tv",
      "schedule_bucket": "ws-dazzler-assets-test",
      "ignoreSchedule": "false",
      "MS6URL": "https://open.live.bbc.co.uk/mediaselector/6/redir/version/2.0/mediaset/ws-clip-syndication-high/proto/https/vpid/",
      "playBucket": "ws-dazzler-assets-test",
      "nextStartTime": "2021-03-11T15:54:31Z",
      "HLSURL": "https://a.files.bbci.co.uk/media/live/manifesto/audio_video/simulcast/hls/uk/b2b/%s.m3u8",
      "live_brand": [
          "w172xssw9rmz2sb"
      ],
      "monitoringStreamName": "tst",
      "inputs": [
          {
              "type": "dynamic",
              "url": "$urlPath$",
              "label_suffix": "dynamic"
          },
          {
              "type": "static",
              "url": "s3://ws-dazzler-assets/p08jbg0p.mp4",
              "label_suffix": "slate"
          },
          {
              "type": "hls",
              "url": "https://a.files.bbci.co.uk/media/live/manifesto/audio_video/simulcast/hls/uk/b2b/world_service_stream_05.m3u8",
              "label_suffix": "world_service_stream_05",
              "sid": "world_service_stream_05"
          },
          {
              "type": "hls",
              "url": "https://a.files.bbci.co.uk/media/live/manifesto/audio_video/simulcast/hls/uk/b2b/world_service_stream_06.m3u8",
              "label_suffix": "world_service_stream_06",
              "sid": "world_service_stream_06"
          },
          {
              "type": "hls",
              "url": "https://a.files.bbci.co.uk/media/live/manifesto/audio_video/simulcast/hls/uk/b2b/world_service_stream_07.m3u8",
              "label_suffix": "world_service_stream_07",
              "sid": "world_service_stream_07"
          },
          {
              "type": "hls",
              "url": "https://a.files.bbci.co.uk/media/live/manifesto/audio_video/simulcast/hls/uk/b2b/world_service_stream_08.m3u8",
              "label_suffix": "world_service_stream_08",
              "sid": "world_service_stream_08"
          }
      ]
  },
  "Gujarati": {
      "outputs": [
          {
              "label": "${ChannelNamePrefix} ${sid} monitoring",
              "stream_name": "p2k9-egxe-f2ua-4hxa-9h1e",
              "type": "rtmp_push",
              "url": "rtmp://a.rtmp.youtube.com/live2"
          },
          {
              "label": "${ChannelNamePrefix} ${sid} main",
              "stream_name": "p2k9-egxe-f2ua-4hxa-9h1e",
              "type": "rtmp_push",
              "url": "rtmp://a.rtmp.youtube.com/live2"
          }
      ],
      "read_schedule_from": "pips",
      "Timezone": "Asia/Kolkata",
      "OutputURL": "rtmp://a.rtmp.youtube.com/live2",
      "webcast_channels": [
          "world_service_stream_05",
          "world_service_stream_06",
          "world_service_stream_07",
          "world_service_stream_08"
      ],
      "runState": "off",
      "save_schedule_to": "pips",
      "serviceIDRef": "TVGUJA01",
      "ChannelNamePrefix": "DazzlerV3",
      "name": "Gujarati",
      "language": "gu",
      "monitoringURL": "rtmp://a.rtmp.youtube.com/live2",
      "edit_group": "80ca27a6-e448-4d65-8b7a-e414c0b5777b",
      "loop_collection": "",
      "slateDuration": "00:01:37",
      "staticClip": "https://open.live.bbc.co.uk/mediaselector/6/redir/version/2.0/mediaset/ws-clip-syndication-high/proto/https/vpid/p07crj91.mp4",
      "newestFixedEvent": "2020-09-24T21:30:09Z",
      "OutputStreamName": "gfh9-c2f9-er49-ck01",
      "s3Schedule": "true",
      "specials_collection": "",
      "Name": "Gujarati",
      "EventsInNearlyFullSchedule": "500",
      "slateVPID": "p099hp2z",
      "quietHour": "3",
      "mid": "bbc_gujarati_tv",
      "clip_language": "gujarati",
      "language_tag": "p053n6wy",
      "sid": "bbc_gujarati_tv",
      "schedule_bucket": "ws-dazzler-assets-test",
      "ignoreSchedule": "false",
      "nextStartTime": "2020-09-25T14:12:53Z",
      "live_brand": [
          "w13xttqr"
      ],
      "monitoringStreamName": "p2k9-egxe-f2ua-4hxa-9h1e",
      "inputs": [
          {
              "type": "dynamic",
              "url": "$urlPath$",
              "label_suffix": "dynamic"
          },
          {
              "type": "static",
              "url": "s3://ws-dazzler-assets/p08jbg0p.mp4",
              "label_suffix": "slate"
          },
          {
              "type": "hls",
              "url": "https://a.files.bbci.co.uk/media/live/manifesto/audio_video/simulcast/hls/uk/b2b/world_service_stream_05.m3u8",
              "label_suffix": "world_service_stream_05",
              "sid": "world_service_stream_05"
          },
          {
              "type": "hls",
              "url": "https://a.files.bbci.co.uk/media/live/manifesto/audio_video/simulcast/hls/uk/b2b/world_service_stream_06.m3u8",
              "label_suffix": "world_service_stream_06",
              "sid": "world_service_stream_06"
          },
          {
              "type": "hls",
              "url": "https://a.files.bbci.co.uk/media/live/manifesto/audio_video/simulcast/hls/uk/b2b/world_service_stream_07.m3u8",
              "label_suffix": "world_service_stream_07",
              "sid": "world_service_stream_07"
          },
          {
              "type": "hls",
              "url": "https://a.files.bbci.co.uk/media/live/manifesto/audio_video/simulcast/hls/uk/b2b/world_service_stream_08.m3u8",
              "label_suffix": "world_service_stream_08",
              "sid": "world_service_stream_08"
          }
      ]
  },
  "Marathi": {
      "MediaSelectorURL": "https://open.live.bbc.co.uk/mediaselector/6/select/version/2.0/mediaset/ws-clip-syndication-high/proto/https/vpid/",
      "outputs": [
          {
              "label": "${ChannelNamePrefix} ${sid} monitoring",
              "stream_name": "tst",
              "type": "rtmp_push",
              "url": "rtmp://a.rtmp.youtube.com/live2"
          },
          {
              "label": "${ChannelNamePrefix} ${sid} main",
              "stream_name": "gfh9-c2f9-er49-ck01",
              "type": "rtmp_push",
              "url": "rtmp://a.rtmp.youtube.com/live2"
          }
      ],
      "read_schedule_from": "s3",
      "Timezone": "Asia/Kolkata",
      "OutputURL": "rtmp://a.rtmp.youtube.com/live2",
      "webcast_channels": [
          "world_service_stream_05",
          "world_service_stream_06",
          "world_service_stream_07",
          "world_service_stream_08"
      ],
      "runState": "off",
      "save_schedule_to": "s3",
      "serviceIDRef": "TVMAR01",
      "APPWBucket": "public-bf7ec4ef6829c416",
      "ChannelNamePrefix": "DazzlerV3",
      "language": "mr",
      "monitoringURL": "rtmp://a.rtmp.youtube.com/live2",
      "edit_group": "80ca27a6-e448-4d65-8b7a-e414c0b5777b",
      "loop_collection": "p0510sbc",
      "slateDuration": "00:01:37",
      "staticClip": "https://open.live.bbc.co.uk/mediaselector/6/redir/version/2.0/mediaset/ws-clip-syndication-high/proto/https/vpid/p07crj91.mp4",
      "RoleSessionName": "dazzler-service",
      "newestFixedEvent": "2021-02-11T20:35:02Z",
      "OutputStreamName": "gfh9-c2f9-er49-ck01",
      "s3Schedule": "true",
      "specials_collection": "p0715nv4",
      "Name": "Marathi",
      "EventsInNearlyFullSchedule": "500",
      "dazzlerAssetsURL": "s3://ws-dazzler-assets/",
      "slateVPID": "p08jbg0p",
      "quietHour": "2",
      "mid": "bbc_marathi_tv",
      "clip_language": "marathi",
      "RoleArn": "arn:aws:iam::746161738563:role/client-access-appw-cd-live",
      "language_tag": "?",
      "chan_ids": [
          "1768567"
      ],
      "SPWURL": "https://programmes.api.bbc.com/schedule?api_key=%s&sid=%s&date=%s",
      "sid": "bbc_marathi_tv",
      "schedule_bucket": "ws-dazzler-assets-test",
      "ignoreSchedule": "false",
      "MS6URL": "https://open.live.bbc.co.uk/mediaselector/6/redir/version/2.0/mediaset/ws-clip-syndication-high/proto/https/vpid/",
      "playBucket": "ws-dazzler-assets-test",
      "nextStartTime": "2021-02-12T14:24:55Z",
      "HLSURL": "https://a.files.bbci.co.uk/media/live/manifesto/audio_video/simulcast/hls/uk/b2b/%s.m3u8",
      "live_brand": [
          "w13xttr2"
      ],
      "monitoringStreamName": "tst",
      "inputs": [
          {
              "type": "dynamic",
              "url": "$urlPath$",
              "label": "${ChannelNamePrefix} ${sid} dynamic"
          },
          {
              "type": "static",
              "url": "s3://ws-dazzler-assets/p08jbg0p.mp4",
              "label": "${ChannelNamePrefix} ${sid} slate"
          },
          {
              "type": "hls",
              "url": "https://a.files.bbci.co.uk/media/live/manifesto/audio_video/simulcast/hls/uk/b2b/world_service_stream_05.m3u8",
              "label": "${ChannelNamePrefix} ${sid} world_service_stream_05"
          },
          {
              "type": "hls",
              "url": "https://a.files.bbci.co.uk/media/live/manifesto/audio_video/simulcast/hls/uk/b2b/world_service_stream_06.m3u8",
              "label": "${ChannelNamePrefix} ${sid} world_service_stream_06"
          },
          {
              "type": "hls",
              "url": "https://a.files.bbci.co.uk/media/live/manifesto/audio_video/simulcast/hls/uk/b2b/world_service_stream_07.m3u8",
              "label": "${ChannelNamePrefix} ${sid} world_service_stream_07"
          },
          {
              "type": "hls",
              "url": "https://a.files.bbci.co.uk/media/live/manifesto/audio_video/simulcast/hls/uk/b2b/world_service_stream_08.m3u8",
              "label": "${ChannelNamePrefix} ${sid} world_service_stream_08"
          }
      ]
  }
};

jest.mock("axios");
describe("ScheduleDao", () => {
  test("testing getLanguages method fetches the list of all available languages", () => {
    axios.get.mockResolvedValue({data: sampleConfig });
    getLanguages((data) => {
      const languageList = Object.keys(data);
      expect(languageList).toStrictEqual(["Hindi", "Gujarati", "Marathi"]);      
    }
    )
  });
  test("testing fetchSchedulev2 method fetches the current schedule", () => {
    let obj = {
      data: {
        total: schedulev2.items.length,
        item: schedulev2.items,
        sid: schedulev2.sid,
        date: schedulev2.date,
      },
    };
    const sid = "bbc_marathi_tv";
    const date = "2020-08-06";
    axios.get.mockResolvedValue(obj);
    fetchSchedule(sid, date, (data) => {
      expect(data.items[0].insertionType).toEqual("sentinel");
      expect(data.items[1].insertionType).toEqual("gap");
    });
  });
});
