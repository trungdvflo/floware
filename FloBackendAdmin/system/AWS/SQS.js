const _ = require('lodash');
const AWS = require('aws-sdk');

const store = {
  caches: []
};

const commands = {

  DeleteMessage(message, QueueUrl) {
    return new Promise((resolve, reject) => {
      try {
        const deleteParams = {
          QueueUrl,
          ReceiptHandle: message.ReceiptHandle
        };
        this.deleteMessage(deleteParams, (err, data) => {
          if (err) {
            reject(err);
          } else {
            resolve(data);
          }
        });
      } catch (error) {
        reject(error);
      }
    });
  },

  /**
     * 
     * @param {*} Entries : [{Id,ReceiptHandle}]
     */
  DeleteMessageBatch(Entries, QueueUrl) {
    return new Promise((resolve, reject) => {
      try {
        const params = {
          Entries,
          QueueUrl
        };
        this.deleteMessageBatch(params, (err, data) => {
          if (err) {
            reject(err);
          } else {
            resolve(data);
          }
        });
      } catch (error) {
        reject(error);
      }
    });
  },

  ReceiveMessages(MaxNumberOfMessages, QueueUrl) {
    return new Promise((resolve, reject) => {
      try {
        const params = {
          MaxNumberOfMessages,
          MessageAttributeNames: [
            'All'
          ],
          QueueUrl,
          VisibilityTimeout: 10,
          WaitTimeSeconds: 5
        };

        this.receiveMessage(params, (err, data) => {
          if (err) {
            reject(err);
          } else if (data.Messages) {
            resolve(data);
          } else {
            resolve([]);
          }
        });
      } catch (error) {
        reject(error);
      }
    });
  },

  SendMessage(args, QueueUrl) {
    return new Promise((resolve, reject) => {
      const { message } = args;
      const params = {
        MessageBody: JSON.stringify(message),
        QueueUrl
      };

      this.sendMessage(params, (err, data) => {
        if (err) {
          reject(err);
        } else {
          resolve(data);
        }
      });
    });
  },

  GetQueueUrl(QueueName, accountId) {
    return new Promise((resolve, reject) => {
      const params = {
        QueueName, /* required */
        QueueOwnerAWSAccountId: accountId
      };
      this.getQueueUrl(params, (error, data) => {
        if (error) {
          reject(error);
        } else {
          const QueueUrl = _.get(data, 'QueueUrl', '');
          resolve(QueueUrl);
        }
      });
    });
  }
};

module.exports.ApplyAwsSQS = (cache, path, projectBasePath) => {
  store.caches.push({
    cache,
    path,
    projectBasePath
  });
};

module.exports.Start = (AwsConfig) => {
  return new Promise((resolve, reject) => {
    try {
      const apiVersion = _.get(AwsConfig, 'API_VERSION', 'latest');
      const region = _.get(AwsConfig, 'REGION', 'ap-southeast-1');

      const sqsConfig = {};

      if (_.isEmpty(apiVersion) === false) {
        sqsConfig.apiVersion = apiVersion;
      }
      if (_.isEmpty(region) === false) {
        sqsConfig.region = region;
      }

      const sqs = new AWS.SQS(sqsConfig);
      _.forEach(store.caches, (v) => {
        try {
          const cache = require(v.path);
          const bindCommand = {};
          _.forEach(commands, (func, funcName) => {
            bindCommand[funcName] = func.bind(sqs);
          });
          require.cache[v.path].exports = bindCommand;
          _.forEach(cache, (func, funcName) => {
            if (_.isFunction(func) === true) {
              require.cache[v.path].exports[funcName] = func.bind(
                bindCommand
              );
            }
          });
        } catch (e) {
          reject(e);
        }
      });
      resolve(true);
    } catch (e) {
      reject(e);
    }
  });
};
