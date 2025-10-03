const Joi = require('joi');
const Code = require('../constants/ResponseCodeConstant');

module.exports = {
    active: true,
    appendResponseStatus: {
        // [Code.INVALID_PAYLOAD_PARAMS]: Joi.object({
        //     code: Joi.number().example(Code.INVALID_PAYLOAD_PARAMS),
        //     error: Joi.object({
        //         message: Joi.array().items(Joi.string())
        //     })
        // }).description('Input parameters are incorrect')

        // [Code.INVALID_PAYLOAD]: Joi.object({
        //   error: Joi.object({
        //     code: Joi.string().example('BAD_REQUEST'),
        //     message: Joi.string().example('Invalid request payload input'),
        //   })
        // }).description('Invalid request payload input')
    }
};
