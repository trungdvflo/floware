const _ = require('lodash');
const Code = require('../constants/ResponseCodeConstant');
const AppsConstant = require('../constants/AppsConstant');
const MessageConstant = require('../constants/MessageConstant');
const Server = require('../app').server;

const { UserModel } = require('../models/Sequelize');

module.exports.TimeExecute = async (request, h) => {
  try {
    const NS_PER_SEC = 1e9;
    const time = process.hrtime();

    await UserModel.findOne({
      attributes: ['id'],
      useMaster: true
    });
    const diff = process.hrtime(time);
    const execTime = diff[0] * NS_PER_SEC + diff[1]; // nanoseconds
    const timeout = AppsConstant.SERVICE_HEALTH_CHECK_TIMEOUT * 1000000; // milliseconds to nanoseconds

    if (_.isNumber(timeout) === false) {
      return h.response({
        error: {
          message: MessageConstant.INTERNAL_SERVER_ERROR
        }
      }).code(Code.SYSTEM_ERROR);
    }

    if (execTime > timeout) {
      return h.response({
        error: {
          message: MessageConstant.INTERNAL_SERVER_ERROR
        }
      }).code(Code.SYSTEM_ERROR);
    }

    return h.response({
      data: {
      }
    }).code(Code.REQUEST_SUCCESS);
  } catch (error) {
    Server.log(['OAuth2.0_ERROR'], error);
    throw error;
  }
};

