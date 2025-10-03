import { Injectable } from '@nestjs/common';
import { WORKER_INVALID_FLO_MAIL_COLLECTOR } from '../../common/constants/worker.constant';
import { IEmailDeletion } from '../../common/interface/invalid-data.interface';
import { JobMQ, RabbitMQQueueService } from '../../common/services/rabbitmq.service';
import { Graylog } from '../../common/utils/graylog';
import { InvalidFloMailService } from './invalid-flomail.service';

@Injectable()
export class InvalidFloMailProcessor {
  private readonly rabbitMQQueue: RabbitMQQueueService;
  constructor(private readonly invalidLinkService: InvalidFloMailService) {
    this.rabbitMQQueue = new RabbitMQQueueService({
      name: WORKER_INVALID_FLO_MAIL_COLLECTOR.QUEUE,
      concurrency: WORKER_INVALID_FLO_MAIL_COLLECTOR.CONCURRENCY,
    });

    this.rabbitMQQueue.addProcessor(
      this.process, this.invalidLinkService);
  }

  async process(job: JobMQ, invalidLinkService: InvalidFloMailService) {
    try {
      const { email, uid, path } = job.data;
      const data: IEmailDeletion = { email, uid, path };
      if (job.jobName === WORKER_INVALID_FLO_MAIL_COLLECTOR.JOB.DELETED_MAIL) {
        await invalidLinkService.processAfterDeleteMail(data);
      } else if (job.jobName === WORKER_INVALID_FLO_MAIL_COLLECTOR.JOB.RMV_CONSIDERING) {
        await invalidLinkService.removeConsidering(data);
      }
      return true;
    } catch (err) {
      Graylog.getInstance().logInfo({
        moduleName: WORKER_INVALID_FLO_MAIL_COLLECTOR.QUEUE,
        jobName: job.jobName,
        message: err.code,
        fullMessage: err.message
      });
      return err;
    }
  }
}