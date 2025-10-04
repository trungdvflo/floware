/* eslint-disable prefer-regex-literals */
const { Queue } = require('bullmq');
const Cache = require('../caches/Cache');
const AppsConstant = require('../constants/AppsConstant');
const RabbitConfig = require('../configs/RabbitConfig');
const ReportCacheRabbitMQServiece = require('./ReportCacheRabbitMQService');

const QueueService = {
  // Will return true for all exception case
  AddUserToReportCachedQueue: async (email) => {
    try {
      if (RabbitConfig.enable) {
        const reportCache = ReportCacheRabbitMQServiece.instance();
        reportCache.addJob(AppsConstant.REPORT_CACHED_USER_QUEUE, {
          emails: [email]
        });
      } else {
        const queue = new Queue(AppsConstant.REPORT_CACHED_USER_QUEUE, {
          connection: Cache.getConnection(),
          defaultJobOptions: {
            removeOnComplete: +process.env.REDIS_REMOVE_ON_COMPLETE || 20,
            removeOnFail: +process.env.REDIS_REMOVE_ON_FAIL || 50,
            delay: +process.env.REPORT_CACHED_USER_QUEUE_DELAY || 3000
          }
        });
        await queue.add(AppsConstant.REPORT_CACHED_USER_QUEUE, {
          emails: [email]
        });
      }
      return true;
    } catch (error) {
      return false;
    }
  }
};
module.exports = QueueService;
