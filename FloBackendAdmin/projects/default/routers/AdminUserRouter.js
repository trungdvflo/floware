const Joi = require('joi');
const Code = require('../constants/ResponseCodeConstant');
const AdminUserModule = require('../modules/AdminUserModule');
const QuerysConstant = require('../constants/QuerysConstant');

const routers = [];

const response = Joi.object();

routers.push({
    method: 'GET',
    path: '/admin/users',
    options: {
        auth: 'OAuth',
        handler(request, h) {
            return AdminUserModule.getAllAdminUser(request, h);
        },
        description: 'Get All Admin User',
        validate: {
            headers: QuerysConstant.HEADERS_ACCESS_TOKEN,
            query: Joi.object({
                page: QuerysConstant.PAGE.required(),
                max_rows: QuerysConstant.MAX_ROWS.required(),
                filter_key: QuerysConstant.FILTER_KEY,
                role: QuerysConstant.ROLE,
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
        tags: ['api', 'Admin User']
    }
});

routers.push({
    method: 'GET',
    path: '/admin/users/{id}',
    options: {
        auth: 'OAuth',
        handler(request, h) {
            return AdminUserModule.getAdminUserById(request, h);
        },
        description: 'Get Admin User By Id',
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
        tags: ['api', 'Admin User']
    }
});

routers.push({
    method: 'POST',
    path: '/admin/users',
    options: {
        auth: 'OAuth',
        handler(request, h) {
            return AdminUserModule.createAdminUser(request, h);
        },
        description: 'Create Admin User',
        validate: {
            headers: QuerysConstant.HEADERS_ACCESS_TOKEN,
            payload: Joi.object({
                data: Joi.array().items(Joi.object({
                    email: Joi.string().required(),
                })).required(),
                role: Joi.number().required()
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
        tags: ['api', 'Admin User']
    }
});

routers.push({
    method: 'POST',
    path: '/admin/users/remove',
    options: {
        auth: 'OAuth',
        handler(request, h) {
            return AdminUserModule.deleteAdminUser(request, h);
        },
        description: 'Remove User from Admin Table',
        validate: {
            headers: QuerysConstant.HEADERS_ACCESS_TOKEN,
            payload: Joi.object({
                data: Joi.array().items(Joi.object({ id: Joi.number() })).required(),
            })

        },
        response: {
            status: {
                [Code.REQUEST_SUCCESS]: Joi.object({
                    code: Joi.number(),
                    data: Joi.array().items(Joi.object({ id: Joi.number() })),
                    error: Joi.any()
                }).description('Request successfully'),

                [Code.SYSTEM_ERROR]: Joi.object().description('System error')
            }
        },
        tags: ['api', 'Admin User']
    }
});

module.exports = routers;
