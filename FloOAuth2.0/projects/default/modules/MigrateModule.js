const _ = require('lodash');
const { Queue } = require('bullmq');
const { QueryTypes } = require('sequelize');
const Code = require('../constants/ResponseCodeConstant');
const AppsConstant = require('../constants/AppsConstant');
const MessageConstant = require('../constants/MessageConstant');
const CacheUtility = require('../utilities/Cache');
const InternalAccountService = require('../services/InternalAccountService');
const Server = require('../app').server;
const Cache = require('../caches/Cache');

const { UserModel, TrackingAppModel } = require('../models/Sequelize');

const CheckMigrateStatus = async (email) => {
  const redisInfo = await CacheUtility.GetMigrateStatus(email);
  if (redisInfo) {
    if (redisInfo.migrateStatus === AppsConstant.USER_MIGRATE_STATUS.MIGRATE_FAILED) {
      return {
        migrate_status: AppsConstant.USER_MIGRATE_STATUS.MIGRATE_FAILED,
        message: MessageConstant.MSG_USER_IS_MIGRATE_DATA_FAILED
      };
    }

    // MIGRATING && INIT MIGRATE
    return {
      migrate_status: AppsConstant.USER_MIGRATE_STATUS.MIGRATING,
      percent: redisInfo.percent,
      message: MessageConstant.MSG_USER_IS_MIGRATING_DATA
    };
  }

  const userInfo = await UserModel.findOne({
    attributes: ['id', 'disabled'],
    where: {
      email
    },
    useMaster: true,
    raw: true
  });

  if (userInfo && userInfo.disabled === 0) {
    const query = `
    SELECT tracking_app.\`id\` FROM user_tracking_app
    LEFT JOIN tracking_app ON user_tracking_app.tracking_app_id =  tracking_app.id
    WHERE 
      tracking_app.\`name\` LIKE '%mac%'
      AND user_tracking_app.user_id = $userId
    LIMIT 1
    `;

    const hasFloMac = await TrackingAppModel.sequelize.query(query, {
      type: QueryTypes.SELECT,
      raw: true,
      bind: {
        userId: userInfo.id
      }
    });

    return {
      has_flo_mac: _.isEmpty(hasFloMac) ? 0 : 1,
      migrate_status: AppsConstant.USER_MIGRATE_STATUS.MIGRATED,
      message: MessageConstant.MSG_USER_IS_ALREADY_MIGRATE_DATA
    };
  }

  const existMailUser = await InternalAccountService.FloMailInternalCheckAccountExist(email);
  if (existMailUser !== true) {
    return {
      error: true,
      message: MessageConstant.MSG_NOT_FOUND_USER_MIGRATE
    };
  }

  if (!userInfo && existMailUser === true) {
    return {
      migrate_status: AppsConstant.USER_MIGRATE_STATUS.NOT_MIGRATE,
      message: MessageConstant.MSG_USER_HAS_NOT_MIGRATE_DATA
    };
  }

  return {
    error: true,
    message: MessageConstant.MSG_NOT_FOUND_USER_MIGRATE
  };
};

const CheckRevertStatus = async (email) => {
  const redisInfo = await CacheUtility.GetRevertStatus(email);
  if (redisInfo) {
    // MIGRATING && INIT MIGRATE
    return {
      migrate_status: AppsConstant.USER_REVERT_MIGRATE_STATUS.REVERTING,
      percent: redisInfo.percent,
      message: MessageConstant.MSG_USER_IS_REVERTING_DATA
    };
  }

  const userInfo = await UserModel.findOne({
    attributes: ['id', 'disabled'],
    where: {
      email
    },
    useMaster: true,
    raw: true
  });

  if (_.isEmpty(userInfo) === true) {
    return {
      error: true,
      message: MessageConstant.MSG_NOT_FOUND_USER_40_REVERT_MIGRATE
    };
  }

  const existMailUser = await InternalAccountService.FloMailInternalCheckAccountExist(email);
  if (existMailUser !== true) {
    return {
      error: true,
      message: MessageConstant.MSG_NOT_FOUND_USER_32_REVERT_MIGRATE
    };
  }

  if (userInfo && userInfo.disabled === 0) {
    return {
      migrate_status: AppsConstant.USER_REVERT_MIGRATE_STATUS.MIGRATED,
      message: MessageConstant.MSG_USER_IS_ALREADY_MIGRATE_DATA
    };
  }

  return {
    error: true,
    message: MessageConstant.MSG_NOT_FOUND_USER_REVERT_MIGRATE
  };
};

const AddUserMigrateDataQueueJob = async (email) => {
  try {
    const queue = new Queue(AppsConstant.USER_DATA_MIGRATE_QUEUE, {
      connection: Cache.getConnection(),
      defaultJobOptions: {
        removeOnComplete: +process.env.REDIS_REMOVE_ON_COMPLETE || 20,
        removeOnFail: +process.env.REDIS_REMOVE_ON_FAIL || 50,
      }
    });

    await queue.add(AppsConstant.USER_MIGRATE_DATA_JOB, {
      status: 'init', email
    });
    return true;
  } catch (error) {
    return false;
  }
};

const AddUserRevertDataQueueJob = async (email) => {
  try {
    const queue = new Queue(AppsConstant.REVERT_USER_DATA_QUEUE, {
      connection: Cache.getConnection(),
      defaultJobOptions: {
        removeOnComplete: +process.env.REDIS_REMOVE_ON_COMPLETE || 20,
        removeOnFail: +process.env.REDIS_REMOVE_ON_FAIL || 50
      }
    });
    await queue.add(AppsConstant.REVERT_DATA_USER_JOB, {
      email
    });
    return true;
  } catch (error) {
    this.logger.error(error);
    return false;
  }
};

const MigrateStatus = async (request, h) => {
  try {
    const email = _.get(request, 'auth.credentials.email', false);
    const result = await CheckMigrateStatus(email);
    if (result.error === true) {
      return h.response({
        error: {
          code: Code.FUNC_USER_NOT_FOUND,
          message: result.message
        }
      }).code(Code.INVALID_PAYLOAD_PARAMS);
    }

    return h.response({
      data: {
        ...result
      }
    }).code(Code.REQUEST_SUCCESS);
  } catch (error) {
    Server.log(['OAuth2.0_ERROR'], error);
    throw error;
  }
};

const StartMigrate = async (request, h) => {
  try {
    const credentials = _.get(request, 'auth.credentials', false);
    const result = await CheckMigrateStatus(credentials.email);

    if (result.error === true) {
      return h.response({
        error: {
          code: Code.FUNC_USER_NOT_FOUND,
          message: result.message
        }
      }).code(Code.INVALID_PAYLOAD_PARAMS);
    }

    if (
      result.migrate_status === AppsConstant.USER_MIGRATE_STATUS.MIGRATE_FAILED
      || result.migrate_status === AppsConstant.USER_MIGRATE_STATUS.MIGRATING
      || result.migrate_status === AppsConstant.USER_MIGRATE_STATUS.MIGRATED
    ) {
      return h.response({
        data: {
          ...result
        }
      }).code(Code.REQUEST_SUCCESS);
    }

    await CacheUtility.SetMigrateStatus(credentials.email, credentials.access_token);
    await AddUserMigrateDataQueueJob(credentials.email);

    return h.response({
      data: {
        migrate_status: AppsConstant.USER_MIGRATE_STATUS.MIGRATING,
        percent: 0,
        message: MessageConstant.MSG_USER_IS_MIGRATING_DATA
      }
    }).code(Code.REQUEST_SUCCESS);
  } catch (error) {
    Server.log(['OAuth2.0_ERROR'], error);
    throw error;
  }
};

const StartRevert = async (request, h) => {
  try {
    const credentials = _.get(request, 'auth.credentials', false);
    const result = await CheckRevertStatus(credentials.email);
    if (result.error === true) {
      return h.response({
        error: {
          code: Code.FUNC_USER_NOT_FOUND,
          message: result.message
        }
      }).code(Code.INVALID_PAYLOAD_PARAMS);
    }

    if (
      result.migrate_status === AppsConstant.USER_REVERT_MIGRATE_STATUS.REVERTING
    ) {
      return h.response({
        data: {
          ...result
        }
      }).code(Code.REQUEST_SUCCESS);
    }

    await CacheUtility.SetRevertStatus(credentials.email);
    await AddUserRevertDataQueueJob(credentials.email);

    return h.response({
      data: {
        migrate_status: AppsConstant.USER_REVERT_MIGRATE_STATUS.REVERTING,
        percent: 0,
        message: MessageConstant.MSG_USER_IS_REVERTING_DATA
      }
    }).code(Code.REQUEST_SUCCESS);
  } catch (error) {
    Server.log(['OAuth2.0_ERROR'], error);
    throw error;
  }
};

module.exports = {
  MigrateStatus,
  StartMigrate,
  StartRevert
};
