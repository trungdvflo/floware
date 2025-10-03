const Joi = require('joi');
const Code = require('../constants/ResponseCodeConstant');
const QuerysConstant = require('../constants/QuerysConstant');
const MessageModule = require('../modules/MessageModule');
const RabbitConfig = require('../configs/RabbitConfig');
const { log } = require('async');

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
      payload: Joi.object({
        from: QuerysConstant.FROM.example('Binh Pham <binhpt@flomail.net>'),
        to: QuerysConstant.TO.example('Binh Pham <binhpt@flodev.net>, duocnt@flodev.net'),
        subject: QuerysConstant.SUBJECT.example('Fwd: Re: Fwd: Re: Fwd: tewesdf'),
        snippet: QuerysConstant.SNIPPET.example('Hi Everyone'),
        user: QuerysConstant.USER.example('duocnt@flodev.net'),
        uid: QuerysConstant.UID.example('2'),
        event_name: QuerysConstant.EVENT_NAME.example('MessageNew'),
        folder: QuerysConstant.FOLDER_NAME.example('Inbox'),
        date_sent: QuerysConstant.DATE_SENT.optional().allow(null, '')
      })
    },
    response: {
      status: {
        [Code.REQUEST_SUCCESS]: Joi.object({
          code: Joi.number().example(200),
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
  method: 'POST',
  path: '/queue-linked-mail-collection',
  options: {
    auth: false,
    handler(request, h) {
      if (RabbitConfig.enable) {
        return MessageModule.LinkedEmailCollectionRabbit(request, h);
      } else {
        return MessageModule.LinkedEmailCollection(request, h);
      }
    },
    description: 'Receive message',
    validate: {
      payload: Joi.object({
        username: QuerysConstant.FROM.example('duocnt@flodev.net'),
        action: QuerysConstant.ACTION.example(1),
        collection_id: QuerysConstant.COLLECTION_ID.example(1),
        uid: QuerysConstant.FLO_MAIL_UID.example(2),
        path: QuerysConstant.PATH.example('imap_folder')
      })
    },
    response: {
      status: {
        [Code.REQUEST_SUCCESS]: Joi.object({
          code: Joi.number().example(200),
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
      query: Joi.object({
        from: QuerysConstant.FROM.example('Binh Pham <binhpt@flomail.net>'),
        to: QuerysConstant.TO.example('Binh Pham <binhpt@flodev.net>, duocnt@flodev.net'),
        subject: QuerysConstant.SUBJECT.example('Fwd: Re: Fwd: Re: Fwd: tewesdf'),
        snippet: QuerysConstant.SNIPPET.example('Hi Everyone'),
        user: QuerysConstant.USER.example('duocnt@flodev.net'),
        uid: QuerysConstant.UID.example('2'),
        event_name: QuerysConstant.EVENT_NAME.example('MessageNew')

      })
    },
    response: {
      status: {
        [Code.REQUEST_SUCCESS]: Joi.object({
          code: Joi.number().example(200),
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
  method: 'POST',
  path: '/queue-flo-mail-deleted',
  options: {
    auth: false,
    handler(request, h) {
      return MessageModule.PostDeleteEmail(request, h);
    },
    description: 'Delete message',
    validate: {
      query: Joi.object({
        user: QuerysConstant.USER.example('duocnt@flodev.net'),
        uid: QuerysConstant.UID.example('2'),
        path: QuerysConstant.PATH.example('INBOX')
      })
    },
    response: {
      status: {
        [Code.REQUEST_SUCCESS]: Joi.object({
          code: Joi.number().example(200),
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
