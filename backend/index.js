var dazzler = require("./dazzler/server");
var v1 = require("./dazzler/v1");
var v2 = require("./dazzler/v2");

dazzler.app.listen(8080, async function () {
  dazzler
    .config()
    .then((config) => {
      v1.init(dazzler.app, config);
      v2.init(dazzler.app, config);
    })
    .catch((e) => {
      v1.init(dazzler.app, dazzler.defaultConfig);
      v2.init(dazzler.app, dazzler.defaultConfig);
    });

  console.log("dazzler listening on port 8080!");
});
