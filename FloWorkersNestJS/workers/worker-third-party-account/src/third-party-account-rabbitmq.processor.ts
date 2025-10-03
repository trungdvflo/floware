import { Injectable } from '@nestjs/common';
import { WORKER_THIRD_PARTY_ACCOUNT } from '../../common/constants/worker.constant';
import { JobMQ, RabbitMQQueueService } from '../../common/services/rabbitmq.service';
import { Graylog } from '../../common/utils/graylog';
import { ThirdPartyAccountService } from './third-party-account.service';

@Injectable()
export class ThirdPartyAccountRabbitMQProcessor {
  private readonly rabbitMQQueue: RabbitMQQueueService;
  constructor(private readonly thirdPartyAccountService: ThirdPartyAccountService) {
    this.rabbitMQQueue = new RabbitMQQueueService({
      name: WORKER_THIRD_PARTY_ACCOUNT.QUEUE,
      concurrency: WORKER_THIRD_PARTY_ACCOUNT.JOB.CONCURRENCY
    });
    this.rabbitMQQueue.addProcessor(
      this.process, this.thirdPartyAccountService);
  }

  async process(job: JobMQ, thirdPartyAccountService: ThirdPartyAccountService) {
    try {
      const jobName = job.jobName.toString();
      const { user_id, email, ids } = job.data;
      if (!user_id || !ids || ids.length === 0) {
        throw Error('Job data invalid: ' + JSON.stringify(job.data));
      }
      switch (jobName) {
        case WORKER_THIRD_PARTY_ACCOUNT.JOB.NAME.COLLECTION_LINK:
          await thirdPartyAccountService.deleteLinkedCollectionObject(user_id, email, ids);
          break;

        case WORKER_THIRD_PARTY_ACCOUNT.JOB.NAME.RECENT_OBJ:
          await thirdPartyAccountService.deleteRecentObject(user_id, email, ids);
          break;
        case WORKER_THIRD_PARTY_ACCOUNT.JOB.NAME.LINK:
          await thirdPartyAccountService.deleteLinkedObject(user_id, email, ids);
          break;

        case WORKER_THIRD_PARTY_ACCOUNT.JOB.NAME.ORDER_OBJ:
          await thirdPartyAccountService.deleteSortObject(user_id, email, ids);
          break;

        case WORKER_THIRD_PARTY_ACCOUNT.JOB.NAME.HISTORY:
          await thirdPartyAccountService.deleteContactHistory(user_id, email, ids);
          break;

        case WORKER_THIRD_PARTY_ACCOUNT.JOB.NAME.TRACK:
          await thirdPartyAccountService.deleteEmailTracking(user_id, email, ids);
          break;

        case WORKER_THIRD_PARTY_ACCOUNT.JOB.NAME.CANVAS:
          await thirdPartyAccountService.deleteKanbanCard(user_id, email, ids);
          break;

        default:
          break;
      }
      return true;
    } catch (err) {
      Graylog.getInstance().logInfo({
        moduleName: WORKER_THIRD_PARTY_ACCOUNT.QUEUE,
        jobName: job.jobName,
        message: err.code,
        fullMessage: err.message
      });
      return err;
    }
  }

}