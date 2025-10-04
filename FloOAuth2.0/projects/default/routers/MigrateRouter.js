const Joi = require('joi');
const AppsConstant = require('../constants/AppsConstant');
const Code = require('../constants/ResponseCodeConstant');
const QuerysConstant = require('../constants/QuerysConstant');
const MessageConstant = require('../constants/MessageConstant');
const Migrate = require('../modules/MigrateModule');

const routers = [];

routers.push({
  method: 'GET',
  path: '/migrate-status',
  options: {
    auth: 'Migrate',
    handler(request, h) {
      return Migrate.MigrateStatus(request, h);
    },
    description: MessageConstant.TRACKING_STATUS_OF_MIGRATE_DATA_PROCESS_OF_USER,
    validate: {
      headers: QuerysConstant.HEADERS_ACCESS_TOKEN,
      options: {
        allowUnknown: AppsConstant.JOI_ALLOW_UNKNOWN
      }
    },
    response: {
      status: {
        [`${Code.REQUEST_SUCCESS}#1`]: Joi.object({
          data: Joi.object({
            migrate_status: QuerysConstant.MIGRATE_STATUS.example(1),
            message: MessageConstant.MSG_USER_HAS_NOT_MIGRATE_DATA
          })
        }).description(MessageConstant.MSG_USER_HAS_NOT_MIGRATE_DATA),

        [`${Code.REQUEST_SUCCESS}#2`]: Joi.object({
          data: Joi.object({
            has_flo_mac: QuerysConstant.USER_HAS_FLO_MAC.example(1),
            migrate_status: QuerysConstant.MIGRATE_STATUS.example(2),
            message: MessageConstant.MSG_USER_IS_ALREADY_MIGRATE_DATA
          })
        }).description(MessageConstant.MSG_USER_IS_ALREADY_MIGRATE_DATA),

        [`${Code.REQUEST_SUCCESS}#3`]: Joi.object({
          data: Joi.object({
            migrate_status: QuerysConstant.MIGRATE_STATUS.example(3),
            percent: QuerysConstant.MIGRATE_PERCENT.example(50),
            message: MessageConstant.MSG_USER_IS_MIGRATING_DATA
          })
        }).description(MessageConstant.MSG_USER_IS_MIGRATING_DATA),

        [`${Code.REQUEST_SUCCESS}#4`]: Joi.object({
          data: Joi.object({
            migrate_status: QuerysConstant.MIGRATE_STATUS.example(-1),
            message: MessageConstant.MSG_USER_IS_MIGRATE_DATA_FAILED
          })
        }).description(MessageConstant.MSG_USER_IS_MIGRATE_DATA_FAILED),

        [`${Code.INVALID_PAYLOAD_PARAMS}#`]: Joi.object({
          error: Joi.object({
            code: QuerysConstant.CODE.example(Code.FUNC_USER_NOT_FOUND),
            message: QuerysConstant.MESSAGE.example(MessageConstant.MSG_NOT_FOUND_USER_MIGRATE)
          })
        }).description(MessageConstant.MSG_NOT_FOUND_USER_MIGRATE)
      }
    },
    tags: ['api', 'Migrate']
  }
});

routers.push({
  method: 'POST',
  path: '/start-migrate',
  options: {
    auth: 'Migrate',
    handler(request, h) {
      return Migrate.StartMigrate(request, h);
    },
    description: MessageConstant.START_MIGRATE_USER_DATA,
    validate: {
      headers: QuerysConstant.HEADERS_ACCESS_TOKEN,
      options: {
        allowUnknown: AppsConstant.JOI_ALLOW_UNKNOWN
      }
    },
    response: {
      status: {
        [`${Code.REQUEST_SUCCESS}#1`]: Joi.object({
          data: Joi.object({
            migrate_status: QuerysConstant.MIGRATE_STATUS.example(1),
            message: MessageConstant.MSG_USER_HAS_NOT_MIGRATE_DATA
          })
        }).description(MessageConstant.MSG_USER_HAS_NOT_MIGRATE_DATA),

        [`${Code.REQUEST_SUCCESS}#2`]: Joi.object({
          data: Joi.object({
            has_flo_mac: QuerysConstant.USER_HAS_FLO_MAC.example(1),
            migrate_status: QuerysConstant.MIGRATE_STATUS.example(2),
            message: MessageConstant.MSG_USER_IS_ALREADY_MIGRATE_DATA
          })
        }).description(MessageConstant.MSG_USER_IS_ALREADY_MIGRATE_DATA),

        [`${Code.REQUEST_SUCCESS}#3`]: Joi.object({
          data: Joi.object({
            migrate_status: QuerysConstant.MIGRATE_STATUS.example(3),
            percent: QuerysConstant.MIGRATE_PERCENT.example(50),
            message: MessageConstant.MSG_USER_IS_MIGRATING_DATA
          })
        }).description(MessageConstant.MSG_USER_IS_MIGRATING_DATA),

        [`${Code.REQUEST_SUCCESS}#4`]: Joi.object({
          data: Joi.object({
            migrate_status: QuerysConstant.MIGRATE_STATUS.example(-1),
            message: MessageConstant.MSG_USER_IS_MIGRATE_DATA_FAILED
          })
        }).description(MessageConstant.MSG_USER_IS_MIGRATE_DATA_FAILED),

        [`${Code.INVALID_PAYLOAD_PARAMS}#`]: Joi.object({
          error: Joi.object({
            code: QuerysConstant.CODE.example(Code.FUNC_USER_NOT_FOUND),
            message: QuerysConstant.MESSAGE.example(MessageConstant.MSG_NOT_FOUND_USER_MIGRATE)
          })
        }).description(MessageConstant.MSG_NOT_FOUND_USER_MIGRATE)
      }
    },
    tags: ['api', 'Migrate']
  }
});

routers.push({
  method: 'POST',
  path: '/start-revert',
  options: {
    auth: 'Oauth',
    handler(request, h) {
      return Migrate.StartRevert(request, h);
    },
    description: MessageConstant.START_MIGRATE_USER_DATA,
    validate: {
      headers: QuerysConstant.HEADERS_ACCESS_TOKEN,
      options: {
        allowUnknown: AppsConstant.JOI_ALLOW_UNKNOWN
      }
    },
    response: {
      status: {
        [`${Code.REQUEST_SUCCESS}#`]: Joi.object({
          data: Joi.object({
            revert_status: QuerysConstant.REVERT_MIGRATE_STATUS.example(3),
            percent: QuerysConstant.REVERT_MIGRATE_PERCENT.example(50),
            message: MessageConstant.MSG_USER_IS_REVERTING_DATA
          })
        }).description(MessageConstant.MSG_USER_IS_REVERTING_DATA),

        [`${Code.INVALID_PAYLOAD_PARAMS}#1`]: Joi.object({
          error: Joi.object({
            code: QuerysConstant.CODE.example(Code.FUNC_USER_NOT_FOUND),
            message: QuerysConstant.MESSAGE.example(MessageConstant.MSG_NOT_FOUND_USER_40_REVERT_MIGRATE)
          })
        }).description(MessageConstant.MSG_NOT_FOUND_USER_40_REVERT_MIGRATE),

        [`${Code.INVALID_PAYLOAD_PARAMS}#2`]: Joi.object({
          error: Joi.object({
            code: QuerysConstant.CODE.example(Code.FUNC_USER_NOT_FOUND),
            message: QuerysConstant.MESSAGE.example(MessageConstant.MSG_NOT_FOUND_USER_32_REVERT_MIGRATE)
          })
        }).description(MessageConstant.MSG_NOT_FOUND_USER_32_REVERT_MIGRATE)
      }
    },
    tags: ['api', 'Migrate']
  }
});

module.exports = routers;
