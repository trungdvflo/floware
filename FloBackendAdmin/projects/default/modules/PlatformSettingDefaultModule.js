/* eslint-disable camelcase */
/* eslint-disable no-unused-expressions */
/* eslint-disable no-useless-catch */
const {
  Op
} = require('sequelize');
const _ = require('lodash');
const {
  PlatformSettingDefaultsModel
} = require('../models');

const Code = require('../constants/ResponseCodeConstant');
const Utils = require('../utilities/Utils');

const Private = {
  ValidatePlatformSettingDefaultsRequest: (request, allowFilterKeys, allowSortFields) => {
    const { query } = request;
    const {
      filter_key,
      sort
    } = query;

    if (_.isEmpty(filter_key) === false && _.isEmpty(allowFilterKeys) === false) {
      const message = 'Invalid filter_key value, please check available filter_key';

      const filterArr = filter_key ? filter_key.split(',').map((item) => item.trim()) : [];
      const accountTypeUnion = _.union(filterArr, allowFilterKeys);

      if (accountTypeUnion.length !== allowFilterKeys.length) {
        return {
          code: 0,
          message
        };
      }
    }

    if (_.isEmpty(sort) === false && _.isEmpty(allowSortFields) === false) {
      let error = 0;
      const sortArr = sort.split(',');
      const types = {
        '+': 'ASC',
        '-': 'DESC'
      };
      _.forEach(sortArr, (item) => {
        const type = types[item[0]];
        let field = _.trim(item.slice(1));

        if (_.isUndefined(type) === true) {
          field = _.trim(item);
        }
        if (_.indexOf(allowSortFields, field) < 0) {
          error = 1;
        }
      });

      if (error === 1) {
        return {
          code: 0,
          message: 'Invalid sort field, please check available sort field'
        };
      }
    }
    return {};
  },
  FilterPlatformSettingDefault: (request) => {
    const {
      query
    } = request;
    const result = {};
    try {
      if (_.isEmpty(query.filter_key) === true || _.isEmpty(query.keyword) === true) {
        return {};
      }

      const filter = Utils.HandleFilterToAttr(query.keyword);
      const filterKeys = query.filter_key.split(',');

      result[Op.or] = [];
      _.forEach(filterKeys, (filterKey) => {
        switch (filterKey.trim()) {
          case 'id': {
            result[Op.or].push({
              id: {
                [Op.substring]: Number(filter.value)
              }
            });
            break;
          }
          case 'app_reg_id': {
            result[Op.or].push({
              app_reg_id: {
                [Op.substring]: filter.value.toString()
              }
            });

            break;
          }
          case 'app_version': {
            result[Op.or].push({
              app_version: {
                [Op.substring]: filter.value.toString()
              }
            });
            break;
          }

          case 'updated_date': {
            result[Op.or].push({
              updated_date: {
                [Op.substring]: filter.value.toString()
              }
            });
            break;
          }
          default:
            break;
        }
      });

      return result;
    } catch (error) {
      return result;
    }
  }
};

const GetPlatformSettingDefaults = async (request, h) => {
  try {
    const {
      query
    } = request;
    const userInfo = _.get(request, 'auth.credentials', false);
    if (userInfo.role !== 1) {
      return h.response({
        code: Code.INVALID_PERMISSION,
        error: {
          message: 'You don\'t have permission to perform this action'
        }
      }).code(Code.INVALID_PERMISSION);
    }

    const allowFilterKeys = [
      'id',
      'app_reg_id',
      'app_version',
      // 'created_date',
      'updated_date'
    ];

    const allowSortFields = [
      'id',
      'app_reg_id',
      'app_version',
      'created_date',
      'updated_date'
    ];
    const attributes = [
      'id',
      'app_reg_id',
      'app_version',
      'data_setting',
      'created_date',
      'updated_date'
    ];

    const validation = Private.ValidatePlatformSettingDefaultsRequest(request, allowFilterKeys, allowSortFields);
    if (validation.code === 0) {
      return h.response({
        code: Code.INVALID_PAYLOAD_PARAMS,
        error: {
          message: [validation.message]
        }
      }).code(Code.INVALID_PAYLOAD_PARAMS);
    }
    const paging = Utils.HandlePaging(query.page, query.max_rows);
    const where = await Private.FilterPlatformSettingDefault(request);
    const order = Utils.HandleSortSequelize(query.sort, allowSortFields);
    const platformSettingDefaults = await PlatformSettingDefaultsModel.findAndCountAll({
      attributes,
      where,
      order,
      offset: paging.offset,
      limit: paging.limit,
      raw: true
    });

    const data = _.get(platformSettingDefaults, 'rows', []);
    const totalRows = _.get(platformSettingDefaults, 'count', 0);

    if (_.isEmpty(data) === true) {
      return h.response({
        code: Code.REQUEST_SUCCESS,
        data: []
      }).code(Code.REQUEST_SUCCESS).header('X-Total-Count', totalRows);
    }

    return h.response({
      code: Code.REQUEST_SUCCESS,
      data
    })
      .code(Code.REQUEST_SUCCESS)
      .header('X-Total-Count', totalRows);
  } catch (error) {
    throw error;
  }
};

const GetPlatformSettingDefault = async (request, h) => {
  try {
    // 
    const {
      params
    } = request;
    const userInfo = _.get(request, 'auth.credentials', false);
    if (userInfo.role !== 1) {
      return h.response({
        code: Code.INVALID_PERMISSION,
        error: {
          message: 'You don\'t have permission to perform this action'
        }
      }).code(Code.INVALID_PERMISSION);
    }

    const attributes = [
      'id',
      'app_reg_id',
      'app_version',
      'data_setting',
      'created_date',
      'updated_date'
    ];
    const data = await PlatformSettingDefaultsModel.findOne({
      attributes,
      where: {
        id: params.id
      },
      raw: true
    });

    if (_.isEmpty(data) === true) {
      return h.response({
        code: Code.INVALID_SERVICE,
        error: {
          message: 'Platform Setting Default doesn\'t exist'
        }
      }).code(Code.INVALID_SERVICE);
    }

    return h.response({
      code: Code.REQUEST_SUCCESS,
      data
    }).code(Code.REQUEST_SUCCESS);
  } catch (error) {
    throw error;
  }
};

const CreatePlatformSettingDefault = async (request, h) => {
  try {
    const {
      payload
    } = request;
    const userInfo = _.get(request, 'auth.credentials', false);
    if (userInfo.role !== 1) {
      return h.response({
        code: Code.INVALID_PERMISSION,
        error: {
          message: 'You don\'t have permission to perform this action'
        }
      }).code(Code.INVALID_PERMISSION);
    }

    const platformDefault = await PlatformSettingDefaultsModel.findOne({
      attributes: ['id'],
      where: {
        app_reg_id: payload.app_reg_id,
        app_version: payload.app_version
      },
      raw: true
    });

    if (_.isEmpty(platformDefault) === false) {
      return h.response({
        code: Code.INVALID_PAYLOAD_PARAMS,
        error: {
          message: ['Release platform setting default already exist with app_reg_id and app_version.']
        }
      }).code(Code.INVALID_PAYLOAD_PARAMS);
    }

    const currentTimestamp = Utils.Timestamp();
    const result = await PlatformSettingDefaultsModel.create({
      app_id: payload.app_id,
      app_reg_id: payload.app_reg_id,
      app_version: payload.app_version,
      data_setting: payload.data_setting,
      created_date: currentTimestamp,
      updated_date: currentTimestamp
    });

    if (_.isEmpty(result) === true || _.isEmpty(result.dataValues) === true) {
      return h.response({
        code: Code.INVALID_PAYLOAD_PARAMS,
        error: {
          message: ['Create platform setting default failed, please try again later!']
        }
      }).code(Code.INVALID_PAYLOAD_PARAMS);
    }

    return h.response({
      code: Code.CREATE_SUCCESS,
      data: result.dataValues
    }).code(Code.CREATE_SUCCESS);
  } catch (error) {
    throw error;
  }
};

const ModifyPlatformSettingDefault = async (request, h) => {
  try {
    const {
      payload,
      params
    } = request;
    const userInfo = _.get(request, 'auth.credentials', false);
    if (userInfo.role !== 1) {
      return h.response({
        code: Code.INVALID_PERMISSION,
        error: {
          message: 'You don\'t have permission to perform this action'
        }
      }).code(Code.INVALID_PERMISSION);
    }

    const platformSetting = await PlatformSettingDefaultsModel.findOne({
      where: {
        id: params.id,
        app_reg_id: payload.app_reg_id
      },
      raw: true
    });

    if (_.isEmpty(platformSetting) === true) {
      return h.response({
        code: Code.INVALID_SERVICE,
        error: {
          message: 'Release platform setting default doesn\'t exist'
        }
      }).code(Code.INVALID_SERVICE);
    }

    const data_update = {
      data_setting: payload.data_setting,
      updated_date: Utils.Timestamp()
    };
    if (payload.app_version) {
      data_update.app_version = payload.app_version;
    }
    const result = await PlatformSettingDefaultsModel.update(data_update,
      {
        where: {
          id: params.id
        }
      });
    if (_.isEmpty(result) === true) {
      return h.response({
        code: Code.INVALID_PAYLOAD_PARAMS,
        error: {
          message: ['Modify platform setting default failed, please try again later!']
        }
      }).code(Code.INVALID_PAYLOAD_PARAMS);
    }

    return h.response({
      code: Code.REQUEST_SUCCESS,
      data: {
        ...platformSetting,
        ...data_update
      }
    }).code(Code.REQUEST_SUCCESS);
  } catch (error) {
    if (error.original && error.original.code === 'ER_DUP_ENTRY') {
      return h.response({
        code: Code.INVALID_PAYLOAD_PARAMS,
        error: {
          message: ['app_version is exist!']
        }
      }).code(Code.INVALID_PAYLOAD_PARAMS);
    } throw error;
  }
};

const DeletePlatformSettingDefault = async (request, h) => {
  try {
    const {
      params
    } = request;
    const userInfo = _.get(request, 'auth.credentials', false);
    if (userInfo.role !== 1) {
      return h.response({
        code: Code.INVALID_PERMISSION,
        error: {
          message: 'You don\'t have permission to perform this action'
        }
      }).code(Code.INVALID_PERMISSION);
    }

    const platformSettingDefault = await PlatformSettingDefaultsModel.findOne({
      where: {
        id: params.id
      },
      raw: true
    });

    if (_.isEmpty(platformSettingDefault) === true) {
      return h.response({
        code: Code.INVALID_SERVICE,
        error: {
          message: 'Platform Setting Default doesn\'t exist'
        }
      }).code(Code.INVALID_SERVICE);
    }
    const isDeleted = await PlatformSettingDefaultsModel.destroy({
      where: {
        id: params.id
      }
    });

    if (isDeleted === 0) {
      return h.response({
        code: Code.INVALID_PAYLOAD_PARAMS,
        error: {
          message: ['Remove platform setting default fail, please try again later !']
        }
      }).code(Code.INVALID_PAYLOAD_PARAMS);
    }

    return h
      .response({})
      .code(Code.NO_CONTENT);
  } catch (error) {
    throw error;
  }
};

module.exports = {
  GetPlatformSettingDefaults,
  GetPlatformSettingDefault,
  CreatePlatformSettingDefault,
  ModifyPlatformSettingDefault,
  DeletePlatformSettingDefault
};
