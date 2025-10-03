module.exports = {
  REGION: process.env.AWS_REGION,
  ACCOUNT_ID: process.env.AWS_ACCOUNT_ID,
  API_VERSION: process.env.AWS_API_VERSION,

  // Queue Name
  HANDLE_WEBHOOK_GMAIL: process.env.HANDLE_WEBHOOK_GMAIL_QUEUE_NAME,

  KEY_MAP_PUSH_NOTIFY: process.env.KEY_MAP_PUSH_NOTIFY ? JSON.parse(process.env.KEY_MAP_PUSH_NOTIFY) : ''
};
