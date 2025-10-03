const { SSM } = require("@aws-sdk/client-ssm");

module.exports.init = (SSM_NAME, AWS_REGION, ENV) => {
  try {
    const ssm = new SSM({
      region: AWS_REGION || 'ap-southeast-1',
      apiVersion: '2014-11-06'
    });

    return new Promise((resolve, reject) => {
      ssm.getParameter({
        Name: SSM_NAME,
        WithDecryption: true
      }, (err, data) => {
        if (err) {
          reject(err.stack || 'Load System Parameter Store fail');
        } else {
          const parameters = JSON.parse(data.Parameter.Value || '{}');
          if (!parameters) {
            process.exit(1);
          }
          Object.keys(parameters).forEach((key) => {
            const envKey = `${ENV}_${key}`
            if (!process.env[envKey]) {
              process.env[envKey] = parameters[key];
            }
          });
          resolve(true);
        }
      });
    });
  } catch (e) {
    alog.error('SSM::init::ERROR', e);
    process.exit(1);
  }
};
