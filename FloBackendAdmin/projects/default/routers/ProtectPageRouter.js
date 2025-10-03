const Joi = require('joi');
const Code = require('../constants/ResponseCodeConstant');
const QuerysConstant = require('../constants/QuerysConstant');
const ProtectPageModule = require('../modules/ProtectPageModule');

const routers = [];

routers.push({
  method: 'POST',
  path: '/save-password-protected',
  options: {
    auth: 'OAuth',
    handler(request, h) {
      return ProtectPageModule.SaveProtectCode(request, h);
    },
    description: 'Save protect page password encrypted RSA.',
    validate: {
      headers: QuerysConstant.HEADERS_ACCESS_TOKEN,
      payload: Joi.object({
        data: Joi.object({
          verify_code: QuerysConstant.PROTECT_PAGE_VERIFY_CODE_RSA
        })
      })
    },
    response: {
      status: {
        [Code.REQUEST_SUCCESS]: Joi.object({
          code: Joi.number().example(200),
          data: Joi.object({
            status: QuerysConstant.PROTECT_PAGE_CODE_SAVE_STATUS
          })
        }).description('Save protect password successfully'),

        [`${Code.INVALID_PERMISSION}`]: Joi.object({
          code: QuerysConstant.CODE.example(Code.INVALID_PERMISSION),
          error: Joi.object({
            message: QuerysConstant.MESSAGE.example('You don\'t have permission to perform this action')
          })
        }).description('Invalid permission, only PO can perform this action'),

        [`${Code.SYSTEM_ERROR}  `]: Joi.object().description('System error')
      }
    },
    tags: ['api', 'ProtectPage']
  }
});

routers.push({
  method: 'GET',
  path: '/password-protected',
  options: {
    auth: 'OAuth',
    handler(request, h) {
      return ProtectPageModule.GetProtectCode(request, h);
    },
    description: 'List protect page password.',
    validate: {
      headers: QuerysConstant.HEADERS_ACCESS_TOKEN
    },
    response: {
      status: {
        [Code.REQUEST_SUCCESS]: Joi.object({
          code: Joi.number().example(200),
          data: Joi.array().items({
            verify_code: QuerysConstant.PROTECT_PAGE_CODE,
            time_code_expire: QuerysConstant.PROTECT_PAGE_EXPIRE
          })
        }).description('Generate protect password successfully'),

        [`${Code.INVALID_PERMISSION}`]: Joi.object({
          code: QuerysConstant.CODE.example(Code.INVALID_PERMISSION),
          error: Joi.object({
            message: QuerysConstant.MESSAGE.example('You don\'t have permission to perform this action')
          })
        }).description('Invalid permission, only PO can perform this action'),

        [`${Code.SYSTEM_ERROR}  `]: Joi.object().description('System error')
      }
    },
    tags: ['api', 'ProtectPage']
  }
});

module.exports = routers;
