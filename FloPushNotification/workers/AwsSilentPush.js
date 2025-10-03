/* eslint-disable no-console */
const { Consumer } = require('sqs-consumer');
const _ = require('lodash');
const AsyncForEach = require('await-async-foreach');
const events = require('events');

const eventEmitter = new events.EventEmitter();

const AwsSystemParameterStore = require('../system/AwsSystemParameterStore');

(async () => {
    try {
        await AwsSystemParameterStore.Init();

        // Start Worker
        console.log('** Start worker of AWS Silent Push... ');

        const Graylog = require('./supports/utilities/GrayLog');
        const AppleSilentPush = require('../projects/default/services/AppleSilentPush');
        const Model = require('./supports/model'); 
        const Utils = require('../projects/default/utilities/Utils');
        const queueName = process.env.SILENT_PUSH_QUEUE;
        const keyMapsPushNoti = process.env.KEY_MAP_PUSH_NOTIFY ? JSON.parse(process.env.KEY_MAP_PUSH_NOTIFY) : {};
        const app = Consumer.create({
            queueUrl: queueName,
            handleMessage: async (message) => {
                // do some work with `message`
                const messageObj = JSON.parse(message.Body);
                
                await AsyncForEach(keyMapsPushNoti, async (bundleId, key) => {
                    // console.log(bundleId, key);
                    if (!_.isUndefined(messageObj[key])) {
                        const listDevices = messageObj[key];
                        const argsUpdate = {
                            time_sent_silent: Utils.Timestamp()
                        };
                        Model.device_token.update(argsUpdate, {
                            where: {
                                device_token: listDevices
                            },
                            silent: true
                        });
                        const showAlert = !!messageObj.showAlert;
                        
                        AppleSilentPush.ApnSilentPush(listDevices, key, bundleId, Graylog, showAlert);
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
