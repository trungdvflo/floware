// Load the AWS SDK
const {
  SSMClient,
  GetParameterCommand
} = require('@aws-sdk/client-ssm');
const _ = require('lodash');

const region = _.get(process.env, 'AWS_REGION', 'ap-southeast-1');
const ssm = new SSMClient({
  region,
  apiVersion: '2014-11-06'
});

const command = new GetParameterCommand({
  Name: process.env.AWS_SSM_NAME,
  WithDecryption: true
});

module.exports.Init = async () => {
  const data = await ssm.send(command);
  if (data.Parameter) {
    const parameter = JSON.parse((data.Parameter || {}).Value || '{}');
    _.forEach(parameter, (value, key) => {
      process.env[key] = value;
    });
    return true;
  }
  return false;
};

