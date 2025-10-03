/* eslint-disable no-console */
/**
 * Author: DuocNT
 * Ticket: https://www.pivotaltracker.com/story/show/171592244 
 */
const { Consumer } = require('sqs-consumer');
const _ = require('lodash');
const AsyncForEach = require('await-async-foreach');
const stripHtml = require('string-strip-html');

const AwsSystemParameterStore = require('../system/AwsSystemParameterStore');

(async () => {
    try {
        await AwsSystemParameterStore.Init();

        // eslint-disable-next-line no-console
        console.log('** Start worker of Aws DOVECOT_NEW_MAIL... ');

        const AwsConstant = require('./supports/AwsConstant');
        const ApplePushNotifyFloMail = require('../projects/default/services/ApplePushNotifyFloMail');
        const Graylog = require('./supports/utilities/GrayLog');

        const accountId = AwsConstant.ACCOUNT_ID;
        const queueName = AwsConstant.DOVECOT_NEW_MAIL || 'dovecot_newmail_local';
        const Model = require('./supports/model');
        const GetMessagesID = require('./supports/utilities/Imap');
        const Utils = require('./supports/utilities/Accounts');

        const app = Consumer.create({
            queueUrl: `https://sqs.${AwsConstant.REGION}.amazonaws.com/${accountId}/${queueName}`,
            handleMessage: async (message) => {
                const messageObject = JSON.parse(message.Body);

                if (messageObject.event_name === 'MessageNew' || messageObject.event_name === 'MessageAppend') {
                    const userInfo = await Model.users.findOne({
                        where: { email: messageObject.user },
                        raw: true
                    });
                    if (_.isNull(userInfo)) {
                        console.log('User does not exist ');
                        return false;
                    }

                    const deviceToken = await Model.device_token.findAll({
                        where: { user_id: userInfo.id },
                        raw: true
                    });
                    const devicePush = {};
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
                        devicePush[`${userInfo.id}`] = listDevices;
                    }
                    const password = Utils.DecryptStringWithRsaPrivateKey(userInfo.rsa);
                    const messsageIdEmail = password !== false ? await GetMessagesID(messageObject.user, password, messageObject.uid) : false;

                    let snippet = '';
                    if (messageObject.snippet) {
                        snippet = stripHtml(messageObject.snippet).result;
                        // remove spaces
                        snippet = snippet.replace(/\s\s+/g, '');
                        // remove link http
                        snippet = snippet.replace(/\((http(s)?:\/\/.)?(www\.)?[-a-zA-Z0-9@:%._\\+~#=]{2,256}\.[a-z]{2,6}\b([-a-zA-Z0-9@:%_\\+.~#?&//=]*)\)/g, '');
                        snippet = snippet.replace(/<(http(s)?:\/\/.)?(www\.)?[-a-zA-Z0-9@:%._\\+~#=]{2,256}\.[a-z]{2,6}\b([-a-zA-Z0-9@:%_\\+.~#?&//=]*)>/g, '');
                        // remove comments
                        snippet = snippet.replace(/\/\*[\s\S]*?\*\/|([^\\:]|^)\/\/.*$/gm, '');
                        snippet = snippet.replace(/>/g, '');
                    }

                    const emailInfo = {
                        from: messageObject.from,
                        subject: messageObject.subject,
                        snippet,
                        uid: messageObject.uid,
                        messageID: messsageIdEmail || `${messageObject.uid}`,
                        folderName: messageObject.folder || 'INBOX',
                    };
                    await AsyncForEach(devicePush, async (i) => {
                        _.forEach(AwsConstant.KEY_MAP_PUSH_NOTIFY, (x, y) => {
                            if (i[y]) {
                                ApplePushNotifyFloMail.ApnFloMail(
                                    messageObject.user,
                                    emailInfo,
                                    i[y],
                                    y,
                                    x,
                                    Graylog
                                );
                                // eslint-disable-next-line no-console
                                console.log('** Push Success', messageObject.user);
                            }
                        });
                    });
                    messageObject.snippet = 'snippet';
                    Graylog.SendLog('Flomail Push Success: AwsDovecotNewEmail', {
                        messageObject,
                        devicePush
                    });
                }
                return true;
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
