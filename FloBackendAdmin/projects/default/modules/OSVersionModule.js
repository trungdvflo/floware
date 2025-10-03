const _ = require('lodash');
const {
  Op
} = require('sequelize');
const Code = require('../constants/ResponseCodeConstant');
const {
  OSVersionModel
} = require('../models');
const {
  HandlePaging,
  HandleSortSequelize,
  Timestamp,
  HandleFilterToAttr
} = require('../utilities/Utils');

const Private = {

  FilterOSVersion: (request) => {
    const {
      query
    } = request;
    let result = {};
    if (_.isEmpty(query.filter_key) === true && _.isEmpty(query.keyword) === true) {
      return {};
    }

    const filter = HandleFilterToAttr(query.keyword);
    switch (query.filter_key) {
      case 'id': {
        result = {
          id: filter.value
        };
        break;
      }
      case 'os_name': {
        result = {
          os_name: {
            [Op.substring]: filter.value
          }
        };
        break;
      }
      case 'os_version': {
        result = {
          os_version: {
            [Op.substring]: filter.value
          }
        };
        break;
      }
      case 'os_type': {
        result = {
          os_type: {
            [Op.eq]: filter.value
          }
        };
        break;
      }
      default:
        break;
    }
    return result;
  }
};

const GetOSVersion = async (request, h) => {
  const {
    params
  } = request;
  const OSVersion = await OSVersionModel.findOne({
    where: {
      id: params.id
    },
    raw: true
  });

  if (_.isEmpty(OSVersion) === true) {
    return h.response({
      code: Code.NOT_FOUND,
      error: {
        message: 'OS Version setting doesn\'t exist'
      }
    }).code(Code.NOT_FOUND);
  }

  return h.response({
    code: Code.REQUEST_SUCCESS,
    data: _.pick(OSVersion, ['id', 'os_name', 'os_version', 'os_type', 'created_date', 'updated_date'])
  }).code(Code.REQUEST_SUCCESS);
};

const GetOSVersions = async (request, h) => {
  const {
    query
  } = request;
  const validSortField = ['id', 'os_name', 'os_version', 'os_type', 'created_date', 'updated_date'];
  const attributes = ['id', 'os_name', 'os_version', 'os_type', 'created_date', 'updated_date'];
  const order = HandleSortSequelize(query.sort, validSortField, ['os_version', 'DESC']);
  const where = Private.FilterOSVersion(request);
  const paging = HandlePaging(query.page, query.max_rows);

  const OSVersionQuery = {
    attributes,
    where,
    order,
    offset: paging.offset,
    limit: paging.limit,
    raw: true
  };

  const OSVersions = await OSVersionModel.findAndCountAll(OSVersionQuery);
  const data = _.get(OSVersions, 'rows', []);
  const totalRows = _.get(OSVersions, 'count', 0);

  if (_.isEmpty(data) === true) {
    return h.response({
      code: Code.REQUEST_SUCCESS,
      data: []
    }).code(Code.REQUEST_SUCCESS).header('X-Total-Count', totalRows);
  }

  const result = [];
  _.forEach(data, (item) => {
    result.push(
      _.pick(item, ['id', 'os_name', 'os_version', 'os_type', 'created_date', 'updated_date'])
    );
  });

  return h.response({
    code: Code.REQUEST_SUCCESS,
    data: result
  }).code(Code.REQUEST_SUCCESS).header('X-Total-Count', totalRows);
};

const CreateOSVersion = async (request, h) => {
  const {
    payload
  } = request;
  const checkExist = await OSVersionModel.findOne({
    where: {
      os_version: payload.os_version,
      os_type: payload.os_type
    },
    raw: true
  });

  if (_.isEmpty(checkExist) === false) {
    return h.response({
      code: Code.INVALID_PAYLOAD_PARAMS,
      error: {
        message: ['os_version or os_type are already exist']
      }
    }).code(Code.INVALID_PAYLOAD_PARAMS);
  }

  const modifyDate = Timestamp();
  const result = await OSVersionModel.create({
    os_name: payload.os_name,
    os_version: payload.os_version,
    os_type: payload.os_type,
    created_date: modifyDate,
    updated_date: modifyDate
  });

  const OSVersion = result.get({
    plain: true
  });
  return h.response({
    code: Code.REQUEST_SUCCESS,
    data: _.pick(OSVersion, ['id', 'os_name', 'os_version', 'os_type', 'created_date', 'updated_date'])
  }).code(Code.REQUEST_SUCCESS);
};

const ModifyOSVersion = async (request, h) => {
  const {
    payload,
    params
  } = request;

  const whereArgs = _.pick(payload, ['os_name', 'os_version', 'os_type']);
  if (_.isEmpty(whereArgs) === true) {
    return h.response({
      code: Code.INVALID_PAYLOAD_PARAMS,
      error: {
        message: ['Invalid Information']
      }
    }).code(Code.INVALID_PAYLOAD_PARAMS);
  }
  const checkExistByID = await OSVersionModel.findOne({
    where: {
      id: params.id
    },
    raw: true
  });

  if (_.isEmpty(checkExistByID) === true) {
    return h.response({
      code: Code.NOT_FOUND,
      error: {
        message: 'OS Version doesn\'t exist'
      }
    }).code(Code.NOT_FOUND);
  }

  const orWhere = [{
    [Op.and]: [{
      os_type: _.isNumber(whereArgs.os_type) ? whereArgs.os_type : checkExistByID.os_type
    },
    {
      os_version: whereArgs.os_version || checkExistByID.os_version
    }
    ]
  }];

  const checkExist = await OSVersionModel.findOne({
    where: {
      id: {
        [Op.ne]: params.id
      },
      [Op.or]: orWhere

    },
    raw: true
  });

  if (_.isEmpty(checkExist) === false) {
    return h.response({
      code: Code.INVALID_PAYLOAD_PARAMS,
      error: {
        message: ['os_version or os_type are already exist']
      }
    }).code(Code.INVALID_PAYLOAD_PARAMS);
  }

  const args = {
    ...whereArgs,
    updated_date: Timestamp()
  };

  const modifyStatus = await OSVersionModel.update(args, {
    where: {
      id: params.id
    },
    silent: true
  });

  const returnCode = modifyStatus ? modifyStatus[0] : 0;
  if (returnCode !== 1) {
    return h.response({
      code: Code.INVALID_PAYLOAD_PARAMS,
      error: {
        message: ['Update OS version fail, please try again later!']
      }
    }).code(Code.INVALID_PAYLOAD_PARAMS);
  }

  const OSVersion = await OSVersionModel.findOne({
    where: {
      id: params.id
    },
    raw: true
  });

  return h.response({
    code: Code.REQUEST_SUCCESS,
    data: _.pick(OSVersion, ['id', 'os_name', 'os_version', 'os_type', 'created_date', 'updated_date'])
  }).code(Code.REQUEST_SUCCESS);
};

const DeleteOSVersion = async (request, h) => {
  const {
    params
  } = request;

  const checkExist = await OSVersionModel.findOne({
    where: {
      id: params.id
    },
    raw: true
  });

  if (_.isEmpty(checkExist) === true) {
    return h.response({
      code: Code.NOT_FOUND,
      error: {
        message: 'OS Version doesn\'t exist'
      }
    }).code(Code.INVALID_SERVICE);
  }

  const isDelete = await OSVersionModel.destroy({
    where: {
      id: params.id
    }
  });
  if (isDelete !== 1) {
    return h.response({
      code: Code.NOT_FOUND,
      error: {
        message: 'Not found'
      }
    }).code(Code.NOT_FOUND);
  }
  return h.response({}).code(Code.NO_CONTENT);
};

module.exports = {
  GetOSVersion,
  GetOSVersions,
  CreateOSVersion,
  ModifyOSVersion,
  DeleteOSVersion
};
