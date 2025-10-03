/* eslint-disable object-curly-newline */
/* eslint-disable operator-linebreak */
/* eslint-disable no-multi-str */
/* eslint-disable no-useless-catch */
const _ = require('lodash');
const Code = require('../constants/ResponseCodeConstant');
const Utils = require('../utilities/Utils');
const { GlobalSettingModel } = require('../models');

const GetGlobalSettingList = async (request, h) => {
  try {
    const { query } = request;
    const userInfo = _.get(request, 'auth.credentials', false);

    if (userInfo.role === 1) {
      const paging = Utils.HandlePaging(query.page, query.max_rows);
      const globalSettingData = await GlobalSettingModel.findAll(
        {
          offset: paging.offset,
          limit: paging.limit,
          raw: true
        }
      );

      return h
        .response({
          code: Code.REQUEST_SUCCESS,
          data: globalSettingData
        }).code(Code.REQUEST_SUCCESS);
    }
    return h
      .response({
        code: Code.INVALID_PERMISSION,
        error: {
          message: 'You don\'t have permission to perform this action'
        }
      })
      .code(Code.INVALID_PERMISSION);
  } catch (error) {
    throw error;
  }
};

const PutGlobalSetting = async (request, h) => {
  try {
    const dataError = [];
    const dataPassed = [];
    const userInfo = _.get(request, 'auth.credentials', false);

    if (userInfo.role === 1) {
      const { payload } = request;
      await Promise.all(payload.map(async (item) => {
        const data = { ...item };
        const globalSettingItem = await GlobalSettingModel.findOne({
          attributes: ['id'],
          where: { id: item.id },
          useMaster: true
        });

        if (globalSettingItem === null) {
          const error = {
            code: Code.NO_CONTENT,
            error: {
              message: "item is not existed"
            }
          };
          return dataError.push(error);
        }
        data.updated_date = Utils.Timestamp();
        await GlobalSettingModel.update(data, {
          where: {
            id: item.id
          }
        });
        const rsUpdate = await GlobalSettingModel.findOne({
          where: { id: item.id },
          raw: true,
          useMaster: true
        });
        return dataPassed.push(rsUpdate);
      }));

      return h
        .response({
          code: Code.REQUEST_SUCCESS,
          data: {
            items: dataPassed,
            failed_items: dataError
          }
        }).code(Code.REQUEST_SUCCESS);
    }
    return h
      .response({
        code: Code.INVALID_PERMISSION,
        error: {
          message: "You don't have permission to perform this action"
        }
      })
      .code(Code.INVALID_PERMISSION);
  } catch (error) {
    throw error;
  }
};

module.exports = {
  GetGlobalSettingList,
  PutGlobalSetting
};
