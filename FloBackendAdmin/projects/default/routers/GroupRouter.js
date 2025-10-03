const Joi = require('joi');
const Code = require('../constants/ResponseCodeConstant');
const QuerysConstant = require('../constants/QuerysConstant');
const GroupModule = require('../modules/GroupModule');

const routers = [];

const groupObject = Joi.object({
  id: QuerysConstant.ID,
  name: QuerysConstant.GROUP_NAME,
  description: QuerysConstant.GROUP_DESCRIPTION.optional().allow('', null),
  group_type: QuerysConstant.GROUP_TYPE,
  is_default: QuerysConstant.IS_DEFAULT,
  internal_group: QuerysConstant.INTERNAL_GROUP,
  created_date: QuerysConstant.CREATED_DATE,
  updated_date: QuerysConstant.UPDATED_DATE
});

routers.push({
  method: 'GET',
  path: '/groups',
  options: {
    auth: 'OAuth',
    handler(request, h) {
      return GroupModule.GetGroups(request, h);
    },
    description: 'Get all groups. Only PO can use this API',
    validate: {
      headers: QuerysConstant.HEADERS_ACCESS_TOKEN,
      query: Joi.object({
        page: QuerysConstant.PAGE.required(),
        max_rows: QuerysConstant.MAX_ROWS.required(),
        keyword: QuerysConstant.KEYWORD,
        is_internal: QuerysConstant.IS_INTERNAL.optional()
      })
    },
    response: {
      status: {
        [Code.REQUEST_SUCCESS]: Joi.object({
          code: Joi.number().example(200),
          data: Joi.array().items(
            groupObject.keys({
              number_users: QuerysConstant.NUMBER_USERS
            }))
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
    tags: ['api', 'Groups']
  }
});

routers.push({
  method: 'GET',
  path: '/groups/{id}',
  options: {
    auth: 'OAuth',
    handler(request, h) {
      return GroupModule.GetGroup(request, h);
    },
    description: 'Get a group via id. Only PO can use this API',
    validate: {
      params: Joi.object({
        id: QuerysConstant.ID
      })
    },
    response: {
      status: {
        [Code.REQUEST_SUCCESS]: Joi.object({
          code: Joi.number().example(200),
          data: groupObject
        }).description('Request successful'),

        [`${Code.INVALID_PERMISSION}#`]: Joi.object({
          code: QuerysConstant.CODE.example(Code.INVALID_PERMISSION),
          error: Joi.object({
            message: QuerysConstant.MESSAGE.example('You don\'t have permission to perform this action')
          })
        }).description('Invalid permission, only PO can perform this action'),

        [`${Code.INVALID_SERVICE}#`]: Joi.object({
          code: QuerysConstant.CODE.example(Code.INVALID_SERVICE),
          error: Joi.object({
            message: QuerysConstant.MESSAGE.example('Group doesn\'t exist')
          })
        }).description('Group doesn\'t exist'),

        [`${Code.SYSTEM_ERROR}  `]: Joi.object().description('System error')
      }
    },
    tags: ['api', 'Groups']
  }
});

routers.push({
  method: 'POST',
  path: '/groups',
  options: {
    auth: 'OAuth',
    handler(request, h) {
      return GroupModule.CreateGroup(request, h);
    },
    description: 'Create a group. Only PO can use this API',
    validate: {
      headers: QuerysConstant.HEADERS_ACCESS_TOKEN,
      payload: Joi.object({
        name: QuerysConstant.GROUP_NAME.required(),
        group_type: QuerysConstant.GROUP_TYPE.optional().default('1'),
        description: QuerysConstant.GROUP_DESCRIPTION.optional().allow('', null)
      })
    },
    response: {
      status: {
        [Code.REQUEST_SUCCESS]: Joi.object({
          code: Joi.number().example(200),
          data: groupObject
        }).description('Request successful'),

        [`${Code.INVALID_PERMISSION}#`]: Joi.object({
          code: QuerysConstant.CODE.example(Code.INVALID_PERMISSION),
          error: Joi.object({
            message: QuerysConstant.MESSAGE.example('You don\'t have permission to perform this action')
          })
        }).description('Invalid permission, only PO can perform this action'),

        [`${Code.INVALID_PAYLOAD_PARAMS}#1`]: Joi.object({
          code: QuerysConstant.CODE.example(Code.INVALID_PAYLOAD_PARAMS),
          error: Joi.object({
            message: Joi.array().items(
              QuerysConstant.MESSAGE.example('Group name is already exists')
            )
          })
        }).description('Group name is already exists'),

        [`${Code.INVALID_PAYLOAD_PARAMS}#2`]: Joi.object({
          code: QuerysConstant.CODE.example(Code.INVALID_PAYLOAD_PARAMS),
          error: Joi.object({
            message: Joi.array().items(
              QuerysConstant.MESSAGE.example('Create group fail, please try again later!')
            )
          })
        }).description('When everything is alright but can not create group. This is server error'),

        [`${Code.SYSTEM_ERROR}  `]: Joi.object().description('System error')
      }
    },
    tags: ['api', 'Groups']
  }
});

routers.push({
  method: 'PUT',
  path: '/groups/{id}',
  options: {
    auth: 'OAuth',
    handler(request, h) {
      return GroupModule.UpdateGroup(request, h);
    },
    description: 'Update a group via id. Only PO can use this API',
    validate: {
      headers: QuerysConstant.HEADERS_ACCESS_TOKEN,
      params: Joi.object({
        id: QuerysConstant.ID
      }),
      payload: Joi.object({
        name: QuerysConstant.GROUP_NAME.optional(),
        group_type: QuerysConstant.GROUP_TYPE.optional(),
        description: QuerysConstant.GROUP_DESCRIPTION.optional().allow('', null)
      })
    },
    response: {
      status: {
        [Code.REQUEST_SUCCESS]: Joi.object({
          code: Joi.number().example(200),
          data: groupObject
        }).description('Request successful'),

        [`${Code.INVALID_PERMISSION}#`]: Joi.object({
          code: QuerysConstant.CODE.example(Code.INVALID_PERMISSION),
          error: Joi.object({
            message: QuerysConstant.MESSAGE.example('You don\'t have permission to perform this action')
          })
        }).description('Invalid permission, only PO can perform this action'),

        [`${Code.INVALID_SERVICE}#`]: Joi.object({
          code: QuerysConstant.CODE.example(Code.INVALID_SERVICE),
          error: Joi.object({
            message: QuerysConstant.MESSAGE.example('Group doesn\'t exist')
          })
        }).description('Group doesn\'t exist'),

        [`${Code.INVALID_PAYLOAD_PARAMS}#1`]: Joi.object({
          code: QuerysConstant.CODE.example(Code.INVALID_PAYLOAD_PARAMS),
          error: Joi.object({
            message: Joi.array().items(
              QuerysConstant.MESSAGE.example('Group name is already exists')
            )
          })
        }).description('Group name is already exists'),

        [`${Code.INVALID_PAYLOAD_PARAMS}#2`]: Joi.object({
          code: QuerysConstant.CODE.example(Code.INVALID_PAYLOAD_PARAMS),
          error: Joi.object({
            message: Joi.array().items(
              QuerysConstant.MESSAGE.example('Update group fail, please try again later!')
            )
          })
        }).description('When everything is alright but can not update group'),

        [`${Code.SYSTEM_ERROR} `]: Joi.object().description('System error')
      }
    },
    tags: ['api', 'Groups']
  }
});

routers.push({
  method: 'DELETE',
  path: '/groups/{id}',
  options: {
    auth: 'OAuth',
    handler(request, h) {
      return GroupModule.DeleteGroup(request, h);
    },
    description: 'Delete a group via id. Only PO can use this API',
    validate: {
      headers: QuerysConstant.HEADERS_ACCESS_TOKEN,
      params: Joi.object({
        id: QuerysConstant.ID
      })
    },
    response: {
      status: {
        [Code.NO_CONTENT]: Joi.object({}).description('Delete successful'),
        [`${Code.INVALID_PERMISSION}#`]: Joi.object({
          code: QuerysConstant.CODE.example(Code.INVALID_PERMISSION),
          error: Joi.object({
            message: QuerysConstant.MESSAGE.example('You don\'t have permission to perform this action')
          })
        }).description('Invalid permission, only PO can perform this action'),

        [`${Code.INVALID_SERVICE}#`]: Joi.object({
          code: QuerysConstant.CODE.example(Code.INVALID_SERVICE),
          error: Joi.object({
            message: QuerysConstant.MESSAGE.example('Group doesn\'t exist')
          })
        }).description('Group doesn\'t exist'),

        [`${Code.SYSTEM_ERROR}  `]: Joi.object().description('System error')
      }
    },
    tags: ['api', 'Groups']
  }
});

module.exports = routers;
