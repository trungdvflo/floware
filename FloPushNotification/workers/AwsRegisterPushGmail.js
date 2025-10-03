/* eslint-disable no-console */
const { Consumer } = require('sqs-consumer');

const AwsSystemParameterStore = require('../system/AwsSystemParameterStore');

(async () => {
    try {
        await AwsSystemParameterStore.Init();

        // Start Worker
        console.log('** Start worker of AWS REGISTER_PUSH_GMAIL... ');

        const AwsConstant = require('./supports/AwsConstant');
        const GmailApi = require('../projects/default/services/GmailApi');
        const Utils = require('../projects/default/utilities/Utils');
        const Graylog = require('./supports/utilities/GrayLog');

        const Model = require('./supports/model');

        const accountId = AwsConstant.ACCOUNT_ID;
        const queueName = AwsConstant.REGISTER_PUSH_GMAIL;

        const app = Consumer.create({
            queueUrl: `https://sqs.${AwsConstant.REGION}.amazonaws.com/${accountId}/${queueName}`,
            handleMessage: async (message) => {
                try {
                    const messageObj = JSON.parse(message.Body);
                    GmailApi.SetAccessToken(messageObj.accessToken);
                    const watch = await GmailApi.Watch();

                    if (watch !== false) {
                        const checkHistory = await Model.gmail_historys.findOne({
                            where: {
                                gmail: messageObj.gmail
                            },
                            raw: true
                        });
                        if (checkHistory) {
                            const args = {
                                history_id: watch.historyId,
                                expiration: watch.expiration,
                                updated_date: Utils.Timestamp(),
                                watch_expired: watch.expiration
                            };
                            await Model.gmail_historys.update(args, {
                                where: {
                                    gmail: messageObj.gmail
                                },
                                silent: true
                            });
                        } else {
                            await Model.gmail_historys.create({
                                gmail: messageObj.gmail,
                                history_id: watch.historyId,
                                expiration: watch.expiration,
                                created_date: Utils.Timestamp(),
                                watch_expired: watch.expiration
                            });
                        }
                        const args = {
                            status: '1',
                            updated_date: Utils.Timestamp()
                        };
                        await Model.gmail_accesstokens.update(args, {
                            where: {
                                gmail: messageObj.gmail,
                                status: '0'
                            },
                            silent: true
                        });
                        // eslint-disable-next-line no-console
                        console.log('Register Push OK', messageObj.gmail);
                        Graylog.SendLog('Register Push Gmail', {
                            messageObj,
                            watch
                        });
                    }
                } catch (error) {
                    throw error;
                }
            }
        });

        app.on('error', (err) => {
            console.error(err.message);
        });

        app.on('processing_error', (err) => {
            console.error(err.message);
        });

        app.start();
    } catch (error) {
        console.log(error);
    }
})();
