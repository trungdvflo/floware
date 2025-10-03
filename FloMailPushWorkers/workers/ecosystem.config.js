const env = {
  NODE_ENV: 'production',
  AWS_SSM_NAME: process.env.AWS_SSM_NAME,
  AWS_REGION: process.env.AWS_REGION,
  AWS_ACCOUNT_ID: process.env.AWS_ACCOUNT_ID,
  AWS_API_VERSION: process.env.AWS_API_VERSION
};

module.exports = {
  apps: [{
    name: 'Aws_Dovecot_New_Email',
    script: `${__dirname}/AwsDovecotNewEmail.js`,
    watch: true,
    env_production: env
  }, {
    name: 'Aws_SilentPush',
    script: `${__dirname}/AwsSilentPush.js`,
    watch: true,
    env_production: env
  // Remove (feature not work)
  // }, {
  //   name: 'Cron_DeleteDeviceToken',
  //   script: `${__dirname}/CronDeleteDeviceToken.js`,
  //   watch: true,
  //   env_production: env
  }, {
    name: 'Cron_SilentPush',
    script: `${__dirname}/CronSilentPush.js`,
    watch: true,
    env_production: env
  }]
};
