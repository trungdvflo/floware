const Joi = require('joi');
const Code = require('../constants/ResponseCodeConstant');
const FeatureModule = require('../modules/FeatureModule');
const QuerysConstant = require('../constants/QuerysConstant');

const routers = [];

const response = Joi.object();

routers.push({
    method: 'GET',
    path: '/features',
    options: {
        auth: 'OAuth',
        handler(request, h) {
            return FeatureModule.getAllFeature(request, h);
        },
        description: 'Get All Features',
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
        tags: ['api', 'Feature']
    }
});

module.exports = routers;
