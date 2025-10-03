const Queue = require('bull');
const { QUEUE_NAMES } = require('../projects/default/constants/AppsConstant');
const ReportCacheRabbitMQServiece = require('../projects/default/services/ReportCacheRabbitMQService');
const RabbitConfig = require('../projects/default/configs/RabbitConfig');

let RevertUserDataQueue = null;
let MigrateUserDataQueue = null;
let ReportCachedUserDataQueue = null;
class Queues {
  // eslint-disable-next-line class-methods-use-this
  async addQueueRevertUserData(email, userId) {
    // TODO: user rabbit
    // eslint-disable-next-line no-return-await
    return await RevertUserDataQueue.add({ email, userId },
      {
        attempts: 0,
        removeOnComplete: +process.env.REDIS_REMOVE_ON_COMPLETE || 20,
        removeOnFail: +process.env.REDIS_REMOVE_ON_FAIL || 50,
      });
  }

  // eslint-disable-next-line class-methods-use-this
  async addQueueMigrateUserData(email) {
    // TODO: user rabbit
    // eslint-disable-next-line no-return-await
    return await MigrateUserDataQueue.add({ email },
      {
        attempts: 0,
        removeOnComplete: +process.env.REDIS_REMOVE_ON_COMPLETE || 20,
        removeOnFail: +process.env.REDIS_REMOVE_ON_FAIL || 50,
      });
  }

  // eslint-disable-next-line class-methods-use-this
  async addQueueReportCachedUser({ userId, emails }) {
    if (RabbitConfig.enable) {
      const rabbitService = ReportCacheRabbitMQServiece.instance();
      rabbitService.addJob(QUEUE_NAMES.REPORT_CACHED_USER_QUEUE
        , { userId, emails });
    } else {
      // eslint-disable-next-line no-return-await
      return await ReportCachedUserDataQueue.add({ userId, emails },
        {
          attempts: 0,
          removeOnComplete: +process.env.REDIS_REMOVE_ON_COMPLETE || 20,
          removeOnFail: +process.env.REDIS_REMOVE_ON_FAIL || 50,
        });
    }
  }
}

module.exports.Queues = new Queues();

module.exports.Start = (connections) => {
  MigrateUserDataQueue = new Queue(QUEUE_NAMES.USER_DATA_MIGRATE_QUEUE, { redis: connections.cache.options.config });
  RevertUserDataQueue = new Queue(QUEUE_NAMES.REVERT_USER_DATA_MIGRATE_QUEUE_NAME, { redis: connections.cache.options.config });
  ReportCachedUserDataQueue = new Queue(QUEUE_NAMES.REPORT_CACHED_USER_QUEUE, { redis: connections.cache.options.config });
};