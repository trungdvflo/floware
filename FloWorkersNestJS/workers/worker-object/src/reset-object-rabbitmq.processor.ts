import { Injectable } from '@nestjs/common';
import { WORKER_OBJECT } from '../../common/constants/worker.constant';
import { IResetObject } from '../../common/interface/object.interface';
import { JobMQ, RabbitMQQueueService } from '../../common/services/rabbitmq.service';
import { Graylog } from '../../common/utils/graylog';
import { ObjectService } from './object.service';

@Injectable()
export class ResetObjectRabbitMQProcessor {
  private readonly rabbitMQQueue: RabbitMQQueueService;
  constructor(private readonly objectService: ObjectService) {
    this.rabbitMQQueue = new RabbitMQQueueService({
      name: WORKER_OBJECT.RESET_QUEUE,
      concurrency: WORKER_OBJECT.RESET_JOB.CONCURRENCY,
    });

    this.rabbitMQQueue.addProcessor(
      this.process, this.objectService);
  }

  async process(job: JobMQ, objectService: ObjectService) {
    try {
      const { user_id, email, obj_type, request_uid, data_input } = job.data;
      const data: IResetObject = {
        user_id,
        email,
        obj_type,
        request_uid,
        data_input,
        job_id: request_uid
      };
      await objectService.handleResetOrder(data);
      return true;
    } catch (err) {
      Graylog.getInstance().logInfo({
        moduleName: WORKER_OBJECT.RESET_QUEUE,
        jobName: job.jobName,
        message: err.code,
        fullMessage: err.message
      });
      return err;
    }
  }
}