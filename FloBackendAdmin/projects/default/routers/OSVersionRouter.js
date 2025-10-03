const Joi = require('joi');
const Code = require('../constants/ResponseCodeConstant');
const OSVersionModule = require('../modules/OSVersionModule');
const QuerysConstant = require('../constants/QuerysConstant');

const routers = [];

const payloadPost = Joi.object({
  os_name: QuerysConstant.OS_VERSION_OS_NAME.required(),
  os_version: QuerysConstant.OS_VERSION_OS_VERSION.required(),
  os_type: QuerysConstant.OS_VERSION_OS_TYPE.required()
});

const payloadPut = Joi.object({
  os_name: QuerysConstant.OS_VERSION_OS_NAME.optional(),
  os_version: QuerysConstant.OS_VERSION_OS_VERSION.optional(),
  os_type: QuerysConstant.OS_VERSION_OS_TYPE.optional()
});

const response = Joi.object({
  id: QuerysConstant.ID,
  os_name: QuerysConstant.OS_VERSION_OS_NAME,
  os_version: QuerysConstant.OS_VERSION_OS_VERSION,
  os_type: QuerysConstant.OS_VERSION_OS_TYPE,
  created_date: QuerysConstant.CREATED_DATE,
  updated_date: QuerysConstant.UPDATED_DATE
});

routers.push({
  method: 'GET',
  path: '/os-versions',
  options: {
    auth: 'OAuth',
    handler(request, h) {
      return OSVersionModule.GetOSVersions(request, h);
    },
    description: 'Get OS Version',
    validate: {
      headers: QuerysConstant.HEADERS_ACCESS_TOKEN,
      query: Joi.object({
        filter_key: QuerysConstant.OS_VERSION_FILTER_KEY,
        keyword: QuerysConstant.KEYWORD,
        sort: QuerysConstant.SORT,
        page: QuerysConstant.PAGE.required(),
        max_rows: QuerysConstant.MAX_ROWS.required()
      })
    },
    response: {
      status: {
        [Code.REQUEST_SUCCESS]: Joi.object({
          code: Joi.number().example(200),
          data: Joi.array().items(response)
        }).description('Request successfully'),

        [Code.SYSTEM_ERROR]: Joi.object().description('System error')
      }
    },
    tags: ['api', 'Auto Update']
  }
});

routers.push({
  method: 'GET',
  path: '/os-versions/{id}',
  options: {
    auth: 'OAuth',
    handler(request, h) {
      return OSVersionModule.GetOSVersion(request, h);
    },
    description: 'Get OS Version',
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
        }).description('Request successfully'),
        [Code.NOT_FOUND]: Joi.object({
          code: QuerysConstant.CODE.example(Code.NOT_FOUND),
          error: Joi.object({
            message: QuerysConstant.MESSAGE.example('OS Version setting doesn\'t exist')

          })
        }).description('Request fail'),
        [Code.SYSTEM_ERROR]: Joi.object().description('System error')
      }
    },
    tags: ['api', 'Auto Update']
  }
});

routers.push({
  method: 'POST',
  path: '/os-versions',
  options: {
    auth: 'OAuth',
    handler(request, h) {
      return OSVersionModule.CreateOSVersion(request, h);
    },
    description: 'Create OS Version',
    validate: {
      headers: QuerysConstant.HEADERS_ACCESS_TOKEN,
      payload: payloadPost
    },
    response: {
      status: {
        [Code.REQUEST_SUCCESS]: Joi.object({
          code: QuerysConstant.CODE.example(200),
          data: response
        }).description('Request successfully'),

        [`${Code.INVALID_PAYLOAD_PARAMS}#1`]: Joi.object({
          code: QuerysConstant.CODE.example(Code.INVALID_PAYLOAD_PARAMS),
          error: Joi.object({
            message: Joi.array().items(
              QuerysConstant.MESSAGE.example('os_version or os_type are already exist')
            )
          })
        }).description('Request fail'),
        [Code.SYSTEM_ERROR]: Joi.object().description('System error')
      }
    },
    tags: ['api', 'Auto Update']
  }
});

routers.push({
  method: 'PUT',
  path: '/os-versions/{id}',
  options: {
    auth: 'OAuth',
    handler(request, h) {
      return OSVersionModule.ModifyOSVersion(request, h);
    },
    description: 'Modify OS Version',
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
        }).description('Request successfully'),

        [`${Code.INVALID_PAYLOAD_PARAMS}#1`]: Joi.object({
          code: QuerysConstant.CODE.example(Code.INVALID_PAYLOAD_PARAMS),
          error: Joi.object({
            message: Joi.array().items(
              QuerysConstant.MESSAGE.example('Invalid Information, at least one of the payload parameters is required: os_name, os_version, os_type')
            )
          })
        }).description('Invalid Information'),

        [`${Code.INVALID_PAYLOAD_PARAMS}#2`]: Joi.object({
          code: QuerysConstant.CODE.example(Code.INVALID_PAYLOAD_PARAMS),
          error: Joi.object({
            message: Joi.array().items(
              QuerysConstant.MESSAGE.example('os_version or os_type are already exist')
            )
          })
        }).description('os_version or os_type are already exist'),

        [`${Code.NOT_FOUND}#`]: Joi.object({
          code: QuerysConstant.CODE.example(Code.NOT_FOUND),
          error: Joi.object({
            message: QuerysConstant.MESSAGE.example('OS Version doesn\'t exist')
          })
        }).description('Not found'),

        [Code.SYSTEM_ERROR]: Joi.object().description('System error')
      }
    },
    tags: ['api', 'Auto Update']
  }
});

routers.push({
  method: 'DELETE',
  path: '/os-versions/{id}',
  options: {
    auth: 'OAuth',
    handler(request, h) {
      return OSVersionModule.DeleteOSVersion(request, h);
    },
    description: 'Delete OS Version',
    validate: {
      headers: QuerysConstant.HEADERS_ACCESS_TOKEN,
      params: Joi.object({
        id: QuerysConstant.ID.required()
      })
    },
    response: {
      status: {
        [Code.NO_CONTENT]: Joi.object().description('Delete successful'),
        [`${Code.NOT_FOUND}#`]: Joi.object({
          code: QuerysConstant.CODE.example(Code.NOT_FOUND),
          error: Joi.object({
            message: QuerysConstant.MESSAGE.example('OS Version doesn\'t exist')
          })
        }).description('Not found'),

        [Code.SYSTEM_ERROR]: Joi.object().description('System error')
      }
    },
    tags: ['api', 'Auto Update']
  }
});

module.exports = routers;
