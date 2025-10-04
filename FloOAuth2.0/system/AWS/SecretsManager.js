// Load the AWS SDK
const _ = require('lodash');
const AWS = require('aws-sdk');

const region = _.get(process.env, 'AWS_REGION', 'us-east-1');
const secretName = process.env.AWS_SM_NAME;
let secret;

// Create a Secrets Manager client
const client = new AWS.SecretsManager({
  region
});
module.exports.Init = () => {
  return new Promise((resolve, reject) => {
    client.getSecretValue({
      SecretId: secretName
    }, (err, data) => {
      if (err) {
        let { message } = err;
        if (err.code === 'ResourceNotFoundException') {
          message = `The requested secret ${secretName} was not found`;
        } else if (err.code === 'InvalidRequestException') {
          message = `The request was invalid due to: ${err.message}`;
        } else if (err.code === 'InvalidParameterException') {
          message = `The request had invalid params: ${err.message}`;
        }
        reject(message);
      } else {
        // eslint-disable-next-line no-lonely-if
        if (data.SecretString !== '') {
          secret = JSON.parse(data.SecretString);
          _.forEach(secret, (item, key) => {
            if (_.isUndefined(process.env[key]) === true) {
              process.env[key] = item;
            }
          });
          resolve(secret);
        } else {
          // eslint-disable-next-line prefer-promise-reject-errors
          reject('SecretString does not exist');
        }
      }
    });
  });
};

