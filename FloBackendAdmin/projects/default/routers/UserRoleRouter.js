const Joi = require('joi');
const Code = require('../constants/ResponseCodeConstant');
const UserRoleModule = require('../modules/UserRoleModule');
const QuerysConstant = require('../constants/QuerysConstant');

const routers = [];

const response = Joi.object();

routers.push({
    method: 'GET',
    path: '/roles',
    options: {
        auth: 'OAuth',
        handler(request, h) {
            return UserRoleModule.getAllUserRole(request, h);
        },
        description: 'Get All Roles',
        validate: {
            headers: QuerysConstant.HEADERS_ACCESS_TOKEN,
            query: Joi.object({
                page: QuerysConstant.PAGE.required(),
                max_rows: QuerysConstant.MAX_ROWS.required(),
                filter_key: QuerysConstant.FILTER_KEY,
                keyword: QuerysConstant.KEYWORD
                    .optional()
                    .allow(null, '')
                    .description('Keyword search.\n Server will query field-value like %keyword%.\n\n Searching field: \n - email \n- account_3rd_emails'),
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
        tags: ['api', 'User Role']
    }
});

routers.push({
    method: 'GET',
    path: '/roles/{id}',
    options: {
        auth: 'OAuth',
        handler(request, h) {
            return UserRoleModule.getAllUserRoleById(request, h);
        },
        description: 'Get All Role by Role Id',
        validate: {
            headers: QuerysConstant.HEADERS_ACCESS_TOKEN
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
        tags: ['api', 'User Role']
    }
});

routers.push({
    method: 'POST',
    path: '/roles',
    options: {
        auth: 'OAuth',
        handler(request, h) {
            return UserRoleModule.createUserRole(request, h);
        },
        description: 'Create Role',
        validate: {
            headers: QuerysConstant.HEADERS_ACCESS_TOKEN,
            payload: Joi.object({
                name: Joi.string().required()
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
        tags: ['api', 'User Role']
    }
});

routers.push({
    method: 'PUT',
    path: '/roles/{id}',
    options: {
        auth: 'OAuth',
        handler(request, h) {
            return UserRoleModule.updateUserRole(request, h);
        },
        description: 'Update Role',
        validate: {
            headers: QuerysConstant.HEADERS_ACCESS_TOKEN,
            params: Joi.object({
                id: Joi.number().required()
            }),
            payload: Joi.object({
                name: Joi.string().required()
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
        tags: ['api', 'User Role']
    }
});

routers.push({
    method: 'DELETE',
    path: '/roles/{id}',
    options: {
      auth: 'OAuth',
      handler(request, h) {
        return UserRoleModule.deleteUserRole(request, h);
      },
      description: 'Delete Role',
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
      tags: ['api', 'User Role']
    }
  });

module.exports = routers;
