/* eslint-disable no-console */
const apn = require('apn');
const EventEmitter = require('events');
const Utils = require('../utilities/Utils');

const KEY_PATH = process.env.PUSH_NOTIFY_KEY_PATH || '/opt/flo_apns_certificates/';

module.exports = {
    ApnFloMail: async (emailTo, payload, deviceToken, keyMaps = 40, bundleId, Graylog) => {
        const FULL_KEY_PATH = `${KEY_PATH}${keyMaps}.pem`;
        const production = (keyMaps % 2 === 0);
        const options = {
            cert: FULL_KEY_PATH,                 
            key: FULL_KEY_PATH,  
            production            
        };
        const apnProvider = new apn.Provider(options);
        const notiMessage = new apn.Notification();
        const sound = 'default';
        const category = 'FLOWARE_NEW_INCOMMING_MESSAGE';

        notiMessage.expiry = Math.floor(Date.now() / 1000) + 3600; // Expires 1 hour from now.
        // notiMessage.badge = 3;
        notiMessage.sound = sound;
        notiMessage.category = category;

        const alert = {
            title: Utils.SubString(Utils.FromConvertUTF8ToStrings(payload.from), 128),
            subtitle: Utils.SubString(payload.subject, 128),
            body: Utils.SubString(payload.snippet, 512),
            messageID: payload.messageID,
            uid: payload.uid,
            email: emailTo,
            folder: payload.folderName
        };
        notiMessage.alert = alert;

        notiMessage.payload = {
            from: 'node-apn'
        };
        notiMessage.topic = bundleId;
        const emitter = new EventEmitter();
        emitter.setMaxListeners(0);
        const result = await apnProvider.send(notiMessage, deviceToken);

        alert.body = 'snippet';
        Graylog.SendLog('APN Flomail Send Push', {
            alert,
            sound,
            category,
            result,
            apnEnv: {
                production,
                keyMaps,
                bundleId
            }
        });
        return result;
    }
};
