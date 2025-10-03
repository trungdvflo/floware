import {
    Process,
    Processor
} from '@nestjs/bull';
import { Job } from 'bull';
import { IFileCommonJob, IFileCommonObjectJob, IFileJob } from '../../common/interface/file-attachment.interface';
import { Graylog } from '../../common/utils/graylog';
import { FILE_JOB, FILE_QUEUE } from '../common/constants/worker.constant';
import { CommonService } from './common.service';

@Processor(FILE_QUEUE)
export class FileProcessor {
  constructor(private readonly commonService: CommonService) { }

  @Process({
    name: FILE_JOB.NAME.FILE,
    concurrency: FILE_JOB.CONCURRENCY
  })
  async deleteFileHandler(job: Job): Promise<void> {
    try {
      const { userId, data } = job.data;
      const jobData: IFileJob = { user_id: userId, uid: data.uid, ext: data.ext };
      await this.commonService.deleteFileAttachment(jobData);
    } catch (err) {
      Graylog.getInstance().logInfo({
        moduleName: FILE_QUEUE,
        jobName: FILE_JOB.NAME.FILE,
        message: err.code,
        fullMessage: err.message
      });
      return err;
    }
  }

  @Process({
    name: FILE_JOB.NAME.FILE_COMMON,
    concurrency: FILE_JOB.CONCURRENCY
  })
  async deleteFileCommonHandler(job: Job): Promise<void> {
    try {
      const { userId, data } = job.data;
      const jobData: IFileCommonJob = {
        user_id: userId,
        source_id: data.source_id,
        collection_id: data.collection_id,
        source_type: data.source_type
      };
      await this.commonService.deleteFileCommonsAttachment(jobData);
    } catch (err) {
      Graylog.getInstance().logInfo({
        moduleName: FILE_QUEUE,
        jobName: FILE_JOB.NAME.FILE_COMMON,
        message: err.code,
        fullMessage: err.message
      });
      return err;
    }
  }

  @Process({
    name: FILE_JOB.NAME.FILE_OBJECT_COMMON,
    concurrency: FILE_JOB.CONCURRENCY
  })
  async deleteFileCommonObjectHandler(job: Job): Promise<void> {
    try {
      const { data } = job.data;
      const jobData: IFileCommonObjectJob = {
        object_uid: data.object_uid,
        object_type: data.object_type
      };
      await this.commonService.deleteFileCommonsofObject(jobData);
    } catch (err) {
      Graylog.getInstance().logInfo({
        moduleName: FILE_QUEUE,
        jobName: FILE_JOB.NAME.FILE_OBJECT_COMMON,
        message: err.code,
        fullMessage: err.message
      });
      return err;
    }
  }
}