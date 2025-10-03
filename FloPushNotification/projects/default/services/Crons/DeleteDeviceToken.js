const _ = require('lodash');
const apn = require('apn178');

(async () => {
    try {
        setTimeout(() => {
            // eslint-disable-next-line no-console
            console.log('[**] Start Crons: DELETE DEVICE TOKEN AFTER REMOVE FLO');
        }, 1000);
        const DeviceTokenModel = require('../../models/Sequelize/DeviceTokenModel');
        const Graylog = require('../../../../workers/supports/utilities/GrayLog');
        const feedbackOptions = JSON.parse(process.env.KEY_MAP_PUSH_NOTIFY);
        const KEY_PATH = process.env.PUSH_NOTIFY_KEY_PATH;
        if (_.isEmpty(feedbackOptions) === false) {
            _.forEach(feedbackOptions, (bundleId, keyMaps) => {
                const FULL_KEY_PATH = `${KEY_PATH}${keyMaps}.pem`;
                const production = (keyMaps % 2 === 0);
                const options = {
                    cert: FULL_KEY_PATH,                 
                    key: FULL_KEY_PATH,  
                    production,
                    batchFeedback: true,
                    interval: 5
                };
                const feedback = new apn.Feedback(options);
                feedback.on('feedback', async (devices) => {
                    const deviceTokens = [];
                    if (_.isEmpty(devices) === false) {
                        devices.forEach((item) => {
                            const deviceBuffer = _.get(item, 'device', false);
                            if (_.isEmpty(deviceBuffer) === false) {
                                deviceTokens.push(deviceBuffer.toString());
                            }
                        });
                        Graylog.SendLog('Delete Device Token', {
                            deviceTokens
                        });
                        if (_.isEmpty(deviceTokens) === false) {
                            await DeviceTokenModel.destroy({ 
                                where: {
                                    device_token: deviceTokens
                                } 
                            });
                        }
                    }
                });
            });
        }
    } catch (error) {
        throw error;
    }
})();

