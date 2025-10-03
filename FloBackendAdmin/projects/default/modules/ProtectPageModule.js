/* eslint-disable object-curly-newline */
/* eslint-disable operator-linebreak */
/* eslint-disable no-multi-str */
/* eslint-disable no-useless-catch */
const _ = require('lodash');
const { createHash } = require('crypto');
const Code = require('../constants/ResponseCodeConstant');
const { Timestamp, generateRandomDecimal } = require('../utilities/Utils');
const { ProtectPageModel } = require('../models');
const { Encrypt, Decrypt } = require('../utilities/Futil');
const MessageConstant = require('../constants/MessageConstant');

function getRandomStr(len = 10) {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789'.split('');
  const size = chars.length;
  let str = "";
  // eslint-disable-next-line no-plusplus
  for (let i = 0; i < len; i++) {
    const lastNumber = Math.floor(generateRandomDecimal() * size);
    str += chars[lastNumber];
  }
  return str;
}

async function execGenerateProtectCode(gen, verifyCode, checksum) {
  return ProtectPageModel.sequelize.query(`CALL protect_page_generate(:generateNew,
     :verifyCode, :checksum, :timeCodeExpire, :createdDate, :updatedDate, :offset, :limit)`, {
    replacements: {
      generateNew: gen,
      verifyCode,
      checksum,
      timeCodeExpire: 0,
      createdDate: Timestamp(),
      updatedDate: Timestamp(),
      offset: 0,
      limit: 50
    }
  });
}

async function SaveProtectCode(request, h) {
  try {
    const userInfo = _.get(request, 'auth.credentials', false);
    if (userInfo.role !== 1) {
      return h
        .response({
          code: Code.INVALID_PERMISSION,
          error: {
            message: MessageConstant.FORBIDDEN
          }
        })
        .code(Code.INVALID_PERMISSION);
    }
    const { payload } = request;
    const decrypted = Decrypt(payload.data.verify_code);
    const checksum = createHash('md5').update(decrypted).digest('hex');
    const respond = await execGenerateProtectCode(1, payload.data.verify_code, checksum);
    return h
      .response({
        code: Code.REQUEST_SUCCESS,
        data: {
          status: +Boolean(respond[0]?.verify_code.length) || 0
        }
      })
      .code(Code.REQUEST_SUCCESS);
  } catch (error) {
    return h
      .response({
        code: Code.INVALID_PAYLOAD_PARAMS,
        error: {
          message: ["data",
            MessageConstant.MSG_PROTECT_PWD_INVALID
          ]
        }
      })
      .code(Code.INVALID_PAYLOAD_PARAMS);
  }
}

async function GetProtectCode(request, h) {
  try {
    const userInfo = _.get(request, 'auth.credentials', false);
    if (userInfo.role !== 1) {
      return h
        .response({
          code: Code.INVALID_PERMISSION,
          error: {
            message: MessageConstant.FORBIDDEN
          }
        })
        .code(Code.INVALID_PERMISSION);
    }
    //
    const plainPwd = getRandomStr();
    const encrypted = Encrypt(plainPwd);
    const checksum = createHash('md5').update(plainPwd).digest('hex');
    const respond = await execGenerateProtectCode(0, encrypted, checksum);
    return h
      .response({
        code: Code.REQUEST_SUCCESS,
        data: respond.map((v) => ({
          verify_code: Decrypt(v.verify_code),
          time_code_expire: v.time_code_expire
        }))
      })
      .code(Code.REQUEST_SUCCESS)
      .header('X-Total-Count', respond[0]?.totalRows);
  } catch (error) {
    return h
      .response({
        code: Code.INVALID_PAYLOAD_PARAMS,
        error: {
          message: [
            "data",
            MessageConstant.MSG_PROTECT_PWD_INVALID
          ]
        }
      })
      .code(Code.INVALID_PAYLOAD_PARAMS);
  }
}

module.exports = {
  GetProtectCode,
  SaveProtectCode
};
