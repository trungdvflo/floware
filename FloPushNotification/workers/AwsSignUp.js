/* eslint-disable no-console */
const _ = require('lodash');
const { Consumer } = require('sqs-consumer');
const AwsSystemParameterStore = require('../system/AwsSystemParameterStore');

const replaceErrors = (key, value) => {
    if (value instanceof Error) {
        const error = {};
        Object.getOwnPropertyNames(value).forEach((k) => {
            error[k] = value[k];
        });
        return error;
    }
    return value;
};

const modifyData = async (user, opts, Model, Graylog) => {
    try {
        const Accounts = require('./supports/utilities/Accounts');
        const t = await Model.users.sequelize.transaction();
        try {
            // #generate principal
            const principalStatus = await Accounts.CreatePrincipal(user, Model, t);
            if (principalStatus.code === 0) {
                await t.rollback();
                return {
                    code: 0,
                    message: principalStatus.message
                };
            }

            // #generate url bookmark
            const urlBookmarkDataStatus = await Accounts.GenerateUrlBookmarkData(user, Model, t);
            if (urlBookmarkDataStatus.code === 0) {
                await t.rollback();
                return {
                    code: 0,
                    message: urlBookmarkDataStatus.message
                };
            }

            // #generate address book
            const addressbookDataStatus = await Accounts.GenerateAddressbookData(user, Model, t);
            if (addressbookDataStatus.code === 0) {
                await t.rollback();
                return {
                    code: 0,
                    message: addressbookDataStatus.message
                };
            }

            // #generate virtual alias
            const virtualAliasStatus = await Accounts.GenerateVirtualAlias(user, opts, Model, t);
            if (virtualAliasStatus.code === 0) {
                await t.rollback();
                return {
                    code: 0,
                    message: virtualAliasStatus.message
                };
            }

            // #auto upgrade account for beta user
            const upgradePreYearlyStatus = await Accounts.AutoUpgradePreYearly(user, Model, t);
            if (upgradePreYearlyStatus.code === 0) {
                await t.rollback();
                return {
                    code: 0,
                    message: upgradePreYearlyStatus.message
                };
            }

            await t.commit();
            return {
                code: 1,
                email: user.email,
                message: 'Create user success'
            };
        } catch (error) {
            console.log('error', JSON.stringify(error, replaceErrors));
            await t.rollback();
            throw error;
        }
    } catch (error) {
        console.log('error', JSON.stringify(error, replaceErrors));
        Graylog.SendLog('Worker Signup Error modifyData', {
            error
        });
        throw error;
    }
};

const QueueHandle = async (message, Model, Graylog) => {
    try {
        if (_.isEmpty(message) === true) {
            return false;
        }
        const resultSignup = await modifyData(message.user, message.opts, Model, Graylog);
        Graylog.SendLog('Worker Signup', {
            message,
            resultSignup
        });
        return true;
    } catch (error) {
        console.log('error', JSON.stringify(error, replaceErrors));
        Graylog.SendLog('Worker Signup Error QueueHandle', {
            error
        });
        throw error;
    }
};

(async () => {
    try {
        await AwsSystemParameterStore.Init();
        console.log('** Start worker of AWS SIGNUP');
        const AwsConstant = require('./supports/AwsConstant');
        const accountId = AwsConstant.ACCOUNT_ID;
        const queueName = AwsConstant.AWS_SQS_SIGNUP_QUEUE_NAME;
        const Graylog = require('./supports/utilities/GrayLog');

        const Model = require('./supports/model');
        const app = Consumer.create({
            queueUrl: `https://sqs.${AwsConstant.REGION}.amazonaws.com/${accountId}/${queueName}`,
            handleMessage: async (message) => {
                const body = JSON.parse(message.Body);
                const user = await Model.users.findOne({
                    where: { email: body.email },
                    raw: true
                });
                if (_.isEmpty(user) === false) {
                    await QueueHandle({
                        user,
                        opts: body.opts
                    }, Model, Graylog);
                }
            }
        });

        app.on('error', async (err) => {
            // eslint-disable-next-line no-console
            console.error(err.message);
        });

        app.on('processing_error', (err) => {
            // eslint-disable-next-line no-console
            console.error(err.message);
        });

        app.start();
    } catch (error) {
        console.log('error', JSON.stringify(error, replaceErrors));
    }
})();

