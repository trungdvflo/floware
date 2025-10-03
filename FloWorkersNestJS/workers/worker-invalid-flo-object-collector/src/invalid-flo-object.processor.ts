import { Injectable } from '@nestjs/common';
import { WORKER_INVALID_FLO_OBJECT_COLLECTOR } from '../../common/constants/worker.constant';
import { IUserProcess } from '../../common/interface/invalid-data.interface';
import { JobMQ, RabbitMQQueueService } from '../../common/services/rabbitmq.service';
import { Graylog } from '../../common/utils/graylog';
import { InvalidFloObjectService } from './invalid-flo-object.service';

@Injectable()
export class InvalidLinkFloObjectCollectorProcessor {
  private readonly rabbitMQQueue: RabbitMQQueueService;
  constructor(private readonly invalidLinkService: InvalidFloObjectService) {
    this.rabbitMQQueue = new RabbitMQQueueService({
      name: WORKER_INVALID_FLO_OBJECT_COLLECTOR.QUEUE,
      concurrency: WORKER_INVALID_FLO_OBJECT_COLLECTOR.CONCURRENCY,
    });

    this.rabbitMQQueue.addProcessor(
      this.process, this.invalidLinkService);
  }

  async process(job: JobMQ, invalidLinkService: InvalidFloObjectService) {
    try {
      const { user_id, username }: IUserProcess = job.data;
      await invalidLinkService.scanInvalidLinkPerUser({ user_id, username });
      return true;
    } catch (err) {
      Graylog.getInstance().logInfo({
        moduleName: WORKER_INVALID_FLO_OBJECT_COLLECTOR.QUEUE,
        jobName: job.jobName,
        message: err.code,
        fullMessage: err.message
      });
      return err;
    }
  }

}