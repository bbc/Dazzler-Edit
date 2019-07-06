'use strict';

// https://github.com/bbc/sample-cloud-apps/nodejs-helloworld/src/helloworld/server.js
const auth = require('./auth');
const express = require('express');
const fs = require('fs');
const parseString = require('xml2js').parseString;
const querystring = require('querystring');
const Big = require('big-integer');
const http = require('http');
const https = require('https');
const bodyParser = require('body-parser')
const app = express();

//app.use(bodyParser.raw({ type: '*/*' }));
app.use(bodyParser.text({ type: '*/*' }));

app.use(express.static('/usr/lib/dazzler/edit'))

// /status is used by ELB health checkers to assert that the service is running OK
app.get('/status', function (req, res) {
    res.send("OK");
});

app.get('/user', function (req, res) {
    if(req.header('sslclientcertsubject')) {
	const subject = parseSSLsubject(req);
	let r = { email: subject.emailAddress, auth: auth(subject.emailAddress)};
        if(subject.hasOwnProperty('CN')) {
            r.name = subject.CN;
        }
        res.json(r);
    }
    else {
        res.json({auth: false});
    }
});

app.get('/schedule', function (req, res) {
  SpwRequest(req.query.sid, req.query.date).then(
      r => {
        if(r) {
          res.json(r);
        }
        else {
                res.status(404).send('Not found'); // TODO use proper error message
        }
      },
      err => {
		console.log(err);
		res.status(404).send('Not found'); // TODO use proper error message
      }
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
    group: process.env.SPECIALS_COLLECTION
  };
  nitroRequest('programmes', q).then(
    r => res.json(r.nitro.results.items),
    err => res.status(404).send('Not found') // TODO use proper error message
  );
});

app.get('/placings', function (req, res) {
  nitroRequest('schedules', { version: req.query.version }).then(
    r => res.json(r.nitro.results.items),
    err => res.status(404).send('Not found') // TODO use proper error message
  );
});

app.get('/version', function (req, res) {
  nitroRequest('versions', { pid: req.query.version }).then(
    r => res.json(r.nitro.results.items),
    err => res.status(404).send('Not found') // TODO use proper error message
  );
});

/*
  ENV=live
  KEY=/home/developer/t/Dazzler-Edit/backend/dazzler.key
  CERT=/home/developer/t/Dazzler-Edit/backend/dazzler.pem
  PASSPHRASE=dazzler
  KEY=/etc/pki/tls/private/client.key
  CERT=/etc/pki/tls/certs/client.crt
  PASSPHRASE=client
 */

app.post('/tva', function (req, res) {
  if(req.body.includes('serviceIDRef="TVMAR01')) {
    if(req.header.hasOwnProperty('sslclientcertsubject')) {
	const subject = parseSSLsubject(req);
	if(auth(subject.emailAddress)) {
	    postTVA(data, res);
	}
        else {
	    res.status(403).send('unauthorised1');
	}
    }
    else {
	res.status(403).send('unauthorised2');
    }
  }
  else {
      res.status(403).send('unauthorised3');
  }
});

function postTVA(data, res) {
  var options = {
    hostname: 'api.'+process.env.ENV+'.bbc.co.uk',
    path: '/pips/import/tva/',
    method: 'POST',
    key: fs.readFileSync(process.env.KEY),
    cert: fs.readFileSync(process.env.CERT),
    passphrase: process.env.PASSPHRASE,
    headers: {
        'Content-Type': 'application/xml',
        'Content-Length': Buffer.byteLength(data)
    }
  };
  options.agent = new https.Agent(options);
  var req = https.request(options, function(post_res) {
      var body = '';
      post_res.setEncoding('utf8');
      post_res.on('data', (chunk) => {body+=chunk;});
      post_res.on('end', () => {
	try {
	  parseString(
	    body,
	    function(err, result) {
	      if(err) {
		res.status(404).send(err);
	      }
	      else {
		res.json(result);
	      }
	    }
	  );
	}
	catch (e){
	  res.status(404).send(e);
	}
      });
  });
  // post the data
  req.write(data);
  req.end();
}

// https://programmes.api.bbc.com/schedule?api_key=mUvZU43V0uGr7ItNBGnxYXgZLFVgx8Zo&sid=bbc_marathi_tv&date=2019-06-20

function SpwRequest(sid, date) {
    
    return new Promise((resolve, reject) => {

        var options = {
            host: 'programmes.api.bbc.com',
            path: `/schedule?api_key=${process.env.SPW_KEY}&sid=${sid}&date=${date}`,
	    key: fs.readFileSync(process.env.KEY),
	    cert: fs.readFileSync(process.env.CERT),
	    passphrase: process.env.PASSPHRASE,
            headers: {
                accept: 'application/xml'
            }
        };

        var request = https.get(options, (response) => {
            
            if (response.statusCode == 404) {
                resolve(null);
                return;
            }

            if (response.statusCode < 200 || response.statusCode > 299) {
                console.log('Invalid status code: ' + response.statusCode);
                reject(new Error('Invalid status code: ' + response.statusCode));
		return;
            }
            
            var body = [];
            response.on('data', (chunk) => {body.push(chunk);});
            response.on('end', () => {
  		try {
                  parseString(
		    Buffer.concat(body).toString(), 
		    function(err, result) {
		      if(err) {
			reject(err);
		      }
		      else {
			resolve(result);
		      }
                    }
		  );
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

function parseSSLsubject(req) {
    var subject = req.header('sslclientcertsubject');
    var fields = subject.split(',');
    var data = {};
    for(var i=0; i<fields.length; i++) {
        console.log(fields[i]);
        var [ key, val ] = fields[i].split('=');
        data[key] = val;
    }
    return data;
}

// We do the "listen" call in index.js - making this module easier to test
module.exports.app = app;
