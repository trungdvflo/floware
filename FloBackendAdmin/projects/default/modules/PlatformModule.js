/* eslint-disable object-curly-newline */
/* eslint-disable operator-linebreak */
/* eslint-disable no-multi-str */
/* eslint-disable no-useless-catch */
const _ = require('lodash');
const { Op } = require('sequelize');
const Code = require('../constants/ResponseCodeConstant');
const Utils = require('../utilities/Utils');
const { AppRegisterModel } = require('../models');

const GetAllPlatforms = async (keyword, paging) => {
  try {
    const result = await AppRegisterModel.findAll({
      where: {
        app_name: { [Op.substring]: _.trim(keyword) },
        app_reg_id: {
          [Op.in]: [
            'e70f1b125cbad944424393cf309efaf0', // Flo Online
            'ad944424393cf309efaf0e70f1b125cb', // Flo Mac
            'faf0e70f1bad944424393cf309e125cb', // Flo iOS
            'd944424393cf309e125cbfaf0e70f1ba' // Flo iPad
          ]
        }
      },
      ...paging,
      raw: true
    });


    return result || [];
  } catch (error) {
    return [];
  }
};

const GetPlatformList = async (request, h) => {
  try {
    const { query } = request;

    const userInfo = _.get(request, 'auth.credentials', false);
    if (userInfo.role !== 1) {
      return h
        .response({
          code: Code.INVALID_PERMISSION,
          error: {
            message: 'You don\'t have permission to perform this action'
          }
        })
        .code(Code.INVALID_PERMISSION);
    }

    const paging = Utils.HandlePaging(query.page, query.max_rows);
    const data = await GetAllPlatforms(_.trim(query.keyword), paging);

    const totalRows = await AppRegisterModel.count({
      where: { app_name: { [Op.substring]: _.trim(query.keyword) } },
      attributes: ['id', 'app_name', 'created_date', 'updated_date'],
      limit: paging.limit,
      offset: paging.offset,
      raw: true
    });

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

module.exports = {
  GetPlatformList
};
