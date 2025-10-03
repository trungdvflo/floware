/* eslint-disable object-curly-newline */
/* eslint-disable operator-linebreak */
/* eslint-disable no-multi-str */
/* eslint-disable no-useless-catch */
const _ = require('lodash');
const { Op } = require('sequelize');
const Code = require('../constants/ResponseCodeConstant');
const Utils = require('../utilities/Utils');
const { GroupsModel, GroupUserModel, ReleaseGroupModel, UserModel,
  ReportCachedUsersModel } = require('../models');
const { log } = require('handlebars');

const GetAllGroups = async (keyword, isInternal, paging) => {
  try {
    const result = await UserModel.sequelize
      .query('CALL adm2023_listOfGroup(:keyword, :isInternal, :offset, :limit)',
        {
          replacements: {
            keyword,
            isInternal: isInternal === undefined ? null : isInternal,
            offset: paging.offset,
            limit: paging.limit
          }
        });

    return result || [];
  } catch (error) {
    return [];
  }
};

const GetGroup = async (request, h) => {
  try {
    const { params } = request;

    const userInfo = _.get(request, 'auth.credentials', false);
    if (userInfo.role !== 1) {
      return h
        .response({
          code: Code.INVALID_PERMISSION,
          error: {
            message: "You don't have permission to perform this action"
          }
        })
        .code(Code.INVALID_PERMISSION);
    }

    const result = await GroupsModel.findOne({
      where: {
        id: params.id
      },
      attributes: ['id', 'name', 'description', 'group_type', 'internal_group',
        'created_date', 'updated_date'],
      raw: true
    });

    if (_.isEmpty(result) === true) {
      return h
        .response({
          code: Code.INVALID_SERVICE,
          error: {
            message: "Group doesn't exist"
          }
        })
        .code(Code.INVALID_SERVICE);
    }
    result.is_default = +(result.group_type === '2' && result.internal_group !== '0') || 0;
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

const GetGroups = async (request, h) => {
  try {
    const { query } = request;

    const userInfo = _.get(request, 'auth.credentials', false);
    if (userInfo.role !== 1) {
      return h
        .response({
          code: Code.INVALID_PERMISSION,
          error: {
            message: "You don't have permission to perform this action"
          }
        })
        .code(Code.INVALID_PERMISSION);
    }

    const paging = Utils.HandlePaging(query.page, query.max_rows);
    const raw = await GetAllGroups(_.trim(query.keyword), query.is_internal, paging);

    const totalRows = raw[0]?.totalRows;
    const data = raw.filter((gr) => {
      delete gr?.totalRows;
      return gr;
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

const CreateGroup = async (request, h) => {
  try {
    const { payload } = request;

    const userInfo = _.get(request, 'auth.credentials', false);
    if (userInfo.role !== 1) {
      return h
        .response({
          code: Code.INVALID_PERMISSION,
          error: {
            message: "You don't have permission to perform this action"
          }
        })
        .code(Code.INVALID_PERMISSION);
    }
    const groupName = _.trim(payload.name);
    const groupType = _.trim(payload.group_type) || '1';
    const groupDescription = _.trim(payload.description);
    const isGroupExisted = await GroupsModel.findOne({
      where: {
        name: groupName,
        group_type: groupType
      },
      raw: true
    });

    if (isGroupExisted) {
      return h
        .response({
          code: Code.INVALID_PAYLOAD_PARAMS,
          error: {
            message: ['Group name is already exists']
          }
        })
        .code(Code.INVALID_PAYLOAD_PARAMS);
    }

    const currentTimestamp = Utils.Timestamp();
    const group = await GroupsModel.create({
      name: groupName,
      description: groupDescription,
      group_type: groupType,
      internal_group: '0',
      updated_date: currentTimestamp,
      created_date: currentTimestamp
    });

    return h
      .response({
        code: Code.REQUEST_SUCCESS,
        data: group.get({
          plain: true
        })
      })
      .code(Code.REQUEST_SUCCESS);
  } catch (error) {
    throw error;
  }
};

const UpdateGroup = async (request, h) => {
  try {
    const { payload, params } = request;

    const userInfo = _.get(request, 'auth.credentials', false);
    if (userInfo.role !== 1) {
      return h
        .response({
          code: Code.INVALID_PERMISSION,
          error: {
            message: "You don't have permission to perform this action"
          }
        })
        .code(Code.INVALID_PERMISSION);
    }

    const group = await GroupsModel.findOne({
      where: {
        id: params.id
      },
      raw: true
    });

    if (_.isEmpty(group) === true) {
      return h
        .response({
          code: Code.INVALID_SERVICE,
          error: {
            message: "Group doesn't exist"
          }
        })
        .code(Code.INVALID_SERVICE);
    }
    const where = {
      id: {
        $ne: params.id
      },
      name: payload.name
    };
    const groupIsExist = await GroupsModel.findOne({
      where,
      raw: true
    });
    if (_.isEmpty(groupIsExist) === false) {
      return h
        .response({
          code: Code.INVALID_PAYLOAD_PARAMS,
          error: {
            message: ['Group name is already exists']
          }
        })
        .code(Code.INVALID_PAYLOAD_PARAMS);
    }
    let result;
    const updateData = {
      name: payload.name,
      description: payload.description,
      updated_date: Utils.Timestamp()
    };
    if (payload.group_type
      && payload.group_type !== group.group_type) {
      updateData.group_type = payload.group_type;
      updateData.internal_group = '0'; // reset + remove default
    }
    try {
      result = await GroupsModel.update(
        updateData,
        {
          where: {
            id: params.id
          }
        }
      );
    } catch (e) {
      result = 0;
    }
    const returnCode = result ? result[0] : 0;
    if (returnCode !== 1) {
      return h
        .response({
          code: Code.INVALID_PAYLOAD_PARAMS,
          error: {
            message: ['Update group fail, please try again later!']
          }
        })
        .code(Code.INVALID_PAYLOAD_PARAMS);
    }

    const groupInfo = await GroupsModel.findOne({
      where: {
        id: params.id
      },
      raw: true
    });

    return h
      .response({
        code: Code.REQUEST_SUCCESS,
        data: groupInfo
      })
      .code(Code.REQUEST_SUCCESS);
  } catch (error) {
    throw error;
  }
};

const DeleteGroup = async (request, h) => {
  try {
    const { params } = request;

    const userInfo = _.get(request, 'auth.credentials', false);
    if (userInfo.role !== 1) {
      return h
        .response({
          code: Code.INVALID_PERMISSION,
          error: {
            message: "You don't have permission to perform this action"
          }
        })
        .code(Code.INVALID_PERMISSION);
    }

    const group = await GroupsModel.findOne({
      where: {
        id: params.id
      },
      raw: true
    });

    if (_.isEmpty(group) === true) {
      return h
        .response({
          code: Code.INVALID_SERVICE,
          error: {
            message: "Group doesn't exist"
          }
        })
        .code(Code.INVALID_SERVICE);
    }

    await GroupsModel.sequelize.transaction(async (transaction) => {
      await GroupUserModel.destroy({
        where: {
          group_id: group.id
        },
        transaction
      });
      await ReleaseGroupModel.destroy({
        where: {
          group_id: group.id
        },
        transaction
      });
      const isDeleted = await GroupsModel.destroy({
        where: {
          id: group.id
        },
        transaction
      });
      // update all user in group report cached
      // get all report_cached_user
      const reports = await ReportCachedUsersModel.findAll({
        attributes: ['id', 'groups'],
        where: { groups: { [Op.regexp]: `"id":${group.id},` } }
      });
      // re init report_cached_user.groups
      await Promise.all(reports.map((rcu) => {
        let oldGroups;
        try {
          oldGroups = !rcu.groups ? [] : JSON.parse(rcu.groups);
        } catch (e) {
          oldGroups = [];
        }
        const reportGroups = oldGroups.filter((gr) => gr.id !== group.id);
        return ReportCachedUsersModel.update({
          groups: JSON.stringify(reportGroups)
        }, {
          where: { id: rcu.id }
        });
      }));

      return isDeleted;
    });

    return h.response({}).code(Code.NO_CONTENT);
  } catch (error) {
    throw error;
  }
};

module.exports = {
  GetGroups,
  GetGroup,
  CreateGroup,
  UpdateGroup,
  DeleteGroup
};
