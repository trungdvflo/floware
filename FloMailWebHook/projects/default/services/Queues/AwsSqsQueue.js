/* eslint-disable no-console */
const { SQSClient, SendMessageCommand } = require('@aws-sdk/client-sqs');
const AwsConstant = require('../../constants/AwsConstant');

const client = new SQSClient({
  region: AwsConstant.REGION,
  apiVersion: AwsConstant.API_VERSION
});

const Queue = async (queueName, msg) => {
  const message = msg;
  message.date = (new Date()).toISOString();
  const params = {
    MessageBody: JSON.stringify(message),
    QueueUrl: queueName
  };
  const command = new SendMessageCommand(params);
  client.send(command).then(
    (data) => {
      console.log('Successfully added message queue', data.MessageId);
    },
    (error) => {
      console.log('Error', error);
    }
  );
};
module.exports = Queue;
