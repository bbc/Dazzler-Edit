const axios = require("axios");
const fs = require("fs");
const https = require("https");
const parseString = require("xml2js").parseString;

const uri = 'https://api.live.bbc.co.uk/pips/api/v1';

async function xml2json(xml) {
    return new Promise((resolve, reject) => {
      parseString(xml, function(err, json) {
        if (err) reject(err);
        else resolve(json);
      });
    });
  }

async function clearCollection(pid) {
    var config = {
      key: fs.readFileSync(process.env.KEY),
      cert: fs.readFileSync(process.env.CERT),
      passphrase: process.env.PASSPHRASE
    };
    const members = await getCollectionMembers(pid);
    for (let i = 0; i < members.length; i++) {
      await axios.delete(
        `${uri}/membership/pid.${members[i]}`,
        config
      );
    }
  }
  
  async function getCollectionMembers(pid) {
    var config = {
      key: fs.readFileSync(process.env.KEY),
      cert: fs.readFileSync(process.env.CERT),
      passphrase: process.env.PASSPHRASE
    };
    const membersXml = await axios.get(
      `${uri}/collection/pid.${pid}/group_of/`,
      config
    );
    const members = await xml2json(membersXml);
    const membership = members.pips.results[0].membership;
    /* this is good if we need the positions but we only use the results for delete
    let r = [];
    for(let i=0; i<membership.length; i++) {
            const pid = membership[i].$.pid;
            const position = membership[i].position[0]
            r[position] = pid;
    }
    return r.filter(function (el) { return el != null; });
    */
    return Array.from(membership, x => x.$.pid);
  }
  
  async function setCollectionMembers(pid, data) {
    for (let i = 0; i < data.length; i++) {
      await createMembership(pid, data[i], i + 1);
    }
  }
  
  async function createMembership(collection, member, position) {
    const xml = `<pips xmlns="http://ns.webservices.bbc.co.uk/2006/02/pips" xmlns:pips-meta="http://ns.webservices.bbc.co.uk/2006/02/pips-meta" xmlns:xsd="http://www.w3.org/2001/XMLSchema-datatypes" release="219">
    <membership>
      <partner>
        <link rel="pips-meta:partner" pid="s0000001"/>
      </partner>
      <ids/>
      <group>
        <link rel="pips-meta:collection" pid="${collection}"/>
      </group>
      <member>
        <link rel="pips-meta:clip" pid="${member}"/>
      </member>
      <position>${position}</position>
      <title></title>
      <synopses/>
      <links/>
    </membership>
  </pips>`;
    return await postPIPS(xml);
  }
  
  async function postPIPS(object_type, data) {
    var config = {
      key: fs.readFileSync(process.env.KEY),
      cert: fs.readFileSync(process.env.CERT),
      passphrase: process.env.PASSPHRASE,
      headers: { "Content-Type": "text/xml" }
    };
  
    return await axios.post(
      `${uri}/${object_type}/`,
      data,
      config
    );
  }
  
  function postTVA(data, res) {
    const options = {
      path: "/pips/import/tva/",
      host: "api.live.bbc.co.uk",
      method: "POST",
      key: fs.readFileSync(process.env.KEY),
      cert: fs.readFileSync(process.env.CERT),
      passphrase: process.env.PASSPHRASE,
      headers: {
        "Content-Type": "application/xml",
        "Content-Length": Buffer.byteLength(data)
      }
    };
    options.agent = new https.Agent(options);
    try {
      const req = https.request(options, function(post_res) {
        let body = "";
        post_res.setEncoding("utf8");
        post_res.on("data", chunk => {
          body += chunk;
        });
        post_res.on("end", () => {
          try {
            parseString(body, function(err, result) {
              if (err) {
                res.status(404).send(err);
              } else {
                res.json(result);
              }
            });
          } catch (e) {
            res.status(404).send(e);
          }
        });
      });
      // post the data
      req.write(data);
      req.end();  
    } catch(e) {
      console.log(e);
      // assume cert error
      res.status(401).send(e);
    }
  }

  module.exports = {
    clearCollection: clearCollection,
    getCollectionMembers: getCollectionMembers,
    setCollectionMembers: setCollectionMembers,
    postTVA: postTVA
  };
  