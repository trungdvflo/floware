/* eslint-disable no-console */
const { Consumer } = require('sqs-consumer');
const _ = require('lodash');
const AsyncForEach = require('await-async-foreach');
const AwsSystemParameterStore = require('../system/AwsSystemParameterStore');

(async () => {
  try {
    await AwsSystemParameterStore.Init();
    const AwsConstant = require('./supports/AwsConstant');
    const Graylog = require('./supports/utilities/GrayLog');
    const AppleSilentPush = require('../projects/default/services/AppleSilentPush');
    const Model = require('./supports/model');
    const Utils = require('../projects/default/utilities/Utils');
    const AppConstant = require('./supports/AppConstant');

    const keyMapsPushNoti = AwsConstant.KEY_MAP_PUSH_NOTIFY;
    const app = Consumer.create({
      queueUrl: AwsConstant.SILENT_PUSH_QUEUE,
      handleMessage: async (message) => {
        try {
          const messageObj = JSON.parse(message.Body);
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
              const showAlert = !!messageObj.showAlert;
              await AppleSilentPush.ApnSilentPush(listDevices, key, bundleId, showAlert);
            }
          });
        } catch (error) {
          console.log(error);
        }
      }
    });

    app.on('error', (err) => {
      Graylog.SendLog('Silent push consumer error', {
        err
      });
      console.error(err.message);
    });

    app.on('processing_error', (err) => {
      Graylog.SendLog('Silent push consumer processing error', {
        err
      });
      console.error(err.message);
    });

    app.on('timeout_error', (err) => {
      Graylog.SendLog('Silent push consumer timeout error', {
        err
      });
      console.error(err.message);
    });

    // Set max listener to avoid leak memory
    app.setMaxListeners(0);

    app.start();
  } catch (error) {
    console.log(error);
  }
})();
