/* eslint-disable no-console */
const apn = require('apn');
const Utils = require('../utilities/Utils');
const Graylog = require('../../../workers/supports/utilities/GrayLog');
const { getProviderInstance } = require('./APNsProvider');

module.exports = {
  ApnSilentPush: async (deviceToken, keyMaps, bundleId, showAlert) => {
    const apnProvider = getProviderInstance(keyMaps);
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
    } else {
      notiMessage.sound = '';
    }

    notiMessage.payload = {
      from: 'node-apn'
    };
    notiMessage.contentAvailable = 1;
    notiMessage.topic = bundleId;

    const result = await apnProvider.send(notiMessage, deviceToken);

    Graylog.SendLog('APN Silent Push', {
      // notiMessage,
      // result,
      // apnEnv: {
      //   keyMaps,
      //   bundleId
      // }
    });
    return result;
  }
};
