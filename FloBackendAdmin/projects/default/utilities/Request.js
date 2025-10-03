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
  Get: async (url, headers, params = {}, timeout = 60000) => {
    const options = {
      url: url,
      headers: {
        'Authorization': headers || {},
      },
      params: params
    };
  
    const startTime = new Date().getTime();
  
    try {
      const response = await axios.get(url, options);
  
      const { data, status } = response;
  
      return {
        body: data,
        statusCode: status,
        http: response,
        executeTime: (new Date().getTime() - startTime) / 1000,
      };
    } catch (error) {
      throw error;
    }
  },

  Post: async (url, headers, data = {}, timeout = 60000) => {
    const options = {
      url: url,
      headers: {
        'Authorization': headers || {},
      },
    };
  
    const startTime = new Date().getTime();
  
    try {
      const response = await axios.post(url, data, options);
  
      const { data: responseData, status } = response;
  
      return {
        body: responseData,
        statusCode: status,
        http: response,
        executeTime: (new Date().getTime() - startTime) / 1000,
      };
    } catch (error) {
      throw error;
    }
  },

  Put: async (url, headers, id, data = {}, timeout = 60000) => {
    const options = {
      url: `${url}/${id}`,
      headers: {
        'Authorization': headers || {},
      },
    };
  
    const startTime = new Date().getTime();
  
    try {
      const response = await axios.put(url, data, options);
  
      const { data: responseData, status } = response;
  
      return {
        body: responseData,
        statusCode: status,
        http: response,
        executeTime: (new Date().getTime() - startTime) / 1000,
      };
    } catch (error) {
      throw error;
    }
  },
  
  Delete: async (url, headers, id, timeout = 60000) => {
    const options = {
      url: `${url}/${id}`,
      headers: {
        'Authorization': headers || {},
      },
    };
  
    const startTime = new Date().getTime();
  
    try {
      const response = await axios.delete(url, options);
  
      const { data, status } = response;
  
      return {
        body: data,
        statusCode: status,
        http: response,
        executeTime: (new Date().getTime() - startTime) / 1000,
      };
    } catch (error) {
      throw error;
    }
  },
};

module.exports = RequestService;
