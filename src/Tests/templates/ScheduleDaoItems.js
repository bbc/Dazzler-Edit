// export const configV2 = {
//   Hindi: {
//     serviceIDRef: "TVHIND01",
//     mid: "bbc_hindi_tv",
//     sid: "bbc_hindi_tv",
//     loop_collection: "p0845svx",
//     specials_collection: "p0845sqf",
//     live_brand: ["w13xttlw"],
//     clip_language: "hindi",
//     language_tag: "p0368zp7",
//     language: "hi",
//     webcast_channels: [
//       "world_service_stream_05",
//       "world_service_stream_06",
//       "world_service_stream_07",
//       "world_service_stream_08",
//     ],
//   },
//   Marathi: {
//     serviceIDRef: "TVMAR01",
//     mid: "bbc_marathi_tv",
//     sid: "bbc_marathi_tv",
//     loop_collection: "p0510sbc",
//     specials_collection: "p0715nv4",
//     live_brand: ["w13xttvl"],
//     clip_language: "marathi",
//     language_tag: "x",
//     language: "mr",
//     webcast_channels: [
//       "world_service_stream_05",
//       "world_service_stream_06",
//       "world_service_stream_07",
//       "world_service_stream_08",
//     ],
//   },
//   Swahili: {
//     serviceIDRef: "TVMAR01",
//     mid: "bbc_swahili_tv",
//     sid: "bbc_swahili_tv",
//     loop_collection: "p0510sbc",
//     specials_collection: "p0715nv4",
//     live_brand: ["w13xttvl"],
//     clip_language: "swahili",
//     language_tag: "p0368zpn",
//     language: "sw",
//     webcast_channels: [
//       "world_service_stream_05",
//       "world_service_stream_06",
//       "world_service_stream_07",
//       "world_service_stream_08",
//     ],
//   },
// };

export const schedulev2 = {
  scheduleSource: "Dazzler",
  serviceIDRef: "TVMAR01",
  date: "2020-08-06",
  items: [
    {
      duration: "PT20M",
      insertionType: "",
      title: "BBC à¤µà¤¿à¤¶à¥à¤µ - 15/07/2020 GMT",
      asset: {
        duration: "PT20M",
        pid: "w3ct06bc",
        uri: "crid://bbc.co.uk/w/3000525816",
        release_date: "2020-07-15",
        title: "BBC à¤µà¤¿à¤¶à¥à¤µ - 15/07/2020 GMT",
        versionCrid: "crid://bbc.co.uk/w/4000567189",
        vpid: "w4hqvs3h",
        live: false,
        insertionType: "",
        entityType: "episode",
        availability: {
          planned_start: "2020-07-15T00:00:00Z",
          expected_start: "2020-07-15T00:30:00Z",
          actual_start: "2020-07-14T14:32:19.941Z",
        },
        status: "",
        action: "",
      },
      startTime: "2020-08-06T00:00:00.000Z",
      end: "2020-08-06T00:20:00.000Z",
    },
  ],
};

export const webcastResponse = {
  data: {
    page: 1,
    page_size: 5,
    total: 1,
    more_than: 0,
    items: [
      {
        item_type: "window",
        pid: "p08myc6m",
        identifiers: {
          identifier: [{ type: "pid", authority: "pips", $: "p08myc6m" }],
        },
        partner: "s0000001",
        service: {
          sid: "world_service_stream_06",
          result_type: "service",
          href: "/nitro/api/services?sid=world_service_stream_06",
        },
        updated_time: "2020-08-06T15:39:44Z",
        scheduled_time: {
          start: "2020-08-17T16:29:58Z",
          end: "2020-08-17T16:49:50Z",
        },
        ids: { id: { type: "pid", authority: "pips", $: "p08myc6m" } },
        window_of: [
          {
            result_type: "version",
            pid: "w1mshkxqtdlrv6d",
            href: "/nitro/api/versions?pid=w1mshkxqtdlrv6d",
            crid: "crid://bbc.co.uk/w/40005711041597681798",
          },
          {
            result_type: "episode",
            pid: "w172xf169vm91yw",
            href: "/nitro/api/programmes?pid=w172xf169vm91yw",
            crid: "crid://bbc.co.uk/w/30005297071597681798",
          },
        ],
        scheduled_publication_rights: {
          publication_rights: [
            {
              territory: "uk",
              transport: "stream",
              context: "webcast",
              platform: "mobile",
            },
            {
              territory: "nonuk",
              transport: "stream",
              context: "webcast",
              platform: "mobile",
            },
            {
              territory: "uk",
              transport: "stream",
              context: "webcast",
              platform: "pc",
            },
            {
              territory: "nonuk",
              transport: "stream",
              context: "webcast",
              platform: "pc",
            },
            {
              territory: "uk",
              transport: "stream",
              context: "webcast",
              platform: "iptv",
            },
            {
              territory: "nonuk",
              transport: "stream",
              context: "webcast",
              platform: "iptv",
            },
          ],
        },
      },
    ],
  },
  status: 200,
  statusText: "OK",
  headers: { "content-type": "application/json; charset=utf-8" },
  config: {
    url:
      "http://localhost:8080/api/v1/webcast?sid=bbc_hindi_tv&start=…-08-16T23:00:00Z&end=2020-08-17T23:00:00Z&page=1&page_size=5",
    method: "get",
    headers: { Accept: "application/json, text/plain, */*" },
    transformRequest: [null],
    transformResponse: [null],
    timeout: 0,
    xsrfCookieName: "XSRF-TOKEN",
    xsrfHeaderName: "X-XSRF-TOKEN",
    maxContentLength: -1,
  },
  request: {},
};
