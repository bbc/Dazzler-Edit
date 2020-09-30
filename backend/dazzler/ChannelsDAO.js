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

  getListOfChannels() {
    try {
      const { dynamodb, params } = this;
      dynamodb.scan(params, function (err, data) {
        if (err) {
          console.log(err, err.stack);
        } else {
          console.log(JSON.stringify(data.Items));
          return Object.keys(data.Items[0]);
        }
      });
    } catch (error) {
      console.log(error);
    }
  }

  getItem(channel) {
    const params = {
      Key: { sid: channel },

      TableName: process.env.DYNAMO_DB,
    };
    this.dynamodb.getItem(params, function (err, data) {
      if (err) {
        console.log(err, err.stack);
      }
      if (data) {
        console.log("it is ", data);
      }
    });
  }
}

const cd = new ChannelsDAO();
// cd.getListOfChannels();
cd.getItem("bbc_marathi_tv");
