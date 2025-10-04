// Load the AWS SDK
const _ = require('lodash');
const AWS = require('aws-sdk');

const region = _.get(process.env, 'AWS_REGION', 'ap-southeast-1');
const Name = process.env.AWS_SSM_NAME;
const ssm = new AWS.SSM({
  region,
  apiVersion: '2014-11-06'
});

const params = {
  Name,
  WithDecryption: true
};

module.exports.Init = () => {
  return new Promise((resolve, reject) => {
    ssm.getParameter(params, (err, data) => {
      if (err) {
        reject(_.get(err, 'stack', 'Load System Parameter Store fail'));
      } else {
        const parameter = JSON.parse(_.get(data.Parameter, 'Value', '{}'));
        _.forEach(parameter, (item, key) => {
          if (_.isUndefined(process.env[key]) === true) {
            process.env[key] = item;
          }
        });
        resolve(true);
      }
    });
  });
};
