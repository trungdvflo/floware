const Re2 = require('re2');

const FILTER_KEY = [
  'authorization',
  'app_id',
  'user_id',
  'password',
  'new_password',
  'username',
  'access_token',
  'refresh_token',
  'keyapi',
  'verify_code'
];

const FILTER_KEY_DEFAULT = process.env.NODE_ENV_FILTER_DEFAULT
  ? JSON.parse(process.env.NODE_ENV_FILTER_DEFAULT)
  : [];

const FILTER_REGEX = new RegExp(`^(${[...new Set([].concat([...FILTER_KEY_DEFAULT, ...FILTER_KEY]))].join('|')})$`, 'gmi');
const FILTER_REGEX_VALUE = new RegExp(`(${[...new Set([].concat([...FILTER_KEY_DEFAULT, ...FILTER_KEY]))].join('|')})`, 'gmi');
const EMAIL_REGEX = Re2(/[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/g);
module.exports = {
  FILTER_ENABLE: process.env.NODE_ENV_FILTER_ENABLE ? process.env.NODE_ENV_FILTER_ENABLE.toLocaleLowerCase() === 'true' : false,
  FILTER_REGEX,
  FILTER_REGEX_VALUE,
  EMAIL_REGEX
};
