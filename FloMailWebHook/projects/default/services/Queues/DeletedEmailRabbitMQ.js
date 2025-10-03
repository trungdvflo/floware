const AwsConstant = require('../../configs/AwsConstant');
const RabbitMQQueueService = require('./RabbitmqService');

module.exports = class DeleteEmail {
  static _instance;

  static rabbitMQ;

  constructor() {
    DeleteEmail.rabbitMQ = new RabbitMQQueueService({
      name: AwsConstant.DELETE_MAIL_TRIGGER_QUEUE
    });
  }

  addJob(name, data) {
    DeleteEmail.rabbitMQ.addJob(name, data);
  }

  static instance() {
    if (!DeleteEmail._instance) {
      DeleteEmail._instance = new DeleteEmail();
    }
    return DeleteEmail._instance;
  }
}