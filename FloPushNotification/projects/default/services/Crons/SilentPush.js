const _ = require('lodash');
const { CronJob } = require('cron');
const Sequelize = require('sequelize');
const { Op } = require('sequelize');
const AsyncForEach = require('await-async-foreach');
const DeviceTokenModel = require('../../models/Sequelize/DeviceTokenModel');
const ConfigPushSilentModel = require('../../models/Sequelize/ConfigPushSilentModel');
const AwsSqsQueue = require('../Queues/AwsSqsQueue');

const numberPart = 10;

setTimeout(() => {
    // eslint-disable-next-line no-console
    console.log('[**] Start Crons: Collect Device Silent Push');
}, 1000);
const CronSilentPush = new CronJob({
    cronTime: '*/5 * * * *', // 5 minutes
    // cronTime: '*/5 * * * * *', //  5 seconds
    onTick: async () => {
        // # get config push silent
        const config = await ConfigPushSilentModel.findOne({
            raw: true
        });
        // Count device 
        const countDevice = await DeviceTokenModel.count({
            where: {
                [Op.and]: [
                    Sequelize.where(Sequelize.literal('time_sent_silent - time_received_silent'), {
                        [Op.lte]: config.interval_stop_push
                    })
                ],
                status_app_run: 2
            },
            raw: true
        });
        const numberFor = Math.ceil(countDevice / numberPart);
        
        const arr1 = new Array(numberFor);
        let offsetQuery = 0;
        await AsyncForEach(arr1, async () => {
            // Get device token 
            const listDevice = await DeviceTokenModel.findAll({
                attributes: ['id', 'user_id', 'env_silent', 'device_token', 'time_sent_silent', 'time_received_silent', [Sequelize.literal('time_sent_silent - time_received_silent'), 'time_push'], 'device_type', 'cert_env'],
                where: {
                    [Op.and]: [
                        Sequelize.where(Sequelize.literal('time_sent_silent - time_received_silent'), {
                            [Op.lte]: config.interval_stop_push
                        })
                    ],
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
            AwsSqsQueue(process.env.SILENT_PUSH_QUEUE, listDevicePush, true);

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
            if (!_.isEmpty(listDeviceShowAlert, true) && config.has_alert === 1) {
                listDeviceShowAlert.showAlert = true;
                // Push to Queue for Show Alert debug
                AwsSqsQueue(process.env.SILENT_PUSH_QUEUE, listDeviceShowAlert, true);
            }
        });
    }
});
CronSilentPush.start();
module.exports = CronSilentPush;
