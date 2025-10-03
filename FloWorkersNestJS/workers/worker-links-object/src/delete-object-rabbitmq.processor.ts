import { Injectable } from '@nestjs/common';
import { IDeleteLinksObject } from '../../common/interface/links-object.interface';
import { JobMQ, RabbitMQQueueService } from '../../common/services/rabbitmq.service';
import { Graylog } from '../../common/utils/graylog';
import { LINK_OBJECT_JOB, LINK_OBJECT_QUEUE } from '../common/constants/worker.constant';
import { LinksObjectService } from './links-object.service';

@Injectable()
export class DeleteObjectRabbitMQProcessor {
  private readonly rabbitMQQueue: RabbitMQQueueService;
  constructor(private readonly linksObjectService: LinksObjectService) {
    this.rabbitMQQueue = new RabbitMQQueueService({
      name: LINK_OBJECT_QUEUE,
      concurrency: LINK_OBJECT_JOB.CONCURRENCY,
    });

    this.rabbitMQQueue.addProcessor(
      this.process, this.linksObjectService);
  }

  async process (job: JobMQ, linksObjectService: LinksObjectService) {
    try {
      const { objectUid, userId, email, objectId = 0, objectType } = job.data;
      const data: IDeleteLinksObject = {
        user_id: userId,
        email,
        object_type: objectType,
        object_uid: objectUid,
        object_id: objectId
      };
      await linksObjectService.deleteRelatedObject(data);
      return true;
    } catch (err) {
      Graylog.getInstance().logInfo({
        moduleName: LINK_OBJECT_QUEUE,
        jobName: job.jobName,
        message: err.code,
        fullMessage: err.message
      });
      return err;
    }
  }
}