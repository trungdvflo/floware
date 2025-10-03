const Code = require('../constants/ResponseCodeConstant');
const AwsSqsQueue = require('../services/Queues/AwsSqsQueue');
const AwsConstant = require('../../../workers/supports/AwsConstant');
const Graylog = require('../../../workers/supports/utilities/GrayLog');

const ReceiveMessage = async (request, h) => {
    try {
        const { payload } = request;

        Graylog.SendLog('DoveCot: Receive data', {
            payload
        })
        // Send message to Queue
        AwsSqsQueue(AwsConstant.DOVECOT_NEW_MAIL, payload);
        return h.response({
            code: Code.REQUEST_SUCCESS,
            data: {
                message: 'Received data'
            }
        }).code(Code.REQUEST_SUCCESS);
    } catch (error) {
        throw error;
    }
};

const GetReceiveMessage = async (request, h) => {
    try {
        const { query } = request;
        // Send message to Queue
        AwsSqsQueue(AwsConstant.DOVECOT_NEW_MAIL, query);
        return h.response({
            code: Code.REQUEST_SUCCESS,
            data: {
                message: 'Received data'
            }
        }).code(Code.REQUEST_SUCCESS);
    } catch (error) {
        throw error;
    }
};

module.exports = {
    ReceiveMessage,
    GetReceiveMessage
};
