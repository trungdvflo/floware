const Joi = require('joi');
const Code = require('../constants/ResponseCodeConstant');
const QuerysConstant = require('../constants/QuerysConstant');
const PlatformSettingDefaultModule = require('../modules/PlatformSettingDefaultModule');

const routers = [];
const payloadPost = Joi.object({
  app_reg_id: QuerysConstant.APP_ID.valid(
    'ad944424393cf309efaf0e70f1b125cb',
    'faf0e70f1bad944424393cf309e125cb',
    'e70f1b125cbad944424393cf309efaf0',
    'd944424393cf309e125cbfaf0e70f1ba'
  ).example('ad944424393cf309efaf0e70f1b125cb').required(),
  app_version: QuerysConstant.APP_VERSION.required(),
  data_setting: QuerysConstant.DATA_SETTING.required(),
});

const payloadPut = Joi.object({
  app_reg_id: QuerysConstant.APP_ID.valid(
    'ad944424393cf309efaf0e70f1b125cb',
    'faf0e70f1bad944424393cf309e125cb',
    'e70f1b125cbad944424393cf309efaf0',
    'd944424393cf309e125cbfaf0e70f1ba'
  ).example('ad944424393cf309efaf0e70f1b125cb').required(),
  app_version: QuerysConstant.APP_VERSION.optional(),
  data_setting: QuerysConstant.DATA_SETTING.required(),
});

const response = Joi.object({
  id: QuerysConstant.ID,
  app_reg_id: QuerysConstant.APP_ID,
  app_version: QuerysConstant.APP_VERSION,
  data_setting: Joi.object().description('Data setting infomation'),
  created_date: QuerysConstant.CREATED_DATE,
  updated_date: QuerysConstant.UPDATED_DATE
});

routers.push({
  method: 'GET',
  path: '/platform-setting-defaults',
  options: {
    auth: 'OAuth',
    handler(request, h) {
      return PlatformSettingDefaultModule.GetPlatformSettingDefaults(request, h);
    },
    description: 'Get all platform setting defaults.',
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
          data: Joi.array().items(response)
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
    tags: ['api', 'Platform Setting Defaults']
  }
});

routers.push({
  method: 'GET',
  path: '/platform-setting-defaults/{id}',
  options: {
    auth: 'OAuth',
    handler(request, h) {
      return PlatformSettingDefaultModule.GetPlatformSettingDefault(request, h);
    },
    description: 'Get platform setting defaults.',
    validate: {
      headers: QuerysConstant.HEADERS_ACCESS_TOKEN,
      params: Joi.object({
        id: QuerysConstant.ID.required()
      })
    },
    response: {
      status: {
        [Code.REQUEST_SUCCESS]: Joi.object({
          code: Joi.number().example(200),
          data: response
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
    tags: ['api', 'Platform Setting Defaults']
  }
});

routers.push({
  method: 'POST',
  path: '/platform-setting-defaults',
  options: {
    auth: 'OAuth',
    handler(request, h) {
      return PlatformSettingDefaultModule.CreatePlatformSettingDefault(request, h);
    },
    description: 'Create Platform Setting Defaults',
    validate: {
      headers: QuerysConstant.HEADERS_ACCESS_TOKEN,
      payload: payloadPost
    },
    response: {
      status: {
        [Code.CREATE_SUCCESS]: Joi.object({
          code: QuerysConstant.CODE.example(Code.CREATE_SUCCESS),
          data: response
        }).description('Create successfully'),

        [`${Code.INVALID_PERMISSION}`]: Joi.object({
          code: QuerysConstant.CODE.example(Code.INVALID_PERMISSION),
          error: Joi.object({
            message: QuerysConstant.MESSAGE.example('You don\'t have permission to perform this action')
          })
        }).description('Invalid permission, only PO can perform this action'),

        [`${Code.INVALID_PAYLOAD_PARAMS}#1`]: Joi.object({
          code: QuerysConstant.CODE.example(Code.INVALID_PAYLOAD_PARAMS),
          error: Joi.object({
            message: Joi.array().items(
              QuerysConstant.MESSAGE.example('Invalid release id')
            )
          })
        }).description('Invalid release id, base_release\'s id can not equal destination_release\'s id'),

        [`${Code.INVALID_PAYLOAD_PARAMS}#2`]: Joi.object({
          code: QuerysConstant.CODE.example(Code.INVALID_PAYLOAD_PARAMS),
          error: Joi.object({
            message: Joi.array().items(
              QuerysConstant.MESSAGE.example('Base release doesn\'t exist or doesn\'t published (status = 2)')
            )
          })
        }).description('Base release doesn\'t exist or doesn\'t published (status = 2)'),

        [`${Code.INVALID_PAYLOAD_PARAMS}#3`]: Joi.object({
          code: QuerysConstant.CODE.example(Code.INVALID_PAYLOAD_PARAMS),
          error: Joi.object({
            message: Joi.array().items(
              QuerysConstant.MESSAGE.example('Destination release doesn\'t exist or doesn\'t published (status = 2)')
            )
          })
        }).description('Destination release doesn\'t exist or doesn\'t published (status = 2)'),

        [`${Code.INVALID_PAYLOAD_PARAMS}#4`]: Joi.object({
          code: QuerysConstant.CODE.example(Code.INVALID_PAYLOAD_PARAMS),
          error: Joi.object({
            message: Joi.array().items(
              QuerysConstant.MESSAGE.example('Platform Setting Default already exist')
            )
          })
        }).description('Already exist a Platform Setting Default that has base_release_id and  destination_release_id'),

        [`${Code.INVALID_PAYLOAD_PARAMS}#5`]: Joi.object({
          code: QuerysConstant.CODE.example(Code.INVALID_PAYLOAD_PARAMS),
          error: Joi.object({
            message: Joi.array().items(
              QuerysConstant.MESSAGE.example('Destination release version must be bigger than or equal to the base release version')
            )
          })
        }).description('Destination release version must be bigger than or equal to the base release version'),

        [`${Code.INVALID_PAYLOAD_PARAMS}#6`]: Joi.object({
          code: QuerysConstant.CODE.example(Code.INVALID_PAYLOAD_PARAMS),
          error: Joi.object({
            message: Joi.array().items(
              QuerysConstant.MESSAGE.example('Destination release build_number must be bigger than the base release build_number')
            )
          })
        }).description('Destination release build_number must be bigger than the base release build_number'),

        [`${Code.INVALID_PAYLOAD_PARAMS}#7`]: Joi.object({
          code: QuerysConstant.CODE.example(Code.INVALID_PAYLOAD_PARAMS),
          error: Joi.object({
            message: Joi.array().items(
              QuerysConstant.MESSAGE.example('Create Platform Setting Default failed, please try again later!')
            )
          })
        }).description('When everything is alright but can not create Platform Setting Default. This is server error'),

        [`${Code.SYSTEM_ERROR}  `]: Joi.object().description('System error')
      }
    },
    tags: ['api', 'Platform Setting Defaults']
  }
});

routers.push({
  method: 'PUT',
  path: '/platform-setting-defaults/{id}',
  options: {
    auth: 'OAuth',
    handler(request, h) {
      return PlatformSettingDefaultModule.ModifyPlatformSettingDefault(request, h);
    },
    description: 'Modify Platform Setting Defaults',
    validate: {
      headers: QuerysConstant.HEADERS_ACCESS_TOKEN,
      params: Joi.object({
        id: QuerysConstant.ID.required()
      }),
      payload: payloadPut
    },
    response: {
      status: {
        [Code.REQUEST_SUCCESS]: Joi.object({
          code: QuerysConstant.CODE.example(200),
          data: response
        }).description('Update successfully'),

        [`${Code.INVALID_PERMISSION}`]: Joi.object({
          code: QuerysConstant.CODE.example(Code.INVALID_PERMISSION),
          error: Joi.object({
            message: QuerysConstant.MESSAGE.example('You don\'t have permission to perform this action')
          })
        }).description('Invalid permission, only PO can perform this action'),

        [`${Code.INVALID_SERVICE}#`]: Joi.object({
          code: QuerysConstant.CODE.example(Code.INVALID_SERVICE),
          error: Joi.object({
            message: QuerysConstant.MESSAGE.example('Platform Setting Default doesn\'t exist')
          })
        }).description('Platform Setting Default doesn\'t exist'),

        [`${Code.SYSTEM_ERROR}  `]: Joi.object().description('System error')
      }
    },
    tags: ['api', 'Platform Setting Defaults']
  }
});

routers.push({
  method: 'DELETE',
  path: '/platform-setting-defaults/{id}',
  options: {
    auth: 'OAuth',
    handler(request, h) {
      return PlatformSettingDefaultModule.DeletePlatformSettingDefault(request, h);
    },
    description: 'Delete Platform Setting Defaults',
    validate: {
      headers: QuerysConstant.HEADERS_ACCESS_TOKEN,
      params: Joi.object({
        id: QuerysConstant.ID.required()
      })
    },
    response: {
      status: {
        [Code.NO_CONTENT]: Joi.object().description('Delete successfully'),
        [`${Code.INVALID_PERMISSION}`]: Joi.object({
          code: QuerysConstant.CODE.example(Code.INVALID_PERMISSION),
          error: Joi.object({
            message: QuerysConstant.MESSAGE.example('You don\'t have permission to perform this action')
          })
        }).description('Invalid permission, only PO can perform this action'),
        [`${Code.INVALID_SERVICE}#`]: Joi.object({
          code: QuerysConstant.CODE.example(Code.INVALID_SERVICE),
          error: Joi.object({
            message: QuerysConstant.MESSAGE.example('Platform Setting Default doesn\'t exist')
          })
        }).description('Platform Setting Default doesn\'t exist'),
        [Code.SYSTEM_ERROR]: Joi.object().description('System error')
      }
    },
    tags: ['api', 'Platform Setting Defaults']
  }
});
module.exports = routers;
