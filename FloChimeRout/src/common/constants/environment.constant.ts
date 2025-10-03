export const NODE_ENV = {
  production: 'production',
  test: 'test',
  development: 'development',
};

export const GRAYLOG = {
  HOSTNAME: process.env.APP_NAME || 'FLO_API_V4.1',
  BUFFERSIZE: 50000,
};

export const APP_IDS = {
  web: 'e70f1b125cbad944424393cf309efaf0',
  mac: 'ad944424393cf309efaf0e70f1b125cb',
  iphone: 'faf0e70f1bad944424393cf309e125cb',
  ipad: 'd944424393cf309e125cbfaf0e70f1ba',
  sabreDav: '323d0aa8b591b15d68360faf4c853641',
  macInternal: 'fd99981046681b6bbc2124c72e569591',
};
export const SQS_CHIME_MEETING_EVENT_NAME = 'meeting-event-queue'
