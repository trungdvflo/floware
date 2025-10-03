const Joi = require('joi');
const Code = require('../constants/ResponseCodeConstant');
const AdminModule = require('../modules/AdminModule');
const QuerysConstant = require('../constants/QuerysConstant');
const { MSG_ALREADY_MIGRATE_DATA_USER, MSG_USER_NOT_FOUND, UPDATE_SUCCESS } = require('../constants/MessageConstant');
const routers = [];

const BASE_PATH = '/admin/';

routers.push({
  method: 'GET',
  path: `${BASE_PATH}statistics`,
  options: {
    auth: 'OAuth',
    handler(request, h) {
      return AdminModule.Statistics(h);
    },
    description: 'User types statistics',
    validate: {
      headers: QuerysConstant.HEADERS_ACCESS_TOKEN
    },
    response: {
      status: {
        [Code.REQUEST_SUCCESS]: Joi.object({
          code: Joi.number().example(200),
          data: Joi.object({
            google: QuerysConstant.DASHBOARD_GOOGLE,
            yahoo: QuerysConstant.DASHBOARD_YAHOO,
            icloud: QuerysConstant.DASHBOARD_ICLOUD,
            other_3rd: QuerysConstant.DASHBOARD_OTHER_3RD,
            pre: QuerysConstant.DASHBOARD_PRE,
            pro: QuerysConstant.DASHBOARD_PRO,
            standard: QuerysConstant.DASHBOARD_STANDARD,
            users: QuerysConstant.DASHBOARD_USERS
          })
        }).description('Request successfully'),
        [Code.SYSTEM_ERROR]: Joi.object().description('System error')
      }
    },
    tags: ['api', 'Admin']
  }
});

routers.push({
  method: 'GET',
  path: `${BASE_PATH}get_info_by_email`,
  options: {
    auth: 'OAuth',
    handler(request, h) {
      return AdminModule.GetUserOfAdmin(request, h);
    },
    description: 'Get user information',
    validate: {
      headers: QuerysConstant.HEADERS_ACCESS_TOKEN,
      query: Joi.object({
        email: QuerysConstant.EMAIL.required()
      })
    },
    response: {},
    tags: ['api', 'Admin']
  }
});

routers.push({
  method: 'POST',
  path: `${BASE_PATH}update_subscription`,
  options: {
    auth: 'OAuth',
    handler(request, h) {
      return AdminModule.updateSubscription(request, h);
    },
    description: 'Update subscription',
    validate: {
      headers: QuerysConstant.HEADERS_ACCESS_TOKEN,
      payload: Joi.object({
        email: QuerysConstant.EMAIL.required(),
        subsType: QuerysConstant.SUBS_TYPE_CUSTOM,
        subsTime: QuerysConstant.SUBS_TIME_CUSTOM,
        subsId: QuerysConstant.SUB_ID_CUSTOM
      })
    },
    response: {
      status: {
        [Code.REQUEST_SUCCESS]: Joi.object({
          code: QuerysConstant.CODE.example(Code.REQUEST_SUCCESS),
          description: QuerysConstant.MESSAGE
        }).description(UPDATE_SUCCESS),
        [`${Code.INVALID_PAYLOAD_PARAMS}#1`]: Joi.object({
          code: QuerysConstant.CODE.example(Code.INVALID_PAYLOAD_PARAMS),
          error: Joi.object({
            message: QuerysConstant.MESSAGE.example("Subscription purchase don't exist")
          })
        }).description("Subscription purchase don't exist")
      }
    },
    tags: ['api', 'Admin']
  }
});

routers.push({
  method: 'POST',
  path: `${BASE_PATH}extend_expired_date`,
  options: {
    auth: 'OAuth',
    handler(request, h) {
      return AdminModule.ExtendExpDate(request, h);
    },
    description: 'Extend expire date',
    validate: {
      headers: QuerysConstant.HEADERS_ACCESS_TOKEN,
      payload: Joi.object({
        emails: Joi.array().items(Joi.string().email()),
        expiredDate: Joi.date().default(new Date())
      })
    },
    response: {
      status: {
        [Code.REQUEST_SUCCESS]: Joi.object({
          code: Joi.number().example(200),
          data: Joi.array().items(Joi.string().email())
        }).description('Request successfully'),
        [Code.SYSTEM_ERROR]: Joi.object().description('System error')
      }
    },
    tags: ['api', 'Admin']
  }
});

routers.push({
  method: 'POST',
  path: `${BASE_PATH}execute_revert_data`,
  options: {
    auth: 'OAuth',
    handler(request, h) {
      return AdminModule.ExecuteRevertUserData(request, h);
    },
    description: 'Execute the script to revert user data back 3.2',
    validate: {
      headers: QuerysConstant.HEADERS_ACCESS_TOKEN,
      payload: Joi.object({
        email: Joi.string().email()
      })
    },
    response: {
      status: {
        [Code.REQUEST_SUCCESS]: Joi.object({
          data: Joi.object({
            status: Joi.string()
          })
        }).description('Request successfully'),

        [`${Code.INVALID_PAYLOAD_PARAMS}#2`]: Joi.object({
          code: QuerysConstant.CODE.example(Code.INVALID_PAYLOAD_PARAMS),
          error: Joi.object({
            message: QuerysConstant.MESSAGE.example(MSG_ALREADY_MIGRATE_DATA_USER)
          })
        }).description(MSG_ALREADY_MIGRATE_DATA_USER),

        [`${Code.INVALID_PAYLOAD_PARAMS}#3`]: Joi.object({
          code: QuerysConstant.CODE.example(Code.INVALID_PAYLOAD_PARAMS),
          error: Joi.object({
            message: QuerysConstant.MESSAGE.example(MSG_USER_NOT_FOUND)
          })
        }).description(MSG_USER_NOT_FOUND)
      }
    },
    tags: ['api', 'Admin']
  }
});

routers.push({
  method: 'POST',
  path: `${BASE_PATH}migrate_data`,
  options: {
    auth: 'OAuth',
    handler(request, h) {
      return AdminModule.ExcuteMigrateUserData(request, h);
    },
    description: 'Execute the script to migrate user data from 3.2 to 4.0',
    validate: {
      headers: QuerysConstant.HEADERS_ACCESS_TOKEN,
      payload: Joi.object({
        email: QuerysConstant.EMAIL.required()
      })
    },
    response: {
      status: {
        [Code.REQUEST_SUCCESS]: Joi.object({
          data: Joi.object({
            status: Joi.string()
          })
        }).description('Request successfully'),

        [`${Code.INVALID_PAYLOAD_PARAMS}#2`]: Joi.object({
          code: QuerysConstant.CODE.example(Code.INVALID_PAYLOAD_PARAMS),
          error: Joi.object({
            message: QuerysConstant.MESSAGE.example('This user has already start revert user data')
          })
        }).description('This user has already start revert user data'),

        [`${Code.SYSTEM_ERROR}`]: Joi.object().description('System error')
      }
    },
    tags: ['api', 'Admin']
  }
});

module.exports = routers;
