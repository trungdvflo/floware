const Joi = require('joi');
const Code = require('../constants/ResponseCodeConstant');
const QuerysConstant = require('../constants/QuerysConstant');
const MessageConstant = require('../constants/MessageConstant');

module.exports = {
  active: true,
  appendResponseStatus: {
    [`${Code.SYSTEM_ERROR}#`]: Joi.object({
      error: Joi.object({
        message: QuerysConstant.MESSAGE.example(MessageConstant.INTERNAL_SERVER_ERROR)
      })
    }).description(MessageConstant.SYSTEM_ERROR)
  }
};

