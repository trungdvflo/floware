const Joi = require('joi');
const Code = require('../constants/ResponseCodeConstant');
const DashboardModule = require('../modules/DashboardModule');
const QuerysConstant = require('../constants/QuerysConstant');

const routers = [];

routers.push({
  method: 'GET',
  path: '/dashboard',
  options: {
    auth: 'OAuth',
    handler(request, h) {
      return DashboardModule.Dashboard(request, h);
    },
    description: 'Get dashboard report',
    validate: {
      headers: QuerysConstant.HEADERS_ACCESS_TOKEN
    },
    response: {
      status: {
        [Code.REQUEST_SUCCESS]: Joi.object({
          code: Joi.number().example(200),
          data: Joi.object({
            google: QuerysConstant.DASHBOARD_GOOGLE,
            yahoo: QuerysConstant.DASHBOARD_YAHOO,
            icloud: QuerysConstant.DASHBOARD_ICLOUD,
            other_3rd: QuerysConstant.DASHBOARD_OTHER_3RD,
            pre: QuerysConstant.DASHBOARD_PRE,
            pro: QuerysConstant.DASHBOARD_PRO,
            standard: QuerysConstant.DASHBOARD_STANDARD,
            users: QuerysConstant.DASHBOARD_USERS
          })
        }).description('Request successfully'),
        [Code.SYSTEM_ERROR]: Joi.object().description('System error')
      }
    },
    tags: ['api', 'Dashboard']
  }
});

module.exports = routers;
