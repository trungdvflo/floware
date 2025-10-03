/* eslint-disable no-console */
const apn = require('apn');
const Utils = require('../utilities/Utils');
const AppsConstant = require('../constants/AppsConstant');
const { getProviderInstance } = require('./APNsProvider');

module.exports = {
  ApnFloMail: async (emailTo, payload, deviceToken, keyMaps = 40, bundleId, Graylog) => {
    try {
      const apnProvider = getProviderInstance(keyMaps);
      const notiMessage = new apn.Notification();
      const sound = AppsConstant.APN_FLO_MAIL.SOUND;
      const category = AppsConstant.APN_FLO_MAIL.CATEGORY;

      notiMessage.expiry = Math.floor(Date.now() / 1000) + 3600; // Expires 1 hour from now.
      // notiMessage.badge = 3;
      notiMessage.sound = sound;
      notiMessage.category = category;

      payload.from = Utils.FromConvertUTF8ToStrings(payload.from);
      const title = Utils.SubString(Utils.replaceAll(payload.from, '"', ''), 131);
      const alert = {
        title,
        subtitle: Utils.SubString(Utils.FromConvertUTF8ToStrings(payload.subject), 131),
        body: payload.snippet,
        messageID: payload.messageID,
        uid: payload.uid,
        email: emailTo,
        folder: payload.folderName,
        from: payload.from,
        to: '',
        toTotal: 0,
        dateSent: payload.dateSent,
      };
      // limit 4KB
      const limitBytes = AppsConstant.APN_FLO_MAIL.LIMIT_BYTES;
      const alertJSON = JSON.stringify(alert);
      let toBytes = limitBytes - Utils.CountUtf8Bytes(alertJSON);

      const parseTo = Utils.ParseToAddress(payload.to
        , AppsConstant.APN_FLO_MAIL.LIMIT_NUM_RECIPIENTS, toBytes);
      alert.toTotal = parseTo.total;
      alert.to = parseTo.listSt;

      notiMessage.alert = alert;
      notiMessage.payload = {
        from: AppsConstant.APN_FLO_MAIL.FROM
      };
      notiMessage.topic = bundleId;
      const result = await apnProvider.send(notiMessage, deviceToken);

      Graylog.SendLog('APN Flomail Send Push', {
        // alert,
        // sound,
        // category,
        // result,
        // apnEnv: {
        //   production,
        //   keyMaps,
        //   bundleId
        // }
      });
      return result;
    } catch (error) {
      Graylog.SendLog('APN Flomail Error', {
        code: error.code,
        // message: error.message,
      });
    }
  }
};
