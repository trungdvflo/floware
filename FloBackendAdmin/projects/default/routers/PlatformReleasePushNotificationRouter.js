const Joi = require('joi');
const Code = require('../constants/ResponseCodeConstant');
const PlatformReleasePushNotificationModule = require('../modules/PlatformReleasePushNotificationModule');
const QuerysConstant = require('../constants/QuerysConstant');

const routers = [];

const payloadPost = Joi.object({
  app_id: QuerysConstant.APP_ID.valid(
    'ad944424393cf309efaf0e70f1b125cb',
    'faf0e70f1bad944424393cf309e125cb',
    'd944424393cf309e125cbfaf0e70f1ba'
  ).example('ad944424393cf309efaf0e70f1b125cb').required(),
  base_release_id: QuerysConstant.BASE_RELEASE_ID.required(),
  destination_release_id: QuerysConstant.DESTINATION_RELEASE_ID.required(),
  title: QuerysConstant.PLATFORM_RELEASE_PUSH_NOTIFICATION_TITLE.required(),
  message: QuerysConstant.PLATFORM_RELEASE_PUSH_NOTIFICATION_MESSAGE.required(),
  force_update: QuerysConstant.PLATFORM_RELEASE_PUSH_NOTIFICATION_FORCE_UPDATE.required()
});


const payloadPut = Joi.object({
  title: QuerysConstant.PLATFORM_RELEASE_PUSH_NOTIFICATION_TITLE.required(),
  message: QuerysConstant.PLATFORM_RELEASE_PUSH_NOTIFICATION_MESSAGE.required(),
  force_update: QuerysConstant.PLATFORM_RELEASE_PUSH_NOTIFICATION_FORCE_UPDATE.required()
});

const response = Joi.object({
  id: QuerysConstant.ID,
  app_id: QuerysConstant.APP_ID,
  base_release: Joi.object({
    release_id: QuerysConstant.ID,
    version: QuerysConstant.VERSION,
    build_number: QuerysConstant.BUILD_NUMBER
  }).description('Base release infomation'),
  destination_release: Joi.object({
    release_id: QuerysConstant.ID,
    version: QuerysConstant.VERSION,
    build_number: QuerysConstant.BUILD_NUMBER,
    url_download: QuerysConstant.RELEASE_URL_DOWNLOAD.optional().allow(null, '')
  }).description('Destination release infomation'),
  title: QuerysConstant.PLATFORM_RELEASE_PUSH_NOTIFICATION_TITLE,
  message: QuerysConstant.PLATFORM_RELEASE_PUSH_NOTIFICATION_MESSAGE,
  force_update: QuerysConstant.PLATFORM_RELEASE_PUSH_NOTIFICATION_FORCE_UPDATE,
  created_date: QuerysConstant.CREATED_DATE,
  updated_date: QuerysConstant.UPDATED_DATE
});

routers.push({
  method: 'GET',
  path: '/platform-release-push-notifications',
  options: {
    auth: 'OAuth',
    handler(request, h) {
      return PlatformReleasePushNotificationModule.GetPlatformReleases(request, h);
    },
    description: 'Get platform release push notifications',
    validate: {
      headers: QuerysConstant.HEADERS_ACCESS_TOKEN,
      query: Joi.object({
        filter_key: QuerysConstant.PLATFORM_RELEASE_FILTER_KEY,
        keyword: QuerysConstant.KEYWORD,
        sort: QuerysConstant.PLATFORM_RELEASE_SORT,
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

        [`${Code.INVALID_PAYLOAD_PARAMS}#1`]: Joi.object({
          code: QuerysConstant.CODE.example(Code.INVALID_PAYLOAD_PARAMS),
          error: Joi.object({
            message: QuerysConstant.MESSAGE.example('Invalid filter_key value, please check available filter_key')
          })
        }).description('Invalid filter_key value, please check available filter_key'),

        [`${Code.INVALID_PAYLOAD_PARAMS}#2`]: Joi.object({
          code: QuerysConstant.CODE.example(Code.INVALID_PAYLOAD_PARAMS),
          error: Joi.object({
            message: QuerysConstant.MESSAGE.example('Invalid sort field, please check available sort field')
          })
        }).description('Invalid sort field, please check available sort field'),

        [`${Code.INVALID_PERMISSION}#`]: Joi.object({
          code: QuerysConstant.CODE.example(Code.INVALID_PERMISSION),
          error: Joi.object({
            message: QuerysConstant.MESSAGE.example('You don\'t have permission to perform this action')
          })
        }).description('Invalid permission, only PO can perform this action'),

        [`${Code.SYSTEM_ERROR}  `]: Joi.object().description('System error')
      }
    },
    tags: ['api', 'Platform release']
  }
});

routers.push({
  method: 'GET',
  path: '/platform-release-push-notifications/{id}',
  options: {
    auth: 'OAuth',
    handler(request, h) {
      return PlatformReleasePushNotificationModule.GetPlatformRelease(request, h);
    },
    description: 'Get platform release push notifications',
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

        [`${Code.INVALID_PERMISSION}#`]: Joi.object({
          code: QuerysConstant.CODE.example(Code.INVALID_PERMISSION),
          error: Joi.object({
            message: QuerysConstant.MESSAGE.example('You don\'t have permission to perform this action')
          })
        }).description('Invalid permission, only PO can perform this action'),

        [`${Code.INVALID_SERVICE}#`]: Joi.object({
          code: QuerysConstant.CODE.example(Code.INVALID_SERVICE),
          error: Joi.object({
            message: QuerysConstant.MESSAGE.example('Platform release doesn\'t exist')
          })
        }).description('Platform release doesn\'t exist'),

        [`${Code.SYSTEM_ERROR}  `]: Joi.object().description('System error')
      }
    },
    tags: ['api', 'Platform release']
  }
});

routers.push({
  method: 'POST',
  path: '/platform-release-push-notifications',
  options: {
    auth: 'OAuth',
    handler(request, h) {
      return PlatformReleasePushNotificationModule.CreatePlatformRelease(request, h);
    },
    description: 'Create platform release push notifications',
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
              QuerysConstant.MESSAGE.example('Release platform push notification already exist')
            )
          })
        }).description('Already exist a release platform push notification that has base_release_id and  destination_release_id'),

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
              QuerysConstant.MESSAGE.example('Create platform release push notification failed, please try again later!')
            )
          })
        }).description('When everything is alright but can not create platform release push notification. This is server error'),

        [`${Code.SYSTEM_ERROR}  `]: Joi.object().description('System error')
      }
    },
    tags: ['api', 'Platform release']
  }
});

routers.push({
  method: 'PUT',
  path: '/platform-release-push-notifications/{id}',
  options: {
    auth: 'OAuth',
    handler(request, h) {
      return PlatformReleasePushNotificationModule.ModifyPlatformRelease(request, h);
    },
    description: 'Modify platform release push notifications',
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
            message: QuerysConstant.MESSAGE.example('Release platform push notification doesn\'t exist')
          })
        }).description('Release platform push notification doesn\'t exist'),

        [`${Code.INVALID_PAYLOAD_PARAMS}`]: Joi.object({
          code: QuerysConstant.CODE.example(Code.INVALID_PAYLOAD_PARAMS),
          error: Joi.object({
            message: Joi.array().items(
              QuerysConstant.MESSAGE.example('Update platform release push notification failed, please try again later!')
            )
          })
        }).description('When everything is alright but can not update platform release push notification. This is server error'),

        [`${Code.SYSTEM_ERROR}  `]: Joi.object().description('System error')
      }
    },
    tags: ['api', 'Platform release']
  }
});

routers.push({
  method: 'DELETE',
  path: '/platform-release-push-notifications/{id}',
  options: {
    auth: 'OAuth',
    handler(request, h) {
      return PlatformReleasePushNotificationModule.DeletePlatformRelease(request, h);
    },
    description: 'Delete platform release push notifications',
    validate: {
      headers: QuerysConstant.HEADERS_ACCESS_TOKEN,
      params: Joi.object({
        id: QuerysConstant.ID.required()
      })
    },
    response: {
      status: {
        [Code.NO_CONTENT]: Joi.object().description('Delete successfully'),
        [`${Code.INVALID_SERVICE}#`]: Joi.object({
          code: QuerysConstant.CODE.example(Code.INVALID_SERVICE),
          error: Joi.object({
            message: QuerysConstant.MESSAGE.example('Platform release doesn\'t exist')
          })
        }).description('Platform release doesn\'t exist'),
        [Code.SYSTEM_ERROR]: Joi.object().description('System error')
      }
    },
    tags: ['api', 'Platform release']
  }
});

module.exports = routers;
