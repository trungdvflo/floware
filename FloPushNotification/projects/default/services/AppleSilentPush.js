/* eslint-disable no-console */
const apn = require('apn');
const Utils = require('../utilities/Utils');

const KEY_PATH = process.env.PUSH_NOTIFY_KEY_PATH;

module.exports = {
    ApnSilentPush: async (deviceToken, keyMaps = 40, bundleId, Graylog, showAlert = false) => {
        const FULL_KEY_PATH = `${KEY_PATH}${keyMaps}.pem`;
          
        const production = (keyMaps % 2 === 0);
        const options = {
            cert: FULL_KEY_PATH,                 
            key: FULL_KEY_PATH,  
            production            
        };
        
        const apnProvider = new apn.Provider(options);
        const notiMessage = new apn.Notification();
    
        notiMessage.expiry = Math.floor(Date.now() / 1000) + 3600; // Expires 1 hour from now.
        // notiMessage.badge = 1;
        const alert = {
            body: 'Silent Push Notification',
            title: `${keyMaps} ${bundleId} ${Utils.Timestamp()}`
        };
        if (showAlert === true) {
            notiMessage.sound = 'default';
            notiMessage.alert = alert;
        }

        notiMessage.payload = { 
            from: 'node-apn'
        };
        
        notiMessage.topic = bundleId;
        notiMessage.aps['content-available'] = 1;
        
        const result = await apnProvider.send(notiMessage, deviceToken);
        alert.body = 'snippet';
        Graylog.SendLog('APN Silent Push', {
            notiMessage,
            apnEnv: {
                production,
                keyMaps,
                bundleId
            }
        });
        return result;
    }
};
