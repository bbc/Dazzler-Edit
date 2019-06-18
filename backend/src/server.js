'use strict';

// https://github.com/bbc/sample-cloud-apps/nodejs-helloworld/src/helloworld/server.js
var express = require('express');
var fs = require('fs');
var https = require('https');
var bodyParser = require('body-parser')
var app = express();

//app.use(bodyParser.raw({ type: '*/*' }));
app.use(bodyParser.text({ type: '*/*' }));

app.get('/', function (req, res) {
    res.send('Hello world from Node ' + process.version + '!\n');
});

// /status is used by ELB health checkers to assert that the service is running OK
app.get('/status', function (req, res) {
    res.send("OK");
});

app.get('/user', function (req, res) {
    var subject = req.header('sslclientcertsubject');
    if(subject != null) {
	    var subject = req.header('sslclientcertsubject');
	    var fields = subject.split(',');
	    var data = {};
	    for(var i=0; i<fields.length; i++) {
	      console.log(fields[i]);
	      var [ key, val ] = fields[i].split('=');
	      data[key] = val;
	    }
	    if(data.hasOwnProperty('CN')) {
	      res.json({name: data.CN, email: data.emailAddress});
	    }
	    else {
              res.json({name: "", email: ""});
	    }
    }
    else {
        res.json({name: "", email: ""});
    }
});

app.post('/tva', function (req, res) {
	console.log('add_tva');
	console.log(req.body);
        if(req.body.includes('serviceIDRef="TVMAR01')) {
            console.log('its marathi');
        }
  var post_data = req.body;
  var options = {
    hostname: 'api.live.bbc.co.uk',
    path: '/pips/import/tva/',
    method: 'POST',
    headers: {
        'Content-Type': 'text/xml',
        'Content-Length': Buffer.byteLength(post_data)
    },
    key: fs.readFileSync('/etc/pki/tls/private/client.key'),
    cert: fs.readFileSync('/etc/pki/tls/certs/client.crt'),
    passphrase: 'client'
  };
  options.agent = new https.Agent(options);
  console.log(options);
  var post_req = https.request(options, function(post_res) {
      post_res.setEncoding('utf8');
      post_res.on('data', function (chunk) {
          console.log('Response: ' + chunk);
      });
      post_res.on('end', function() {
         res.send(Buffer.concat(body).toString());
      });
  });
  // post the data
  post_req.write(post_data);
  post_req.end();
});


// We do the "listen" call in index.js - making this module easier to test
module.exports.app = app;
