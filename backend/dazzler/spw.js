const axios = require("axios");
const fs = require("fs");
const xml2js = require('xml2js-es6-promise');

function onlyName(name) {
    return name.split(':')[1]
} 

async function request(sid, date) {
    let url = `https://programmes.api.bbc.com/schedule?api_key=${process.env.SPW_KEY}&sid=${sid}&date=${date}`
    let r = await axios({
        url: url,
        method: 'get',
        timeout: 8000,
        key: fs.readFileSync(process.env.KEY),
        cert: fs.readFileSync(process.env.CERT),
        passphrase: process.env.PASSPHRASE,
        headers: { 'Accept': 'application/xml', }
    });
    return (await xml2js(r.data, { tagNameProcessors: [onlyName] })).schedule;
}

module.exports.request = request;