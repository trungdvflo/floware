const Joi = require('joi');
const Code = require('../constants/ResponseCodeConstant');
const QuerysConstant = require('../constants/QuerysConstant');
const MessageModule = require('../modules/MessageModule');

const routers = [];

routers.push({
    method: 'POST',
    path: '/queue-push-notify-flomail',
    options: {
        auth: false,
        handler(request, h) {
            return MessageModule.ReceiveMessage(request, h);
        },
        description: 'Receive message',
        validate: {
            payload: {
                from: QuerysConstant.FROM.example('Binh Pham <binhpt@flomail.net>'),
                to: QuerysConstant.TO.example('Binh Pham <binhpt@flodev.net>, duocnt@flodev.net'),
                subject: QuerysConstant.SUBJECT.example('Fwd: Re: Fwd: Re: Fwd: tewesdf'),
                snippet: QuerysConstant.SNIPPET.example('Hi Everyone'),
                user: QuerysConstant.USER.example('duocnt@flodev.net'),
                uid: QuerysConstant.UID.example('2'),
                event_name: QuerysConstant.EVENT_NAME.example('MessageNew'),
                folder: QuerysConstant.FOLDER_NAME.example('Inbox')
            }
        },
        response: {
            status: {
                [Code.REQUEST_SUCCESS]: Joi.object({ 
                    code: Joi.number()
                        .example('200'),
                    data: Joi.object({
                        message: QuerysConstant.MESSAGE.example('Received data')
                    })
                }).description('Request successful')    
            }
        },
        tags: ['api', 'Message']
    }
});

routers.push({
    method: 'GET',
    path: '/queue-push-notify-flomail',
    options: {
        auth: false,
        handler(request, h) {
            return MessageModule.GetReceiveMessage(request, h);
        },
        description: 'Receive message',
        validate: {
            query: {
                from: QuerysConstant.FROM.example('Binh Pham <binhpt@flomail.net>'),
                to: QuerysConstant.TO.example('Binh Pham <binhpt@flodev.net>, duocnt@flodev.net'),
                subject: QuerysConstant.SUBJECT.example('Fwd: Re: Fwd: Re: Fwd: tewesdf'),
                snippet: QuerysConstant.SNIPPET.example('Hi Everyone'),
                user: QuerysConstant.USER.example('duocnt@flodev.net'),
                uid: QuerysConstant.UID.example('2'),
                event_name: QuerysConstant.EVENT_NAME.example('MessageNew')
            }
        },
        response: {
            status: {
                [Code.REQUEST_SUCCESS]: Joi.object({ 
                    code: Joi.number()
                        .example('200'),
                    data: Joi.object({
                        message: QuerysConstant.MESSAGE.example('Received data')
                    })
                }).description('Request successful')    
            }
        },
        tags: ['api', 'Message']
    }
});

module.exports = routers;
