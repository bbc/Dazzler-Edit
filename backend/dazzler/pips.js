const https = require("https");
const axios = require("axios");
const fs = require("fs");
const parseString = require("xml2js").parseString;
const xml2js = require('xml2js-es6-promise');

const base_uri = 'https://api.live.bbc.co.uk/pips';
const uri = base_uri+'/api/v1';

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
    https.globalAgent.options.key = fs.readFileSync(process.env.KEY);
    https.globalAgent.options.cert = fs.readFileSync(process.env.CERT);
    https.globalAgent.options.passphrase = process.env.PASSPHRASE;
    var config = {
      headers: { "Content-Type": "text/xml" }
    };
    try {
      return await axios.post(
        `${uri}/${object_type}/`,
        data,
        config
      );  
    } catch(e) {
      console.log(e);
      // TODO fix error handling
      return null;
    }
  }

  async function postTVA(data) {
    https.globalAgent.options.key = fs.readFileSync(process.env.KEY);
    https.globalAgent.options.cert = fs.readFileSync(process.env.CERT);
    https.globalAgent.options.passphrase = process.env.PASSPHRASE;

    var config = {
      headers: { "Content-Type": "text/xml" }
    };
  
    try {
      const r = await axios.post(base_uri+'/import/tva', data, config);
      return await xml2js(r.data);
    } catch(e) {
      console.log("POST TVA ERROR");
      console.log(e);
      return e;
    }
  }

  module.exports = {
    clearCollection: clearCollection,
    getCollectionMembers: getCollectionMembers,
    setCollectionMembers: setCollectionMembers,
    postTVA: postTVA
  };
  