const AppsConstant = require('../constants/AppsConstant');
const RabbitMQQueueService = require('./RabbitmqService');

module.exports = class ReportCacheRabbitMQServiece {
  static _instance;

  static rabbitMQ;

  constructor() {
    ReportCacheRabbitMQServiece.rabbitMQ = new RabbitMQQueueService({
      name: AppsConstant.REPORT_CACHED_USER_QUEUE
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