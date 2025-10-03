/* eslint-disable no-useless-catch */
/* eslint-disable no-console */
const _ = require('lodash');
const AwsSystemParameterStore = require('./system/AWS/SystemParameterStore');
const System = require('./system/System');

(async () => {
  try {
    const AWS_SSM_NAME = _.get(process.env, 'AWS_SSM_NAME', false);
    if (_.isEmpty(AWS_SSM_NAME) === false) {
      await AwsSystemParameterStore.Init();
    } else {
      require('dotenv').config();
    }

    await System.Start();
  } catch (error) {
    throw error;
  }
})();

