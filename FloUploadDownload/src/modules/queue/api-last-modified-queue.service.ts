import { InjectQueue } from '@nestjs/bull';
import { Injectable } from '@nestjs/common';
import { Queue } from 'bull';
import { JOB_NAME, QUEUE_NAME } from '../../common/constants/queue.constant';

@Injectable()
export class ApiLastModifiedQueueService {
  constructor(
    @InjectQueue(QUEUE_NAME.API_LAST_MODIFIED_QUEUE)
    private readonly apiLastModifiedQueue: Queue) {}

  async addJob(
    input: {
      apiName: string;
      userId: number;
      updatedDate?: number;
    }) {
    try {
      const jobName = JOB_NAME.API_LAST_MODIFIED;
      const jobId = `${jobName}_${input.apiName}_${input.userId}_${input.updatedDate}`;
      return await this.apiLastModifiedQueue.add(jobName, input, { jobId });
    } catch (error) {
      return false;
    }
  }

}
