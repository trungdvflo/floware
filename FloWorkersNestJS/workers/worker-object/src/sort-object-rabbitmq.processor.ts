import { Injectable } from '@nestjs/common';
import { CALDAV_OBJ_TYPE } from '../../common/constants/common.constant';
import { WORKER_OBJECT } from '../../common/constants/worker.constant';
import { JobMQ, RabbitMQQueueService } from '../../common/services/rabbitmq.service';
import { Graylog } from '../../common/utils/graylog';
import { SortObjectService } from './sort-object.service';

@Injectable()
export class SortObjectRabbitMQProcessor {
  private readonly rabbitMQQueue: RabbitMQQueueService;
  constructor(private readonly sortObjectService: SortObjectService) {
    this.rabbitMQQueue = new RabbitMQQueueService({
      name: WORKER_OBJECT.SORT_QUEUE,
      concurrency: WORKER_OBJECT.SORT_JOB.CONCURRENCY,
    });

    this.rabbitMQQueue.addProcessor(
      this.process, this.sortObjectService);
  }

  async process (job: JobMQ, sortObjectService: SortObjectService) {
    try {
      const { request_uid, email, object_type, objects } = job.data;
      if (request_uid && email && objects) {
        await sortObjectService
          .handleSortOrder({
            request_uid,
            email,
            object_type,
            objects: objects.map((item) => ({
              ...item,
              object_uid: object_type === CALDAV_OBJ_TYPE.VTODO ? item.uid : item.id
            }))
          });
        return true;
      }
    } catch (err) {
      Graylog.getInstance().logInfo({
        moduleName: WORKER_OBJECT.SORT_QUEUE,
        jobName: job.jobName,
        message: err.code,
        fullMessage: err.message
      });
      return err;
    }
  }
}