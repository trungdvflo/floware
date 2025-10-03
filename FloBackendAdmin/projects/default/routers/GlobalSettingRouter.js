const Joi = require('joi');
const Code = require('../constants/ResponseCodeConstant');
const QuerysConstant = require('../constants/QuerysConstant');
const GlobalSettingModule = require('../modules/GlobalSettingModule');

const requestPutGlobalSetting = Joi.object({
  id: Joi.number().required(),
  working_time: Joi.array().max(7).items(
    Joi.object({
      day: "Mon",
      iMin: Joi.number().min(0).max(86400),
      iMax: Joi.number().min(0).max(86400).greater(Joi.ref('iMin'))
    }).required(),
    Joi.object({
      day: "Tue",
      iMin: Joi.number().min(0).max(86400),
      iMax: Joi.number().min(0).max(86400).greater(Joi.ref('iMin'))
    }).valid().required(),
    Joi.object({
      day: "Wed",
      iMin: Joi.number().min(0).max(86400),
      iMax: Joi.number().min(0).max(86400).greater(Joi.ref('iMin'))
    }).required(),
    Joi.object({
      day: "Thu",
      iMin: Joi.number().min(0).max(86400),
      iMax: Joi.number().min(0).max(86400).greater(Joi.ref('iMin'))
    }).required(),
    Joi.object({
      day: "Fri",
      iMin: Joi.number().min(0).max(86400),
      iMax: Joi.number().min(0).max(86400).greater(Joi.ref('iMin'))
    }).required(),
    Joi.object({
      day: "Sat",
      iMin: Joi.number().min(0).max(86400),
      iMax: Joi.number().min(0).max(86400).greater(Joi.ref('iMin'))
    }).required(),
    Joi.object({
      day: "Sun",
      iMin: Joi.number().min(0).max(86400),
      iMax: Joi.number().min(0).max(86400).greater(Joi.ref('iMin'))
    }).required()
  ),
  week_start: Joi.number().valid(0, 1),
  event_duration: Joi.number().min(0),
  alert_before: Joi.number(),
  default_alert_ade: Joi.number(),
  due_task: Joi.number().min(0),
  default_alert_todo: Joi.number(),
  snooze_default: Joi.number().min(0),
  task_duration: Joi.number().min(0)
});

const responsePutGlobalSetting = Joi.object({
  items: Joi.array().items({
    id: QuerysConstant.ID,
    working_time: QuerysConstant.WORKING_TIME,
    week_start: QuerysConstant.WEEK_START,
    event_duration: QuerysConstant.EVENT_DURATION,
    alert_before: QuerysConstant.ALERT_BEFORE,
    default_alert_ade: QuerysConstant.DEFAULT_ALERT_ADE,
    due_task: QuerysConstant.DUE_TASK,
    default_alert_todo: QuerysConstant.DEFAULT_ALERT_TODO,
    snooze_default: QuerysConstant.SNOOZE_DEFAULT,
    task_duration: QuerysConstant.TASK_DURATION,
    created_date: QuerysConstant.CREATED_DATE,
    updated_date: QuerysConstant.UPDATED_DATE
  }),
  failed_items: Joi.array().items(Joi.object({
    code: QuerysConstant.CODE,
    error: Joi.object({
      message: QuerysConstant.MESSAGE.example('item is not existed')
    })
  }))
});
const routers = [];
routers.push({
  method: 'GET',
  path: '/global-setting-default',
  options: {
    auth: 'OAuth',
    handler(request, h) {
      return GlobalSettingModule.GetGlobalSettingList(request, h);
    },
    description: 'Get all global setting default.',
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
            working_time: QuerysConstant.WORKING_TIME,
            week_start: QuerysConstant.WEEK_START,
            event_duration: QuerysConstant.EVENT_DURATION,
            alert_before: QuerysConstant.ALERT_BEFORE,
            default_alert_ade: QuerysConstant.DEFAULT_ALERT_ADE,
            due_task: QuerysConstant.DUE_TASK,
            default_alert_todo: QuerysConstant.DEFAULT_ALERT_TODO,
            snooze_default: QuerysConstant.SNOOZE_DEFAULT,
            task_duration: QuerysConstant.TASK_DURATION,
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
    tags: ['api', 'Global setting default']
  }
});
routers.push({
  method: 'PUT',
  path: '/global-setting-default',
  options: {
    auth: 'OAuth',
    handler(request, h) {
      return GlobalSettingModule.PutGlobalSetting(request, h);
    },
    description: 'Update global setting default',
    validate: {
      headers: QuerysConstant.HEADERS_ACCESS_TOKEN,
      payload: Joi.array().items(requestPutGlobalSetting).max(50).min(1)
    },
    response: {
      status: {
        [Code.REQUEST_SUCCESS]: Joi.object({
          code: Joi.number().example(200),
          data: responsePutGlobalSetting
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

    tags: ['api', 'Global setting default']
  }
});
module.exports = routers;
