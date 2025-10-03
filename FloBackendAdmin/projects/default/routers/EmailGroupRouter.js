const Joi = require('joi');
const Code = require('../constants/ResponseCodeConstant');
const EmailGroupModule = require('../modules/EmailGroupModule');
const QuerysConstant = require('../constants/QuerysConstant');

const routers = [];

const response = Joi.object();

routers.push({
  method: 'GET',
  path: '/email-group/items',
  options: {
    auth: 'OAuth',
    handler(request, h) {
      return EmailGroupModule.getAllEmailGroup(request, h);
    },
    description: 'Get All Admin Email Group',
    validate: {
      headers: QuerysConstant.HEADERS_ACCESS_TOKEN,
      query: Joi.object({
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
    tags: ['api', 'Admin Email Group']
  }
});

routers.push({
  method: 'GET',
  path: '/email-group/{id}',
  options: {
    auth: 'OAuth',
    handler(request, h) {
      return EmailGroupModule.getEmailGroupById(request, h);
    },
    description: 'Get Email Group by Id',
    validate: {
      headers: QuerysConstant.HEADERS_ACCESS_TOKEN,
      params: Joi.object({
        id: Joi.number().required()
      })
    },
    response: {
      status: {
        [Code.REQUEST_SUCCESS]: Joi.object({
          code: Joi.number().example(200),
          data: response
        }).description('Request successfully'),

        [Code.SYSTEM_ERROR]: Joi.object().description('System error')
      }
    },
    tags: ['api', 'Admin Email Group']
  }
});

routers.push({
  method: 'POST',
  path: '/email-group',
  options: {
    auth: 'OAuth',
    handler(request, h) {
      return EmailGroupModule.createEmailGroup(request, h);
    },
    description: 'Create Email Group',
    validate: {
      headers: QuerysConstant.HEADERS_ACCESS_TOKEN,
      payload: Joi.object({
        group_name: Joi.string().required()
      })
    },
    response: {
      status: {
        [Code.REQUEST_SUCCESS]: Joi.object({
          code: Joi.number().example(201),
          data: response
        }).description('Request successfully'),

        [Code.SYSTEM_ERROR]: Joi.object().description('System error')
      }
    },
    tags: ['api', 'Admin Email Group']
  }
});

routers.push({
  method: 'PUT',
  path: '/email-group/{id}',
  options: {
    auth: 'OAuth',
    handler(request, h) {
      return EmailGroupModule.updateEmailGroup(request, h);
    },
    description: 'Update Email Group',
    validate: {
      headers: QuerysConstant.HEADERS_ACCESS_TOKEN,
      params: Joi.object({
        id: Joi.number().required()
      }),
      payload: Joi.object({
        group_name: Joi.string().required()
      })
    },
    response: {
      status: {
        [Code.REQUEST_SUCCESS]: Joi.object({
          code: Joi.number().example(200),
          data: response
        }).description('Request successfully'),

        [Code.SYSTEM_ERROR]: Joi.object().description('System error')
      }
    },
    tags: ['api', 'Admin Email Group']
  }
});

routers.push({
  method: 'DELETE',
  path: '/email-group/{id}',
  options: {
    auth: 'OAuth',
    handler(request, h) {
      return EmailGroupModule.deleteEmailGroup(request, h);
    },
    description: 'Delete Email Group',
    validate: {
      headers: QuerysConstant.HEADERS_ACCESS_TOKEN,
      params: Joi.object({
        id: Joi.number().required()
      })
    },
    response: {
      status: {
        [Code.REQUEST_SUCCESS]: Joi.object({
          code: Joi.number().example(204)
        }).description('Request successfully'),

        [Code.SYSTEM_ERROR]: Joi.object().description('System error')
      }
    },
    tags: ['api', 'Admin Email Group']
  }
});

//implement for add/remove user to emailGroup
routers.push({
  method: 'GET',
  path: '/email-group/{id}/members',
  options: {
    auth: 'OAuth',
    handler(request, h) {
      return EmailGroupModule.getAllUserInEmailGroup(request, h);
    },
    description: 'Get All User in the Email Group',
    validate: {
      headers: QuerysConstant.HEADERS_ACCESS_TOKEN,
      query: Joi.object({
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
    tags: ['api', 'Admin Email Group']
  }
});

routers.push({
  method: 'POST',
  path: '/email-group/{id}/add-member',
  options: {
    auth: 'OAuth',
    handler(request, h) {
      return EmailGroupModule.addMemberToEmailGroup(request, h);
    },
    description: 'Add member to email group',
    validate: {
      headers: QuerysConstant.HEADERS_ACCESS_TOKEN,
      payload: Joi.object({
        email: Joi.string().required()
      })
    },
    response: {
      status: {
        [Code.REQUEST_SUCCESS]: Joi.object({
          code: Joi.number().example(201),
          data: response
        }).description('Request successfully'),

        [Code.SYSTEM_ERROR]: Joi.object().description('System error')
      }
    },
    tags: ['api', 'Admin Email Group']
  }
});

routers.push({
  method: 'POST',
  path: '/email-group/{id}/remove-member',
  options: {
    auth: 'OAuth',
    handler(request, h) {
      return EmailGroupModule.removeMemberFromEmailGroup(request, h);
    },
    description: 'Remove member to email group',
    validate: {
      headers: QuerysConstant.HEADERS_ACCESS_TOKEN,
      payload: Joi.object({
        email: Joi.string().required()
      })
    },
    response: {
      status: {
        [Code.REQUEST_SUCCESS]: Joi.object({
          code: Joi.number().example(201),
          data: response
        }).description('Request successfully'),

        [Code.SYSTEM_ERROR]: Joi.object().description('System error')
      }
    },
    tags: ['api', 'Admin Email Group']
  }
});

module.exports = routers;
