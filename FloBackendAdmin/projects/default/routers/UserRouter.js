const Joi = require('joi');
const { any } = require('joi');
const Code = require('../constants/ResponseCodeConstant');
const UserModule = require('../modules/UserModule');
const QuerysConstant = require('../constants/QuerysConstant');

const routers = [];

const responseFrozenUser = Joi.object({
  id: QuerysConstant.ID,
  fullname: QuerysConstant.USER_FULLNAME.optional().allow(null, ''),
  email: QuerysConstant.EMAIL,
  account_3rd: QuerysConstant.ACCOUNT_3RD,
  account_3rd_emails: QuerysConstant.ACCOUNT_3RD_EMAIL.optional().allow(null, ''),
  storage: QuerysConstant.STORAGE,
  groups: QuerysConstant.GROUPS.optional().allow(null, ''),
  group_ids: Joi.array().items(Joi.number()),
  last_used_date: QuerysConstant.LAST_USED_DATE.optional().allow(null, ''),
  subs_current_date: QuerysConstant.SUB_CURRENT_DATE.optional().allow(null, ''),
  join_date: QuerysConstant.JOIN_DATE.optional().allow(null, ''),
  next_renewal: QuerysConstant.NEXT_RENEWAL.optional().allow(null, ''),
  disabled: QuerysConstant.DISABLED.optional().allow(null, ''),
  delete_status: QuerysConstant.DELETED.optional().allow(null, ''),
  migrates: Joi.string(),
  migrate_status: QuerysConstant.USER_MIGRATE_STATUS.optional().allow(null, ''),
  app_reg_id: QuerysConstant.APP_ID.allow(null, ''),
  platform: QuerysConstant.PLATFORM.allow(null, ''),
  time_remain: Joi.number()
});

const responseFreeze = Joi.object({
  items: Joi.array().items(
    QuerysConstant.EMAIL.example('success_test@flomail.net')
  ),
  failed_items: Joi.array().items(Joi.object({
    email: QuerysConstant.EMAIL.example('failed_test@flomail.net'),
    message: QuerysConstant.MESSAGE.example('User has been already frozen')
  }))
});

const responseUnFreeze = Joi.object({
  items: Joi.array().items(
    QuerysConstant.EMAIL.example('success_test@flomail.net')
  ),
  failed_items: Joi.array().items(Joi.object({
    email: QuerysConstant.EMAIL.example('failed_test@flomail.net'),
    message: QuerysConstant.MESSAGE.example('User has been already unfrozen')
  }))
});

const responseDeleted = Joi.object({
  items: Joi.array().items(
    QuerysConstant.EMAIL.example('success_test@flomail.net')
  ),
  failed_items: Joi.array().items(Joi.object({
    email: QuerysConstant.EMAIL.example('doesn_exist_email@flomail.net'),
    message: QuerysConstant.MESSAGE.example('User doesn\'t exist')
  }))
});

const responseRecover = Joi.object({
  items: Joi.array().items(
    QuerysConstant.EMAIL.example('success_recover@flomail.net')
  ),
  failed_items: Joi.array().items(Joi.object({
    email: QuerysConstant.EMAIL.example('failed_recover@flomail.net'),
    message: QuerysConstant.MESSAGE.example('User doesn\'t exist')
  }))
});

const usersDeletedInfo = Joi.object();

const requestPutTerminate = Joi.object({
  activeStatus: Joi.number().valid(0, 1).required(),
  email: Joi.string().required()
});

const frozenQuery = {
  ids: QuerysConstant.LIST_ID.optional().allow(null, ''),
  group_ids: QuerysConstant.LIST_GROUP.optional().allow(null, ''),
  keyword: QuerysConstant.KEYWORD
    .optional()
    .allow(null, '')
    .description('Keyword search.\n Server will query field-value like %keyword%.\n\n Searching field: \n - email \n- account_3rd_emails'),
  sort: QuerysConstant.USERS_SORT.optional().allow(null, ''),
  group_type: QuerysConstant.GROUP_TYPE
    .optional()
    .allow(null, '')
    .description(' - 0: Group for QA/Team lead  \n - 1: RELEASE_GROUP: Group for Release '),
  account_types: QuerysConstant.ACCOUNT_TYPE.optional().allow(null, ''),
  last_used_start: QuerysConstant.LAST_USED_DATE.optional().allow(null, ''),
  last_used_end: QuerysConstant.LAST_USED_DATE.optional().allow(null, ''),
  join_date_start: QuerysConstant.JOIN_DATE_RANGE.optional().allow(null, ''),
  join_date_end: QuerysConstant.JOIN_DATE_RANGE.optional().allow(null, ''),
  is_disabled: QuerysConstant.DISABLED.optional().allow(null, ''),
  is_deleted: QuerysConstant.DELETED.optional().allow(null, ''),
  platform_ids: QuerysConstant.APP_IDS.optional().allow(null, ''),
  migration_status: QuerysConstant.MIGRATION_STATUS.optional().allow(null),
  group_filter_type: QuerysConstant.GROUP_FILTER_TYPE.allow(null, ''),
  platform_filter_type: QuerysConstant.GROUP_FILTER_TYPE.allow(null, ''),
  migrate_filter_type: QuerysConstant.GROUP_FILTER_TYPE.allow(null, '')
};
const frozenResponseStatus = {
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
};
routers.push({
  method: 'GET',
  path: '/users/frozen',
  options: {
    auth: 'OAuth',
    handler(request, h) {
      return UserModule.GetFrozenUsers(request, h);
    },
    description: 'Get list frozen user',
    validate: {
      headers: QuerysConstant.HEADERS_ACCESS_TOKEN,
      query: Joi.object({
        ...frozenQuery,
        page: QuerysConstant.PAGE.required(),
        max_rows: QuerysConstant.MAX_ROWS.required()
      })
    },
    response: {
      status: {
        ...frozenResponseStatus,
        [Code.REQUEST_SUCCESS]: Joi.object({
          code: Joi.number().example(200),
          data: Joi.array().items(responseFrozenUser)
        }).description('Request successfully')
      }
    },
    tags: ['api', 'User']
  }
});
routers.push({
  method: 'GET',
  path: '/users/frozen/export',
  options: {
    auth: 'OAuth',
    handler(request, h) {
      return UserModule.ExportFrozenUsers(request, h);
    },
    description: 'Export frozen users to CSV',
    validate: {
      headers: QuerysConstant.HEADERS_ACCESS_TOKEN,
      query: Joi.object(frozenQuery)
    },
    response: {
      status: frozenResponseStatus
    },
    tags: ['api', 'User']
  }
});

routers.push({
  method: 'GET',
  path: '/users/terminate',
  options: {
    auth: 'OAuth',
    handler(request, h) {
      return UserModule.GetUsersDeleted(request, h);
    },
    description: 'Get terminate users information',
    validate: {
      headers: QuerysConstant.HEADERS_ACCESS_TOKEN,
      query: Joi.object({
        sort: QuerysConstant.SORT,
        page: QuerysConstant.PAGE.required(),
        max_rows: QuerysConstant.MAX_ROWS.required()
      })
    },
    response: {
      status: {
        [Code.REQUEST_SUCCESS]: Joi.object({
          code: Joi.number().example(200),
          data: usersDeletedInfo
        }).description('Request successfully'),

        [Code.SYSTEM_ERROR]: Joi.object().description('System error')
      }
    },
    tags: ['api', 'User']
  }
});

routers.push({
  method: 'PUT',
  path: '/users/terminate',
  options: {
    auth: 'OAuth',
    handler(request, h) {
      return UserModule.PutUsersDeleted(request, h);
    },
    description: 'Update status of user terminate',
    validate: {
      headers: QuerysConstant.HEADERS_ACCESS_TOKEN,
      payload: Joi.array().items(requestPutTerminate).max(50).min(1)
    },
    response: {
      status: {
        [Code.REQUEST_SUCCESS]: Joi.object({
          code: Joi.number().example(200),
          data: usersDeletedInfo
        }).description('Request successfully'),

        [Code.SYSTEM_ERROR]: Joi.object().description('System error')
      }
    },

    tags: ['api', 'User']
  }
});

routers.push({
  method: 'GET',
  path: '/users/me',
  options: {
    auth: 'OAuth',
    handler(request, h) {
      return UserModule.GetInformation(request, h);
    },
    description: 'Get user information',
    validate: {
      headers: QuerysConstant.HEADERS_ACCESS_TOKEN
    },
    response: {
      status: {
        [Code.REQUEST_SUCCESS]: Joi.object({
          code: Joi.number().example(200),
          data: Joi.object({
            email: QuerysConstant.EMAIL.email().required(),
            role: QuerysConstant.ROLE.required()
          })
        }).description('Request successfully'),

        [Code.SYSTEM_ERROR]: Joi.object().description('System error')
      }
    },
    tags: ['api', 'User']
  }
});

routers.push({
  method: 'PUT',
  path: '/users/freeze',
  options: {
    auth: 'OAuth',
    handler(request, h) {
      return UserModule.Freeze(request, h);
    },
    description: 'Freeze account',
    validate: {
      headers: QuerysConstant.HEADERS_ACCESS_TOKEN,
      payload: Joi.object({
        emails: Joi.array()
          .items(QuerysConstant.EMAIL)
          .required()
          .max(50)
          .min(1)
      })
    },
    response: {
      status: {
        [Code.REQUEST_SUCCESS]: Joi.object({
          code: Joi.number().example(200),
          data: responseFreeze
        }).description('Freeze success \n \n *Available messages in the returned response:* \n - User doesn\'t exist \n- User has been already frozen \n- Invalid email format \n- Freeze user account fail \n- Can not freeze PO role'),

        [`${Code.INVALID_PAYLOAD_PARAMS}#1`]: Joi.object({
          code: QuerysConstant.CODE.example(Code.INVALID_PAYLOAD_PARAMS),
          error: Joi.object({
            message: Joi.array().items(
              'child emails fails because [emails must contain less than or equal to 50 items]'
            )
          })
        }).description('Maximum exceeded: maximum amount of email is 50'),

        [`${Code.INVALID_PAYLOAD_PARAMS}#2`]: Joi.object({
          code: QuerysConstant.CODE.example(Code.INVALID_PAYLOAD_PARAMS),
          error: Joi.object({
            message: Joi.array().items(
              'child emails fails because [emails must contain at least 1 items]'
            )
          })
        }).description('Minimum exceed: minimum amount of email is 1'),

        [`${Code.INVALID_PAYLOAD_PARAMS}#3`]: Joi.object({
          code: QuerysConstant.CODE.example(Code.INVALID_PAYLOAD_PARAMS),
          error: Joi.object({
            message: Joi.array().items(
              'Invalid request payload JSON format'
            )
          })
        }).description('Invalid request payload JSON format'),

        [`${Code.INVALID_PAYLOAD_PARAMS}#4`]: Joi.object({
          code: QuerysConstant.CODE.example(Code.INVALID_PAYLOAD_PARAMS),
          error: Joi.object({
            message: Joi.array().items(
              'child emails fails because [emails at position xx fails because [xx is not allowed to be empty]]'
            )
          })
        }).description('Invalid payload params'),

        [`${Code.INVALID_TOKEN}#1`]: Joi.object({
          code: QuerysConstant.CODE.example(Code.INVALID_TOKEN),
          error: Joi.object({
            message: QuerysConstant.MESSAGE.example('Unauthorized')
          })
        }).description('Unauthorized'),

        [`${Code.INVALID_TOKEN}#2`]: Joi.object({
          code: QuerysConstant.CODE.example(Code.INVALID_TOKEN),
          error: Joi.object({
            message: QuerysConstant.MESSAGE.example('Unauthorized. KeyApi has timed out!')
          })
        }).description('Unauthorized'),

        [`${Code.INVALID_TOKEN}#3`]: Joi.object({
          code: QuerysConstant.CODE.example(Code.INVALID_TOKEN),
          error: Joi.object({
            message: QuerysConstant.MESSAGE.example('Unauthorized. Header \'keyapi\' is missing!')
          })
        }).description('Unauthorized'),

        [`${Code.INVALID_TOKEN}#4`]: Joi.object({
          code: QuerysConstant.CODE.example(Code.INVALID_TOKEN),
          error: Joi.object({
            message: QuerysConstant.MESSAGE.example('Unauthorized. Header \'keyapi\' value should not be empty!')
          })
        }).description('Unauthorized'),

        [`${Code.INVALID_PERMISSION}#`]: Joi.object({
          code: QuerysConstant.CODE.example(Code.INVALID_PERMISSION),
          error: Joi.object({
            message: QuerysConstant.MESSAGE.example('You don\'t have permission to perform this action')
          })
        }).description('Invalid permission, only PO can perform this action'),
        [`${Code.SYSTEM_ERROR}  `]: Joi.object().description('System error')

      }
    },

    tags: ['api', 'User']
  }
});

routers.push({
  method: 'PUT',
  path: '/users/unfreeze',
  options: {
    auth: 'OAuth',
    handler(request, h) {
      return UserModule.UnFreeze(request, h);
    },
    description: 'UnFreeze account',
    validate: {
      headers: QuerysConstant.HEADERS_ACCESS_TOKEN,
      payload: Joi.object({
        emails: Joi.array()
          .items(QuerysConstant.EMAIL)
          .required()
          .max(50)
          .min(1)
      })
    },
    response: {
      status: {
        [Code.REQUEST_SUCCESS]: Joi.object({
          code: Joi.number().example(200),
          data: responseUnFreeze
        }).description('UnFreeze success \n \n *Available messages in the returned response:* \n - User doesn\'t exist \n - User has been already unfrozen \n - User account has been disabled \n - Invalid email format \n - UnFreeze user account fail \n - Can not unFreeze PO role'),

        [`${Code.INVALID_PAYLOAD_PARAMS}#1`]: Joi.object({
          code: QuerysConstant.CODE.example(Code.INVALID_PAYLOAD_PARAMS),
          error: Joi.object({
            message: Joi.array().items(
              'child emails fails because [emails must contain less than or equal to 50 items]'
            )
          })
        }).description('Maximum exceeded: maximum amount of email is 50'),

        [`${Code.INVALID_PAYLOAD_PARAMS}#2`]: Joi.object({
          code: QuerysConstant.CODE.example(Code.INVALID_PAYLOAD_PARAMS),
          error: Joi.object({
            message: Joi.array().items(
              'child emails fails because [emails must contain at least 1 items]'
            )
          })
        }).description('Minimum exceed: minimum amount of email is 1'),

        [`${Code.INVALID_PAYLOAD_PARAMS}#3`]: Joi.object({
          code: QuerysConstant.CODE.example(Code.INVALID_PAYLOAD_PARAMS),
          error: Joi.object({
            message: Joi.array().items(
              'Invalid request payload JSON format'
            )
          })
        }).description('Invalid request payload JSON format'),

        [`${Code.INVALID_PAYLOAD_PARAMS}#4`]: Joi.object({
          code: QuerysConstant.CODE.example(Code.INVALID_PAYLOAD_PARAMS),
          error: Joi.object({
            message: Joi.array().items(
              'child emails fails because [emails at position xx fails because [xx is not allowed to be empty]]'
            )
          })
        }).description('Invalid payload params'),

        [`${Code.INVALID_TOKEN}#1`]: Joi.object({
          code: QuerysConstant.CODE.example(Code.INVALID_TOKEN),
          error: Joi.object({
            message: QuerysConstant.MESSAGE.example('Unauthorized')
          })
        }).description('Unauthorized'),

        [`${Code.INVALID_TOKEN}#2`]: Joi.object({
          code: QuerysConstant.CODE.example(Code.INVALID_TOKEN),
          error: Joi.object({
            message: QuerysConstant.MESSAGE.example('Unauthorized. KeyApi has timed out!')
          })
        }).description('Unauthorized'),

        [`${Code.INVALID_TOKEN}#3`]: Joi.object({
          code: QuerysConstant.CODE.example(Code.INVALID_TOKEN),
          error: Joi.object({
            message: QuerysConstant.MESSAGE.example('Unauthorized. Header \'keyapi\' is missing!')
          })
        }).description('Unauthorized'),

        [`${Code.INVALID_TOKEN}#4`]: Joi.object({
          code: QuerysConstant.CODE.example(Code.INVALID_TOKEN),
          error: Joi.object({
            message: QuerysConstant.MESSAGE.example('Unauthorized. Header \'keyapi\' value should not be empty!')
          })
        }).description('Unauthorized'),

        [`${Code.INVALID_PERMISSION}#`]: Joi.object({
          code: QuerysConstant.CODE.example(Code.INVALID_PERMISSION),
          error: Joi.object({
            message: QuerysConstant.MESSAGE.example('You don\'t have permission to perform this action')
          })
        }).description('Invalid permission, only PO can perform this action'),
        [`${Code.SYSTEM_ERROR}  `]: Joi.object().description('System error')
      }
    },

    tags: ['api', 'User']
  }
});

routers.push({
  method: 'DELETE',
  path: '/users',
  options: {
    auth: 'OAuth',
    handler(request, h) {
      return UserModule.DeleteUsers(request, h);
    },
    description: 'Delete one or more users',
    validate: {
      headers: QuerysConstant.HEADERS_ACCESS_TOKEN,
      payload: Joi.object({
        emails: Joi.array()
          .items(QuerysConstant.EMAIL)
          .required()
          .max(50)
          .min(1)
      })
    },
    response: {
      status: {
        [Code.REQUEST_SUCCESS]: Joi.object({
          code: Joi.number().example(200),
          data: responseDeleted
        }).description('Delete success \n \n *Available messages in the returned response:* \n - User doesn\'t exist \n - User account has been disabled \n - Invalid email format \n - Delete user account fail \n - Can not delete PO role'),

        [`${Code.INVALID_PAYLOAD_PARAMS}#1`]: Joi.object({
          code: QuerysConstant.CODE.example(Code.INVALID_PAYLOAD_PARAMS),
          error: Joi.object({
            message: Joi.array().items(
              'child emails fails because [emails must contain less than or equal to 50 items]'
            )
          })
        }).description('Maximum exceeded: maximum amount of email is 50'),

        [`${Code.INVALID_PAYLOAD_PARAMS}#2`]: Joi.object({
          code: QuerysConstant.CODE.example(Code.INVALID_PAYLOAD_PARAMS),
          error: Joi.object({
            message: Joi.array().items(
              'child emails fails because [emails must contain at least 1 items]'
            )
          })
        }).description('Minimum exceed: minimum amount of email is 1'),

        [`${Code.INVALID_PAYLOAD_PARAMS}#3`]: Joi.object({
          code: QuerysConstant.CODE.example(Code.INVALID_PAYLOAD_PARAMS),
          error: Joi.object({
            message: Joi.array().items(
              'Invalid request payload JSON format'
            )
          })
        }).description('Invalid request payload JSON format'),

        [`${Code.INVALID_PAYLOAD_PARAMS}#4`]: Joi.object({
          code: QuerysConstant.CODE.example(Code.INVALID_PAYLOAD_PARAMS),
          error: Joi.object({
            message: Joi.array().items(
              'child emails fails because [emails at position xx fails because [xx is not allowed to be empty]]'
            )
          })
        }).description('Invalid payload params'),

        [`${Code.INVALID_TOKEN}#1`]: Joi.object({
          code: QuerysConstant.CODE.example(Code.INVALID_TOKEN),
          error: Joi.object({
            message: QuerysConstant.MESSAGE.example('Unauthorized')
          })
        }).description('Unauthorized'),

        [`${Code.INVALID_TOKEN}#2`]: Joi.object({
          code: QuerysConstant.CODE.example(Code.INVALID_TOKEN),
          error: Joi.object({
            message: QuerysConstant.MESSAGE.example('Unauthorized. KeyApi has timed out!')
          })
        }).description('Unauthorized'),

        [`${Code.INVALID_TOKEN}#3`]: Joi.object({
          code: QuerysConstant.CODE.example(Code.INVALID_TOKEN),
          error: Joi.object({
            message: QuerysConstant.MESSAGE.example('Unauthorized. Header \'keyapi\' is missing!')
          })
        }).description('Unauthorized'),

        [`${Code.INVALID_TOKEN}#4`]: Joi.object({
          code: QuerysConstant.CODE.example(Code.INVALID_TOKEN),
          error: Joi.object({
            message: QuerysConstant.MESSAGE.example('Unauthorized. Header \'keyapi\' value should not be empty!')
          })
        }).description('Unauthorized'),

        [`${Code.INVALID_PERMISSION}#`]: Joi.object({
          code: QuerysConstant.CODE.example(Code.INVALID_PERMISSION),
          error: Joi.object({
            message: QuerysConstant.MESSAGE.example('You don\'t have permission to perform this action')
          })
        }).description('Invalid permission, only PO can perform this action'),
        [`${Code.SYSTEM_ERROR}  `]: Joi.object().description('System error')
      }
    },
    tags: ['api', 'User']
  }
});

routers.push({
  method: 'PUT',
  path: '/users/recover-deleted',
  options: {
    auth: 'OAuth',
    handler(request, h) {
      return UserModule.RecoverDeletedUser(request, h);
    },
    description: 'Recover deleted users',
    validate: {
      headers: QuerysConstant.HEADERS_ACCESS_TOKEN,
      payload: Joi.object({
        emails: Joi.array().items(QuerysConstant.EMAIL)
          .required()
          .max(50)
          .min(1)
      })
    },
    response: {
      status: {
        [Code.REQUEST_SUCCESS]: Joi.object({
          code: Joi.number().example(200),
          data: responseRecover
        }).description('Recover success \n \n *Available messages in the returned response:* \n- User doesn\'t exist \n- User wasn\'t deleted\n- Can not recover PO role \n- Invalid email format'),

        [`${Code.INVALID_PAYLOAD_PARAMS}#1`]: Joi.object({
          code: QuerysConstant.CODE.example(Code.INVALID_PAYLOAD_PARAMS),
          error: Joi.object({
            message: Joi.array().items(
              'child emails fails because [emails must contain less than or equal to 50 items]'
            )
          })
        }).description('Maximum exceeded: maximum amount of email is 50'),

        [`${Code.INVALID_PAYLOAD_PARAMS}#2`]: Joi.object({
          code: QuerysConstant.CODE.example(Code.INVALID_PAYLOAD_PARAMS),
          error: Joi.object({
            message: Joi.array().items(
              'child emails fails because [emails must contain at least 1 items]'
            )
          })
        }).description('Minimum exceed: minimum amount of email is 1'),

        [`${Code.INVALID_PAYLOAD_PARAMS}#3`]: Joi.object({
          code: QuerysConstant.CODE.example(Code.INVALID_PAYLOAD_PARAMS),
          error: Joi.object({
            message: Joi.array().items(
              'Invalid request payload JSON format'
            )
          })
        }).description('Invalid request payload JSON format'),

        [`${Code.INVALID_PAYLOAD_PARAMS}#4`]: Joi.object({
          code: QuerysConstant.CODE.example(Code.INVALID_PAYLOAD_PARAMS),
          error: Joi.object({
            message: Joi.array().items(
              'child emails fails because [emails at position xx fails because [xx is not allowed to be empty]]'
            )
          })
        }).description('Invalid payload params'),

        [`${Code.INVALID_TOKEN}#1`]: Joi.object({
          code: QuerysConstant.CODE.example(Code.INVALID_TOKEN),
          error: Joi.object({
            message: QuerysConstant.MESSAGE.example('Unauthorized')
          })
        }).description('Unauthorized'),

        [`${Code.INVALID_TOKEN}#2`]: Joi.object({
          code: QuerysConstant.CODE.example(Code.INVALID_TOKEN),
          error: Joi.object({
            message: QuerysConstant.MESSAGE.example('Unauthorized. KeyApi has timed out!')
          })
        }).description('Unauthorized'),

        [`${Code.INVALID_TOKEN}#3`]: Joi.object({
          code: QuerysConstant.CODE.example(Code.INVALID_TOKEN),
          error: Joi.object({
            message: QuerysConstant.MESSAGE.example('Unauthorized. Header \'keyapi\' is missing!')
          })
        }).description('Unauthorized'),

        [`${Code.INVALID_TOKEN}#4`]: Joi.object({
          code: QuerysConstant.CODE.example(Code.INVALID_TOKEN),
          error: Joi.object({
            message: QuerysConstant.MESSAGE.example('Unauthorized. Header \'keyapi\' value should not be empty!')
          })
        }).description('Unauthorized'),

        [`${Code.INVALID_PERMISSION}#`]: Joi.object({
          code: QuerysConstant.CODE.example(Code.INVALID_PERMISSION),
          error: Joi.object({
            message: QuerysConstant.MESSAGE.example('You don\'t have permission to perform this action')
          })
        }).description('Invalid permission, only PO can perform this action'),
        [`${Code.SYSTEM_ERROR}  `]: Joi.object().description('System error')
      }
    },

    tags: ['api', 'User']
  }
});

module.exports = routers;
