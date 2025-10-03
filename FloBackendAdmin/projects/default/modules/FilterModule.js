/* eslint-disable no-useless-catch */
const _ = require('lodash');
const { Op } = require('sequelize');
const Code = require('../constants/ResponseCodeConstant');
const Utils = require('../utilities/Utils');

const { FiltersModel } = require('../models');

const GetLatestFilterByObjID = async (request, h) => {
  try {
    const { params, query } = request;
    const email = _.get(request, 'auth.credentials.email', false);
    if (_.isEmpty(email) === true) {
      return h
        .response({
          code: Code.INVALID_PAYLOAD_PARAMS,
          error: {
            message: ['Invalid account']
          }
        })
        .code(Code.INVALID_PAYLOAD_PARAMS);
    }

    const validSortField = ['id', 'objID', 'objType', 'created_date', 'updated_date'];
    const attributes = ['id', 'objID', 'objType', 'data', 'description', 'created_date', 'updated_date'];
    const order = Utils.HandleSortSequelize(query.sort, validSortField);
    const where = {
      email,
      objID: params.objID
    };
    const result = await FiltersModel.findOne({
      attributes,
      where,
      order,
      raw: true
    });

    if (_.isEmpty(result) === true) {
      return h
        .response({
          code: Code.REQUEST_SUCCESS,
          data: {}
        })
        .code(Code.REQUEST_SUCCESS);
    }

    return h
      .response({
        code: Code.REQUEST_SUCCESS,
        data: result
      })
      .code(Code.REQUEST_SUCCESS);
  } catch (error) {
    throw error;
  }
};

const GetFilter = async (request, h) => {
  try {
    const { params } = request;
    const email = _.get(request, 'auth.credentials.email', false);
    if (_.isEmpty(email) === true) {
      return h
        .response({
          code: Code.INVALID_PAYLOAD_PARAMS,
          error: {
            message: ['Invalid account']
          }
        })
        .code(Code.INVALID_PAYLOAD_PARAMS);
    }

    const attributes = ['id', 'objID', 'objType', 'data', 'description', 'created_date', 'updated_date'];
    const where = {
      email,
      id: params.id
    };
    const result = await FiltersModel.findOne({
      attributes,
      where,
      raw: true
    });

    if (_.isEmpty(result) === true) {
      return h
        .response({
          code: Code.INVALID_SERVICE,
          error: {
            message: "Filter doesn't exist"
          }
        })
        .code(Code.INVALID_SERVICE);
    }

    return h
      .response({
        code: Code.REQUEST_SUCCESS,
        data: result
      })
      .code(Code.REQUEST_SUCCESS);
  } catch (error) {
    throw error;
  }
};

const GetFilters = async (request, h) => {
  try {
    const { query } = request;
    const email = _.get(request, 'auth.credentials.email', false);
    if (_.isEmpty(email) === true) {
      return h
        .response({
          code: Code.INVALID_PAYLOAD_PARAMS,
          error: {
            message: ['Invalid account']
          }
        })
        .code(Code.INVALID_PAYLOAD_PARAMS);
    }
    const validSortField = ['id', 'objID', 'objType', 'created_date', 'updated_date'];
    const attributes = ['id', 'objID', 'objType', 'data', 'description', 'created_date', 'updated_date'];
    const paging = Utils.HandlePaging(query.page, query.max_rows);
    const order = Utils.HandleSortSequelize(query.sort, validSortField);
    /**
     *
     * */
    const where = {
      email
    };
    if (_.isEmpty(query.objID) === false) {
      where.objID = query.objID;
    }
    if (_.isNumber(query.objType) === true) {
      where.objType = query.objType;
    }
    if (_.isEmpty(query.description) === false) {
      where.description = {
        [Op.substring]: query.description
      };
    }

    const filters = await FiltersModel.findAndCountAll({
      attributes,
      where,
      order,
      offset: paging.offset,
      limit: paging.limit,
      raw: true
    });

    const data = _.get(filters, 'rows', []);
    const totalRows = _.get(filters, 'count', 0);

    if (_.isEmpty(data) === true) {
      return h
        .response({
          code: Code.REQUEST_SUCCESS,
          data: []
        })
        .code(Code.REQUEST_SUCCESS)
        .header('X-Total-Count', totalRows);
    }

    return h
      .response({
        code: Code.REQUEST_SUCCESS,
        data
      })
      .code(Code.REQUEST_SUCCESS)
      .header('X-Total-Count', totalRows);
  } catch (error) {
    throw error;
  }
};

const CreateFilter = async (request, h) => {
  try {
    const { payload } = request;

    const email = _.get(request, 'auth.credentials.email', false);
    if (_.isEmpty(email) === true) {
      return h
        .response({
          code: Code.INVALID_PAYLOAD_PARAMS,
          error: {
            message: ['Invalid account']
          }
        })
        .code(Code.INVALID_PAYLOAD_PARAMS);
    }
    /**
     * Check exist filter
     */
    const where = {
      email,
      objID: _.trim(payload.objID),
      objType: payload.objType
    };

    const isExist = await FiltersModel.findOne({
      where
    });
    if (_.isEmpty(isExist) === false) {
      return h
        .response({
          code: Code.INVALID_PAYLOAD_PARAMS,
          error: {
            message: ['Filter already exist']
          }
        })
        .code(Code.INVALID_PAYLOAD_PARAMS);
    }

    const currentTimestamp = Utils.Timestamp();
    const args = {
      email,
      objID: _.trim(payload.objID),
      objType: payload.objType,
      data: _.trim(payload.data),
      description: _.trim(payload.description),
      created_date: currentTimestamp,
      updated_date: currentTimestamp
    };
    const result = await FiltersModel.create(args);
    if (_.isEmpty(result) === true) {
      return h
        .response({
          code: Code.INVALID_PAYLOAD_PARAMS,
          error: {
            message: ['Create filter fail, please try again later !']
          }
        })
        .code(Code.INVALID_PAYLOAD_PARAMS);
    }

    const rawData = result.toJSON();
    return h
      .response({
        code: Code.CREATE_SUCCESS,
        data: _.pick(rawData, ['id', 'objID', 'objType', 'data', 'description', 'created_date', 'updated_date'])
      })
      .code(Code.CREATE_SUCCESS);
  } catch (error) {
    throw error;
  }
};

const ModifyFilter = async (request, h) => {
  try {
    const { payload, params } = request;

    const email = _.get(request, 'auth.credentials.email', false);
    if (_.isEmpty(email) === true) {
      return h
        .response({
          code: Code.INVALID_PAYLOAD_PARAMS,
          error: {
            message: ['Invalid account']
          }
        })
        .code(Code.INVALID_PAYLOAD_PARAMS);
    }
    /**
     * Check exist filter
     */

    const isExist = await FiltersModel.findOne({
      where: {
        email,
        id: params.id
      },
      raw: true
    });

    if (_.isEmpty(isExist) === true) {
      return h
        .response({
          code: Code.INVALID_SERVICE,
          error: {
            message: "Filter doesn't exist"
          }
        })
        .code(Code.INVALID_SERVICE);
    }

    const query = Utils.CleanObject({
      objID: _.trim(payload.objID),
      objType: payload.objType,
      data: _.trim(payload.data),
      description: _.trim(payload.description),
      updated_date: Utils.Timestamp()
    });

    const isValid = await FiltersModel.findOne({
      where: {
        id: {
          [Op.ne]: params.id
        },
        email,
        objID: _.get(query, 'objID', isExist.objID),
        objType: _.get(query, 'objType', isExist.objType)
      }
    });

    if (_.isEmpty(isValid) === false) {
      return h
        .response({
          code: Code.INVALID_PAYLOAD_PARAMS,
          error: {
            message: ['Filter objID-objType already exist']
          }
        })
        .code(Code.INVALID_PAYLOAD_PARAMS);
    }

    const result = await FiltersModel.update(query, {
      where: {
        email,
        id: params.id
      }
    });

    const returnCode = result ? result[0] : 0;
    if (returnCode !== 1) {
      return h
        .response({
          code: Code.INVALID_PAYLOAD_PARAMS,
          error: {
            message: ['Update filter fail, please try again later!']
          }
        })
        .code(Code.INVALID_PAYLOAD_PARAMS);
    }

    const filter = await FiltersModel.findOne({
      where: {
        email,
        id: params.id
      },
      raw: true
    });

    return h
      .response({
        code: Code.REQUEST_SUCCESS,
        data: _.pick(filter, ['id', 'objID', 'objType', 'data', 'description', 'created_date', 'updated_date'])
      })
      .code(Code.REQUEST_SUCCESS);
  } catch (error) {
    throw error;
  }
};

const DeleteFilter = async (request, h) => {
  try {
    const { params } = request;

    const userInfo = _.get(request, 'auth.credentials', false);

    /**
     * Check exist filter
     */
    const where = {
      id: params.id,
      email: userInfo.email
    };

    const isExist = await FiltersModel.findOne({
      where,
      raw: true
    });

    if (_.isEmpty(isExist) === true) {
      return h
        .response({
          code: Code.INVALID_SERVICE,
          error: {
            message: "Filter doesn't exist"
          }
        })
        .code(Code.INVALID_SERVICE);
    }

    const result = await FiltersModel.destroy({
      where
    });
    if (result !== 1) {
      return h
        .response({
          code: Code.INVALID_PAYLOAD_PARAMS,
          error: {
            message: ['Remove filter fail, please try again later !']
          }
        })
        .code(Code.INVALID_PAYLOAD_PARAMS);
    }

    return h.response({}).code(Code.NO_CONTENT);
  } catch (error) {
    throw error;
  }
};

module.exports = {
  GetLatestFilterByObjID,
  GetFilter,
  GetFilters,
  CreateFilter,
  ModifyFilter,
  DeleteFilter
};
