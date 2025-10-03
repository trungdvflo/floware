const Joi = require('joi');
const Code = require('../constants/ResponseCodeConstant');
const PermissionModule = require('../modules/PermissionModule');
const QuerysConstant = require('../constants/QuerysConstant');

const routers = [];

const response = Joi.object();

routers.push({
    method: 'GET',
    path: '/permissions',
    options: {
        auth: 'OAuth',
        handler(request, h) {
            return PermissionModule.getAllPermission(request, h);
        },
        description: 'Get List Permissions',
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
        tags: ['api', 'Permissions']
    }
});

routers.push({
    method: 'POST',
    path: '/permission',
    options: {
        auth: 'OAuth',
        handler(request, h) {
            return PermissionModule.createPermission(request, h);
        },
        description: 'Create Permissions',
        validate: {
            headers: QuerysConstant.HEADERS_ACCESS_TOKEN,
            payload: Joi.object({
                feature_id: Joi.number().required(),
                role_id: Joi.number().required(),
                permission_value: Joi.number().required()
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
        tags: ['api', 'Permissions']
    }
});

routers.push({
    method: 'PUT',
    path: '/permission/{id}',
    options: {
        auth: 'OAuth',
        handler(request, h) {
            return PermissionModule.updatePermission(request, h);
        },
        description: 'Update Permissions',
        validate: {
            headers: QuerysConstant.HEADERS_ACCESS_TOKEN,
            params: Joi.object({
                id: Joi.number().required()
            }),
            payload: Joi.object({
                feature_id: Joi.number().required(),
                role_id: Joi.number().required(),
                permission_value: Joi.number().required()
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
        tags: ['api', 'Permissions']
    }  
});

routers.push({
    method: 'DELETE',
    path: '/permission/{id}',
    options: {
      auth: 'OAuth',
      handler(request, h) {
        return PermissionModule.deletePermission(request, h);
      },
      description: 'Delete Permissions',
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
      tags: ['api', 'Permissions']
    }
  });

module.exports = routers;
