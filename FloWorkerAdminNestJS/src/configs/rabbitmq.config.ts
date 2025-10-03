
export const rabbitmqConfig = () => ({
  enable: (process.env.RABBIT_MQ_ENABLE && process.env.RABBIT_MQ_ENABLE.toLowerCase() === 'true') ?
    true : false,
  host: process.env.RABBIT_MQ_HOST || 'localhost',
  // Note: when lack of '/' will got this error..
  // ..Error: Expected ConnectionOpenOk; got<ConnectionClose channel:0>
  protocol: process.env.RABBIT_MQ_PROTOCOL || 'amqps',
  vhost: process.env.RABBIT_MQ_VHOST || '/backend',
  port: +process.env.RABBIT_MQ_PORT || 5671,
  user: process.env.RABBIT_MQ_USER || 'amq',
  password: process.env.RABBIT_MQ_PASS || '',
  heartbeat: +process.env.RABBIT_MQ_HEARTBEAT || 60,
  timeout: +process.env.RABBIT_MQ_TIMEOUT || 1e4 // 10 seconds
});