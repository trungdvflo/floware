/* eslint-disable no-console */
const { Base64 } = require('js-base64');
const Code = require('../constants/ResponseCodeConstant');

const AwsSqsQueue = require('../services/Queues/AwsSqsQueue');
const AwsConstant = require('../../../workers/supports/AwsConstant');

module.exports.HandelWebHookGmail = async (request, h) => {
    try {
        const { payload } = request;
        const pushInfo = Base64.decode(payload.message.data);
        
        console.log('------------------------------------------------------'); 
        console.log('pushInfo', pushInfo);

        // Send message to Queue
        AwsSqsQueue(AwsConstant.HANDLE_WEBHOOK_GMAIL, pushInfo);
    } catch (error) {
        console.log('history', error);
    }
    return h.response({
        code: Code.REQUEST_SUCCESS,
        data: {
            message: 'Received data'
        }
    }).code(Code.REQUEST_SUCCESS);
};
