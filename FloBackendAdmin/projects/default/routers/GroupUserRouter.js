const Joi = require('joi');
const Code = require('../constants/ResponseCodeConstant');
const GroupUserModule = require('../modules/GroupUserModule');
const QuerysConstant = require('../constants/QuerysConstant');

const routers = [];

const responseGroupUser = Joi.object({
  id: QuerysConstant.ID,
  fullname: QuerysConstant.USER_FULLNAME.optional().allow(null, ''),
  email: QuerysConstant.EMAIL,
  account_3rd: QuerysConstant.ACCOUNT_3RD,
  account_3rd_emails: QuerysConstant.ACCOUNT_3RD_EMAIL.optional().allow(null, ''),
  storage: QuerysConstant.STORAGE,
  groups: QuerysConstant.GROUPS.optional().allow(null, ''),
  sub_id: QuerysConstant.SUB_ID.optional().allow(null, ''),
  subs_type: QuerysConstant.SUBS_TYPE.optional().allow(null, ''),
  subs_time: QuerysConstant.SUBS_TIME.optional().allow(null, ''),
  last_used_date: QuerysConstant.LAST_USED_DATE.optional().allow(null, ''),
  subs_current_date: QuerysConstant.SUB_CURRENT_DATE.optional().allow(null, ''),
  join_date: QuerysConstant.JOIN_DATE.optional().allow(null, ''),
  next_renewal: QuerysConstant.NEXT_RENEWAL.optional().allow(null, ''),
  disabled: QuerysConstant.DISABLED.optional().allow(null, ''),
  deleted: QuerysConstant.DELETED.optional().allow(null, ''),
  user_migrate_status: QuerysConstant.USER_MIGRATE_STATUS.optional().allow(null, ''),
  app_reg_id: QuerysConstant.APP_ID.allow(null, ''),
  platform: QuerysConstant.PLATFORM.allow(null, ''),
  flo_mac_update: QuerysConstant.FLO_MAC_UPDATE.allow(null, ''),
  role_id: QuerysConstant.ROLE_ID.allow(null, ''),
  role_name: QuerysConstant.ROLE_NAME.allow(null, ''),
  role_value: QuerysConstant.ROLE_VALUE.allow(null, '')
});

const usersQuery = {
  ids: QuerysConstant.IDS.optional().allow(null),
  group_ids: QuerysConstant.LIST_GROUP.optional().allow(null, ''),
  keyword: QuerysConstant.KEYWORD
    .optional()
    .allow(null, '')
    .description('Keyword search.\n Server will query field-value like %keyword%.\n\n Searching field: \n - email \n- account_3rd_emails'),
  sort: QuerysConstant.USERS_SORT.optional().allow(null, ''),
  account_types: QuerysConstant.ACCOUNT_TYPE.optional().allow(null, ''),
  subscription_types: QuerysConstant.SUBSCRIPTION_TYPE.optional().allow(null, ''),
  last_used_start: QuerysConstant.LAST_USED_DATE.optional().allow(null, ''),
  last_used_end: QuerysConstant.LAST_USED_DATE.optional().allow(null, ''),
  join_date_start: QuerysConstant.JOIN_DATE_RANGE.optional().allow(null, ''),
  join_date_end: QuerysConstant.JOIN_DATE_RANGE.optional().allow(null, ''),
  is_disabled: QuerysConstant.DISABLED.optional().allow(null, ''),
  is_deleted: QuerysConstant.DELETED.optional().allow(null, ''),
  platform_ids: QuerysConstant.APP_IDS.optional().allow(null, ''),
  platform_filter_type: QuerysConstant.GROUP_FILTER_TYPE.allow(null, ''),
  migration_status: QuerysConstant.MIGRATION_STATUS.optional().allow(null),
  group_filter_type: QuerysConstant.GROUP_FILTER_TYPE.allow(null, ''),
  flo_mac_update: QuerysConstant.FLO_MAC_UPDATE_FILTER.allow(null, ''),
  flo_mac_filter_type: QuerysConstant.GROUP_FILTER_TYPE.allow(null, ''),
  is_internal: QuerysConstant.IS_INTERNAL.optional()

};

routers.push({
  method: 'GET',
  path: '/users',
  options: {
    auth: 'OAuth',
    handler(request, h) {
      return GroupUserModule.GetGroupUsers(request, h);
    },
    description: 'Get list user',
    validate: {
      headers: QuerysConstant.HEADERS_ACCESS_TOKEN,
      query: Joi.object({
        ...usersQuery,
        page: QuerysConstant.PAGE.required(),
        max_rows: QuerysConstant.MAX_ROWS.required()
      })
    },
    response: {
      status: {
        [Code.REQUEST_SUCCESS]: Joi.object({
          code: Joi.number().example(200),
          data: Joi.array().items(responseGroupUser)
        }).description('Request successfully'),

        [`${Code.INVALID_PAYLOAD_PARAMS}#1`]: Joi.object({
          code: QuerysConstant.CODE.example(Code.INVALID_PAYLOAD_PARAMS),
          error: Joi.object({
            message: Joi.array().items(
              QuerysConstant.MESSAGE.example('Invalid sort field, please check available sort field')
            )
          })
        }).description('Request fail'),

        [`${Code.INVALID_PAYLOAD_PARAMS}#2`]: Joi.object({
          code: QuerysConstant.CODE.example(Code.INVALID_PAYLOAD_PARAMS),
          error: Joi.object({
            message: Joi.array().items(
              QuerysConstant.MESSAGE.example('Invalid id number, id must be between 1 and 4294967295')
            )
          })
        }).description('Request fail'),

        [`${Code.INVALID_PAYLOAD_PARAMS}#3`]: Joi.object({
          code: QuerysConstant.CODE.example(Code.INVALID_PAYLOAD_PARAMS),
          error: Joi.object({
            message: Joi.array().items(
              QuerysConstant.MESSAGE.example('Invalid group_id number, group_id must be between -2147483647 and 2147483647')
            )
          })
        }).description('Request fail'),

        [`${Code.INVALID_PAYLOAD_PARAMS}#4`]: Joi.object({
          code: QuerysConstant.CODE.example(Code.INVALID_PAYLOAD_PARAMS),
          error: Joi.object({
            message: Joi.array().items(
              QuerysConstant.MESSAGE.example('Invalid account_type value, please check available account types')
            )
          })
        }).description('Request fail'),

        [`${Code.INVALID_PAYLOAD_PARAMS}#5`]: Joi.object({
          code: QuerysConstant.CODE.example(Code.INVALID_PAYLOAD_PARAMS),
          error: Joi.object({
            message: Joi.array().items(
              QuerysConstant.MESSAGE.example('Invalid subscription_type value, please check available subscription types')
            )
          })
        }).description('Request fail'),

        [`${Code.INVALID_PERMISSION}#`]: Joi.object({
          code: QuerysConstant.CODE.example(Code.INVALID_PERMISSION),
          error: Joi.object({
            message: QuerysConstant.MESSAGE.example('You don\'t have permission to perform this action')
          })
        }).description('Invalid permission, only PO can perform this action'),

        [Code.SYSTEM_ERROR]: Joi.object().description('System error')
      }
    },
    tags: ['api', 'User']
  }
});

routers.push({
  method: 'GET',
  path: '/groups/{group_id}/users',
  options: {
    auth: 'OAuth',
    handler(request, h) {
      return GroupUserModule.GetGroupUser(request, h);
    },
    description: 'Get list user from group',
    validate: {
      headers: QuerysConstant.HEADERS_ACCESS_TOKEN,
      params: Joi.object({
        group_id: QuerysConstant.GROUP_ID
      }),
      query: Joi.object({
        keyword: QuerysConstant.KEYWORD.optional().allow(null, ''),
        page: QuerysConstant.PAGE.required(),
        max_rows: QuerysConstant.MAX_ROWS.required()
      })
    },
    response: {
      status: {
        [Code.REQUEST_SUCCESS]: Joi.object({
          code: Joi.number().example(Code.REQUEST_SUCCESS),
          data: Joi.array().items(responseGroupUser)
        }).description('Request successfully'),

        [`${Code.INVALID_PERMISSION}#`]: Joi.object({
          code: QuerysConstant.CODE.example(Code.INVALID_PERMISSION),
          error: Joi.object({
            message: QuerysConstant.MESSAGE.example('You don\'t have permission to perform this action')
          })
        }).description('Invalid permission, only PO can perform this action'),

        [Code.SYSTEM_ERROR]: Joi.object().description('System error')
      }
    },
    tags: ['api', 'Group Users']
  }
});

routers.push({
  method: 'POST',
  path: '/groups/users',
  options: {
    auth: 'OAuth',
    handler(request, h) {
      return GroupUserModule.CreateGroupUser(request, h);
    },
    description: 'Create many group with users \n Filters : Email filter only. Only working when type = 1. Emails Only working when type = 0',
    validate: {
      headers: QuerysConstant.HEADERS_ACCESS_TOKEN,
      payload: Joi.object({
        type: QuerysConstant.GROUP_RELEASE_TYPE.required(),
        group_ids: Joi.array().items(QuerysConstant.GROUP_ID).required().min(1),
        emails: Joi.array().items(QuerysConstant.EMAIL).required().min(1)
      })
    },
    response: {
      status: {
        [Code.CREATE_SUCCESS]: Joi.object({
          code: Joi.number().example(Code.CREATE_SUCCESS)
        }).description('Request successfully'),

        [`${Code.INVALID_PAYLOAD_PARAMS}#1`]: Joi.object({
          code: QuerysConstant.CODE.example(Code.INVALID_PAYLOAD_PARAMS),
          error: Joi.object({
            message: Joi.array().items(
              QuerysConstant.MESSAGE.example('Invalid emails')
            )
          })
        }).description('Invalid emails'),

        [`${Code.INVALID_PAYLOAD_PARAMS}#2`]: Joi.object({
          code: QuerysConstant.CODE.example(Code.INVALID_PAYLOAD_PARAMS),
          error: Joi.object({
            message: Joi.array().items(
              QuerysConstant.MESSAGE.example('Invalid groups')
            )
          })
        }).description('Invalid groups'),

        [`${Code.INVALID_PERMISSION}#`]: Joi.object({
          code: QuerysConstant.CODE.example(Code.INVALID_PERMISSION),
          error: Joi.object({
            message: QuerysConstant.MESSAGE.example('You don\'t have permission to perform this action')
          })
        }).description('Invalid permission, only PO can perform this action'),

        [`${Code.INVALID_SERVICE}`]: Joi.object({
          code: QuerysConstant.CODE.example(Code.INVALID_SERVICE),
          error: Joi.object({
            message: QuerysConstant.MESSAGE.example('User doesn\'t exist')

          })
        }).description('Request fail'),

        [Code.SYSTEM_ERROR]: Joi.object().description('System error')
      }
    },
    tags: ['api', 'Group Users']
  }
});

routers.push({
  method: 'DELETE',
  path: '/groups/{group_id}/users',
  options: {
    auth: 'OAuth',
    handler(request, h) {
      return GroupUserModule.DeleteGroupUser(request, h);
    },
    description: 'Delete user in group',
    validate: {
      headers: QuerysConstant.HEADERS_ACCESS_TOKEN,
      params: Joi.object({
        group_id: QuerysConstant.ID
      }),
      payload: Joi.object({
        emails: Joi.array().items(QuerysConstant.EMAIL)
      })
    },
    response: {
      status: {
        [Code.NO_CONTENT]: Joi.object({}).description('Delete successful'),
        [Code.NOT_FOUND]: Joi.object({
          code: QuerysConstant.CODE.example(Code.NOT_FOUND),
          error: Joi.object({
            message: QuerysConstant.MESSAGE.example('Not found')
          })
        }).description('Not found'),

        [`${Code.INVALID_PAYLOAD_PARAMS}#1`]: Joi.object({
          code: QuerysConstant.CODE.example(Code.INVALID_PAYLOAD_PARAMS),
          error: Joi.object({
            message: Joi.array().items(
              QuerysConstant.MESSAGE.example('Invalid emails')
            )
          })
        }).description('Invalid emails'),

        [`${Code.INVALID_PAYLOAD_PARAMS}#2`]: Joi.object({
          code: QuerysConstant.CODE.example(Code.INVALID_PAYLOAD_PARAMS),
          error: Joi.object({
            message: Joi.array().items(
              QuerysConstant.MESSAGE.example('Invalid groups')
            )
          })
        }).description('Invalid groups'),

        [`${Code.INVALID_PERMISSION}#`]: Joi.object({
          code: QuerysConstant.CODE.example(Code.INVALID_PERMISSION),
          error: Joi.object({
            message: QuerysConstant.MESSAGE.example('You don\'t have permission to perform this action')
          })
        }).description('Invalid permission, only PO can perform this action'),

        [Code.SYSTEM_ERROR]: Joi.object().description('System error')
      }
    },
    tags: ['api', 'Group Users']
  }
});

routers.push({
  method: 'GET',
  path: '/users/export',
  options: {
    auth: 'OAuth',
    handler(request, h) {
      return GroupUserModule.ExportGroupUsers(request, h);
    },
    description: 'Export users to CSV',
    validate: {
      headers: QuerysConstant.HEADERS_ACCESS_TOKEN,
      query: Joi.object({
        ...usersQuery,
        fields: QuerysConstant.FIELDS
          .optional()
          .allow(null, '')
          .description('Fields name that client want to export.\n Default return fields are: \n - fullname \n - email \n - account_3rd_emails\n\n Available field: \n - fullname \n- email \n- account_3rd \n- account_3rd_emails \n- storage \n - groups \n- sub_id \n- subs_type \n- subs_time \n- last_used_date \n- subs_current_date \n- join_date \n- next_renewal \n- disabled \n- deleted')
      })
    },
    response: {
      status: {
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
              QuerysConstant.MESSAGE.example('Invalid field name, please check available field names')
            )
          })
        }).description('Request fail'),

        [`${Code.INVALID_PAYLOAD_PARAMS}#2`]: Joi.object({
          code: QuerysConstant.CODE.example(Code.INVALID_PAYLOAD_PARAMS),
          error: Joi.object({
            message: Joi.array().items(
              QuerysConstant.MESSAGE.example('Invalid sort field, please check available sort field')
            )
          })
        }).description('Request fail'),

        [`${Code.INVALID_PAYLOAD_PARAMS}#3`]: Joi.object({
          code: QuerysConstant.CODE.example(Code.INVALID_PAYLOAD_PARAMS),
          error: Joi.object({
            message: Joi.array().items(
              QuerysConstant.MESSAGE.example('Invalid id number, id must be between 1 and 4294967295')
            )
          })
        }).description('Request fail'),

        [`${Code.INVALID_PAYLOAD_PARAMS}#4`]: Joi.object({
          code: QuerysConstant.CODE.example(Code.INVALID_PAYLOAD_PARAMS),
          error: Joi.object({
            message: Joi.array().items(
              QuerysConstant.MESSAGE.example('Invalid group_id number, group_id must be between -2147483647 and 2147483647')
            )
          })
        }).description('Request fail'),

        [`${Code.INVALID_PAYLOAD_PARAMS}#5`]: Joi.object({
          code: QuerysConstant.CODE.example(Code.INVALID_PAYLOAD_PARAMS),
          error: Joi.object({
            message: Joi.array().items(
              QuerysConstant.MESSAGE.example('Invalid account_type value, please check available account types')
            )
          })
        }).description('Request fail'),

        [`${Code.INVALID_PAYLOAD_PARAMS}#5`]: Joi.object({
          code: QuerysConstant.CODE.example(Code.INVALID_PAYLOAD_PARAMS),
          error: Joi.object({
            message: Joi.array().items(
              QuerysConstant.MESSAGE.example('Invalid subscription_type value, please check available subscription types')
            )
          })
        }).description('Request fail'),

        [`${Code.SYSTEM_ERROR}`]: Joi.object().description('System error')
      }
    },
    tags: ['api', 'User']
  }
});

module.exports = routers;
