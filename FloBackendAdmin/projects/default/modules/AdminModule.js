/* eslint-disable no-useless-catch */
const _ = require('lodash');
const { QueryTypes } = require('sequelize');
const Code = require('../constants/ResponseCodeConstant');
const Mess = require('../constants/MessageConstant');
const SubscriptionPurchaseModel = require('../models/SubscriptionPurchaseModel');
const App = require('../constants/AppsConstant');
const SqlAdmin = require('./sqls/admin.sql');
const Server = require('../app').server;

const {
  UserModel,
  TrackingAppsModel,
  GroupsModel,
  ReportCachedUsersModel,
  SubscriptionsModel
} = require('../models');
const { generateAdminRevertDataCacheKey, generateAdminMigrateDataCacheKey, Timestamp } = require('../utilities/Utils');
const Cache = require('../caches/Cache');
const { Queues } = require('../../../system/Queue');
const { MSG_USER_NOT_FOUND, MSG_ALREADY_MIGRATE_DATA_USER } = require('../constants/MessageConstant');
const { USER_MIGRATE_STATUS, USER_MIGRATE_PROCESS } = require('../constants/AppsConstant');

const GetUserOfAdmin = async (request, h) => {
  const email = request.query.email.trim().toLowerCase();

  try {
    const [configuredAcc, versionData, groupData] = await Promise.all([
      await UserModel.sequelize.query(SqlAdmin.getAll3rdAccSql, {
        type: QueryTypes.SELECT,
        bind: [email]
      }),
      await TrackingAppsModel.sequelize.query(SqlAdmin.getVersionSql, {
        type: QueryTypes.SELECT,
        bind: [email]
      }),
      await GroupsModel.sequelize.query(SqlAdmin.getGroupSql, {
        type: QueryTypes.SELECT,
        bind: [email]
      })
    ]);

    const report = await ReportCachedUsersModel.findOne({
      where: { email }
    });
    // Fixed: https://floware.atlassian.net/browse/FB-2248
    if (!report) {
      return h.response({
        code: Code.INVALID_PAYLOAD_PARAMS,
        error: { message: "User doesn't exist!" }
      }).code(Code.INVALID_PAYLOAD_PARAMS);
    }
    const storage = JSON.parse(report.storage) || {};

    const usedStorage = {
      message: +storage.message || 0,
      event: +storage.event || 0,
      todo: +storage.todo || 0,
      note: +storage.note || 0,
      contact: +storage.contact || 0
    };
    const versions = versionData.map(tracking => ({ tracking_app: tracking }));
    const data = {
      configured_acc: configuredAcc,
      used_storage: usedStorage,
      versions,
      groups: groupData
    };

    return h.response({
      code: Code.REQUEST_SUCCESS,
      data
    }).code(Code.REQUEST_SUCCESS);
  } catch (error) {
    throw error;
  }
};

const Statistics = async (h) => {
  try {
    const query = `select u2.*, tpa.*, su.*, (u2.user - su.pro - su.pre) as standard 
    FROM ${SqlAdmin.getCountUsers}, ${SqlAdmin.getCount3rdSql},${SqlAdmin.getCountSubSql}`;

    const dashboard = await UserModel.sequelize.query(query, {
      type: QueryTypes.SELECT,
      raw: true
    });

    const data = {
      google: _.get(dashboard, '[0].google', 0),
      yahoo: _.get(dashboard, '[0].yahoo', 0),
      icloud: _.get(dashboard, '[0].icloud', 0),
      other_3rd: _.get(dashboard, '[0].other_3rd', 0),
      pre: _.get(dashboard, '[0].pre', 0),
      pro: _.get(dashboard, '[0].pro', 0),
      standard: _.get(dashboard, '[0].standard', 0),
      users: _.get(dashboard, '[0].users', 0)
    };

    return h.response({
      code: Code.REQUEST_SUCCESS,
      data
    }).code(Code.REQUEST_SUCCESS);
  } catch (error) {
    throw error;
  }
};

const updateSubscription = async (request, h) => {
  const {
    email, subsType, subsTime, subsId
  } = request.payload;
  const newSubsID = `${App.SUBSCRIPTION_TYPE_DEFAULT}${subsTime}${subsType}`.toLowerCase();
  const subDetail = await SubscriptionPurchaseModel.sequelize.query(SqlAdmin.getSubDetail, {
    type: QueryTypes.SELECT,
    bind: [email.toLowerCase()]
  });
  // not have any subscription yet
  if (subDetail.length === 0) {
    const user = await UserModel.findOne({
      attributes: ['id'],
      where: { email },
      raw: true
    });
    await SubscriptionPurchaseModel.create({
      is_current: 1,
      sub_id: newSubsID,
      user_id: user.id,
      description: '',
      purchase_type: 0,
      purchase_status: 1,
      transaction_id: '',
      receipt_data: '',
      updated_date: Timestamp(),
      created_date: Timestamp()
    });
    const subInfo = await SubscriptionsModel.findOne({
      where: { id: newSubsID }
    });
    await ReportCachedUsersModel.update({
      subs_type: subInfo.subs_type,
      sub_id: newSubsID,
      order_number: subInfo.order_number
    }, {
      where: { email: email.toLowerCase() }
    });
  } else {
    // already subscription
    await Promise.all(subDetail.map(async (item) => {
      // dont have any subscription_purchase record -> create new one

      await SubscriptionPurchaseModel.update({
        is_current: 1,
        sub_id: newSubsID
      }, {
        where: { id: item.id }
      });
      const subInfo = await SubscriptionsModel.findOne({
        where: { id: newSubsID }
      });

      await ReportCachedUsersModel.update({
        subs_type: subInfo.subs_type,
        sub_id: newSubsID,
        order_number: subInfo.order_number,
      }, {
        where: { email: email.toLowerCase() }
      })
    }));
  }
  return h.response({
    code: Code.REQUEST_SUCCESS,
    description: Mess.UPDATE_SUCCESS
  }).code(Code.REQUEST_SUCCESS);
};

const ExtendExpDate = async (request, h) => {
  try {
    const { emails, expiredDate } = request.payload;

    let validEmails = [];
    const userList = await UserModel.findAll({ where: { email: emails }, raw: true });
    if (!_.isEmpty(userList) && isDateFromFuture(expiredDate)) {
      const expDate = new Date(expiredDate);
      const createdDate = isYearly(expiredDate)
        ? new Date(expiredDate).setUTCFullYear(expDate.getUTCFullYear() - 1) / 1000
        : new Date(expiredDate).setUTCMonth(expDate.getUTCMonth() - 1) / 1000;
      const userIds = userList.map((item) => item.id);
      // update batch by userIds
      await SubscriptionPurchaseModel.update(
        { created_date: createdDate },
        { where: { user_id: userIds, is_current: 1 } }
      );
      await ReportCachedUsersModel.update(
        { next_renewal: new Date(expiredDate) / 1000 },
        { where: { user_id: userIds } }
      );
      validEmails = userList.map((item) => item.email);
    }

    return h.response({ data: validEmails }).code(Code.CREATE_SUCCESS);
  } catch (error) {
    throw error;
  }
};
/**
 * special case: change to Monthly on December
 * @param {*} expiredDate 
 * @returns 
 */
function isYearly(expiredDate) {
  const thatDate = new Date(expiredDate);
  const toDate = new Date();
  return thatDate.setUTCFullYear() > toDate.setUTCFullYear() && thatDate.getUTCMonth() >= toDate.getUTCMonth();
}
// check input date from future
function isDateFromFuture(future) {
  return new Date(future) - new Date() > 0;
}
const ExecuteRevertUserData = async (request, h) => {
  try {
    const {
      payload
    } = request;
    const { email } = payload;
    const cacheInfo = await ReportCachedUsersModel.findOne({
      where: {
        email,
        user_migrate_status: USER_MIGRATE_STATUS.IS_MIGRATED
      },
      raw: true
    });
    if (!cacheInfo) {
      return h
        .response({
          code: Code.INVALID_PAYLOAD_PARAMS,
          error: {
            message: MSG_USER_NOT_FOUND
          }
        })
        .code(Code.INVALID_PAYLOAD_PARAMS);
    }
    // TODO temp comment here. Will enable when required PO role only
    // if (userInfo.role !== App.ACCOUNT_ROLE.PO) {
    //   return h
    //     .response({
    //       code: Code.INVALID_PERMISSION,
    //       error: {
    //         message: "You don't have permission to perform this action"
    //       }
    //     })
    //     .code(Code.INVALID_PERMISSION);
    // }
    const cacheKey = generateAdminRevertDataCacheKey(cacheInfo.email);
    const isExist = await Cache.get(cacheKey);
    if (isExist) {
      return h
        .response({
          code: Code.INVALID_PAYLOAD_PARAMS,
          error: {
            message: MSG_ALREADY_MIGRATE_DATA_USER
          }
        })
        .code(Code.INVALID_PAYLOAD_PARAMS);
    }
    await Queues.addQueueRevertUserData(cacheInfo.email, cacheInfo.user_id);
    await Cache.set(cacheKey, JSON.stringify({ user_id: cacheInfo.user_id, email: cacheInfo.email }), 3600); // 3600 = 1h
    return h.response({ data: { status: 'init' } }).code(Code.REQUEST_SUCCESS);
  } catch (error) {
    Server.log(['error'], error);
    throw error;
  }
};

const ExcuteMigrateUserData = async (request, h) => {
  try {
    const { email } = request.payload;
    const userInfo = await UserModel.findOne({
      attributes: ['id'],
      where: {
        email
      },
      raw: true
    });

    if (userInfo) {
      return h
        .response({
          code: Code.INVALID_PAYLOAD_PARAMS,
          error: {
            message: 'This user has already migrated'
          }
        })
        .code(Code.INVALID_PAYLOAD_PARAMS);
    }

    const cacheKey = generateAdminMigrateDataCacheKey(email);
    const isExist = await Cache.get(cacheKey);

    if (isExist) {
      return h
        .response({
          code: Code.INVALID_PAYLOAD_PARAMS,
          error: {
            message: 'This user is starting migrate user data'
          }
        })
        .code(Code.INVALID_PAYLOAD_PARAMS);
    }

    await Queues.addQueueMigrateUserData(email);
    await Cache.set(cacheKey, JSON.stringify({
      code: USER_MIGRATE_PROCESS.INIT_MIGRATE,
      email
    }), 3600);
    return h.response({
      data: {
        status: 'init'
      }
    }).code(Code.REQUEST_SUCCESS);
  } catch (error) {
    Server.log(['error'], error);
    throw error;
  }
};

module.exports = {
  GetUserOfAdmin,
  ExtendExpDate,
  Statistics,
  updateSubscription,
  ExecuteRevertUserData,
  ExcuteMigrateUserData
};
