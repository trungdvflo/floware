import { FILTER_DICT } from "../constants/log.constant";

export const FORMAT_API_INFO = (_code: number,_method: string, _path: string) => {
  return `[${_code}][${_method}] Respond for ${_path}`;
};

export const FORMAT_API_ERROR = (_code: number,_method: string, _path: string) => {
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
