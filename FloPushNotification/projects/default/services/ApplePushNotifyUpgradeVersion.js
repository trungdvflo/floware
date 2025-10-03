/* eslint-disable no-console */
const apn = require('apn');
const EventEmitter = require('events');
const Utils = require('../utilities/Utils');

const KEY_PATH = process.env.PUSH_NOTIFY_KEY_PATH;

module.exports = {
    UpgradeVersion: async (payload, deviceToken, keyMaps = 40, bundleId, Graylog) => {
        try {
            const FULL_KEY_PATH = `${KEY_PATH}${keyMaps}.pem`;
          
            const production = (keyMaps % 2 === 0);
            const options = {
                cert: FULL_KEY_PATH,                 
                key: FULL_KEY_PATH,  
                production            
            };
        
            const apnProvider = new apn.Provider(options);
            const notiMessage = new apn.Notification();
            const category = 'FLOWARE_UPGRADE_VERSION_INFO';
            const sound = 'default';
            notiMessage.expiry = Math.floor(Date.now() / 1000) + 3600; // Expires 1 hour from now.
            notiMessage.sound = sound;
            notiMessage.category = category;

            const alert = {
                title: Utils.SubString(Utils.FromConvertUTF8ToStrings(payload.title), 128),
                body: Utils.SubString(payload.body, 512)
            };
            notiMessage.alert = alert;

            notiMessage.payload = {
                from: 'node-apn'
            };
            notiMessage.topic = bundleId;
            const emitter = new EventEmitter();
            emitter.setMaxListeners(0);
            const result = await apnProvider.send(notiMessage, deviceToken);
    
            Graylog.SendLog('APN Flomail Upgrade Info', {
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
        } catch (error) {
            return false;
        }
    }
};
