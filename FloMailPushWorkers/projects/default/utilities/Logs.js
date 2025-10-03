/* eslint-disable no-param-reassign */
const {
  FILTER_ENABLE, FILTER_REGEX,
  FILTER_REGEX_VALUE, EMAIL_REGEX
} = require('../constants/LogConstant');

function deleteSensitiveData(obj) {
  if (!obj) return obj;
  Object.keys(obj).forEach((k) => {
    if (k.match(FILTER_REGEX)) {
      delete obj[k];
    } else if (typeof obj[k] === 'object' && obj[k] !== null) {
      obj[k] = deleteSensitiveData(obj[k]);
    } else if (FILTER_REGEX_VALUE.test(obj[k])) {
      obj[k] = obj[k].replace(FILTER_REGEX_VALUE, 'hidden');
    } else if (EMAIL_REGEX.test(obj[k])) {
      obj[k] = obj[k].replace(EMAIL_REGEX, 'hidden');
    }
  });
  return obj;
}

module.exports = {
  Filter: (dataFilter, message = '') => {
    if (!FILTER_ENABLE) {
      return {
        short_message: message,
        extra: {
          full_message: dataFilter
        }
      };
    }

    if (!dataFilter) {
      return null;
    }

    const dataLogs = JSON.parse(JSON.stringify(dataFilter));
    deleteSensitiveData(dataLogs);
    return {
      short_message: message,
      extra: {
        full_message: dataLogs
      }
    };
  }
};
