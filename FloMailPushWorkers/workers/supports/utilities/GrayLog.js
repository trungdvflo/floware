/* eslint-disable new-cap */
/* eslint-disable no-param-reassign */

const graylog2 = require('graylog2');
const _ = require('lodash');
const {
  FILTER_ENABLE, FILTER_REGEX,
  FILTER_REGEX_VALUE, EMAIL_REGEX
} = require('../../../projects/default/constants/LogConstant');

let instance = null;
const Graylog = (() => {
  function createInstance() {
    return new graylog2.graylog({
      servers: [
        { host: process.env.LOG_GRAYLOG_HOST, port: process.env.LOG_GRAYLOG_PORT }
      ],
      hostname: 'Flo_mail_push_workers',
      facility: 'Queue_Workers',
      bufferSize: 5000
    });
  }
  return {
    getInstance: () => {
      if (!instance) {
        instance = createInstance();
      }
      return instance;
    }
  };
})();

function deleteSensitiveData(obj) {
  Object.keys(obj).forEach((k) => {
    if (typeof obj[k] === 'object' && obj[k] !== null && !Array.isArray(obj[k])) {
      obj[k] = deleteSensitiveData(obj[k]);
    } else if (k.match(FILTER_REGEX)) {
      delete obj[k];
    } else if (typeof obj[k] === 'string') {
      if (FILTER_REGEX_VALUE.test(obj[k])) {
        obj[k] = obj[k].replace(FILTER_REGEX_VALUE, 'hidden');
      } else if (EMAIL_REGEX.test(obj[k])) {
        obj[k] = obj[k].replace(EMAIL_REGEX, 'hidden');
      }
    }
  });
  return obj;
}

const Graylogs = {
  Filter: (dataFilter) => {
    if (!FILTER_ENABLE) {
      return dataFilter;
    }
    if (!dataFilter) {
      return null;
    }

    const dataLogs = JSON.parse(JSON.stringify(dataFilter));
    deleteSensitiveData(dataLogs);
    return dataLogs;
  },
  SendLog: (functions, messages) => {
    const messagesAfterFilter = Graylogs.Filter(messages);
    Graylog.getInstance().log({
      functions,
      messagesAfterFilter
    });
    return true;
  },

  SendLogPushChange: (functions, messages) => {
    // const messagesAfterFilter = Graylogs.Filter(messages);
    const module = 'PushChange';
    if (typeof messages === 'string') {
      // const messagesAfterFilterString = Graylogs.Filter(messages);
      Graylog.getInstance().log({
        module,
        functions,
        // messagesAfterFilterString
      });
    } else {
      Graylog.getInstance().log({
        module,
        functions,
        // messagesAfterFilter
      });
    }
    return true;
  }
};

module.exports = Graylogs;

