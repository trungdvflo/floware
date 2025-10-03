import {
  OnQueueFailed,
  Process,
  Processor
} from '@nestjs/bull';
import { Job } from 'bull';
import { WORKER_API_LAST_MODIFIED } from '../../common/constants/worker.constant';
import { ILastModify } from '../../common/interface/api-last-modify.interface';
import { Graylog } from '../../common/utils/graylog';
import { ApiLastModifiedService } from './api-last-modify.service';

@Processor(WORKER_API_LAST_MODIFIED.QUEUE)
export class ApiLastModifyProcessor {
  constructor(private readonly apiLastModifiedService: ApiLastModifiedService) { }

  @Process({
    name: WORKER_API_LAST_MODIFIED.JOB.NAME,
    concurrency: WORKER_API_LAST_MODIFIED.JOB.CONCURRENCY
  })
  async lastModifyCloudHandler(job: Job): Promise<void> {
    const { apiName, userId, email, updatedDate } = job.data;
    const data: ILastModify = {
      user_id: userId,
      email,
      api_name: apiName,
      updated_date: updatedDate
    };
    await this.apiLastModifiedService.handleCreateLastModify(data);
  }

  @Process({
    name: WORKER_API_LAST_MODIFIED.JOB.COLLECTION,
    concurrency: WORKER_API_LAST_MODIFIED.JOB.CONCURRENCY
  })
  async lastModifyCollectionHandler(job: Job): Promise<void> {
    const { apiName, userId, email, updatedDate, collectionId } = job.data;
    const data: ILastModify = {
      user_id: userId,
      email,
      api_name: apiName,
      updated_date: updatedDate,
      collection_id: collectionId
    };
    await this.apiLastModifiedService.handleCreateLastModifyCollection(data);
  }

  @Process({
    name: WORKER_API_LAST_MODIFIED.JOB.CONFERENCE,
    concurrency: WORKER_API_LAST_MODIFIED.JOB.CONCURRENCY
  })
  async lastModifyConferenceHandler(job: Job): Promise<void> {
    const { apiName, userId, email, updatedDate, channelId } = job.data;
    const data: ILastModify = {
      user_id: userId,
      email,
      api_name: apiName,
      updated_date: updatedDate,
      channel_id: channelId
    };
    await this.apiLastModifiedService.handleCreateLastModifyConference(data);
  }

  @OnQueueFailed()
  onError(job: Job<any>, error) {
    Graylog.getInstance().logInfo({
      moduleName: WORKER_API_LAST_MODIFIED.QUEUE,
      jobName: WORKER_API_LAST_MODIFIED.JOB.NAME,
      message: error.message,
      fullMessage: `Failed job ${job.id}: ${error.message}`
    });
    throw error;
  }

}