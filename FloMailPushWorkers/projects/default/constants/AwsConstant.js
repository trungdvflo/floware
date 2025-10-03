module.exports = {
  REGION: process.env.AWS_REGION,
  API_VERSION: process.env.AWS_API_VERSION,

  // Queue Name
  SQS_URL_DOVECOT_NEW_MAIL: process.env.SQS_URL_DOVECOT_NEW_MAIL
};
