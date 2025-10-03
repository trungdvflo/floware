module.exports = {
  enable: (process.env.RABBIT_MQ_ENABLE && process.env.RABBIT_MQ_ENABLE.toLowerCase()==='true'),
  host: process.env.RABBIT_MQ_HOST || 'localhost',
  vhost: process.env.RABBIT_MQ_VHOST || '/backend',
  port: +process.env.RABBIT_MQ_PORT || 5671,
  user: process.env.RABBIT_MQ_USER || 'amq',
  password: process.env.RABBIT_MQ_PASS || '',
  heartbeat: +process.env.RABBIT_MQ_HEARTBEAT || 60,
  timeout: +process.env.RABBIT_MQ_TIMEOUT || 1e4 // 10 seconds
};
