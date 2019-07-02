'use strict';

var dazzler = require("./dazzler/server");

dazzler.app.listen(8080, function () {
    console.log('dazzler listening on port 8080!');
});
