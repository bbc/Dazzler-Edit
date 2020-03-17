const aws = require("aws-sdk");
const auth = require("./auth");

const s3 = new aws.S3({ apiVersion: "2006-03-01" });

async function getSubscriptions(sid) {
    try {
        const s = await s3.getObject({
            Bucket: process.env.BUCKET || 'ws-dazzler-assets-test',
            Key: `${sid}/subscriptions`
        }).promise();
        return JSON.parse(s.Body.toString("utf-8"));            
    } catch (error) { // assume doc does not exist
        return [];
    }
}

async function putSubscriptions(sid, subscriptions) {
    return s3.putObject({
        Bucket: process.env.BUCKET || 'ws-dazzler-assets-test',
        Key: `${sid}/subscriptions`,
        Body: JSON.stringify(subscriptions),
        ContentType: 'application/json'
    }).promise();
}

async function addSubscription(sid, subscription) {
    console.log('addSubscription', sid, subscription);
    const subscriptions = await getSubscriptions(sid);
    const s = {};
    subscriptions.forEach((sub) => {
        s[sub.endpoint] = sub;
    });
    s[subscription.endpoint] = subscription;
    const newsubs = [];
    Object.keys(s).forEach((key) => {
        newsubs.push(s[key]);
    });
    return putSubscriptions(sid, newsubs);
}

async function removeSubscription(sid, subscription) {
    const subscriptions = await getSubscriptions(sid);
    const filtered = subscriptions.filter((value) => { return value !== subscription });
    return putSubscriptions(sid, filtered);
}

module.exports = {
    getSubscriptions,
    putSubscriptions,
    addSubscription,
    removeSubscription
}