module.exports = {
  REGION: process.env.AWS_REGION,
  API_VERSION: process.env.AWS_API_VERSION,
  KEY_MAP_PUSH_NOTIFY: process.env.KEY_MAP_PUSH_NOTIFY ? JSON.parse(process.env.KEY_MAP_PUSH_NOTIFY) : '',
  // Queue Name
  SQS_URL_DOVECOT_NEW_MAIL: process.env.SQS_URL_DOVECOT_NEW_MAIL,
  SILENT_PUSH_QUEUE: process.env.SILENT_PUSH_QUEUE,
  MAX_LISTENER: 100
};
