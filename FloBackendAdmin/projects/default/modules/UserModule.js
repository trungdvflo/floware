/* eslint-disable no-useless-catch */
const _ = require('lodash');
const axios = require('axios');
const IsJSON = require('is-valid-json');
const AsyncForEach = require('await-async-foreach');
const Handlebars = require('handlebars');
const Sequelize = require('sequelize');
const Moment = require('moment');
const Code = require('../constants/ResponseCodeConstant');
const App = require('../constants/AppsConstant');
const Utils = require('../utilities/Utils');
const { RevokeToken } = require('../utilities/Accounts');
const Mail = require('../utilities/Mail');
const AppsConstant = require('../constants/AppsConstant');
const {
  AdminModel,
  DeviceTokenModel,
  ConfigModel,
  TrackingAppsModel,
  UserModel,
  UsersTrackingAppsModel,
  ReportCachedUsersModel,
  UsersDeletedModel
} = require('../models');

const { ValidateEmailFormat, RemoveDuplicateFailMessages } = Utils;

const permissionPO = [1];

const Private = {
  GetFrozenData: async (request, isExport) => {
    const { totalRows, data } = await Private.GetFrozenUsers(request, isExport);
    const result = [];
    _.forEach(data, (item) => {
      let account3rdEmails = [];
      if (_.isEmpty(item.account_3rd_emails) === false) {
        if (IsJSON(item.account_3rd_emails) === true) {
          account3rdEmails = JSON.parse(item.account_3rd_emails);
        } else {
          account3rdEmails.push(item.account_3rd_emails);
        }
      }

      let additionInfo = '';
      let isDeleted = 0;
      let timeRemain = -1;
      if (_.isEmpty(item.addition_info) === false) {
        if (IsJSON(item.addition_info) === true) {
          additionInfo = JSON.parse(item.addition_info);
          isDeleted = _.get(additionInfo, 'userDeleted.progress', false) === 0 ? 1 : 0;
          const cleaningDate = _.get(additionInfo, 'userDeleted.cleaning_date', 0);
          if (cleaningDate > 0) {
            timeRemain = cleaningDate - Date.now() / 1000;
            if (timeRemain < 0) timeRemain = 0;
          }
        }
      }

      const groupInfos = [];
      if (_.isEmpty(item.groups) === false) {
        if (IsJSON(item.groups) === true) {
          const groups = JSON.parse(item.groups);
          _.forEach(groups, (group) => {
            groupInfos.push(group.name);
          });
        } else {
          groupInfos.push(item.groups);
        }
      }

      function mergePlatform(oldPlatform, platform) {
        if (_.isEmpty(oldPlatform)) {
          return platform;
        }
        if (_.isEmpty(platform)) {
          return oldPlatform;
        }
        const allPlatformId = [...new Set([
          ...oldPlatform, ...platform
        ].map((p) => p.app_reg_id))];
        return allPlatformId.map((id) => {
          const platformItem = platform.find((p) => p.app_reg_id === id);
          if (!_.isEmpty(platformItem)) {
            return platformItem;
          }
          return oldPlatform.find((p) => p.app_reg_id === id);
        });
      }

      let groups;
      try { groups = JSON.parse(item.groups); } catch (e) { groups = []; }
      const groupNames = new Set(groups.map((g) => g.name));
      const groupIds = groups.map((g) => g.id);
      const mergedPlatform = mergePlatform(item.old_platform, item.platform);
      let platformName = [];
      if (mergedPlatform && mergedPlatform.length > 0) {
        platformName = mergedPlatform.map((p) => p.app_name);
      }

      if (isExport) {
        result.push({
          id: item.id,
          email: item.email,
          fullname: _.get(additionInfo, 'fullname', ''),
          groups: [...groupNames].join(','),
          account_3rd_emails: _.isEmpty(account3rdEmails) === false ? account3rdEmails.join('\n') : '',
          join_date: item.join_date,
          last_used_date: item.last_used_date,
          disabled: item.disabled,
          delete_status: item.deleted,
          migrates: item.user_migrate_status === App.USER_MIGRATE_STATUS.IS_V32 ? 'Not migrate' : 'Migrated',
          migrate_status: item.user_migrate_status ?? App.USER_MIGRATE_STATUS.IS_V4,
          platform: platformName.join(','),
          time_remain: timeRemain
        });
      } else {
        result.push({
          id: item.id,
          email: item.email,
          fullname: _.get(additionInfo, 'fullname', ''),
          groups: [...groupNames].join(','),
          group_ids: groupIds,
          account_3rd: item.account_3rd,
          account_3rd_emails: _.isEmpty(account3rdEmails) === false ? account3rdEmails.join('\n') : '',
          join_date: item.join_date,
          last_used_date: item.last_used_date,
          disabled: item.disabled,
          delete_status: item.deleted,
          migrates: item.user_migrate_status === App.USER_MIGRATE_STATUS.IS_V32 ? 'Not migrate' : 'Migrated',
          migrate_status: item.user_migrate_status ?? App.USER_MIGRATE_STATUS.IS_V4,
          platform: mergedPlatform,
          time_remain: timeRemain
        });
      }
    });

    return { totalRows, data: result };
  },
  GetFrozenUsers: async (request, isExport) => {
    const { query } = request;
    const attributes = [
      'id',
      'user_id',
      'email',
      'account_3rd',
      'account_3rd_emails',
      'account_type',
      'groups',
      'order_number',
      'last_used_date',
      'join_date',
      'next_renewal',
      'disabled',
      'deleted',
      'addition_info',
      'user_migrate_status',
      'platform',
      'old_platform',
      'created_date',
      'updated_date'
    ];
    const where = Private.FilterHandle(request);
    const order = Private.SortHandle(request);
    const include = [
      // {
      //   model: UsersDeletedModel,
      //   as: 'userDeleted',
      //   attributes: ['progress', 'cleaning_date']
      // }
    ];
    if (isExport) {
      const data = await ReportCachedUsersModel.findAll({
        attributes,
        where,
        include,
        order,
        group: ['report_cached_user.email']
      });
      return { data };
    }
    const paging = Utils.HandlePaging(query.page, query.max_rows);
    const data = await ReportCachedUsersModel.findAll({
      attributes,
      where,
      include,
      offset: paging.offset,
      limit: paging.limit,
      order,
      group: ['report_cached_user.email']
    });
    const totalRows = await ReportCachedUsersModel.count({ attributes, where });
    if (totalRows <= 0) {
      return { totalRows: 0, data };
    }
    return { totalRows, data };
  },
  FilterHandle: (
    request,
    allowConditionItems = [
      'ids',
      'user_ids',
      'group_ids',
      'group_type',
      'keyword',
      'account_types',
      'last_used_start',
      'last_used_end',
      'join_date_start',
      'join_date_end',
      'is_disabled',
      'is_deleted',
      'migration_status',
      'group_filter_type',
      'platform_ids',
      'platform_filter_type',
      'migrate_filter_type'
    ]
  ) => {
    const { query } = request;
    const conditionItems = _.pick(query, allowConditionItems);
    if (_.isEmpty(conditionItems) === true) {
      return '';
    }
    const result = {};

    if (_.isEmpty(conditionItems.keyword) === false) {
      result[Sequelize.Op.or] = [{
        email: {
          [Sequelize.Op.substring]: query.keyword
        }
      }, {
        account_3rd_emails: {
          [Sequelize.Op.substring]: query.keyword
        }
      }];
    }
    // alway = 1
    result.disabled = 1;
    if (Number.isInteger(conditionItems.is_deleted)) {
      result.deleted = conditionItems.is_deleted;
    }

    if (_.isEmpty(conditionItems.ids) === false) {
      const ids = _.map(conditionItems.ids.split(','), (item) => {
        const id = item.trim();

        if (_.isNaN(Number(id)) === false) {
          return Number(id);
        }
        return undefined;
      });
      _.remove(ids, _.isUndefined);

      if (_.isEmpty(result[Sequelize.Op.and]) === true) {
        result[Sequelize.Op.and] = [];
      }

      if (_.isEmpty(ids) === false) {
        result[Sequelize.Op.and].push({
          id: ids
        });
      }
    }

    if (_.isEmpty(conditionItems.platform_ids) === false) {
      const platformIds = conditionItems.platform_ids
        .split(',')
        .map((item) => item.trim())
        .filter(Boolean);

      const platformOp = conditionItems.platform_filter_type === App.FILTER_TYPE.ALL
        ? Sequelize.Op.and : Sequelize.Op.or;

      const conditionPlatform = conditionItems.platform_filter_type === App.FILTER_TYPE.ANY
        ? [{ [Sequelize.Op.regexp]: `"app_reg_id": "${platformIds.join('|')}"` }]
        : _.uniq(platformIds).map(
          (uniqPlatformId) => ({
            [Sequelize.Op.substring]: `"app_reg_id": "${uniqPlatformId}"`
          })
        );
      result[Sequelize.Op.and] = result[Sequelize.Op.and] || [];
      result[Sequelize.Op.and].push(
        Sequelize.where(
          Sequelize.fn("CONCAT",
            Sequelize.fn('IFNULL', Sequelize.col("platform"), ''),
            Sequelize.fn('IFNULL', Sequelize.col("old_platform"), '')),
          {
            [platformOp]: conditionPlatform
          }
        )
      );
    }

    if (_.isEmpty(conditionItems.group_ids) === false) {
      result.groups = {};
      const groupIds = conditionItems.group_ids.split(',').map((item) => {
        return +item.trim();
      }).filter(Number.isInteger);

      if (_.isEmpty(groupIds) === false) {
        const groupOp = conditionItems.group_filter_type === App.FILTER_TYPE.ALL
          ? Sequelize.Op.and : Sequelize.Op.or;
        result.groups[groupOp] = [];
        const noGroup = (gid) => gid === -1;
        const uniqGroupIds = [...new Set(groupIds)];
        if (conditionItems.group_filter_type === App.FILTER_TYPE.ANY) {
          result.groups[groupOp].push({ [Sequelize.Op.regexp]: `"id":(${uniqGroupIds.join('|')}),` });
          if (uniqGroupIds.find(noGroup) !== undefined) {
            result.groups[Sequelize.Op.or] = result.groups[Sequelize.Op.or] || [];
            result.groups[Sequelize.Op.or].push('[]');
            result.groups[Sequelize.Op.or].push('');
          }
        } else {
          result.groups[groupOp].push(...uniqGroupIds
            .filter((g) => g > 0)
            .map((uniqGroupId) => ({
              [Sequelize.Op.substring]: `"id":${uniqGroupId},`
            })));
        }
      }
    }
    //
    if (_.isNumber(conditionItems.group_type) === true) {
      if (_.isObject(result.groups) === false) {
        result.groups = {};
      }
      if (_.isEmpty(result.groups[Sequelize.Op.and]) === true) {
        result.groups[Sequelize.Op.and] = [];
      }
      result.groups[Sequelize.Op.and].push({
        [Sequelize.Op.substring]: `"group_type":"${conditionItems.group_type}"`
      });
    }
    //
    if (_.isEmpty(conditionItems.account_types) === false) {
      const accountTypes = _.map(conditionItems.account_types.split(','), (item) => {
        const id = item.trim();

        if (_.isNaN(Number(id)) === false) {
          return Number(id);
        }
        return undefined;
      });
      _.remove(accountTypes, _.isUndefined);
      if (_.isEmpty(accountTypes) === false) {
        if (_.isObject(result.account_type) === false) {
          result.account_type = {};
        }
        if (_.isEmpty(result.account_type[Sequelize.Op.or]) === true) {
          result.account_type[Sequelize.Op.or] = [];
        }

        const uniqAccountTypes = _.uniq(accountTypes);
        _.forEach(uniqAccountTypes, (uniqAccountType) => {
          const accountType = App.ACCOUNT_TYPE_MAP[uniqAccountType];
          if (_.isNumber(accountType) === true) {
            result.account_type[Sequelize.Op.or].push({
              [Sequelize.Op.substring]: `${accountType}`
            });
          } else {
            _.forEach(accountType, (item) => {
              result.account_type[Sequelize.Op.or].push({
                [Sequelize.Op.substring]: `${item}`
              });
            });
          }
        });
      }
    }

    //
    if (_.isNumber(conditionItems.join_date_start) === true && _.isNumber(conditionItems.join_date_end) === true) {
      if (conditionItems.join_date_start <= conditionItems.join_date_end) {
        result.join_date = {
          [Sequelize.Op.gte]: conditionItems.join_date_start,
          [Sequelize.Op.lte]: conditionItems.join_date_end
        };
      }
    }

    //
    if (_.isNumber(conditionItems.last_used_start) === true && _.isNumber(conditionItems.last_used_end) === true) {
      if (conditionItems.last_used_start <= conditionItems.last_used_end) {
        result.last_used_date = {
          [Sequelize.Op.gte]: conditionItems.last_used_start,
          [Sequelize.Op.lte]: conditionItems.last_used_end
        };
      }
    }

    //
    if (!_.isEmpty(conditionItems.migration_status)) {
      result[Sequelize.Op.and] = {
        ...result[Sequelize.Op.and],
        user_migrate_status: {
          [Sequelize.Op.in]:
            conditionItems.migration_status
              .split(',')
              .map(Number)
        }
      };
    }
    return result;
  },

  SortHandle: (
    request,
    validSortField = [
      'id',
      'email',
      'fullname',
      'groups',
      'join_date',
      'last_used_date',
      'account_3rd',
      'time_remain',
      'status'
    ]
  ) => {
    try {
      const { query } = request;
      const conditionItems = _.pick(query, ['sort']);
      if (_.isEmpty(conditionItems) === true) {
        return '';
      }

      return Utils.HandleSortCustomSequelize(query.sort, validSortField, [
        {
          field: 'groups',
          value:
            'JSON_UNQUOTE(CASE WHEN JSON_VALID(groups) THEN REPLACE(REPLACE(JSON_EXTRACT(`groups`,\'$[*].name\'),\', \',\'\'),\'""\',\'\') ELSE "" END )'
        },
        {
          field: 'fullname',
          value:
            'JSON_UNQUOTE(CASE WHEN JSON_VALID(addition_info) THEN JSON_EXTRACT(`addition_info`,\'$."fullname"\') ELSE "" END )'
        },
        {
          field: 'time_remain',
          value:
            'JSON_UNQUOTE(CASE WHEN JSON_VALID(addition_info) THEN JSON_EXTRACT(`addition_info`,\'$."userDeleted"."cleaning_date"\') ELSE "" END )'
        },
        {
          field: 'status',
          value:
            'deleted'
        }
      ]);
    } catch (error) {
      return [];
    }
  },

  pad: (num, places) => {
    const zero = places - num.toString().length + 1;
    return Array(+(zero > 0 && zero)).join('0') + num;
  },

  DeleteMailContent: (emails) => {
    const result = [];
    let count = 0;
    _.forEach(emails, (email) => {
      result.push({
        no: Private.pad((count += 1), 2),
        shortEmail: email.split('@')[0],
        email
      });
    });
    return result;
  },

  DeleteMailTemplate: (sender, emails) => {
    // eslint-disable-next-line no-async-promise-executor
    return new Promise(async (resolve) => {
      if (_.isEmpty(emails) === true) {
        return resolve(false);
      }

      const htmlDir = `${__dirname}/../../../assets/templates/emails/announce_mail.html`;
      const html = await Mail.ReadHTMLFile(htmlDir);
      const template = Handlebars.compile(html);
      const title = '[Admin] Account Deletion Notification';
      const content = Private.DeleteMailContent(emails);

      const utcMoment = Moment.utc();
      const replacements = {
        image: 'https://static-cdn.floware.com/icons/logo-flo-v2.svg',
        datetime: `${utcMoment.format('MMM DD, YYYY')} at ${utcMoment.format('hh:mm A')}`,
        title,
        sender,
        noEmail: emails.length,
        noEmailText: emails.length > 1 ? 'accounts' : 'account',
        content,
        adminDomainUrl: process.env.ADMIN_DOMAIN_URL
      };

      const htmlToSend = template(replacements);
      return resolve({
        title,
        body: htmlToSend
      });
    });
  }
};
/**
 * @param {String[]} emails
 * @param {boolean} isImmediate
 */
const bulkDeleteUsers = async (emails) => {
  const users = await UserModel.findAll({
    where: {
      username: emails
    }
  });

  if (_.isEmpty(users) === true) {
    return false;
  }
  const now = Date.now();

  const userIds = [];
  const queries = [];
  const reportCaches = [];

  _.forEach(users, (u) => {
    userIds.push(u.id);
    queries.push({
      user_id: u.id,
      username: u.username,
      is_disabled: u.disabled,
      created_date: now / 1000,
      cleaning_date: (now + AppsConstant.DELETED_USER_CLEANING_WAIT_TIME_SECOND * 1000) / 1000
    });
    reportCaches.push({
      user_id: u.id,
      fullname: u.fullname,
      disabled: 1,
      userDeleted: {
        username: u.username,
        is_disabled: u.disabled,
        progress: 0,
        cleaning_date: (now + AppsConstant.DELETED_USER_CLEANING_WAIT_TIME_SECOND * 1000) / 1000
      }
    });
  });

  const t = await UsersDeletedModel.sequelize.transaction();
  try {
    await UsersDeletedModel.bulkCreate(queries, {
      return: true,
      ignoreDuplicates: true,
      transaction: t
    });

    const dataUpdate = {
      disabled: 1,
      updated_date: Utils.Timestamp()
    };

    await UserModel.update(dataUpdate, {
      where: {
        id: userIds
      },
      transaction: t
    });

    await AsyncForEach(reportCaches, async (reportCache) => {
      const additionInfo = JSON.stringify(reportCache);
      await ReportCachedUsersModel.update({
        deleted: 1,
        ...dataUpdate,
        addition_info: additionInfo
      }, {
        where: { user_id: reportCache.user_id },
        transaction: t
      });
    });

    await t.commit();
  } catch (error) {
    await t.rollback();
  }
  
  await RevokeToken(userIds);
  return true;
};

function filterDuplicateItem(_data) {
  const dataError = [];
  const dataFilter = _data.filter((value, index, self) => {
    if (index === self.findIndex((t) => t.email === value.email)) {
      return value;
    }
    dataError.push(value);
  });
  return { dataFilter, dataError };
}

const Freeze = async (request, h) => {
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

    const emails = _.uniq(payload.emails);
    const validEmails = [];
    const fails = [];
    const successes = [];
    const revokeUserIds = [];

    emails.forEach((e) => {
      if (ValidateEmailFormat(e) === true) {
        validEmails.push(e.trim());
      } else {
        fails.push({
          email: e,
          message: 'Invalid email format'
        });
      }
    });

    if (_.isEmpty(validEmails) === true) {
      return h
        .response({
          code: Code.REQUEST_SUCCESS,
          data: {
            items: [],
            failed_items: fails
          }
        })
        .code(Code.REQUEST_SUCCESS);
    }

    const adminUsers = await AdminModel.findAll({
      where: {
        email: validEmails,
        role: 1
      },
      raw: true
    });

    const users = await UserModel.findAll({
      where: {
        email: validEmails
      },
      raw: true
    });

    await AsyncForEach(users, async (user) => {
      const adminUser = _.find(adminUsers, {
        email: user.email
      });
      if (_.isEmpty(adminUser) === false) {
        fails.push({
          email: user.email,
          message: 'Can not freeze PO role'
        });
      } else if (user.disabled === 0) {
        const dataUpdate = { disabled: 1, updated_date: Utils.Timestamp() };

        const modify = await UserModel.update(dataUpdate, { where: { id: user.id } });
        await ReportCachedUsersModel.update(dataUpdate, { where: { user_id: user.id } });

        if (_.isEmpty(modify) === false) {
          revokeUserIds.push(user.id);
          successes.push(user.email);
        } else {
          fails.push({
            email: user.email,
            message: 'Freeze user account fail'
          });
        }
      } else {
        fails.push({
          email: user.email,
          message: 'User account has been disabled'
        });
      }
    });

    /**
     * Revoke user deviceTokens, AccessToken, appToken
     */
    if (_.isEmpty(revokeUserIds) === false) {
      await RevokeToken(revokeUserIds);
      await DeviceTokenModel.destroy({
        where: {
          user_id: revokeUserIds
        }
      });
    }
    return h
      .response({
        code: Code.REQUEST_SUCCESS,
        data: {
          items: successes,
          failed_items: RemoveDuplicateFailMessages(fails)
        }
      })
      .code(Code.REQUEST_SUCCESS);
  } catch (error) {
    console.log('lsdfkslkflskfldkflsdfksldf', error);
    throw error;
  }
};

const UnFreeze = async (request, h) => {
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

    const emails = _.uniq(payload.emails);
    const validEmails = [];
    const fails = [];
    const successes = [];

    emails.forEach((e) => {
      if (ValidateEmailFormat(e) === true) {
        validEmails.push(e.trim());
      } else {
        fails.push({
          email: e,
          message: 'Invalid email format'
        });
      }
    });

    if (_.isEmpty(validEmails) === true) {
      return h
        .response({
          code: Code.REQUEST_SUCCESS,
          data: {
            items: [],
            failed_items: RemoveDuplicateFailMessages(fails)
          }
        })
        .code(Code.REQUEST_SUCCESS);
    }

    const adminUsers = await AdminModel.findAll({
      where: {
        email: validEmails,
        role: 1
      },
      raw: true
    });

    const users = await UserModel.findAll({
      where: {
        email: validEmails
      },
      raw: true
    });

    const deletedUsers = await UsersDeletedModel.findAll({
      where: {
        username: validEmails
      },
      raw: true
    });

    if (_.isEmpty(deletedUsers) === false) {
      _.forEach(deletedUsers, (deletedUser) => {
        const deletedUserIndex = _.findIndex(users, {
          id: deletedUser.user_id
        });
        users.splice(deletedUserIndex, 1);

        fails.push({
          email: deletedUser.username,
          message: 'User account has been disabled'
        });
      });
    }

    await AsyncForEach(users, async (user) => {
      const adminUser = _.find(adminUsers, {
        email: user.email
      });

      if (_.isEmpty(adminUser) === false) {
        fails.push({
          email: user.email,
          message: 'Can not unFreeze PO role'
        });
      } else if (user.disabled === 1) {
        const dataUpdate = { disabled: 0, updated_date: Utils.Timestamp() };

        const modify = await UserModel.update(dataUpdate, { where: { id: user.id } });
        await ReportCachedUsersModel.update({ ...dataUpdate, deleted: 0 }, { where: { user_id: user.id } });

        if (_.isEmpty(modify) === false) {
          successes.push(user.email);
        } else {
          fails.push({
            email: user.email,
            message: 'UnFreeze user account fail'
          });
        }
      }
    });

    return h
      .response({
        code: Code.REQUEST_SUCCESS,
        data: {
          items: successes,
          failed_items: RemoveDuplicateFailMessages(fails)
        }
      })
      .code(Code.REQUEST_SUCCESS);
  } catch (error) {
    throw error;
  }
};

const GetInformation = async (request, h) => {
  try {
    const userInfo = _.get(request, 'auth.credentials', false);
    return h
      .response({
        code: Code.REQUEST_SUCCESS,
        data: { email: userInfo.email, role: userInfo.role }
      })
      .code(Code.REQUEST_SUCCESS);
  } catch (error) {
    throw error;
  }
};

const GetAdminInformation = async (request, h) => {
  try {
    const { query } = request;
    const email = query.email.toLowerCase();
    const cachedUser = await ReportCachedUsersModel.findOne({
      where: {
        email
      },
      raw: true
    });
    if (_.isEmpty(cachedUser) === true) {
      return h
        .response({
          code: Code.INVALID_SERVICE,
          error: {
            message: 'Can not find admin information'
          }
        })
        .code(Code.INVALID_SERVICE);
    }

    const setAccount = [];
    if (cachedUser.account_3rd > 0) {
      const account3rdEmails = _.get(cachedUser, 'account_3rd_emails', '[]');
      const accountType = _.get(cachedUser, 'account_type', '[]');
      if (IsJSON(account3rdEmails) === true && IsJSON(accountType) === true) {
        const account3rdEmailsArr = JSON.parse(account3rdEmails);
        const accountTypeArr = JSON.parse(account3rdEmails);
        _.forEach(account3rdEmailsArr, (account3rdEmail, key) => {
          setAccount.push({
            set_account: {
              id: null,
              user_income: account3rdEmail,
              account_type: accountTypeArr[key]
            }
          });
        });
      }
    }

    let storage = {};

    if (IsJSON(cachedUser.storage) === true) {
      storage = JSON.parse(cachedUser.storage);
    }

    const usedStorage = {
      contact: _.get(storage, 'contact', 0),
      event: _.get(storage, 'event', 0),
      message: _.get(storage, 'message', 0),
      note: _.get(storage, 'note', 0),
      todo: _.get(storage, 'todo', 0)
    };

    const groups = [];
    if (IsJSON(cachedUser.groups) === true) {
      const groupsArr = JSON.parse(cachedUser.groups);
      _.forEach(groupsArr, (group) => {
        groups.push({
          id: group.id,
          name: group.name,
          group_type: group.group_type,
          description: group.description,
          created_date: group.created_date,
          updated_date: group.updated_date
        });
      });
    }

    const versions = [];
    const trackingApps = await TrackingAppsModel.findAll({
      attributes: ['id', 'name', 'app_version', 'flo_version', 'build_number'],
      include: [
        {
          attributes: ['last_used_date'],
          where: {
            user_id: cachedUser.user_id
          },
          model: UsersTrackingAppsModel,
          as: 'users_tracking_app'
        }
      ],
      raw: true
    });
    if (_.isEmpty(trackingApps) === false) {
      _.forEach(trackingApps, (trackingApp) => {
        versions.push({
          id: trackingApp.id,
          name: trackingApp.name,
          app_version: trackingApp.app_version,
          build_number: trackingApp.build_number,
          flo_version: trackingApp.flo_version,
          last_used_date: trackingApp['users_tracking_app.last_used_date']
        });
      });
    }

    const data = {
      configured_acc: setAccount,
      groups,
      used_storage: usedStorage,
      versions
    };

    return h
      .response({
        code: Code.REQUEST_SUCCESS,
        data
      })
      .code(Code.REQUEST_SUCCESS);
  } catch (error) {
    throw error;
  }
};

const GetFrozenUsers = async (request, h) => {
  const userInfo = _.get(request, 'auth.credentials', false);
  if (Utils.RolePermission(userInfo, permissionPO) === false) {
    return h
      .response({
        code: Code.INVALID_PERMISSION,
        error: {
          message: 'You don\'t have permission to perform this action'
        }
      })
      .code(Code.INVALID_PERMISSION);
  }

  const result = await Private.GetFrozenData(request);
  if (_.isEmpty(result.data) === true || result.data === false) {
    return h
      .response({
        code: Code.REQUEST_SUCCESS,
        data: []
      })
      .code(Code.REQUEST_SUCCESS)
      .header('X-Total-Count', result.totalRows || 0);
  }

  return h
    .response({
      code: Code.REQUEST_SUCCESS,
      data: result.data
    })
    .code(Code.REQUEST_SUCCESS)
    .header('X-Total-Count', result.totalRows);
};

const ExportFrozenUsers = async (request, h) => {
  const userInfo = _.get(request, 'auth.credentials', false);
  if (Utils.RolePermission(userInfo, permissionPO) === false) {
    return h
      .response({
        code: Code.INVALID_PERMISSION,
        error: {
          message: 'You don\'t have permission to perform this action'
        }
      })
      .code(Code.INVALID_PERMISSION);
  }
  const result = await Private.GetFrozenData(request, true);
  if (_.isEmpty(result.data) === true || result.data === false) {
    return h
      .response({
        code: Code.REQUEST_SUCCESS,
        data: []
      })
      .code(Code.REQUEST_SUCCESS)
      .header('X-Total-Count', 0);
  }

  const filename = `flo_user_frozen_${Moment().format('DDMMYY_HHMM')}`;
  const file = Utils.JSONToCSVStream(result.data, true);

  return h
    .response(file)
    .header('Cache-Control', 'no-cache')
    .header('Content-Type', 'text/csv')
    .header('Content-Disposition', `attachment; filename=${filename}.csv`);
};

const DeleteUsers = async (request, h) => {
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

    const emails = _.uniq(payload.emails);
    const validEmails = [];
    const fails = [];
    const successes = [];

    emails.forEach((e) => {
      if (ValidateEmailFormat(e) === true) {
        validEmails.push(e.trim());
      } else {
        fails.push({
          email: e,
          message: 'Invalid email format'
        });
      }
    });

    if (_.isEmpty(validEmails) === true) {
      return h.response({
        code: Code.REQUEST_SUCCESS,
        data: {
          items: [],
          failed_items: fails
        }
      }).code(Code.REQUEST_SUCCESS);
    }

    const adminUsers = await AdminModel.findAll({
      where: {
        email: validEmails,
        role: 1
      },
      raw: true
    });

    const users = await UserModel.findAll({
      where: {
        email: validEmails
      },
      order: [['email', 'ASC']],
      raw: true
    });

    const deletedUsers = await UsersDeletedModel.findAll({
      where: {
        username: validEmails
      },
      raw: true
    });

    if (_.isEmpty(deletedUsers) === false) {
      _.forEach(deletedUsers, (deletedUser) => {
        fails.push({
          email: deletedUser.username,
          message: 'User account has been disabled'
        });
      });
    }

    const successes40 = [];
    await AsyncForEach(users, async (user) => {
      const adminUser = _.find(adminUsers, {
        email: user.email
      });
      const deletedUser = _.find(deletedUsers, {
        user_id: user.id
      });
      if (_.isEmpty(adminUser) === false) {
        fails.push({
          email: user.email,
          message: 'Can not delete PO role'
        });
      } else if (_.isEmpty(deletedUser) === true) {
        successes.push(user.email);
        successes40.push(user.email);
      }
    });
    if (_.isEmpty(successes40) === false) {
      // Set Flag delete user
      await bulkDeleteUsers(successes40);
    }
    if (_.isEmpty(successes) === false) {
      // send mail
      const mailContent = await Private.DeleteMailTemplate(userInfo.email, successes);
      const POUsers = await AdminModel.findAll({
        attributes: ['email'],
        where: { role: 1 },
        raw: true
      });

      Mail.send({
        subject: mailContent.title,
        to: POUsers.map((POUser) => POUser.email),
        html: mailContent.body
      });
    }

    return h.response({
      code: Code.REQUEST_SUCCESS,
      data: {
        items: successes,
        failed_items: RemoveDuplicateFailMessages(fails)
      }
    }).code(Code.REQUEST_SUCCESS);
  } catch (error) {
    throw error;
  }
};

const RecoverDeletedUser = async (request, h) => {
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

  const emails = _.uniq(payload.emails);
  const validEmails = [];
  const fails = [];

  emails.forEach((e) => {
    if (ValidateEmailFormat(e) === true) {
      validEmails.push(e.trim());
    } else {
      fails.push({
        email: e,
        message: 'Invalid email format'
      });
    }
  });
  if (_.isEmpty(validEmails) === true) {
    return h
      .response({
        code: Code.REQUEST_SUCCESS,
        data: {
          items: [],
          failed_items: RemoveDuplicateFailMessages(fails)
        }
      })
      .code(Code.REQUEST_SUCCESS);
  }

  const adminUsers = await AdminModel.findAll({
    where: {
      email: validEmails,
      role: 1
    },
    raw: true
  });

  const users = await UserModel.findAll({
    where: { email: validEmails },
    raw: true
  });

  const deletedUsers = await UsersDeletedModel.findAll({
    where: {
      progress: 0,
      username: validEmails
    },
    raw: true
  });

  const userIds = [];
  const successes = [];
  const usersDisabled = {};
  const usersReport = [];
  _.forEach(validEmails, (validEmail) => {
    const adminEmail = _.find(adminUsers, { email: validEmail });
    const existUser = _.find(users, { email: validEmail });
    const existDeleted = _.find(deletedUsers, { username: validEmail });

    if (_.isEmpty(existUser) === true) {
      fails.push({
        email: validEmail,
        message: "User doesn't exist"
      });
    } else if (_.isEmpty(adminEmail) === false) {
      fails.push({
        email: validEmail,
        message: 'Can not recover PO role'
      });
    } else if (_.isEmpty(existDeleted) === true) {
      fails.push({
        email: validEmail,
        message: "User wasn't deleted"
      });
    } else {
      successes.push(existDeleted.username);
      userIds.push(existDeleted.user_id);
      if (_.isUndefined(usersDisabled[existDeleted.is_disabled]) === true) {
        usersDisabled[existDeleted.is_disabled] = [];
      }
      usersDisabled[existDeleted.is_disabled].push(existDeleted.user_id);
      existUser.disabled = existDeleted.is_disabled;
      usersReport.push(existUser);
    }
  });

  const t = await UsersDeletedModel.sequelize.transaction();
  try {
    await UsersDeletedModel.destroy({
      where: { user_id: userIds },
      transaction: t
    });

    await AsyncForEach(usersDisabled, async (userDisabled, disabled) => {
      const dataUpdate = { disabled: +disabled, updated_date: Utils.Timestamp() };
      await UserModel.update(dataUpdate, { where: { id: userDisabled }, transaction: t });
    });

    await AsyncForEach(usersReport, async (u) => {
      const dataUpdate = { disabled: u.disabled, updated_date: Utils.Timestamp() };
      const additionInfo = JSON.stringify({
        user_id: u.id,
        fullname: u.fullname,
        disabled: u.disabled
      });
      await ReportCachedUsersModel.update(
        { deleted: 0, ...dataUpdate, addition_info: additionInfo },
        { where: { user_id: u.id }, transaction: t }
      );
    });

    await t.commit();
  } catch (error) {
    await t.rollback();
    return h.response({
      code: Code.SYSTEM_ERROR,
      message: 'Server error'
    });
  }

  return h
    .response({
      code: Code.REQUEST_SUCCESS,
      data: {
        items: successes,
        failed_items: RemoveDuplicateFailMessages(fails)
      }
    })
    .code(Code.REQUEST_SUCCESS);
};

const GetUsersDeleted = async (request, h) => {
  try {
    const { query } = request;
    const validSortField = ['id', 'username'];
    const paging = Utils.HandlePaging(query.page, query.max_rows);
    const order = Utils.HandleSortSequelize(query.sort, validSortField);
    const attributes = ['id', 'username', 'is_disabled', 'progress', 'cleaning_date', 'created_date'];
    const usersDeletedInfo = await UsersDeletedModel.findAndCountAll(
      {
        attributes,
        offset: paging.offset,
        limit: paging.limit,
        order,
        raw: true
      }
    );
    return h
      .response({
        code: Code.REQUEST_SUCCESS,
        data: usersDeletedInfo
      }).code(Code.REQUEST_SUCCESS);
  } catch (error) {
    throw error;
  }
};

const PutUsersDeleted = async (request, h) => {
  try {
    const dataError = [];
    const dataPassed = [];
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
    const responseFields = ['id', 'username', 'is_disabled', 'progress', 'cleaning_date', 'created_date'];
    const { value } = await ConfigModel.findOne({
      attributes: ['value'],
      where: {
        key: 'interval_delete_user'
      },
      raw: true
    });

    const cleaningTime = Number(Utils.Timestamp() + value.period_time);
    const { payload } = request;
    const { dataFilter } = filterDuplicateItem(payload);

    await Promise.all(dataFilter.map(async (item) => {
      const dataByEmail = await UsersDeletedModel.findOne({
        where: {
          username: item.email
        }
      });

      if (_.isEmpty(dataByEmail) === true) {
        const error = {
          code: Code.INVALID_SERVICE,
          error: { message: "Email doesn't exist" }
        };
        return dataError.push(error);
      }

      // Handle approve
      if (item.activeStatus === 0) {
        if (dataByEmail.progress === 0 && dataByEmail.cleaning_date === 0) {
          const dataUpdate = await dataByEmail.update({
            cleaning_date: cleaningTime
          });
          return dataPassed.push(_.pick(dataUpdate.dataValues, responseFields));
        }
        const error = {
          code: Code.INVALID_SERVICE,
          error: { message: "Worker is excuting this item" }
        };
        return dataError.push(error);
      }
      // Handle reject
      // Update table User of mail server with current is_disable
      const baseURL = `${AppsConstant.INTERNAL_EMAIL_BASE_URI}/user/information`;
      const { data } = await axios.put(baseURL, {
        email: item.email,
        updated_date: Utils.Timestamp(),
        disabled: dataByEmail.is_disabled
      }, { timeout: AppsConstant.INTERNAL_EMAIL_REQUEST_TIMEOUT });

      // stop update if we have problem with update mail user
      if (data.error) {
        dataError.push(data.error);
      }

      // Update table User with current is_disable
      await UserModel.update({
        disabled: dataByEmail.is_disabled
      }, { where: { id: dataByEmail.user_id } });
      await ReportCachedUsersModel.update(
        { disabled: dataByEmail.is_disabled },
        { where: { user_id: dataByEmail.user_id } }
      );

      // Delete record after update table user of admin and mail server
      await UsersDeletedModel.destroy({
        where: {
          id: dataByEmail.id
        }
      });
      return dataPassed.push(_.pick(dataByEmail.dataValues, responseFields));
    }));

    return h
      .response({
        code: Code.REQUEST_SUCCESS,
        data: {
          items: dataPassed,
          failed_items: dataError
        }
      }).code(Code.REQUEST_SUCCESS);
  } catch (error) {
    throw error;
  }
};

module.exports = {
  GetInformation,
  GetAdminInformation,
  Freeze,
  UnFreeze,
  GetFrozenUsers,
  ExportFrozenUsers,
  DeleteUsers,
  RecoverDeletedUser,
  GetUsersDeleted,
  PutUsersDeleted
};
