const axios = require('axios');
const queryString = require('query-string');
const _ = require('lodash');
const { log } = require('async');

const RequestService = {
  /**
   * @param url
   * @param params
   * @param body
   * @param headers
   * @return {Promise}
   */
  Post: (url, params = null, body = null, headers = null, timeout = 60000) => {
    const options = {
      url,
      timeout,
      headers: headers || {}
    };

    if (!_.isEmpty(params)) {
      options.data = params;
    }

    if (!_.isEmpty(body)) {
      options.data = body;
      options.json = true;
    }

    if (_.isObject(body)) {
      options.headers['Content-Type'] = 'application/json';
    }

    const startTime = new Date().getTime();
    return axios.post(url, options.data, { ...options })
      .then(response => {
        return {
          body: response.data,
          statusCode: response.status,
          http: response,
          executeTime: (new Date().getTime() - startTime) / 1000
        };
      })
      .catch(error => {
        throw error;
      });
  },

  Get: (url, params = null, headers = null, timeout = 60000) => {
    const options = {
      url,
      timeout,
      headers: headers || {}
    };

    if (!_.isEmpty(params)) {
      options.params = params;
    }

    const startTime = new Date().getTime();
    return axios.get(url, options)
      .then(response => {
        return {
          body: response.data,
          statusCode: response.status,
          http: response,
          executeTime: (new Date().getTime() - startTime) / 1000
        };
      })
      .catch(error => {
        throw error;
      });
  }
};

module.exports = RequestService;
