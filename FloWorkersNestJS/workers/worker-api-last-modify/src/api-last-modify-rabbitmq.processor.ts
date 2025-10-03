import { Injectable } from '@nestjs/common';
import { WORKER_API_LAST_MODIFIED } from '../../common/constants/worker.constant';
import { ILastModify } from '../../common/interface/api-last-modify.interface';
import { JobMQ, RabbitMQQueueService } from '../../common/services/rabbitmq.service';
import { Graylog } from '../../common/utils/graylog';
import { ApiLastModifiedService } from './api-last-modify.service';

@Injectable()
export class ApiLastModifyRabbitMQProcessor {
  private readonly rabbitMQQueue: RabbitMQQueueService;
  constructor(private readonly apiLastModifiedService: ApiLastModifiedService) {
    this.rabbitMQQueue = new RabbitMQQueueService({
      name: WORKER_API_LAST_MODIFIED.QUEUE,
      concurrency: WORKER_API_LAST_MODIFIED.JOB.CONCURRENCY,
    });

    this.rabbitMQQueue.addProcessor(
      this.process, this.apiLastModifiedService);
  }

  async process(job: JobMQ, apiLastModifiedService: ApiLastModifiedService) {
    try {
      if (job.jobName === WORKER_API_LAST_MODIFIED.JOB.NAME) {
        const { apiName, userId, email, updatedDate } = job.data;
        const data: ILastModify = {
          user_id: userId,
          email,
          api_name: apiName,
          updated_date: updatedDate
        };
        await apiLastModifiedService.handleCreateLastModify(data);
      } else if (job.jobName === WORKER_API_LAST_MODIFIED.JOB.COLLECTION) {
        const { apiName, userId, email, updatedDate, collectionId } = job.data;
        const data: ILastModify = {
          user_id: userId,
          email,
          api_name: apiName,
          updated_date: updatedDate,
          collection_id: collectionId
        };
        await apiLastModifiedService.handleCreateLastModifyCollection(data);
      } else if (job.jobName === WORKER_API_LAST_MODIFIED.JOB.CONFERENCE) {
        const { apiName, userId, email, updatedDate, channelId } = job.data;
        const data: ILastModify = {
          user_id: userId,
          email,
          api_name: apiName,
          updated_date: updatedDate,
          channel_id: channelId
        };
        await apiLastModifiedService.handleCreateLastModifyConference(data);
      }
      return true;
    } catch (err) {
      Graylog.getInstance().logInfo({
        moduleName: WORKER_API_LAST_MODIFIED.QUEUE,
        jobName: job.jobName,
        message: err.code,
        fullMessage: err.message
      });
      return err;
    }
  }

}