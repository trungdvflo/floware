/* eslint-disable no-console */
const apn = require('apn');
const Utils = require('../utilities/Utils');
const AwsSqsQueue = require('./Queues/AwsSqsQueue');
const { getProviderInstance } = require('./APNsProvider');

const { AWS_GMAIL_TO_DOMAIL_QUEUE } = process.env;



module.exports = {
    Apn: async (emailTo, payload, deviceToken, keyMaps = 40, bundleId, Graylog) => {
        const apnProvider = getProviderInstance(keyMaps);
        const notiMessage = new apn.Notification();

        notiMessage.expiry = Math.floor(Date.now() / 1000) + 3600; // Expires 1 hour from now.
        // notiMessage.badge = 3;
        notiMessage.sound = 'default';
        notiMessage.category = 'FLOWARE_NEW_GMAIL_INCOMING_MESSAGE';

        const alert = {
            title: Utils.SubString(Utils.FromConvertUTF8ToStrings(payload.from), 128),
            subtitle: Utils.SubString(payload.subject, 128),
            body: Utils.SubString(payload.snippet, 512),
            messageID: payload.messageId,
            email: emailTo,
            email_id: payload.uid,
            setAccID: payload.setAccountId,
            labelIds: payload.labelIds
        };
        notiMessage.alert = alert;
        notiMessage.payload = {
            from: 'node-apn'
        };
        notiMessage.topic = bundleId;
        const result = await apnProvider.send(notiMessage, deviceToken);

        const messageToDomail = {
            aps: {
                alert,
                sound: notiMessage.sound,
                category: notiMessage.category
            }
        };

        // alert.body = 'snippet';
        Graylog.SendLog('APN Gmail Send Push', {
            // alert,
            // category: 'FLOWARE_NEW_GMAIL_INCOMING_MESSAGE',
            // sound: notiMessage.sound,
            // result,
            // apnEnv: {
            //     production,
            //     keyMaps,
            //     bundleId
            // }
        });
        // Send message to Queue of Domail
        AwsSqsQueue(AWS_GMAIL_TO_DOMAIL_QUEUE, messageToDomail, true);
        return result;
    }
};
