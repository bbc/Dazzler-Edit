var dazzler = require("./dazzler/server");
var v1 = require("./dazzler/v1");
var v2 = require("./dazzler/v2");

dazzler.app.listen(8080, function () {
  v1.init(dazzler.app, dazzler.config);
  v2.init(dazzler.app, dazzler.config, dazzler.configV2);
  console.log("dazzler listening on port 8080!");
});
