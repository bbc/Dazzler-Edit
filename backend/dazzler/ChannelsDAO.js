const AWS = require("aws-sdk");

class ChannelsDAO {
  constructor() {
    if (!process.env.AUTHORISED_USERS) {
      process.env = require("../../src/config/env.json");
    }
    this.dynamodb = new AWS.DynamoDB({
      region: process.env.DYNAMO_DB_REGION,
    });
    this.params = {
      TableName: process.env.DYNAMO_DB,
    };
  }

  getChannels() {
    const { dynamodb, params } = this;
    return new Promise((resolve, reject) => {
      dynamodb.scan(params, function (err, data) {
        if (err) {
          console.log(err, err.stack);
          reject(err);
        } else {
          let config = {};
          for (let i = 0; i < data.Items.length; i++) {
            let unit = data.Items[i];
            config[unit.Name.S] = AWS.DynamoDB.Converter.unmarshall(unit);
          }
          resolve(config);
        }
      });
    });
  }

  getItem(channel) {
    var params = {
      TableName: process.env.DYNAMO_DB,
      Key: {
        sid: {
          S: channel,
        },
      },
    };
    return new Promise((resolve, reject) => {
      this.dynamodb.getItem(params, function (err, data) {
        if (err) {
          console.log(err, err.stack);
          reject(err);
        }
        if (data) {
          var marshalled = AWS.DynamoDB.Converter.unmarshall(data.Item);
          resolve(marshalled);
        }
      });
    });
  }
}

module.exports = ChannelsDAO;
