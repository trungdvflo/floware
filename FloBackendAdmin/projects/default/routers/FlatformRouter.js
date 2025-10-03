const Joi = require('joi');
const Code = require('../constants/ResponseCodeConstant');
const QuerysConstant = require('../constants/QuerysConstant');
const PlatformModule = require('../modules/PlatformModule');

const routers = [];

routers.push({
  method: 'GET',
  path: '/platforms',
  options: {
    auth: 'OAuth',
    handler(request, h) {
      return PlatformModule.GetPlatformList(request, h);
    },
    description: 'Get all platforms.',
    validate: {
      headers: QuerysConstant.HEADERS_ACCESS_TOKEN,
      query: Joi.object({
        page: QuerysConstant.PAGE.required(),
        max_rows: QuerysConstant.MAX_ROWS.required(),
        keyword: QuerysConstant.KEYWORD
      })
    },
    response: {
      status: {
        [Code.REQUEST_SUCCESS]: Joi.object({
          code: Joi.number().example(200),
          data: Joi.array().items({
            id: QuerysConstant.ID,
            app_name: QuerysConstant.PLATFORM_NAME,
            app_reg_id: QuerysConstant.APP_ID,
            app_alias: QuerysConstant.APP_ID,
            email_register: QuerysConstant.EMAIL,
            created_date: QuerysConstant.CREATED_DATE,
            updated_date: QuerysConstant.UPDATED_DATE
          })
        }).description('Request successful'),
        [`${Code.INVALID_PERMISSION}`]: Joi.object({
          code: QuerysConstant.CODE.example(Code.INVALID_PERMISSION),
          error: Joi.object({
            message: QuerysConstant.MESSAGE.example('You don\'t have permission to perform this action')
          })
        }).description('Invalid permission, only PO can perform this action'),
        [`${Code.SYSTEM_ERROR}  `]: Joi.object().description('System error')
      }
    },
    tags: ['api', 'Platforms']
  }
});

module.exports = routers;
