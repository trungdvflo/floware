/* eslint-disable no-console */
const apn = require('apn');
const _ = require('lodash');
const Utils = require('../utilities/Utils');
const Graylog = require('../../../workers/supports/utilities/GrayLog');
const { getProviderInstance } = require('./APNsProvider');

module.exports = {
  ApnSilentPush: async (deviceToken, keyMaps = 40, bundleId, data, showAlert = true) => {
    const apnProvider = getProviderInstance(keyMaps);
    const notiMessage = new apn.Notification();

    notiMessage.expiry = Math.floor(Date.now() / 1000) + 3600; // Expires 1 hour from now.
    // notiMessage.badge = 1;
    const alert = {
      body: JSON.stringify(data),
      title: `${keyMaps} ${bundleId} PushChange ${Utils.Timestamp()}`
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
    notiMessage.aps['sound'] = '';
    if (showAlert) {
      data = _.map(data, (item) => {
        return item.join(' - ');
      });
    } else {
      data = _.map(data, (item) => {
        return _.isEmpty(item[0]) ? null : item[0];
      });
    }
    notiMessage.aps.data = data;
    notiMessage.aps.category = 'FLOWARE_LAST_MODIFIED';
    notiMessage.aps.priority = 'high';

    const result = await apnProvider.send(notiMessage, deviceToken);
    // alert.body = 'snippet';
    Graylog.SendLog('APN Silent Push', {
      // notiMessage,
      // apnEnv: {
      //   production,
      //   keyMaps,
      //   bundleId
      // }
    });
    return result;
  }
};
