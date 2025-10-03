/* eslint-disable no-console */
// Load the AWS SDK for Node.js
const AWS = require('aws-sdk');
const AwsConstant = require('../../../../workers/supports/AwsConstant');
// Set the region we will be using
AWS.config.update({ region: AwsConstant.REGION });

// Create SQS service client
const sqs = new AWS.SQS({ apiVersion: AwsConstant.API_VERSION });

// Replace with your accountid and the queue name you setup
const accountId = AwsConstant.ACCOUNT_ID;

const Queue = async (queueName, msg, fullUrl = false) => {
    const message = msg;
    message.date = (new Date()).toISOString();
    // console.log('message', message);
    const params = {
        MessageBody: JSON.stringify(message),
        QueueUrl: fullUrl ? queueName : `https://sqs.${AwsConstant.REGION}.amazonaws.com/${accountId}/${queueName}`
    };

    sqs.sendMessage(params, (err, data) => {
        if (err) {
            console.log('Error', err);
        } else {
            // console.log('Successfully added message queue', data.MessageId);
        }
    });
};
module.exports = Queue;

