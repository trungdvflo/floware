const env = {
    NODE_ENV: 'production',
    AWS_SM_NAME: process.env.AWS_SM_NAME,
    AWS_SSM_NAME: process.env.AWS_SSM_NAME,
    AWS_REGION: process.env.AWS_REGION,
    AWS_ACCOUNT_ID: process.env.AWS_ACCOUNT_ID,
    AWS_API_VERSION: process.env.AWS_API_VERSION
};

module.exports = {
    apps: [{
        name: 'all_worker',
        script: `${__dirname}/index.js`,
        watch: true,
        env_production: env
    }, {
        name: 'Aws_Dovecot_New_Email',
        script: `${__dirname}/AwsDovecotNewEmail.js`,
        watch: true,
        env_production: env
    }, {
        name: 'Aws_Register_Push_Gmail',
        script: `${__dirname}/AwsRegisterPushGmail.js`,
        watch: true,
        env_production: env
    }, {
        name: 'Aws_Auto_Watch_Gmail',
        script: `${__dirname}/AwsAutoWatchGmail.js`,
        watch: true,
        env_production: env
    }, {
        name: 'Aws_Handel_Push_Notify_Gmail',
        script: `${__dirname}/AwsHandelPushNotifyGmail.js`,
        watch: true,
        env_production: env
    }, {
        name: 'Aws_SortOrderNumber',
        script: `${__dirname}/AwsSortOrderNumber.js`,
        watch: true,
        env_production: env
    }, {
        name: 'Aws_BinLog',
        script: `${__dirname}/AwsBinLog.js`,
        watch: true,
        env_production: env
    }, {
        name: 'Aws_SilentPush',
        script: `${__dirname}/AwsSilentPush.js`,
        watch: true,
        env_production: env
    }, {
        name: 'Aws_PushChange',
        script: `${__dirname}/PushChange.js`,
        watch: true,
        env_production: env
    }, {
        name: 'Aws_EndOfLifePushNotification',
        script: `${__dirname}/AwsEndOfLifePushNotification.js`,
        watch: true,
        env_production: env
    }, {
        name: 'Cron_CleanUserData',
        script: `${__dirname}/CronCleanUserData.js`,
        watch: true,
        env_production: env
    }]
};

