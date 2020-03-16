const aws = require("aws-sdk");
const auth = require("./auth");

const s3 = new aws.S3({ apiVersion: "2006-03-01" });

async function getSubscriptions(sid) {
    const s = await s3.getObject({
        Bucket: process.env.BUCKET,
        Key: `${sid}/subscriptions`
    }).promise();
    return JSON.parse(s.Body.toString("utf-8"));
}

async function putSubscriptions(sid, subscriptions) {
    return s3.putObject({
        Bucket: process.env.BUCKET,
        Key: `${sid}/subscriptions`,
        Body: JSON.stringify(subscriptions),
        ContentType: 'application/json'
    }).promise();
}

async function addSubscription(sid, subscription) {
    console.log('addSubscription', sid, subscription);
    const subscriptions = await getSubscriptions(sid);
    if (subscriptions.includes(subscription)) {
        return;
    }
    subscriptions.push(subscription);
    return putSubscriptions(sid, subscriptions);
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