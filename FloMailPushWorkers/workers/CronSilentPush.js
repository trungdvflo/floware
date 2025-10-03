/* eslint-disable no-console */
const _ = require('lodash');
const { CronJob } = require('cron');
const Sequelize = require('sequelize');
const { Op } = require('sequelize');
const AsyncForEach = require('await-async-foreach');
const AwsSystemParameterStore = require('../system/AwsSystemParameterStore');

const numberPart = 10;
const sleep = ms => new Promise(resolve => setTimeout(resolve, ms))

setTimeout(() => {
  console.log('[**] Start Crons: Collect Device Silent Push');
}, 1000);

(async () => {
  try {
    await AwsSystemParameterStore.Init();
    const Model = require('./supports/model');
    const { ApnSendQueue } = require('./supports/ApnSilentPush');
    const Graylog = require('./supports/utilities/GrayLog');
    const AppConstant = require('./supports/AppConstant');

    const configCronTime = await Model.config.findOne({
      attributes: ['value'],
      where: {
        group: 'silent_push',
        key: 'cron_time_silent_push'
      },
      raw: true
    });

    const cronTime = _.get(configCronTime, 'value.time', '*/5 * * * *');
    const CronSilentPush = new CronJob({
      cronTime,
      onTick: async () => {
        // # get config push silent
        const config = await Model.config.findOne({
          attributes: ['value'],
          where: {
            group: 'silent_push',
            key: 'config'
          },
          raw: true
        });
        Graylog.SendLog('Cron Collect Device Silent Push', {
          msg: 'config'
        });

        if (_.isEmpty(config) === true) {
          return;
        }

        // Count device 
        const countDevice = await Model.device_token.count({
          where: {
            [Op.and]: [
              Sequelize.where(Sequelize.literal('time_sent_silent - time_received_silent'), {
                [Op.lte]: config.value.interval_stop_push
              })
            ],
            cert_env: AppConstant.PUSH_NOTIFY_MAIL_OR_SILENT_CERT_ENV,
            status_app_run: 2
          },
          raw: true
        });
        const numberFor = Math.ceil(countDevice / numberPart);

        const arr1 = new Array(numberFor);
        let offsetQuery = 0;
        await AsyncForEach(arr1, async () => {
          // Get device token 
          const listDevice = await Model.device_token.findAll({
            attributes: [
              'id',
              'username',
              'env_silent',
              'device_token',
              'time_sent_silent',
              'time_received_silent',
              [Sequelize.literal('time_sent_silent - time_received_silent'), 'time_push'], 'device_type', 'cert_env'],
            where: {
              [Op.and]: [
                Sequelize.where(Sequelize.literal('time_sent_silent - time_received_silent'), {
                  [Op.lte]: config.value.interval_stop_push
                })
              ],
              cert_env: AppConstant.PUSH_NOTIFY_MAIL_OR_SILENT_CERT_ENV,
              status_app_run: 2
            },
            limit: numberPart,
            offset: offsetQuery,
            raw: true
          });

          offsetQuery += numberPart;
          const listDevicePush = {};
          _.forEach(listDevice, (value) => {
            listDevicePush[`${value.device_type}${value.cert_env}`] = [];
          });
          _.forEach(listDevice, (value) => {
            listDevicePush[`${value.device_type}${value.cert_env}`].push(value.device_token);
          });
          // Push to Queue for Silent  
          // AwsSqsQueue(process.env.SILENT_PUSH_QUEUE, listDevicePush, true);
          ApnSendQueue(listDevicePush);
          Graylog.SendLog('Cron Collect Device Silent Push', {
            msg: 'Push to Queue for Silent'
            // listDevicePush
          });
          /**
           *  List Device show Alert
           * */
          const listDeviceShowAlert = {};
          _.forEach(listDevice, (value) => {
            if (value.env_silent === 1) {
              listDeviceShowAlert[`${value.device_type}${value.cert_env}`] = [];
            }
          });
          _.forEach(listDevice, (value) => {
            if (value.env_silent === 1) {
              listDeviceShowAlert[`${value.device_type}${value.cert_env}`].push(value.device_token);
            }
          });

          if (!_.isEmpty(listDeviceShowAlert, true) && config.value.has_alert === 1) {
            listDeviceShowAlert.showAlert = true;
            // Push to Queue for Show Alert debug
            // AwsSqsQueue(process.env.SILENT_PUSH_QUEUE, listDeviceShowAlert, true);
            ApnSendQueue(listDeviceShowAlert);
            Graylog.SendLog('Cron Collect Device Silent Push', {
              msg: 'Push to Queue for Show Alert debug'
              // listDeviceShowAlert
            });
          }
          // Await for consumers
          await sleep(AppConstant.AWAIT_FOR_CONSUMER);
        });
      }
    });

    CronSilentPush.start();
  } catch (error) {
    console.log(error);
    Graylog.SendLog('Cron Collect Device Silent Push', error);
  }
})();
