import { Injectable } from '@nestjs/common';
import { IFileCommonJob, IFileCommonObjectJob, IFileJob } from '../../common/interface/file-attachment.interface';
import { JobMQ, RabbitMQQueueService } from '../../common/services/rabbitmq.service';
import { Graylog } from '../../common/utils/graylog';
import { FILE_JOB, FILE_QUEUE } from '../common/constants/worker.constant';
import { CommonService } from './common.service';

@Injectable()
export class FileRabbitMQProcessor {
  private readonly rabbitMQQueue: RabbitMQQueueService;
  constructor(private readonly commonService: CommonService) {
    this.rabbitMQQueue = new RabbitMQQueueService({
      name: FILE_QUEUE,
      concurrency: FILE_JOB.CONCURRENCY,
    });

    this.rabbitMQQueue.addProcessor(
      this.process, this.commonService);
  }

  async process (job: JobMQ, commonService: CommonService) {
    try {
      if (job.jobName === FILE_JOB.NAME.FILE) {
        const { userId, data } = job.data;
        const jobData: IFileJob = {
          user_id: userId, uid: data.uid, ext: data.ext
        };
        await commonService.deleteFileAttachment(jobData);
      } else if (job.jobName === FILE_JOB.NAME.FILE_COMMON) {
        const { userId, data } = job.data;
        const jobData: IFileCommonJob = {
          user_id: userId,
          source_id: data.source_id,
          collection_id: data.collection_id,
          source_type: data.source_type
        };
        await commonService.deleteFileCommonsAttachment(jobData);
      } else if (job.jobName === FILE_JOB.NAME.FILE_OBJECT_COMMON) {
        const { data } = job.data;
        const jobData: IFileCommonObjectJob = {
          object_uid: data.object_uid,
          object_type: data.object_type
        };
        await commonService.deleteFileCommonsofObject(jobData);
      }
      return true;
    } catch (err) {
      Graylog.getInstance().logInfo({
        moduleName: FILE_QUEUE,
        jobName: job.jobName,
        message: err.code,
        fullMessage: err.message
      });
      return err;
    }
  }
}