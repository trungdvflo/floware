const AwsConstant = require('../../configs/AwsConstant');
const RabbitMQQueueService = require('./RabbitmqService');

module.exports = class LinkedMailCollectionRabbitMq {
  static _instance;
  static rabbitMQ;
  constructor() {
    LinkedMailCollectionRabbitMq.rabbitMQ = new RabbitMQQueueService({
      name: AwsConstant.DOVECOT_LINKED_MAIL_COLLECTION,
    });
  }

  addJob(name, data) {
    LinkedMailCollectionRabbitMq.rabbitMQ.addJob(name, data);
  }

  static instance() {
    if (!LinkedMailCollectionRabbitMq._instance) {
      LinkedMailCollectionRabbitMq._instance =
        new LinkedMailCollectionRabbitMq();
    }
    return LinkedMailCollectionRabbitMq._instance;
  }
}