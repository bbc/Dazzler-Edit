"use strict";

var dazzler = require("./dazzler/server");
var v2 = require("./dazzler/v2");
 
dazzler.app.listen(8080, function() {
  v2.init(dazzler.app, dazzler.config);
  console.log("dazzler listening on port 8080!");
});
