export const NODE_ENV = {
  production: 'production',
  test: 'test',
  development: 'development'
};

export const GRAYLOG = {
  HOSTNAME: process.env.APP_NAME || 'FLO_API_V4.1',
  BUFFERSIZE: 50000,
};