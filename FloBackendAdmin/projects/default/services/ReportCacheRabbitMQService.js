const { QUEUE_NAMES } = require('../constants/AppsConstant');
const RabbitMQQueueService = require('./rabbitmq.service');

module.exports = class ReportCacheRabbitMQServiece {
  static _instance;

  static rabbitMQ;

  constructor() {
    ReportCacheRabbitMQServiece.rabbitMQ = new RabbitMQQueueService({
      name: QUEUE_NAMES.REPORT_CACHED_USER_QUEUE
    });
  }

  addJob(name, data) {
    ReportCacheRabbitMQServiece.rabbitMQ.addJob(name, data);
  }

  static instance() {
    if (!ReportCacheRabbitMQServiece._instance) {
      ReportCacheRabbitMQServiece._instance = new ReportCacheRabbitMQServiece();
    }
    return ReportCacheRabbitMQServiece._instance;
  }
}