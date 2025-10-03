const { Consumer } = require('sqs-consumer');
const _ = require('lodash');
const AsyncForEach = require('await-async-foreach');

const AwsSystemParameterStore = require('../system/AwsSystemParameterStore');

(async () => {
    try {
        await AwsSystemParameterStore.Init();

        // eslint-disable-next-line no-console
        console.log('** Start worker of Aws Handel Push Notify Gmail... ');

        const AwsConstant = require('./supports/AwsConstant');
        const Utils = require('../projects/default/utilities/Utils');
        const GmailApi = require('../projects/default/services/GmailApi');
        const ApplePushNotify = require('../projects/default/services/ApplePushNotify');
        const Graylog = require('./supports/utilities/GrayLog');

        const accountId = AwsConstant.ACCOUNT_ID;
        const queueName = AwsConstant.HANDLE_WEBHOOK_GMAIL;
        const Model = require('./supports/model');

        const app = Consumer.create({
            queueUrl: `https://sqs.${AwsConstant.REGION}.amazonaws.com/${accountId}/${queueName}`,
            handleMessage: async (message) => {
                const messageBody = JSON.parse(message.Body);
                const messageObj = JSON.parse(messageBody);
                const gmail = messageObj.emailAddress;
                const oldHistoryId = await Model.gmail_historys.findOne({
                    where: {
                        gmail
                    },
                    raw: true
                });
                if (_.isUndefined(oldHistoryId) || oldHistoryId.history_id >= messageObj.historyId) {
                    return false;
                }

                // Check setting  setAccount  3rdParty & getting list DeviceToken 
                const setAccounts = await Model.set_accounts.findAll({
                    where: {
                        user_income: gmail,
                        server_income: 'imap.gmail.com'
                    },
                    raw: true
                });
                const devicePush = {};
                if (setAccounts.length > 0) {
                    await AsyncForEach(setAccounts, async (item) => {
                        const listAc = await Model.gmail_accesstokens.findAll({
                            where: {
                                user_id: item.user_id,
                                gmail
                            },
                            raw: true
                        });

                        const listDeviceId = listAc.map((i) => {
                            return i.device_token;
                        });

                        const deviceToken = await Model.device_token.findAll({
                            where: { device_token: listDeviceId },
                            raw: true
                        });
                        if (deviceToken.length > 0) {
                            const listDevices = {};
                            deviceToken.map((i) => {
                                listDevices[`${i.device_type}${i.cert_env}`] = [];
                                return null;
                            });
                            deviceToken.map((i) => {
                                listDevices[`${i.device_type}${i.cert_env}`].push(i.device_token);
                                return null;
                            });
                            devicePush[`${item.id}`] = listDevices;
                        }
                    });
                }

                // Handel get Email info form Gmail server & send Push notification
                const accessTokenInfo = await Model.gmail_accesstokens.findAll({
                    where: {
                        gmail
                    },
                    limit: 1,
                    order: [['id', 'DESC']],
                    raw: true
                });
                if (accessTokenInfo.length > 0) {
                    // Decrypt AccessToken 
                    const decryptAccessToken = Utils.decryptAccessToken(accessTokenInfo[0].sub_key, accessTokenInfo[0].access_token, accessTokenInfo[0].refresh_token);

                    const objAccessToken = {
                        access_token: decryptAccessToken.accessToken,
                        refresh_token: decryptAccessToken.refreshToken,
                        scope: accessTokenInfo[0].scope,
                        token_type: accessTokenInfo[0].token_type,
                        expiry_date: accessTokenInfo[0].expiry_date
                    };
                    GmailApi.SetAccessToken(objAccessToken);
                    const history = await GmailApi.History(oldHistoryId.history_id);
                    let messageInfo = false;
                    if (typeof history === 'object') {
                        history.map((i) => {
                            if (i.messagesAdded) {
                                messageInfo = i.messagesAdded[0].message;
                                const { labelIds } = messageInfo;
                                const inbox = _.findIndex(labelIds, (j) => {
                                    return j === 'INBOX';
                                });
                                if (inbox === -1) messageInfo = false;
                            }
                            return null;
                        });
                    }
                    if (messageInfo) {
                        const emailInfo = await GmailApi.GetMessages(messageInfo.id);
                        if (emailInfo) {
                            if (emailInfo.uid === oldHistoryId.email_id) {
                                Graylog.SendLog('[Duplicate EmailID] Aws Handel Gmail Push Notify', {
                                    messageObj,
                                    devicePush,
                                    emailId: emailInfo.uid
                                });
                                return null;
                            }
                            // Update HistoryID
                            const args = {
                                history_id: messageObj.historyId,
                                email_id: emailInfo.uid,
                                updated_date: Utils.Timestamp()
                            };
                            await Model.gmail_historys.update(args, {
                                where: {
                                    gmail
                                },
                                silent: true
                            });
                            await AsyncForEach(devicePush, async (i, j) => {
                                emailInfo.setAccountId = j;
                                _.forEach(AwsConstant.KEY_MAP_PUSH_NOTIFY, (x, y) => {
                                    if (i[y]) {
                                        ApplePushNotify.Apn(
                                            gmail,
                                            emailInfo,
                                            i[y],
                                            y,
                                            x,
                                            Graylog
                                        );
                                        // eslint-disable-next-line no-console
                                        console.log('** Push Success', gmail);
                                    }
                                });
                            });
                            Graylog.SendLog('Aws Handel Gmail Push Notify', {
                                messageObj,
                                devicePush,
                                emailId: emailInfo.uid
                            });
                        }
                    }
                }
                return null;
            }
        });

        app.on('error', (err) => {
            // eslint-disable-next-line no-console
            console.error(err.message);
        });

        app.on('processing_error', (err) => {
            // eslint-disable-next-line no-console
            console.error(err.message);
        });

        app.start();
    } catch (error) {
        // eslint-disable-next-line no-console
        console.log(error);
    }
})();
