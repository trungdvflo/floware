const Joi = require('joi');
const Code = require('../constants/ResponseCodeConstant');
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
    description: 'Service status monitor',
    response: {
      status: {
        [Code.REQUEST_SUCCESS]: Joi.object().description('Request success'),
        [Code.SYSTEM_ERROR]: Joi.object().description('System error')
      }
    },
    tags: ['api', 'Monitor']
  }
});

module.exports = routers;

