export const FILTER_DICT = {
  id: 1,
  auth_key: 1,
  user_income: 1,
  pass_income: 1,
  user_smtp: 1,
  pass_smtp: 1,
  use_kerberos_caldav: 1,
  auth_token: 1,
  refresh_token: 1,
};

const FILTER_KEY = [
  'authorization',
  'app_id',
  'user_id',
  'password',
  'new_password',
  'access_token',
  'refresh_token',
  'user_income',
  'pass_income',
  'user_smtp',
  'pass_smtp',
  'user_caldav',
  'auth_key',
  'auth_token',
  'transaction_id',
  'receipt_data',
  'title',
  'subject',
  'snippet',
  'verify_code'
];

const FILTER_KEY_DEFAULT = process.env.NODE_ENV_FILTER_DEFAULT
  ? JSON.parse(process.env.NODE_ENV_FILTER_DEFAULT)
  : [];

export const FILTER_REGEX = new RegExp(`^(${[...new Set([].concat([...FILTER_KEY_DEFAULT, ...FILTER_KEY]))].join('|')})$`, 'gmi');
