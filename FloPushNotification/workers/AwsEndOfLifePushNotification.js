/* eslint-disable no-console */
const { Consumer } = require('sqs-consumer');
const _ = require('lodash');
const AsyncForEach = require('await-async-foreach');
const events = require('events');

const eventEmitter = new events.EventEmitter();

const AwsSystemParameterStore = require('../system/AwsSystemParameterStore');

const numberPart = 10;

(async () => {
    try {
        await AwsSystemParameterStore.Init();

        // Start Worker
        console.log('** Start worker of AWS End Of Life Push Notification... ');

        const Graylog = require('./supports/utilities/GrayLog');
        const ApplePushNotifyUpgradeVersion = require('../projects/default/services/ApplePushNotifyUpgradeVersion');
        const Model = require('./supports/model'); 
        const queueName = process.env.END_OF_LIFE_PUSH_QUEUE || 'https://sqs.ap-southeast-1.amazonaws.com/570744851573/khoapm_local';
        const keyMapsPushNoti = process.env.KEY_MAP_PUSH_NOTIFY ? JSON.parse(process.env.KEY_MAP_PUSH_NOTIFY) : {};
        const app = Consumer.create({
            queueUrl: queueName,
            handleMessage: async (message) => {
                // do some work with `message`
                const messageObj = JSON.parse(message.Body);
                console.log('messageObj', messageObj);
                // Count device 
                const countDevice = await Model.users_platform_versions.count({
                    where: {
                        app_id: messageObj.app_id,
                        platform_release_version_id: messageObj.release_id
                    },
                    raw: true
                });
                const numberFor = Math.ceil(countDevice / numberPart);

                const arr1 = new Array(numberFor);
                let offsetQuery = 0;
                await AsyncForEach(arr1, async () => {
                    const listDeviceId = await Model.users_platform_versions.findAll({
                        where: {
                            app_id: messageObj.app_id,
                            platform_release_version_id: messageObj.release_id
                        },
                        limit: numberPart,
                        offset: offsetQuery,
                        raw: true
                    });
                    offsetQuery += numberPart;
                    
                    const arrListDevices = [];
                    _.forEach(listDeviceId, (value) => {
                        arrListDevices.push(value.device_token);
                    });

                    if (arrListDevices.length > 0) {
                        const listDevice = await Model.device_token.findAll({
                            attributes: ['id', 'user_id', 'env_silent', 'device_token', 'time_sent_silent', 'time_received_silent', 'device_type', 'cert_env'],
                            where: {
                                device_token: arrListDevices
                            },
                            raw: true
                        });

                        const listDevicePush = {};
                        _.forEach(listDevice, (value) => {
                            listDevicePush[`${value.device_type}${value.cert_env}`] = [];
                        });
                        _.forEach(listDevice, (value) => {
                            listDevicePush[`${value.device_type}${value.cert_env}`].push(value.device_token);
                        });

                        await AsyncForEach(keyMapsPushNoti, async (bundleId, key) => {
                            if (!_.isUndefined(listDevicePush[key])) {
                                const listDevices = listDevicePush[key];
                                ApplePushNotifyUpgradeVersion.UpgradeVersion({
                                    title: messageObj.title,
                                    body: messageObj.message
                                },
                                listDevices, key, bundleId, Graylog);
                            }
                        });
                       
                        Graylog.SendLog('Aws Handel Upgrade version', {
                            messageObj,
                            listDevicePush
                        });
                    }
                });
            }
        });

        app.on('error', (err) => {
            console.error(err.message);
        });

        app.on('processing_error', (err) => {
            console.error(err.message);
        });
        eventEmitter.setMaxListeners(0);
        app.start();
    } catch (error) {
        console.log(error);
    }
})();
