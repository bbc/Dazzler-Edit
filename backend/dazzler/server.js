'use strict';

// https://github.com/bbc/sample-cloud-apps/nodejs-helloworld/src/helloworld/server.js
var express = require('express');
var fs = require('fs');
var Big = require('big-integer');
var https = require('https');
var bodyParser = require('body-parser')
var app = express();

//app.use(bodyParser.raw({ type: '*/*' }));
app.use(bodyParser.text({ type: '*/*' }));

app.use(express.static('/usr/lib/dazzler/edit'))

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

app.get('/schedule', function (req, res) {
  SpwRequest(req.query.sid, req.query.date).then(
      r => {
        res.type('application/xml');
        res.send(r);
        },
      err => res.status(404).send('Not found') // TODO use proper error message
    );
});

app.get('/webcast', function (req, res) {
  let q = {
	descendants_of: req.query.brand,
        sid : ["world_service_stream_05","world_service_stream_06","world_service_stream_07","world_service_stream_08"],
	start_from: req.query.start
  };
  if(req.query.hasOwnProperty('page')) {
    q.page = req.query.page;
  }
  if(req.query.hasOwnProperty('page_size')) {
    q.page_size = req.query.page_size;
  }
  nitroRequest('schedules', q).then(
    r => res.json(add_crids_to_webcast(r.nitro.results.items)),
    err => res.status(404).send('Not found') // TODO use proper error message
  );
});

app.get('/clip', function (req, res) {
  let q = {
    mixin: ['images','available_versions'],
    entity_type: 'clip'
  };
  if(req.query.hasOwnProperty('language')) {
    q.tag_name= req.query.language;
  }
  if(req.query.hasOwnProperty('page')) {
    q.page = req.query.page;
  }
  if(req.query.hasOwnProperty('page_size')) {
    q.page_size = req.query.page_size;
  }
  nitroRequest('programmes', q).then(
    r => res.json(r.nitro.results.items),
    err => res.status(404).send('Not found') // TODO use proper error message
  );
});

app.get('/episode', function (req, res) {
  let q = {
    mixin: ['images','available_versions'],
    entity_type: 'episode'
  };
  if(req.query.hasOwnProperty('pid')) {
    q.pid= req.query.pid;
  }
  if(req.query.hasOwnProperty('page')) {
    q.page = req.query.page;
  }
  if(req.query.hasOwnProperty('page_size')) {
    q.page_size = req.query.page_size;
  }
  nitroRequest('programmes', q).then(
    r => res.json(r.nitro.results.items),
    err => res.status(404).send('Not found') // TODO use proper error message
  );
});

app.get('/special', function (req, res) {
  let q = {
    mixin: ['images','available_versions'],
    entity_type: 'clip',
    group: process.env.SPECIALS
  };
  nitroRequest('programmes', q).then(
    r => res.json(r.nitro.results.items),
    err => res.status(404).send('Not found') // TODO use proper error message
  );
});

app.get('/placings', function (req, res) {
  nitroRequest('schedules', { version: req.query.version}).then(
    r => res.json(r.nitro.results.items),
    err => res.status(404).send('Not found') // TODO use proper error message
  );
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

// https://programmes.api.bbc.com/schedule?api_key=mUvZU43V0uGr7ItNBGnxYXgZLFVgx8Zo&sid=bbc_marathi_tv&date=2019-06-20

function SpwRequest(sid, date) {
    console.log('schedule', sid, date);
    
    return new Promise((resolve, reject) => {

        var options = {
            host: 'programmes.api.bbc.com',
            path: `/schedule?api_key=${process.env.SPW_KEY}&sid=${sid}&date=${date}`,
	    key: fs.readFileSync('/etc/pki/tls/private/client.key'),
	    cert: fs.readFileSync('/etc/pki/tls/certs/client.crt'),
	    passphrase: 'client',
            headers: {
                accept: 'application/xml'
            }
        };
        var request = https.get(options, (response) => {
            
            if (response.statusCode < 200 || response.statusCode > 299) {
                reject(new Error('Invalid status code: ' + response.statusCode));
            }
            
            var body = [];
            response.on('data', (chunk) => {body.push(chunk);});
            response.on('end', () => {
                try {
                    parseString(Buffer.concat(body).toString(), function (err, result) {
                      console.log(err);
                      console.log(result);
                      if(err) {
                        reject(err);
                      }
                      else {
                        resolve(result);
                      }
                    }); 
                }
                catch (e){
                    reject(new Error(e));
                }
            });
            response.on('error', (err) => reject(new Error(err)));
            
        });
        request.on('error', (err) => reject(new Error(err)));
    });
}


function nitroRequest(feed, query) {
    
    return new Promise((resolve, reject) => {

        var options = {
            host: 'programmes.api.bbc.com',
            path: '/nitro/api/'+feed+'?api_key='+process.env.NITRO_KEY+'&'+querystring.stringify(query),
            headers: {
                accept: 'application/json'
            }
        };
    
        console.log(options.path);
        var request = http.get(options, (response) => {
            
            if (response.statusCode < 200 || response.statusCode > 299) {
                reject(new Error('Invalid status code: ' + response.statusCode));
            }
            
            var data = '';
            response.on('data', (chunk) => {data+=chunk;});
            response.on('end', () => {
                try {
                    resolve(JSON.parse(data));
                }
                catch (e){
                    reject(new Error(e));
                }
            });
            response.on('error', (err) => reject(new Error(err)));
            
        });
        request.on('error', (err) => reject(new Error(err)));
    });
}

const pidchars = "0123456789bcdfghjklmnpqrstvwxyz";
const pidbase = pidchars.length;

function pid2crid(pid) {
  var n = Big(0);
  for (var i = 1; i < pid.length; i++) {
    const c = pid.charAt(i);
    const p = pidchars.indexOf(c);
    n = n.times(pidbase).plus(p);
  }
  return `crid://bbc.co.uk/${pid.substring(0, 1)}/${n}`;
}

function add_crids_to_webcast(items) {
    if(items != null) {
        for(let i=0; i<items.length; i++) {
            const pid = items[i].window_of[0].pid;
            items[i].window_of[0].crid = pid2crid(pid);
        }
    }
    return items;
}

// We do the "listen" call in index.js - making this module easier to test
module.exports.app = app;
