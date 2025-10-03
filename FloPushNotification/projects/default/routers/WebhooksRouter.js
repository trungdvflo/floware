const Joi = require('joi');
const Code = require('../constants/ResponseCodeConstant');
const QuerysConstant = require('../constants/QuerysConstant');
const WebhooksModule = require('../modules/WebhooksModule');

const routers = [];

routers.push({
    method: 'POST',  
    path: '/webhooks/gmail', 
    options: {
        auth: false,
        handler(request, h) {
            return WebhooksModule.HandelWebHookGmail(request, h);
        },
        description: 'Endpoint receives notification of messages from Google Clould\'s Pub/Sub system',
        validate: {},
        response: {
            status: {
                [Code.REQUEST_SUCCESS]: Joi.object({
                    code: Joi.number()
                        .example('200'),
                    data: Joi.object({
                        message: QuerysConstant.MESSAGE
                    })
                }).description('Request successful')    
            }
        },
        tags: [
            'api',
            'Webhooks'
        ]
    }
});

module.exports = routers;
