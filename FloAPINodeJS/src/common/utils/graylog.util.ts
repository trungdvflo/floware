import {
  EMAIL_REGEX,
  FILTER_DICT, FILTER_REGEX,
  FILTER_REGEX_VALUE
} from "../constants/log.constant";

export const FORMAT_API_INFO = (_code: number, _method: string, _path: string) => {
  return `[${_code}][${_method}] Respond for ${_path}`;
};

export const FORMAT_API_ERROR = (_code: number, _method: string, _path: string) => {
  return `[${_code}][${_method}] error by ${_path}`;
};

export const filterBodyWithDict = (_data) => {
  const dataFilter = _data.filter((item) => {
    Object.keys(FILTER_DICT).forEach(key => {
      delete item[key];
    });
    return item;
  });
  return { data: dataFilter };
};

export const deleteSensitiveData = (obj) => {
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
};
