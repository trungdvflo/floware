/* eslint-disable no-console */
const _ = require('lodash');
const AwsSystemParameterStore = require('./system/AWS/SystemParameterStore');

(async () => {
  try {
    const AWS_SSM_NAME = _.get(process.env, 'AWS_SSM_NAME', false);
    if (_.isEmpty(AWS_SSM_NAME) === false) {
      console.log('init SSM');
      await AwsSystemParameterStore.Init();
    } else {
      require('dotenv').config();
    }
    await require('./system/System').Start();
  } catch (error) {
    console.log(error);
  }
})();

