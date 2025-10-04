const Joi = require('joi');
const AppsConstant = require('../constants/AppsConstant');
const Code = require('../constants/ResponseCodeConstant');
const MessageConstant = require('../constants/MessageConstant');
const MonitorModule = require('../modules/MonitorModule');

const routers = [];

routers.push({
  method: 'GET',
  path: '/service-status',
  options: {
    auth: false,
    handler(request, h) {
      return MonitorModule.TimeExecute(request, h);
    },
    description: MessageConstant.SERVICE_STATUS_MONITOR,
    validate: {
      options: {
        allowUnknown: AppsConstant.JOI_ALLOW_UNKNOWN
      }
    },
    response: {
      status: {
        [Code.REQUEST_SUCCESS]: Joi.object({
          data: Joi.object({
          })
        }).description(MessageConstant.REQUEST_SUCCESSFULLY)
      }
    },
    tags: ['api', 'Monitor']
  }
});

module.exports = routers;
