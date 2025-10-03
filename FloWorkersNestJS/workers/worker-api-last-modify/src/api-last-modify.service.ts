import { InjectQueue } from '@nestjs/bull';
import { Injectable } from '@nestjs/common';
import { Queue } from 'bull';
import { LAST_MODIFIED_REPORT_CACHE } from '../../common/constants/common.constant';
import { WORKER_API_LAST_MODIFIED, WORKER_REPORT_CACHED_USER } from '../../common/constants/worker.constant';
import { ILastModify } from '../../common/interface/api-last-modify.interface';
import { CommonApiLastModifiedService } from '../../common/modules/last-modified/api-last-modify-common.service';
import { Graylog } from '../../common/utils/graylog';

@Injectable()
export class ApiLastModifiedService {
  constructor(
    @InjectQueue(WORKER_REPORT_CACHED_USER.QUEUE)
    private reportCachedUserQueue: Queue,
    private readonly commonApiLastModifiedService: CommonApiLastModifiedService,
  ) { }

  async handleCreateLastModify(data: ILastModify) {
    try {
      /* Create queue name for report cache user
         Communication with worker report cache user
      */
      if (LAST_MODIFIED_REPORT_CACHE.indexOf(data.api_name) >= 0) {
        const queueJob = WORKER_REPORT_CACHED_USER.JOB.NAME;
        await this.reportCachedUserQueue.add(queueJob, { userId: data.user_id }, {
          delay: +process.env.REPORT_CACHED_USER_QUEUE_DELAY || 3000,
          jobId: data.user_id
        });
      }
      // Send last modify for 1 shared collection
      await this.commonApiLastModifiedService.createLastModify(data, false);
    } catch (error) {
      Graylog.getInstance().logInfo({
        moduleName: WORKER_API_LAST_MODIFIED.QUEUE,
        jobName: WORKER_API_LAST_MODIFIED.JOB.NAME,
        message: error.code,
        fullMessage: error.message
      });
      return error;
    }
  }
  async handleCreateLastModifyCollection(data: ILastModify) {
    try {
      /* Create queue name for report cache user
         Communication with worker report cache user
      */
      if (LAST_MODIFIED_REPORT_CACHE.indexOf(data.api_name) >= 0) {
        const queueJob = WORKER_REPORT_CACHED_USER.JOB.NAME;
        await this.reportCachedUserQueue.add(queueJob, { userId: data.user_id }, {
          delay: +process.env.REPORT_CACHED_USER_QUEUE_DELAY || 3000,
          jobId: data.user_id
        });
      }
      // Send last modify for 1 shared collection
      await this.commonApiLastModifiedService.sendLastModifyByCollection(data);
    } catch (error) {
      Graylog.getInstance().logInfo({
        moduleName: WORKER_API_LAST_MODIFIED.QUEUE,
        jobName: WORKER_API_LAST_MODIFIED.JOB.NAME,
        message: error.code,
        fullMessage: error.message
      });
      return error;
    }
  }

  async handleCreateLastModifyConference(data: ILastModify) {
    try {
      if (LAST_MODIFIED_REPORT_CACHE.indexOf(data.api_name) >= 0) {
        const queueJob = WORKER_REPORT_CACHED_USER.JOB.NAME;
        await this.reportCachedUserQueue.add(queueJob, { userId: data.user_id }, {
          delay: +process.env.REPORT_CACHED_USER_QUEUE_DELAY || 3000,
          jobId: data.user_id
        });
      }
      // Send last modify for 1 shared collection
      await this.commonApiLastModifiedService.sendLastModifyByConference(data);
    } catch (error) {
      Graylog.getInstance().logInfo({
        moduleName: WORKER_API_LAST_MODIFIED.QUEUE,
        jobName: WORKER_API_LAST_MODIFIED.JOB.NAME,
        message: error.code,
        fullMessage: error.message
      });
      return error;
    }
  }
}