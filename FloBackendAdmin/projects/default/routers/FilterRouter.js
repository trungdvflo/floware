const Joi = require('joi');
const Code = require('../constants/ResponseCodeConstant');
const FilterModule = require('../modules/FilterModule');
const QuerysConstant = require('../constants/QuerysConstant');

const routers = [];

const responseFilter = Joi.object({
  id: QuerysConstant.ID,
  objID: QuerysConstant.OBJ_ID,
  objType: QuerysConstant.OBJ_TYPE,
  data: QuerysConstant.FILTER_DATA,
  description: QuerysConstant.DESCRIPTION,
  created_date: QuerysConstant.CREATED_DATE,
  updated_date: QuerysConstant.UPDATED_DATE
});

routers.push({
  method: 'GET',
  path: '/filters',
  options: {
    auth: 'OAuth',
    handler(request, h) {
      return FilterModule.GetFilters(request, h);
    },
    description: 'Get list filter. Available sort filter: id, objID, objType, created_date, updated_date',
    validate: {
      headers: QuerysConstant.HEADERS_ACCESS_TOKEN,
      query: Joi.object({
        objID: QuerysConstant.OBJ_ID.optional().allow(null, ''),
        objType: QuerysConstant.OBJ_TYPE.optional().allow(null, ''),
        description: QuerysConstant.DESCRIPTION.optional().allow(null, ''),
        sort: QuerysConstant.SORT,
        page: QuerysConstant.PAGE.required(),
        max_rows: QuerysConstant.MAX_ROWS.required()
      })
    },
    response: {
      status: {
        [Code.REQUEST_SUCCESS]: Joi.object({
          code: Joi.number().example(200),
          data: Joi.array().items(responseFilter)
        }).description('Request successfully'),
        [Code.SYSTEM_ERROR]: Joi.object().description('System error')
      }
    },
    tags: ['api', 'Filter']
  }
});

routers.push({
  method: 'GET',
  path: '/filters/{id}',
  options: {
    auth: 'OAuth',
    handler(request, h) {
      return FilterModule.GetFilter(request, h);
    },
    description: 'Get filter',
    validate: {
      headers: QuerysConstant.HEADERS_ACCESS_TOKEN,
      params: Joi.object({
        id: QuerysConstant.ID
      })
    },
    response: {
      status: {
        [Code.REQUEST_SUCCESS]: Joi.object({
          code: Joi.number().example(200),
          data: responseFilter
        }).description('Request successfully'),
        [Code.SYSTEM_ERROR]: Joi.object().description('System error')
      }
    },
    tags: ['api', 'Filter']
  }
});

routers.push({
  method: 'GET',
  path: '/filters/{objID}/latest',
  options: {
    auth: 'OAuth',
    handler(request, h) {
      return FilterModule.GetLatestFilterByObjID(request, h);
    },
    description: 'Get filter. Available sort filter: id, objID, objType, created_date, updated_date',
    validate: {
      headers: QuerysConstant.HEADERS_ACCESS_TOKEN,
      params: Joi.object({
        objID: QuerysConstant.OBJ_ID.required()
      }),
      query: Joi.object({
        sort: QuerysConstant.SORT
      })
    },
    response: {
      status: {
        [Code.REQUEST_SUCCESS]: Joi.object({
          code: Joi.number().example(200),
          data: responseFilter.optional().allow(null, '')
        }).description('Request successfully'),
        [Code.SYSTEM_ERROR]: Joi.object().description('System error')
      }
    },
    tags: ['api', 'Filter']
  }
});

routers.push({
  method: 'POST',
  path: '/filters',
  options: {
    auth: 'OAuth',
    handler(request, h) {
      return FilterModule.CreateFilter(request, h);
    },
    description: 'Create filter',
    validate: {
      headers: QuerysConstant.HEADERS_ACCESS_TOKEN,
      payload: Joi.object({
        objID: QuerysConstant.OBJ_ID.required(),
        objType: QuerysConstant.OBJ_TYPE.required(),
        data: QuerysConstant.FILTER_DATA.required(),
        description: QuerysConstant.DESCRIPTION.optional().allow(null, '')
      })
    },
    response: {
      status: {
        [Code.CREATE_SUCCESS]: Joi.object({
          code: Joi.number().example(Code.CREATE_SUCCESS),
          data: responseFilter
        }).description('Request successfully'),
        [Code.SYSTEM_ERROR]: Joi.object().description('System error')
      }
    },
    tags: ['api', 'Filter']
  }
});

routers.push({
  method: 'PUT',
  path: '/filters/{id}',
  options: {
    auth: 'OAuth',
    handler(request, h) {
      return FilterModule.ModifyFilter(request, h);
    },
    description: 'Modify filter',
    validate: {
      headers: QuerysConstant.HEADERS_ACCESS_TOKEN,
      params: Joi.object({
        id: QuerysConstant.ID
      }),
      payload: Joi.object({
        objID: QuerysConstant.OBJ_ID.optional().allow(null, ''),
        objType: QuerysConstant.OBJ_TYPE.optional().allow(null, ''),
        data: QuerysConstant.FILTER_DATA.optional().allow(null, ''),
        description: QuerysConstant.DESCRIPTION.optional().allow(null, '')
      })
    },
    response: {
      status: {
        [Code.REQUEST_SUCCESS]: Joi.object({
          code: Joi.number().example(200),
          data: responseFilter
        }).description('Request successfully'),
        [Code.SYSTEM_ERROR]: Joi.object().description('System error')
      }
    },
    tags: ['api', 'Filter']
  }
});

routers.push({
  method: 'DELETE',
  path: '/filters/{id}',
  options: {
    auth: 'OAuth',
    handler(request, h) {
      return FilterModule.DeleteFilter(request, h);
    },
    description: 'Delete filter',
    validate: {
      headers: QuerysConstant.HEADERS_ACCESS_TOKEN,
      params: Joi.object({
        id: QuerysConstant.ID
      })
    },
    response: {
      status: {
        [Code.NO_CONTENT]: Joi.object({}).description('Delete successful'),
        [Code.NOT_FOUND]: Joi.object({
          code: QuerysConstant.CODE.example(Code.NOT_FOUND),
          error: Joi.object({
            message: QuerysConstant.MESSAGE.example("Filter doesn't exist")
          })
        }).description('Not found'),

        [Code.SYSTEM_ERROR]: Joi.object().description('System error')
      }
    },
    tags: ['api', 'Filter']
  }
});

module.exports = routers;
