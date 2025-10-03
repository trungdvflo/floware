/* eslint-disable no-useless-escape */
const _ = require('lodash');
const Code = require('../constants/ResponseCodeConstant');
const Server = require('../app').server;

const Env = process.env.NODE_ENV ? process.env.NODE_ENV : 'development';
module.exports = (request, h) => {
  const { response } = request;

  const statusCode = _.get(response, 'statusCode', false);
  if (statusCode === 422) {
    const responseMessage = _.get(response, 'source.error.message', false);
    if (_.isEmpty(responseMessage) === false) {
      return h.response({
        code: Code.INVALID_PAYLOAD_PARAMS,
        error: {
          message: responseMessage.replace(/\"/gi, '').split('.').map((item) => item.trim())
        }
      }).code(Code.INVALID_PAYLOAD_PARAMS);
    }
  }
  if (response instanceof Error) {
    if (response && response.message === 'Not Found') {
      return h.response({
        code: Code.INVALID_SERVICE,
        error: {
          message: 'Not Found'
        }
      }).code(Code.INVALID_SERVICE);
    }

    if (response && response.output && response.output.statusCode === Code.INVALID_TOKEN) {
      return h.response({
        code: Code.INVALID_TOKEN,
        error: {
          message: 'Unauthorized'
        }
      }).code(Code.INVALID_TOKEN);
    }

    if (response && response.output && response.output.statusCode === Code.INVALID_PAYLOAD_PARAMS) {
      const { payload } = response.output;
      const message = payload.message.replace(/\"/gi, '').split('.').map((item) => item.trim());

      if (Env === 'development') {
        return h.response({
          code: Code.INVALID_PAYLOAD_PARAMS,
          error: {
            message,
            stack: response.stack.split('\n')
          }
        }).code(Code.INVALID_PAYLOAD_PARAMS);
      }

      return h.response({
        code: Code.INVALID_PAYLOAD_PARAMS,
        error: {
          message
        }
      }).code(Code.INVALID_PAYLOAD_PARAMS);
    }

    if (Env === 'development') {
      return h.response({
        code: Code.SYSTEM_ERROR,
        error: {
          message: response.message,
          stack: response.stack.split('\n')
        }
      }).code(Code.SYSTEM_ERROR);
    }

    const objectStatusCode = _.get(response, '_object.statusCode', 500);
    if (objectStatusCode < 500) {
      const objectStatusMessage = _.get(response, '_object.message', response.message);

      if (_.isEmpty(objectStatusMessage) === false && _.isString(objectStatusMessage) === true) {
        return h.response({
          code: Code.INVALID_PAYLOAD_PARAMS,
          error: {
            message: objectStatusMessage.replace(/\"/gi, '').split('.').map((item) => item.trim())
          }
        }).code(Code.INVALID_PAYLOAD_PARAMS);
      }
    }

    const outputStatusCode = _.get(response, 'output.statusCode', 500);
    if (outputStatusCode < 500) {
      const outputStatusMessage = _.get(response, 'payload.message:', response.message);
      if (_.isEmpty(outputStatusMessage) === false && _.isString(outputStatusMessage) === true) {
        return h.response({
          code: Code.INVALID_PAYLOAD_PARAMS,
          error: {
            message: outputStatusMessage.replace(/\"/gi, '').split('.').map((item) => item.trim())
          }
        }).code(Code.INVALID_PAYLOAD_PARAMS);
      }
    }

    return h.response({
      code: Code.SYSTEM_ERROR,
      error: {
        message: response.message
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
