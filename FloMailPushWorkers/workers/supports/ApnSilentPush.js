const _ = require('lodash');
const AsyncForEach = require('await-async-foreach');

const AwsConstant = require('./AwsConstant');
const Graylog = require('./utilities/GrayLog');
const AppleSilentPush = require('../../projects/default/services/AppleSilentPush');
const Model = require('./model');
const Utils = require('../../projects/default/utilities/Utils');
const AppConstant = require('./AppConstant');

const keyMapsPushNoti = AwsConstant.KEY_MAP_PUSH_NOTIFY;

const ApnSendQueue = async (messageObj) => {
  try {
    await AsyncForEach(keyMapsPushNoti, async (bundleId, key) => {
      if (!_.isUndefined(messageObj[key])) {
        const listDevices = messageObj[key];
        const argsUpdate = {
          time_sent_silent: Utils.Timestamp()
        };
        Model.device_token.update(argsUpdate, {
          where: {
            device_token: listDevices,
            cert_env: AppConstant.PUSH_NOTIFY_MAIL_OR_SILENT_CERT_ENV
          }
        });
        const showAlert = messageObj.showAlert;
        await AppleSilentPush.ApnSilentPush(listDevices, key, bundleId, showAlert);
      }
    });
  } catch (error) {
    console.log(error);
    Graylog.SendLog('Apn Send Queue error', {
      error
    });
  }
}

module.exports = {
  ApnSendQueue
};