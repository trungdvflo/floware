/* eslint-disable no-useless-escape */
const _ = require('lodash');
const Code = require('../constants/ResponseCodeConstant');
const MessageConstant = require('../constants/MessageConstant');

const Server = require('../app').server;

const Env = process.env.NODE_ENV ? process.env.NODE_ENV : 'development';

module.exports = (request, h) => {
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

  const {
    headers, params, query, payload
  } = request;

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
        ? {} : _.get(response, 'source', '')
  });
  return h.continue;
};
