export const GRAYLOG = {
  HOSTNAME: 'FloWorkerAdmin4.0',
  FACILITY: 'Queue_WorkersAdmin4.0',
  BUFFERSIZE: 5000
};

const FILTER_KEY = [
  'authorization',
  'app_id',
  'user_id',
  'username',
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

export const FILTER_REGEX_VALUE = new RegExp(`(${[...new Set([].concat([...FILTER_KEY_DEFAULT, ...FILTER_KEY]))].join('|')})`, 'gmi');

export const EMAIL_REGEX = '[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\\.[a-zA-Z]{2,}';