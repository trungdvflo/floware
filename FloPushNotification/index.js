/* eslint-disable no-console */
const _ = require('lodash');
const AwsSecretsManager = require('./system/AwsSecretsManager');
const AwsSystemParameterStore = require('./system/AwsSystemParameterStore');
const System = require('./system/System');

(async () => {
    try {
        const AWS_SSM_NAME = _.get(process.env, 'AWS_SSM_NAME', false);
        const AWS_SM_NAME = _.get(process.env, 'AWS_SM_NAME', false);
        if (_.isEmpty(AWS_SSM_NAME) === false) {
            await AwsSystemParameterStore.Init();
        } else if (_.isEmpty(AWS_SM_NAME) === false) {
            await AwsSecretsManager.Init();
        }
        await System.Start();
    } catch (error) {
        console.log(error);
    }
})();

