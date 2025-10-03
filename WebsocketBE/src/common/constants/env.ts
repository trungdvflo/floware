export const NODE_ENV = {
  production: 'production',
  test: 'test',
  development: 'development',
};

export const GRAYLOG = {
  HOSTNAME: process.env.APP_NAME || 'FLO_NOTIFICATION_SERVICE',
  BUFFERSIZE: 50000,
};
