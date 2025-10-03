import { Worker } from 'bullmq';
import { redisClient } from '../../configs/redis.config';
import { QueueName } from '../../commons/constants/queues.contanst';
import { ReportCachedUserJob } from './jobs/report-cached-user.job';
import { BaseWorker } from '../base-worker';
import { Graylog } from '../../configs/graylog.config';
import connectSocket from '../../socketio-client';
import { rabbitmqConfig } from '../../configs/rabbitmq.config';
import { JobMQ, RabbitMQQueueService } from '../../utils/rabbitmq.service';

export class ReportCachedUserWorker extends BaseWorker {
  private readonly reportCachedUserJob: ReportCachedUserJob;
  private readonly rabbitMQQueue: RabbitMQQueueService;
  static _instance: ReportCachedUserWorker;
  private constructor() {
    const reportCachedUserJob = new ReportCachedUserJob();
    const reportCachedUserWorker = new Worker(
      QueueName.REPORT_CACHED_USER_QUEUE,
      async (job) => this.processJob(job),
      {
        connection: redisClient,
        concurrency: +process.env.REPORT_CACHED_USER_CONCURRENCY || 8
      }
    );
    super(reportCachedUserJob, reportCachedUserWorker);
    this.reportCachedUserJob = reportCachedUserJob;
    
    this.rabbitMQQueue = new RabbitMQQueueService({
      name: QueueName.REPORT_CACHED_USER_QUEUE,
      concurrency: 4,
    });
    this.rabbitMQQueue.addProcessor(
      this.process, reportCachedUserJob);
  }

  async process(job: JobMQ, reportCachedUserJob: ReportCachedUserJob) {
    try {
      const data = job.data;
      if (data.emails) {
        for (const email of data.emails) {
          await reportCachedUserJob.queueHandle({ email });
        }
      }
      if (data.userId) {
        await reportCachedUserJob.queueHandle({ userId: data.userId });
      }
    } catch (error) {
      Graylog.getInstance().SendLog({
        moduleName: QueueName.REPORT_CACHED_USER_QUEUE,
        message: `ERROR Rabbit: ${QueueName.REPORT_CACHED_USER_QUEUE}`,
        fullMessage: error.message
      });
      throw error;
    }
  }

  async processJob({ data }: { name: string; data: any }) {
    try {
      if (data.emails) {
        for (const email of data.emails) {
          await this.reportCachedUserJob.queueHandle({ email });
        }
      }
      if (data.userId) {
        await this.reportCachedUserJob.queueHandle({ userId: data.userId });
      }
    } catch (error) {
      Graylog.getInstance().SendLog({
        moduleName: QueueName.REPORT_CACHED_USER_QUEUE,
        message: `ERROR: ${QueueName.REPORT_CACHED_USER_QUEUE}`,
        fullMessage: error.message
      });
      throw error;
    }
  }

  async syncData() {
    try {
      // this.reportCachedUserJob.syncData();
    } catch (error) {
      Graylog.getInstance().SendLog({
        moduleName: QueueName.REPORT_CACHED_USER_QUEUE,
        message: `ERROR: ${QueueName.REPORT_CACHED_USER_QUEUE} SYNC DATA`,
        fullMessage: error.message
      });
      throw error;
    }
  }
  static get instance(): ReportCachedUserWorker {
    if (!ReportCachedUserWorker._instance) {
      ReportCachedUserWorker._instance = new ReportCachedUserWorker();
    }
    return ReportCachedUserWorker._instance;
  }
}
// tslint:disable-next-line: no-unused-expression
ReportCachedUserWorker.instance;
/**
 * SocketIO
 */
// connectSocket(QueueName.REPORT_CACHED_USER_QUEUE);