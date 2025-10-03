/* eslint-disable no-useless-escape */
const Code = require('../constants/ResponseCodeConstant');
const Server = require('../app').server;

const Env = process.env.NODE_ENV ? process.env.NODE_ENV : 'development';

module.exports = (request, h) => {
    const { response } = request;
    if (response instanceof Error) {
        if (response && response.message === 'Not Found') {
            return h.response({
                code: Code.INVALID_SERVICE,
                error: {
                    message: 'Not Found'
                }
            }).code(Code.INVALID_SERVICE);
        } 
    
        if (response && response.output && response.output.statusCode === Code.INVALID_TOKEN) {
            return h.response({
                code: Code.INVALID_TOKEN,
                error: { 
                    message: 'Unauthorized'
                }
            }).code(Code.INVALID_TOKEN);
        } 

        // eslint-disable-next-line no-underscore-dangle
        if (response && response._object && response._object.statusCode === Code.INVALID_PAYLOAD_PARAMS) {
            // eslint-disable-next-line no-underscore-dangle
            const payload = response._object;
            const message = payload.message.replace(/\"/gi, '').split('.');
            if (Env === 'development') {
                return h.response({
                    code: Code.INVALID_PAYLOAD_PARAMS,
                    error: {
                        message,
                        stack: response.stack.split('\n')
                    }
                }).code(Code.INVALID_PAYLOAD_PARAMS);
            }

            return h.response({
                code: Code.INVALID_PAYLOAD_PARAMS,
                error: {    
                    message
                }
            }).code(Code.INVALID_PAYLOAD_PARAMS);
        } 

        if (response && response.output && response.output.payload.validation) {
            // const { validation } = response.output.payload; 
            const message = response.output.payload.message.replace(/\"/gi, '').split('.');
            return h.response({
                code: Code.INVALID_PAYLOAD_PARAMS,
                error: {
                    message
                }
            }).code(Code.INVALID_PAYLOAD_PARAMS);
        } 

        // const { path, payload, params } = request;
        // Server.log('SystemErrorTracking', {
        //     path,
        //     payload,
        //     params,
        //     errorMessage: response.message,
        //     errorStack: response.stack
        // });

        if (Env === 'development') {
            return h.response({
                code: Code.SYSTEM_ERROR,
                error: {
                    message: response.message,
                    stack: response.stack.split('\n')
                }
            }).code(Code.SYSTEM_ERROR);
        }

        return h.response({
            code: Code.SYSTEM_ERROR,
            error: {
                message: response.message 
            }
        }).code(Code.SYSTEM_ERROR);
    } 

    // if (response.statusCode !== 200 && response.statusCode !== 302) {
    //     return h.response({
    //         code: response.statusCode,
    //         data: response.source
    //     }).code(200);
    // } 
    return h.continue;
};
