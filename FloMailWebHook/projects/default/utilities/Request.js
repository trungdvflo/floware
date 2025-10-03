const request = require('request');
const queryString = require('query-string');
const _ = require('lodash');

const RequestService = {
  /**
* @param url
* @param params
* @param body
* @param header
* @return {Promise}
*/
  Post: (url, params = null, body = null, headers = null, timeout = 60000) => {
    return new Promise((resolve, reject) => {
      const options = {
        url,
        timeout
      };

      if (_.isEmpty(params) === false) {
        options.form = params;
      }

      if (_.isEmpty(body) === false) {
        options.body = body;
        if (_.isObject(body)) {
          options.json = true;
        }
      }
      if (_.isEmpty(headers) === false) {
        options.headers = headers;
      }
      const startTime = new Date().getTime();
      request.post(options, (err, httpResponse, rbody) => {
        if (err) {
          reject(err);
        } else {
          resolve({
            body: rbody,
            statusCode: httpResponse.statusCode,
            http: httpResponse,
            executeTime: (new Date().getTime() - startTime) / 1000
          });
        }
      });
    });
  },

  Get: (url, params = null, headers = null, timeout = 60000) => {
    return new Promise((resolve, reject) => {
      const options = {
        url,
        timeout
      };

      if (_.isEmpty(params) === false) {
        options.url = `${options.url}?${queryString.stringify(params)}`;
      }
      if (_.isEmpty(headers) === false) {
        options.headers = headers;
      }

      const startTime = new Date().getTime();
      request.get(options, (err, httpResponse, body) => {
        if (err) {
          reject(err);
        } else {
          resolve({
            body,
            statusCode: httpResponse.statusCode,
            http: httpResponse,
            executeTime: (new Date().getTime() - startTime) / 1000
          });
        }
      });
    });
  }
};

module.exports = RequestService;
