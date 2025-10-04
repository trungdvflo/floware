const _ = require('lodash');
const Fse = require('fs-extra');
const AwsSecretsManager = require('./system/AWS/SecretsManager');
const AwsSystemParameterStore = require('./system/AWS/SystemParameterStore');
const System = require('./system/System');
const RedisConnection = require('./system/RedisConnection');

(async () => {
  const AWS_SSM_NAME = _.get(process.env, 'AWS_SSM_NAME', false);
  const AWS_SM_NAME = _.get(process.env, 'AWS_SM_NAME', false);
  if (_.isEmpty(AWS_SSM_NAME) === false) {
    await AwsSystemParameterStore.Init();
  } else if (_.isEmpty(AWS_SM_NAME) === false) {
    await AwsSecretsManager.Init();
  } else {
    require('dotenv').config();
  }
  if (process.env.RSA_PRIVATE_KEY_PATH) {
    process.env.RSA_PRIVATE_KEY = Fse.readFileSync(process.env.RSA_PRIVATE_KEY_PATH, 'utf8');
  }
  await System.Start();
})();