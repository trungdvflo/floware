/* eslint-disable no-useless-escape */
const _ = require('lodash');
const Code = require('../constants/ResponseCodeConstant');
const MessageConstant = require('../constants/MessageConstant');
const AppRegisterConstant = require('../constants/AppRegisterConstant');
const Server = require('../app').server;

const Env = process.env.NODE_ENV ? process.env.NODE_ENV : 'development';
const logRequest = (request) => {
  const appId = _.get(request, 'headers.app_id', false);
  const deviceUid = _.get(request, 'headers.device_uid', false);
  const checkAppId = _.find(AppRegisterConstant, {
    app_reg_id: appId
  });
  if (!checkAppId?.app_name) {
    return;
  }
  Server.log(['OAuth2.0_request'], {
    request_time: new Date(),
    method: request.method,
    app_name: checkAppId?.app_name || 'health check',
    path: request.path || '',
    app_id: appId,
    device_uid: deviceUid,
  });
};
module.exports = (request, h) => {
  logRequest(request);
  const { response } = request;
  if (response instanceof Error) {
    if (response && response.message === 'Not Found') {
      return h.response({
        error: {
          code: Code.FUNC_UNAUTHORIZED,
          message: MessageConstant.FORBIDDEN
        }
      }).code(Code.INVALID_SERVICE);
    }

    if (response && response.output && response.output.statusCode === Code.INVALID_TOKEN) {
      return h.response({
        error: {
          code: Code.FUNC_UNAUTHORIZED,
          message: MessageConstant.UNAUTHORIZED_AUTHORIZATION_INFO_IS_UNDEFINED_OR_THE_WRONG_FORMAT
        }
      }).code(Code.INVALID_TOKEN);
    }

    // eslint-disable-next-line no-underscore-dangle
    if (response && response._object && response._object.statusCode === Code.INVALID_PAYLOAD_PARAMS) {
      // eslint-disable-next-line no-underscore-dangle
      const errorPayload = response._object;
      const message = errorPayload.message.replace(/\"/gi, '');
      if (Env === 'development') {
        return h.response({
          error: {
            code: Code.FUNC_BAD_REQUEST,
            message
          }
        }).code(Code.INVALID_PAYLOAD_PARAMS);
      }

      return h.response({
        error: {
          code: Code.FUNC_BAD_REQUEST,
          message
        }
      }).code(Code.INVALID_PAYLOAD_PARAMS);
    }

    if (response && response.output && response.output.payload.validation) {
      const message = response.output.payload.message.replace(/\"/gi, '');
      return h.response({
        error: {
          code: Code.FUNC_BAD_REQUEST,
          message
        }
      }).code(Code.INVALID_PAYLOAD_PARAMS);
    }

    if (Env === 'development') {
      const outputPayloadMessage = _.get(response, 'output.payload.message', response.message);
      return h.response({
        error: {
          message: outputPayloadMessage
        }
      }).code(Code.SYSTEM_ERROR);
    }

    const objectStatusCode = _.get(response, '_object.statusCode', Code.SYSTEM_ERROR);
    if (objectStatusCode < 500) {
      const objectStatusMessage = _.get(response, '_object.message', response.message);
      if (_.isEmpty(objectStatusMessage) === false && _.isString(objectStatusMessage) === true) {
        return h.response({
          error: {
            code: Code.FUNC_BAD_REQUEST,
            message: objectStatusMessage.replace('\\', '')
          }
        }).code(Code.INVALID_PAYLOAD_PARAMS);
      }
    }

    return h.response({
      error: {
        message: MessageConstant.INTERNAL_SERVER_ERROR
      }
    }).code(Code.SYSTEM_ERROR);
  }

  const { headers, params, query, payload } = request;

  const pathname = _.get(request, 'url.pathname', '/');
  Server.log(['info'], {
    pathname,
    headers,
    params,
    query,
    payload,
    response:
      pathname.includes('/documentation')
        || pathname.includes('swagger.json')
        || pathname.includes('favicon')
        || pathname.includes('extend.js')
        ? {
        } : _.get(response, 'source', '')
  });
  return h.continue;
};